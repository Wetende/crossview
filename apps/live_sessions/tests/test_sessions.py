from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, NodeCompletion

from apps.live_sessions.crypto import decrypt_session_secret
from apps.live_sessions.models import (
    ScheduledLearningSession,
    SessionAttendanceAudit,
)
from apps.live_sessions.services import (
    override_attendance,
    serialize_session_for_student,
    sync_scheduled_session_from_node,
    validate_session_properties,
)


class ScheduledLearningSessionTests(TestCase):
    def setUp(self):
        self.instructor = UserFactory(admin=True)
        self.student = UserFactory()
        self.program = Program.objects.create(
            name="Scheduled course",
            code="SCHEDULED",
            level="beginner",
            is_published=True,
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status="active",
        )

    def _meeting_node(self, *, start_delta=timedelta(hours=1)):
        start = timezone.now() + start_delta
        end = start + timedelta(hours=1)
        return CurriculumNode.objects.create(
            program=self.program,
            title="Weekly meeting",
            node_type="Lesson",
            is_published=True,
            properties={
                "lesson_type": "live_meeting",
                "provider": "google_meet",
                "session_url": "https://meet.google.com/abc-defg-hij",
                "meeting_password": "private-passcode",
                "starts_at": start.isoformat(),
                "ends_at": end.isoformat(),
                "timezone": "Africa/Nairobi",
            },
        )

    def test_sync_encrypts_passcode_and_removes_plaintext(self):
        node = self._meeting_node()
        session = sync_scheduled_session_from_node(node, actor=self.instructor)
        node.refresh_from_db()

        self.assertNotIn("meeting_password", node.properties)
        self.assertNotIn("private-passcode", session.passcode_ciphertext)
        self.assertEqual(
            decrypt_session_secret(session.passcode_ciphertext), "private-passcode"
        )

    def test_student_gets_join_details_only_inside_join_window(self):
        node = self._meeting_node(start_delta=timedelta(hours=2))
        session = sync_scheduled_session_from_node(node, actor=self.instructor)
        before_window = serialize_session_for_student(session, now=timezone.now())
        in_window = serialize_session_for_student(
            session, now=session.starts_at - timedelta(minutes=5)
        )

        self.assertFalse(before_window["isJoinable"])
        self.assertIsNone(before_window["joinUrl"])
        self.assertIsNone(before_window["passcode"])
        self.assertTrue(in_window["isJoinable"])
        self.assertEqual(in_window["passcode"], "private-passcode")

    def test_course_player_payload_does_not_leak_early_join_details(self):
        node = self._meeting_node(start_delta=timedelta(hours=2))
        sync_scheduled_session_from_node(node, actor=self.instructor)
        self.client.force_login(self.student)

        response = self.client.get(
            reverse(
                "progression:student.session",
                args=[self.enrollment.id, node.id],
            ),
            HTTP_X_INERTIA="true",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()["props"]["node"]
        self.assertNotIn("session_url", payload["properties"])
        self.assertNotIn("video_url", payload["properties"])
        self.assertIsNone(payload["scheduledSession"]["joinUrl"])
        self.assertIsNone(payload["scheduledSession"]["passcode"])

    def test_provider_specific_unsafe_url_is_rejected(self):
        with self.assertRaises(ValidationError):
            validate_session_properties(
                {
                    "lesson_type": "live_meeting",
                    "provider": "google_meet",
                    "session_url": "https://example.test/not-a-meet",
                    "starts_at": timezone.now().isoformat(),
                    "ends_at": (timezone.now() + timedelta(hours=1)).isoformat(),
                    "timezone": "UTC",
                }
            )

    def test_instructor_attendance_override_is_audited_and_completes_node(self):
        node = self._meeting_node(start_delta=timedelta(hours=-2))
        session = sync_scheduled_session_from_node(node, actor=self.instructor)
        attendance = override_attendance(
            session=session,
            enrollment=self.enrollment,
            status="present",
            reason="Confirmed against the signed class register.",
            actor=self.instructor,
        )

        self.assertEqual(attendance.source, "instructor_override")
        self.assertTrue(
            NodeCompletion.objects.filter(enrollment=self.enrollment, node=node).exists()
        )
        self.assertTrue(
            SessionAttendanceAudit.objects.filter(
                session=session,
                enrollment=self.enrollment,
                reason="Confirmed against the signed class register.",
            ).exists()
        )

    def test_instructor_api_creates_an_in_person_session(self):
        node = CurriculumNode.objects.create(
            program=self.program,
            title="Workshop",
            node_type="Lesson",
            is_published=True,
            properties={"lesson_type": "in_person_session"},
        )
        self.client.force_login(self.instructor)
        response = self.client.put(
            reverse("live_sessions:session", args=[node.id]),
            {
                "kind": "in_person_session",
                "provider": "physical",
                "title": "Workshop",
                "summary": "Practical workshop",
                "startsAt": (timezone.now() + timedelta(days=1)).isoformat(),
                "endsAt": (timezone.now() + timedelta(days=1, hours=2)).isoformat(),
                "timezone": "Australia/Melbourne",
                "venue": "Skills Centre",
                "room": "Lab 2",
                "address": "10 Learning Road",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["session"]["kind"], "in_person_session")
        self.assertTrue(ScheduledLearningSession.objects.filter(node=node).exists())
