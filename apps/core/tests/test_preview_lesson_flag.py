"""CurriculumNode.is_preview is the single source of truth for free previews."""

from importlib import import_module
from unittest import mock

import pytest
from django.contrib.auth.models import Group
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase
from django.urls import reverse

from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.core.views import _clone_node, build_curriculum_tree
from apps.curriculum.models import CurriculumNode
from apps.curriculum.preview import coerce_preview_flag, is_previewable_activity
from apps.progression.models import InstructorAssignment
from apps.progression.services import ProgressionEngine, ScheduleLockChecker
from apps.progression.tests.factories import ProgramFactory


@pytest.fixture
def instructor(db):
    user = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


@pytest.fixture
def program(db, instructor):
    program = ProgramFactory()
    InstructorAssignment.objects.create(instructor=instructor, program=program)
    return program


@pytest.mark.django_db
class TestBuilderSyncsPreviewColumn:
    def test_node_update_writes_the_column_from_properties(
        self, client, instructor, program
    ):
        unit = CurriculumNode.objects.create(
            program=program, title="Unit 1", node_type="Unit"
        )
        lesson = CurriculumNode.objects.create(
            program=program,
            parent=unit,
            title="Welcome lesson",
            node_type="Session",
            properties={"lesson_type": "text"},
        )
        client.force_login(instructor)
        url = reverse("core:instructor.node_update", kwargs={"node_id": lesson.id})

        response = client.post(
            url,
            {
                "title": lesson.title,
                "properties": {"lesson_type": "text", "is_preview": True},
            },
            content_type="application/json",
        )

        assert response.status_code == 302
        lesson.refresh_from_db()
        assert lesson.is_preview is True
        assert lesson.properties["is_preview"] is True

        client.post(
            url,
            {
                "title": lesson.title,
                "properties": {"lesson_type": "text", "is_preview": False},
            },
            content_type="application/json",
        )
        lesson.refresh_from_db()
        assert lesson.is_preview is False
        assert lesson.properties["is_preview"] is False

    def test_node_create_writes_the_column_from_properties(
        self, client, instructor, program
    ):
        unit = CurriculumNode.objects.create(
            program=program, title="Unit 1", node_type="Unit"
        )
        client.force_login(instructor)

        response = client.post(
            reverse("core:instructor.node_create", kwargs={"program_id": program.id}),
            {
                "title": "Free intro",
                "parent_id": unit.id,
                "properties": {"lesson_type": "text", "is_preview": True},
            },
            content_type="application/json",
        )

        # The builder redirects back to the manage page after creating a node.
        assert response.status_code == 302
        lesson = CurriculumNode.objects.get(program=program, title="Free intro")
        assert lesson.is_preview is True
        assert lesson.properties["is_preview"] is True

    def test_builder_payload_keeps_the_properties_flag(self, program):
        unit = CurriculumNode.objects.create(
            program=program, title="Unit 1", node_type="Unit"
        )
        CurriculumNode.objects.create(
            program=program,
            parent=unit,
            title="Free intro",
            node_type="Session",
            is_preview=True,
            properties={"lesson_type": "text", "is_preview": True},
        )

        tree = build_curriculum_tree(program)

        assert tree[0]["children"][0]["properties"]["is_preview"] is True

    def test_clone_copies_the_preview_column(self, program):
        source = CurriculumNode.objects.create(
            program=program,
            title="Unit 1",
            node_type="Unit",
        )
        lesson = CurriculumNode.objects.create(
            program=program,
            parent=source,
            title="Free intro",
            node_type="Session",
            is_preview=True,
            properties={"lesson_type": "text", "is_preview": True},
        )
        target = Program.objects.create(name="Copy target", code="COPY-1")

        cloned_unit = _clone_node(source, None, target)

        cloned_lesson = cloned_unit.children.get()
        assert cloned_lesson.title == f"{lesson.title} (Copy)"
        assert cloned_lesson.is_preview is True


@pytest.mark.django_db
class TestModelSavesPreviewColumn:
    def test_save_derives_the_column_from_properties(self, program):
        unit = CurriculumNode.objects.create(
            program=program, title="Unit 1", node_type="Unit"
        )
        lesson = CurriculumNode.objects.create(
            program=program,
            parent=unit,
            title="Free intro",
            node_type="Session",
            properties={"lesson_type": "text", "is_preview": True},
        )
        assert lesson.is_preview is True

        lesson.properties = {"lesson_type": "text", "is_preview": False}
        lesson.is_preview = True  # a stray direct write cannot win
        lesson.save()

        lesson.refresh_from_db()
        assert lesson.is_preview is False

    def test_update_fields_with_properties_also_write_the_column(self, program):
        lesson = CurriculumNode.objects.create(
            program=program,
            title="Free intro",
            node_type="Session",
            properties={"lesson_type": "text"},
        )

        lesson.properties = {"lesson_type": "text", "is_preview": True}
        lesson.save(update_fields=["properties"])

        assert CurriculumNode.objects.get(pk=lesson.pk).is_preview is True


@pytest.mark.django_db
class TestEngineVisitorAccess:
    def test_visitor_access_follows_the_public_preview_rules(self, program):
        unit = CurriculumNode.objects.create(
            program=program, title="Unit 1", node_type="Unit"
        )
        text = CurriculumNode.objects.create(
            program=program,
            parent=unit,
            title="Free intro",
            node_type="Session",
            properties={"lesson_type": "text", "is_preview": True},
        )
        quiz = CurriculumNode.objects.create(
            program=program,
            parent=unit,
            title="Flagged quiz",
            node_type="Session",
            properties={"lesson_type": "quiz", "is_preview": True},
        )
        flagged_section = CurriculumNode.objects.create(
            program=program,
            title="Flagged section",
            node_type="Session",
            properties={"is_preview": True},
        )
        engine = ProgressionEngine()

        assert engine.can_access(None, text).status == "preview"
        for node in (quiz, flagged_section):
            result = engine.can_access(None, node)
            assert result.can_access is False
            assert result.lock_reason == "enrollment_required"
        assert ScheduleLockChecker().is_unlocked(None, quiz).can_access is False
        assert ScheduleLockChecker().is_unlocked(None, text).can_access is True


class TestPreviewRules:
    @pytest.mark.parametrize(
        "value, expected",
        [
            (True, True),
            ("true", True),
            ("On", True),
            (1, True),
            (False, False),
            ("false", False),
            ("", False),
            (None, False),
            (0, False),
            ({}, False),
        ],
    )
    def test_coerce_preview_flag_fails_closed(self, value, expected):
        assert coerce_preview_flag(value) is expected

    @pytest.mark.parametrize(
        "node_type, properties, expected",
        [
            ("Lesson", {"lesson_type": "text"}, True),
            ("Lesson", {"lesson_type": "video"}, True),
            ("Lesson", {"lesson_type": "document"}, True),
            ("Lesson", {"lesson_type": "audio"}, True),
            ("Lesson", {}, True),
            ("Lesson", {"lesson_type": "quiz"}, False),
            ("Lesson", {"lesson_type": "assignment"}, False),
            ("Lesson", {"lesson_type": "code"}, False),
            ("Lesson", {"lesson_type": "live_class"}, False),
            ("Lesson", {"lesson_type": "google_meet"}, False),
            ("Lesson", {"lesson_type": "live_stream"}, False),
            ("Lesson", {"lesson_type": "in_person_session"}, False),
            ("quiz", {"lesson_type": "text"}, False),
            ("assignment", {}, False),
            ("Lesson", {"lesson_type": "practicum"}, False),
            ("Lesson", {"lesson_type": "peer_review"}, False),
            ("Section", {"lesson_type": "text"}, False),
            ("Module", {}, False),
            ("Unit", {}, False),
        ],
    )
    def test_only_self_contained_lessons_are_previewable(
        self, node_type, properties, expected
    ):
        assert is_previewable_activity(node_type, properties) is expected


class PreviewColumnBackfillMigrationTests(TransactionTestCase):
    """The data migration copies properties->is_preview into the column."""

    migrate_from = [("curriculum", "0006_promote_google_meet_lesson_type")]
    migrate_to = [("curriculum", "0007_backfill_curriculum_node_is_preview")]

    def setUp(self):
        super().setUp()
        executor = MigrationExecutor(connection)
        self.latest_targets = executor.loader.graph.leaf_nodes()
        executor.migrate(self.migrate_from)

        # Historical models have no custom save(), so rows can hold stale
        # column values exactly as production data does before 0007.
        before_backfill = [
            target for target in self.latest_targets if target[0] != "curriculum"
        ] + self.migrate_from
        old_apps = executor.loader.project_state(before_backfill).apps
        self.node_model = old_apps.get_model("curriculum", "CurriculumNode")
        program = old_apps.get_model("core", "Program").objects.create(
            name="Backfill", code="BACKFILL-1", slug="backfill"
        )
        self.flagged = self._node(program, "Flagged", {"is_preview": True})
        self.string_flag = self._node(program, "String flag", {"is_preview": "true"})
        self.unflagged = self._node(program, "Unflagged", {"is_preview": False})
        self.missing = self._node(program, "Missing", {"lesson_type": "text"})
        self.stale_column = self._node(
            program, "Stale column", {"is_preview": False}, is_preview=True
        )
        self.no_key_stale = self._node(
            program, "No key stale", {"lesson_type": "text"}, is_preview=True
        )
        self.late_flagged = self._node(program, "Late flagged", {"is_preview": True})

        # Small batches prove the pk paging visits every candidate.
        migration = import_module(
            "apps.curriculum.migrations.0007_backfill_curriculum_node_is_preview"
        )
        with mock.patch.object(migration, "BATCH_SIZE", 2):
            MigrationExecutor(connection).migrate(self.migrate_to)

    def tearDown(self):
        MigrationExecutor(connection).migrate(self.latest_targets)
        super().tearDown()

    def _node(self, program, title, properties, is_preview=False):
        return self.node_model.objects.create(
            program=program,
            title=title,
            node_type="Lesson",
            properties=properties,
            is_preview=is_preview,
        )

    def test_column_is_backfilled_from_properties(self):
        def column(node):
            return CurriculumNode.objects.values_list("is_preview", flat=True).get(
                pk=node.pk
            )

        self.assertIs(column(self.flagged), True)
        self.assertIs(column(self.string_flag), True)
        self.assertIs(column(self.late_flagged), True)
        self.assertIs(column(self.unflagged), False)
        self.assertIs(column(self.missing), False)
        self.assertIs(column(self.stale_column), False)
        self.assertIs(column(self.no_key_stale), False)
        # properties are left untouched for the builder
        self.assertEqual(
            CurriculumNode.objects.get(pk=self.flagged.pk).properties,
            {"is_preview": True},
        )
