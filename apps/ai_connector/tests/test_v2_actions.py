from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from oauth2_provider.models import get_application_model

from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.learning_operations.models import EnrollmentLearningActivity
from apps.messaging.models import DirectMessage
from apps.messaging.services import MessagingService
from apps.platform.models import PlatformSettings
from apps.progression.models import Enrollment, InstructorAssignment

from .. import changes, creation, diagnostics, messaging
from ..access import AccessDenied, ConnectorError
from ..access import get_program_for_user
from ..models import CourseChange
from .helpers import LINKS, FakeToken, make_course, make_user

TOKEN = FakeToken("courses:read courses:write learners:read messages:send")


@override_settings(AI_CONNECTOR_V2_ENABLED=True)
class NewCourseTests(TestCase):
    def setUp(self):
        self.teacher = make_user("new_course_teacher", instructor=True)
        self.existing = make_course("EXIST101")
        PlatformSettings.objects.update_or_create(
            pk=1, defaults={"active_blueprint": self.existing["program"].blueprint},
        )
        self.course = {
            "title": "Cyber Safety Essentials", "code": "CYBER101",
            "description_html": "<p>Stay safe online.</p>",
            "learning_outcomes": ["Recognize phishing"],
            "modules": [{"title": "Online safety", "items": [
                {"type": "text_lesson", "title": "Spot phishing", "body_html": "<p>Check sender addresses.</p>"},
                {"type": "quiz", "title": "Safety check", "questions": [
                    {"type": "true_false", "text": "A suspicious link can be dangerous.", "correct": True},
                ]},
            ]}],
        }

    def test_preview_does_not_create_and_apply_creates_one_unpublished_course(self):
        preview = creation.prepare_course(user=self.teacher, token=TOKEN, links=LINKS, course=self.course)
        self.assertFalse(Program.objects.filter(code="CYBER101").exists())
        self.assertEqual(preview["preview"]["modules"][0]["items"][1]["questions"][0]["correct_answer"], "True")
        result = creation.apply_course(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        program = Program.objects.get(code="CYBER101")
        self.assertFalse(program.is_published)
        self.assertEqual(program.what_you_learn_items, ["Recognize phishing"])
        self.assertTrue(InstructorAssignment.objects.filter(program=program, instructor=self.teacher).exists())
        self.assertEqual(CurriculumNode.objects.filter(program=program).count(), 3)
        self.assertEqual(result["course"]["id"], program.id)
        replay = creation.apply_course(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        self.assertTrue(replay["replayed"])
        self.assertEqual(Program.objects.filter(code="CYBER101").count(), 1)

    def test_duplicate_code_after_preview_is_stale(self):
        preview = creation.prepare_course(user=self.teacher, token=TOKEN, links=LINKS, course=self.course)
        Program.objects.create(blueprint=self.existing["program"].blueprint, name="Other", code="CYBER101")
        with self.assertRaises(ConnectorError):
            creation.apply_course(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        self.assertEqual(CourseChange.objects.get(pk=preview["change_id"]).status, "stale")

    def test_admin_can_create_and_access_an_unassigned_course(self):
        admin = make_user("new_course_admin", staff=True)
        preview = creation.prepare_course(user=admin, token=TOKEN, links=LINKS, course=self.course)
        result = creation.apply_course(user=admin, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        program_id = result["course"]["id"]
        self.assertEqual(get_program_for_user(admin, program_id).id, program_id)
        self.assertFalse(InstructorAssignment.objects.filter(program_id=program_id).exists())

    def test_disabled_account_cannot_apply(self):
        preview = creation.prepare_course(user=self.teacher, token=TOKEN, links=LINKS, course=self.course)
        self.teacher.is_active = False
        self.teacher.save(update_fields=["is_active"])
        with self.assertRaises(ConnectorError):
            creation.apply_course(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        self.assertFalse(Program.objects.filter(code="CYBER101").exists())

    def test_another_ai_client_cannot_apply_prepared_course(self):
        Application = get_application_model()
        first = Application.objects.create(
            name="First AI", client_type=Application.CLIENT_PUBLIC,
            authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
        )
        second = Application.objects.create(
            name="Second AI", client_type=Application.CLIENT_PUBLIC,
            authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
        )
        preview = creation.prepare_course(
            user=self.teacher, token=FakeToken(application=first), links=LINKS, course=self.course,
        )
        with self.assertRaises(AccessDenied):
            creation.apply_course(
                user=self.teacher, token=FakeToken(application=second), links=LINKS,
                change_id=preview["change_id"],
            )
        self.assertFalse(Program.objects.filter(code="CYBER101").exists())

    def test_creation_failure_rolls_back_the_whole_course(self):
        preview = creation.prepare_course(user=self.teacher, token=TOKEN, links=LINKS, course=self.course)
        with patch("apps.ai_connector.creation._apply_create_quiz", side_effect=RuntimeError("simulated failure")):
            with self.assertRaises(ConnectorError):
                creation.apply_course(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        self.assertFalse(Program.objects.filter(code="CYBER101").exists())
        self.assertEqual(CourseChange.objects.get(pk=preview["change_id"]).status, "failed")

    def test_unsupported_new_course_fields_are_not_silently_dropped(self):
        with self.assertRaises(ConnectorError):
            creation.prepare_course(
                user=self.teacher, token=TOKEN, links=LINKS,
                course={**self.course, "is_published": True},
            )
        self.assertFalse(Program.objects.filter(code="CYBER101").exists())


@override_settings(AI_CONNECTOR_V2_ENABLED=True)
class ModuleAndHealthTests(TestCase):
    def setUp(self):
        self.teacher = make_user("health_teacher", instructor=True)
        self.other = make_user("health_other", instructor=True)
        self.course = make_course("HEALTH101", published=True, instructor=self.teacher)

    def test_module_preview_apply_and_stale_layout(self):
        program = self.course["program"]
        preview = changes.prepare_change(
            user=self.teacher, token=TOKEN, links=LINKS, course_id=program.id,
            operations=[{"op": "create_module", "title": "Practice", "description": "Applied work"}],
        )
        self.assertTrue(preview["affects_published_content"])
        self.assertFalse(CurriculumNode.objects.filter(program=program, title="Practice").exists())
        changes.apply_change(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        module = CurriculumNode.objects.get(program=program, title="Practice")
        self.assertTrue(module.is_published)

        second = changes.prepare_change(
            user=self.teacher, token=TOKEN, links=LINKS, course_id=program.id,
            operations=[{"op": "create_module", "title": "More practice"}],
        )
        CurriculumNode.objects.create(program=program, title="Someone else's module", node_type="Module", position=99)
        with self.assertRaises(ConnectorError):
            changes.apply_change(user=self.teacher, token=TOKEN, links=LINKS, change_id=second["change_id"])

    @override_settings(AI_CONNECTOR_V2_ENABLED=False)
    def test_expanded_course_operation_is_disabled_by_default(self):
        with self.assertRaises(ConnectorError):
            changes.prepare_change(
                user=self.teacher, token=TOKEN, links=LINKS,
                course_id=self.course["program"].id,
                operations=[{"op": "create_module", "title": "Unavailable"}],
            )

    def test_disabling_v2_after_preview_blocks_application(self):
        preview = changes.prepare_change(
            user=self.teacher, token=TOKEN, links=LINKS,
            course_id=self.course["program"].id,
            operations=[{"op": "create_module", "title": "Pending module"}],
        )
        with override_settings(AI_CONNECTOR_V2_ENABLED=False):
            with self.assertRaises(AccessDenied):
                changes.apply_change(
                    user=self.teacher, token=TOKEN, links=LINKS,
                    change_id=preview["change_id"],
                )
        self.assertFalse(CurriculumNode.objects.filter(title="Pending module").exists())

    def test_health_is_evidence_based_and_access_scoped(self):
        learner = make_user("health_learner")
        enrollment = Enrollment.objects.create(user=learner, program=self.course["program"])
        EnrollmentLearningActivity.objects.create(
            enrollment=enrollment, started_at=timezone.now() - timedelta(days=10),
            last_activity_at=timezone.now() - timedelta(days=8), last_source="lesson_progress",
        )
        health = diagnostics.course_health(self.teacher, LINKS, self.course["program"].id)
        self.assertEqual(health["learner_states"]["stalled"], 1)
        self.assertIn("readiness", health)
        roster = diagnostics.course_learners(self.teacher, LINKS, self.course["program"].id)
        self.assertEqual(roster["items"][0]["enrollment_id"], enrollment.id)
        self.assertIn(f"/students/{enrollment.id}/", roster["items"][0]["learner_url"])
        enrollment.grades = {"unpublished_private_score": 42}
        enrollment.save(update_fields=["grades"])
        detail = diagnostics.learner_detail(self.teacher, LINKS, self.course["program"].id, enrollment.id)
        self.assertNotIn("grades", detail)
        self.assertEqual(detail["learner_url"], roster["items"][0]["learner_url"])
        with self.assertRaises(AccessDenied):
            diagnostics.course_learners(self.other, LINKS, self.course["program"].id)

    def test_hide_incomplete_item_preserves_it_and_reports_published_impact(self):
        program = self.course["program"]
        node = self.course["lesson"]
        preview = changes.prepare_change(
            user=self.teacher, token=TOKEN, links=LINKS, course_id=program.id,
            operations=[{"op": "set_item_visibility", "item_id": node.id, "visible": False}],
        )
        self.assertTrue(preview["affects_published_content"])
        node.refresh_from_db()
        self.assertTrue(node.is_published)
        changes.apply_change(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        node.refresh_from_db()
        self.assertFalse(node.is_published)
        self.assertTrue(CurriculumNode.objects.filter(pk=node.id).exists())

    def test_course_and_module_descriptive_fields_can_be_previewed_and_saved(self):
        program = self.course["program"]
        preview = changes.prepare_change(
            user=self.teacher, token=TOKEN, links=LINKS, course_id=program.id,
            operations=[
                {"op": "update_course", "preview_description": "Practical AI skills", "level": "Beginner"},
                {"op": "update_module", "module_id": self.course["module1"].id, "description": "Start here"},
            ],
        )
        program.refresh_from_db()
        self.assertNotEqual(program.preview_description, "Practical AI skills")
        changes.apply_change(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        program.refresh_from_db()
        self.course["module1"].refresh_from_db()
        self.assertEqual(program.preview_description, "Practical AI skills")
        self.assertEqual(program.level, "Beginner")
        self.assertEqual(self.course["module1"].description, "Start here")

    def test_only_admin_can_inspect_non_secret_lms_configuration(self):
        with self.assertRaises(AccessDenied):
            diagnostics.lms_configuration(self.teacher)
        admin = make_user("health_admin", staff=True)
        details = diagnostics.lms_configuration(admin)
        self.assertGreaterEqual(details["course_counts"]["total"], 1)
        self.assertNotIn("secret", str(details).lower())


@override_settings(AI_CONNECTOR_V2_ENABLED=True)
class LearnerMessageTests(TestCase):
    def setUp(self):
        self.teacher = make_user("message_teacher", instructor=True)
        self.other = make_user("message_other", instructor=True)
        self.course = make_course("MESSAGE101", instructor=self.teacher)
        self.learner = make_user("message_learner")
        self.enrollment = Enrollment.objects.create(user=self.learner, program=self.course["program"])
        Enrollment.objects.filter(pk=self.enrollment.pk).update(enrolled_at=timezone.now() - timedelta(days=10))
        self.enrollment.refresh_from_db()

    def prepare(self):
        return messaging.prepare_message(
            user=self.teacher, token=TOKEN, links=LINKS,
            course_id=self.course["program"].id,
            content="Please check your course and let me know if you need help.",
            inactivity_days=7,
        )

    def test_preview_send_and_idempotent_replay(self):
        preview = self.prepare()
        self.assertEqual(preview["recipient_count"], 1)
        self.assertEqual(DirectMessage.objects.count(), 0)
        result = messaging.apply_message(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        self.assertEqual(result["sent_count"], 1)
        self.assertEqual(DirectMessage.objects.count(), 1)
        replay = messaging.apply_message(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        self.assertTrue(replay["replayed"])
        self.assertEqual(DirectMessage.objects.count(), 1)

    def test_recent_activity_makes_preview_stale(self):
        preview = self.prepare()
        EnrollmentLearningActivity.objects.create(
            enrollment=self.enrollment, started_at=timezone.now(), last_activity_at=timezone.now(),
        )
        with self.assertRaises(ConnectorError):
            messaging.apply_message(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        self.assertEqual(DirectMessage.objects.count(), 0)

    def test_expired_enrollment_is_not_messaged(self):
        preview = self.prepare()
        Enrollment.objects.filter(pk=self.enrollment.pk).update(
            expires_at=timezone.now() - timedelta(days=1),
        )
        with self.assertRaises(ConnectorError):
            messaging.apply_message(
                user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"],
            )
        with self.assertRaises(AccessDenied):
            messaging.prepare_message(
                user=self.teacher, token=TOKEN, links=LINKS,
                course_id=self.course["program"].id, content="Hello",
                enrollment_ids=[self.enrollment.id],
            )
        self.assertEqual(DirectMessage.objects.count(), 0)

    def test_inactivity_selection_enforces_recipient_cap_before_preview(self):
        second = make_user("message_cap_second")
        second_enrollment = Enrollment.objects.create(user=second, program=self.course["program"])
        Enrollment.objects.filter(pk=second_enrollment.pk).update(
            enrolled_at=timezone.now() - timedelta(days=10),
        )
        with patch("apps.ai_connector.messaging.MAX_RECIPIENTS", 1):
            with self.assertRaisesMessage(ConnectorError, "2 learners match"):
                self.prepare()
        self.assertFalse(CourseChange.objects.filter(kind="learner_message").exists())

    def test_scope_assignment_and_guessed_id_are_denied(self):
        with self.assertRaises(AccessDenied):
            messaging.prepare_message(
                user=self.teacher, token=FakeToken("courses:read courses:write"), links=LINKS,
                course_id=self.course["program"].id, content="Hello", enrollment_ids=[self.enrollment.id],
            )
        with self.assertRaises(AccessDenied):
            messaging.prepare_message(
                user=self.other, token=TOKEN, links=LINKS,
                course_id=self.course["program"].id, content="Hello", enrollment_ids=[self.enrollment.id],
            )
        preview = self.prepare()
        InstructorAssignment.objects.filter(program=self.course["program"], instructor=self.teacher).delete()
        with self.assertRaises(AccessDenied):
            messaging.apply_message(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        self.assertEqual(DirectMessage.objects.count(), 0)

    def test_mid_batch_failure_rolls_back_every_message(self):
        second = make_user("message_second")
        second_enrollment = Enrollment.objects.create(user=second, program=self.course["program"])
        Enrollment.objects.filter(pk=second_enrollment.pk).update(enrolled_at=timezone.now() - timedelta(days=10))
        preview = self.prepare()
        self.assertEqual(preview["recipient_count"], 2)
        original = MessagingService.send_message
        calls = 0

        def fail_second(conversation, sender, content):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise RuntimeError("simulated delivery failure")
            return original(conversation, sender, content)

        with patch.object(MessagingService, "send_message", side_effect=fail_second):
            with self.assertRaises(ConnectorError):
                messaging.apply_message(user=self.teacher, token=TOKEN, links=LINKS, change_id=preview["change_id"])
        self.assertEqual(DirectMessage.objects.count(), 0)
        self.assertEqual(CourseChange.objects.get(pk=preview["change_id"]).status, "failed")
