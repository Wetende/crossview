"""Course-builder saves must not silently overwrite changes saved through an AI app."""

import json
from unittest.mock import patch

from django.contrib.messages import get_messages
from django.db import connection
from django.test import TestCase

from apps.assessments.models import Question
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode

from .. import changes
from ..conflicts import EDIT_CONFLICT_TAG
from .helpers import LINKS, FakeToken, make_course, make_user

TOKEN = FakeToken()


class BuilderConflictTests(TestCase):
    def setUp(self):
        self.instructor = make_user("teacher", instructor=True)
        self.course = make_course("AI101", instructor=self.instructor)
        self.client.force_login(self.instructor)

    def ai_apply(self, operations):
        prepared = changes.prepare_change(
            user=self.instructor, token=TOKEN, links=LINKS,
            course_id=self.course["program"].id, operations=operations,
        )
        return changes.apply_change(user=self.instructor, token=TOKEN, links=LINKS, change_id=prepared["change_id"])

    def builder_save(self, node, expected_version, **fields):
        node.refresh_from_db()
        payload = {"title": node.title, "description": node.description or "", "properties": dict(node.properties)}
        payload.update(fields)
        if expected_version is not None:
            payload["expected_version"] = expected_version
        response = self.client.post(
            f"/instructor/nodes/{node.id}/update/", data=json.dumps(payload), content_type="application/json"
        )
        return response, [(m.tags, str(m)) for m in get_messages(response.wsgi_request)]

    def version(self, node):
        node.refresh_from_db()
        return node.updated_at.isoformat()

    def test_curriculum_and_program_payloads_carry_versions(self):
        page = self.client.get(f"/instructor/programs/{self.course['program'].id}/manage/", HTTP_X_INERTIA=True).json()
        nodes = [child for module in page["props"]["curriculum"] for child in [module, *module["children"]]]
        self.assertTrue(all(node["version"] for node in nodes))
        self.assertTrue(page["props"]["program"]["version"])

    def test_stale_quiz_editor_cannot_delete_questions_added_by_ai(self):
        quiz_node = self.course["quiz_node"]
        opened_version = self.version(quiz_node)
        stale_questions = list(quiz_node.properties["questions"])
        self.ai_apply([{
            "op": "add_questions", "quiz_lesson_id": quiz_node.id,
            "questions": [{"type": "true_false", "text": "AI added this.", "correct": True}],
        }])
        self.assertEqual(self.course["quiz"].questions.count(), 3)

        stale_props = dict(quiz_node.properties, questions=stale_questions)
        response, flashed = self.builder_save(quiz_node, opened_version, title="Renamed quiz", properties=stale_props)

        self.assertEqual(response.status_code, 302)
        self.assertTrue(any(EDIT_CONFLICT_TAG in tags for tags, _ in flashed))
        self.assertEqual(self.course["quiz"].questions.count(), 3)
        self.assertTrue(Question.objects.filter(text="AI added this.").exists())
        quiz_node.refresh_from_db()
        self.assertEqual(quiz_node.title, "Module 2 quiz")

    def test_quiz_question_sync_stays_inside_the_guarded_save_transaction(self):
        quiz_node = self.course["quiz_node"]
        opened_version = self.version(quiz_node)
        outer_depth = len(connection.atomic_blocks)
        sync_depths = []

        from apps.core import views as core_views

        original_sync = core_views._sync_quiz_questions

        def record_transaction(node, questions, **kwargs):
            sync_depths.append(len(connection.atomic_blocks))
            return original_sync(node, questions, **kwargs)

        with patch.object(core_views, "_sync_quiz_questions", side_effect=record_transaction):
            response, flashed = self.builder_save(quiz_node, opened_version, title="Updated quiz")

        self.assertEqual(response.status_code, 302)
        self.assertFalse(any(EDIT_CONFLICT_TAG in tags for tags, _ in flashed))
        self.assertEqual(len(sync_depths), 1)
        self.assertGreater(sync_depths[0], outer_depth)

    def test_editor_opened_after_the_ai_change_saves_normally(self):
        lesson = self.course["lesson"]
        self.ai_apply([{"op": "update_text_lesson", "lesson_id": lesson.id, "title": "What is artificial intelligence?"}])
        response, flashed = self.builder_save(lesson, self.version(lesson), title="AI basics")
        self.assertFalse(any(EDIT_CONFLICT_TAG in tags for tags, _ in flashed))
        lesson.refresh_from_db()
        self.assertEqual(lesson.title, "AI basics")

    def test_own_overlapping_saves_and_unrelated_ai_changes_do_not_conflict(self):
        lesson = self.course["lesson"]
        opened_version = self.version(lesson)
        self.builder_save(lesson, opened_version, title="First autosave")
        self.ai_apply([{"op": "update_module", "module_id": self.course["module2"].id, "title": "Module 2: ML"}])
        response, flashed = self.builder_save(lesson, opened_version, title="Second autosave")
        self.assertFalse(any(EDIT_CONFLICT_TAG in tags for tags, _ in flashed))
        lesson.refresh_from_db()
        self.assertEqual(lesson.title, "Second autosave")

    def test_editor_that_saved_before_an_ai_change_is_still_refused(self):
        # The sequence the browser run exposed: open, autosave, AI change, save.
        quiz_node = self.course["quiz_node"]
        opened_version = self.version(quiz_node)
        stale_questions = list(quiz_node.properties["questions"])
        self.builder_save(quiz_node, opened_version, title="Autosaved title")
        self.ai_apply([{
            "op": "add_questions", "quiz_lesson_id": quiz_node.id,
            "questions": [{"type": "true_false", "text": "AI added this.", "correct": True}],
        }])
        stale_props = dict(quiz_node.properties, questions=stale_questions)
        response, flashed = self.builder_save(quiz_node, opened_version, title="Stale save", properties=stale_props)
        self.assertTrue(any(EDIT_CONFLICT_TAG in tags for tags, _ in flashed))
        self.assertIn(f"node={quiz_node.id}", response["Location"])
        self.assertTrue(Question.objects.filter(text="AI added this.").exists())

    def test_saves_without_a_version_keep_working(self):
        lesson = self.course["lesson"]
        self.ai_apply([{"op": "update_text_lesson", "lesson_id": lesson.id, "title": "What is artificial intelligence?"}])
        self.builder_save(lesson, None, title="Legacy client save")
        lesson.refresh_from_db()
        self.assertEqual(lesson.title, "Legacy client save")

    def settings_save(self, expected_version, section="main", **fields):
        program = self.course["program"]
        payload = {"tab": "settings", "section": section, **fields}
        if expected_version is not None:
            payload["expected_version"] = expected_version
        response = self.client.post(f"/instructor/programs/{program.id}/manage/settings/", data=payload)
        return response, [(m.tags, str(m)) for m in get_messages(response.wsgi_request)]

    def test_stale_settings_form_cannot_overwrite_ai_course_changes(self):
        program = self.course["program"]
        opened_version = Program.objects.get(pk=program.pk).updated_at.isoformat()
        self.ai_apply([{"op": "update_course", "description_html": "<p>Written by the AI.</p>"}])

        response, flashed = self.settings_save(
            opened_version, name=program.name, description="<p>Old description</p>", whatYouLearn=""
        )
        self.assertTrue(any(EDIT_CONFLICT_TAG in tags for tags, _ in flashed))
        self.assertEqual(Program.objects.get(pk=program.pk).description, "<p>Written by the AI.</p>")

        fresh_version = Program.objects.get(pk=program.pk).updated_at.isoformat()
        self.settings_save(fresh_version, name=program.name, description="<p>Edited after reload</p>")
        self.assertEqual(Program.objects.get(pk=program.pk).description, "<p>Edited after reload</p>")

    def test_other_settings_sections_are_not_blocked(self):
        opened_version = Program.objects.get(pk=self.course["program"].pk).updated_at.isoformat()
        self.ai_apply([{"op": "update_course", "description_html": "<p>Written by the AI.</p>"}])
        response, flashed = self.settings_save(opened_version, section="access", access_duration_days="30")
        self.assertFalse(any(EDIT_CONFLICT_TAG in tags for tags, _ in flashed))
        self.assertEqual(Program.objects.get(pk=self.course["program"].pk).access_duration_days, 30)
