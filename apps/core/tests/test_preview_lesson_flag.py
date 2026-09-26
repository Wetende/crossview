"""CurriculumNode.is_preview is the single source of truth for free previews."""

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

        # 0007 is data-only, so the current models match the 0006 schema.
        program = Program.objects.create(name="Backfill", code="BACKFILL-1")
        self.flagged = self._node(program, "Flagged", {"is_preview": True})
        self.string_flag = self._node(program, "String flag", {"is_preview": "true"})
        self.unflagged = self._node(program, "Unflagged", {"is_preview": False})
        self.missing = self._node(program, "Missing", {"lesson_type": "text"})
        self.stale_column = self._node(
            program, "Stale column", {"is_preview": False}, is_preview=True
        )

        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_to)

    def tearDown(self):
        MigrationExecutor(connection).migrate(self.latest_targets)
        super().tearDown()

    @staticmethod
    def _node(program, title, properties, is_preview=False):
        return CurriculumNode.objects.create(
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
        self.assertIs(column(self.unflagged), False)
        self.assertIs(column(self.missing), False)
        self.assertIs(column(self.stale_column), False)
        # properties are left untouched for the builder
        self.assertEqual(
            CurriculumNode.objects.get(pk=self.flagged.pk).properties,
            {"is_preview": True},
        )
