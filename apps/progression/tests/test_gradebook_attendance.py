import json
from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.live_sessions.models import (
    ScheduledLearningSession,
    SessionAttendance,
    SessionAttendanceAudit,
)
from apps.progression.models import Enrollment, NodeCompletion


class GradebookAttendanceTests(TestCase):
    def setUp(self):
        self.instructor = UserFactory(admin=True)
        self.program = Program.objects.create(
            name="Clinical Skills",
            code="CLINICAL-SKILLS",
            level="beginner",
            is_published=True,
        )
        self.learners = [UserFactory(), UserFactory()]
        self.enrollments = [
            Enrollment.objects.create(user=user, program=self.program)
            for user in self.learners
        ]
        self.node = CurriculumNode.objects.create(
            program=self.program,
            title="Practical workshop",
            node_type="Lesson",
            is_published=True,
            properties={"lesson_type": "in_person_session"},
        )
        self.session = ScheduledLearningSession.objects.create(
            node=self.node,
            kind=ScheduledLearningSession.Kind.IN_PERSON,
            provider=ScheduledLearningSession.Provider.PHYSICAL,
            title=self.node.title,
            starts_at=timezone.now() - timedelta(hours=2),
            ends_at=timezone.now() - timedelta(hours=1),
            source_timezone="Africa/Nairobi",
            venue="Skills Centre",
            address="10 Learning Road",
            created_by=self.instructor,
        )
        self.client.force_login(self.instructor)

    def _gradebook(self, *, session=None, partial=False):
        url = reverse(
            "progression:instructor.gradebook",
            kwargs={"pk": self.program.id},
        )
        query = "?view=attendance"
        if session:
            query += f"&session={session.node_id}"
        headers = {"HTTP_X_INERTIA": "true"}
        if partial:
            headers["HTTP_X_INERTIA_PARTIAL_DATA"] = (
                "attendanceSessions,selectedAttendance,googleWorkspaceConnection"
            )
        return self.client.get(url + query, **headers)

    def _mark(self, enrollment_ids, status="present", reason="Signed register"):
        return self.client.post(
            reverse(
                "progression:instructor.gradebook.attendance.mark",
                kwargs={"pk": self.program.id, "node_id": self.node.id},
            ),
            data=json.dumps(
                {
                    "enrollmentIds": enrollment_ids,
                    "status": status,
                    "reason": reason,
                }
            ),
            content_type="application/json",
        )

    @patch("apps.google_workspace.services.serialize_connection_for_request")
    def test_physical_session_props_never_resolve_google_connection(self, connection):
        response = self._gradebook(session=self.session)

        self.assertEqual(response.status_code, 200)
        props = response.json()["props"]
        self.assertEqual(props["attendanceSessions"][0]["kind"], "in_person_session")
        self.assertEqual(
            len(props["selectedAttendance"]["results"]),
            len(self.enrollments),
        )
        self.assertIsNone(props["googleWorkspaceConnection"])
        connection.assert_not_called()

    @patch("apps.progression.views._build_program_gradebook_payload")
    def test_attendance_partial_reload_skips_grade_calculation(self, grade_payload):
        response = self._gradebook(session=self.session, partial=True)

        self.assertEqual(response.status_code, 200)
        props = response.json()["props"]
        self.assertIn("attendanceSessions", props)
        self.assertNotIn("students", props)
        grade_payload.assert_not_called()

    @patch("apps.google_workspace.services.serialize_connection_for_request")
    def test_selected_google_meet_resolves_incremental_connection_state(
        self,
        connection,
    ):
        connection.return_value = {
            "connected": True,
            "grantedCapabilities": ["calendar_events"],
        }
        meet_node = CurriculumNode.objects.create(
            program=self.program,
            title="Remote review",
            node_type="Lesson",
            properties={"lesson_type": "google_meet"},
        )
        meet = ScheduledLearningSession.objects.create(
            node=meet_node,
            kind=ScheduledLearningSession.Kind.LIVE_MEETING,
            provider=ScheduledLearningSession.Provider.GOOGLE_MEET,
            title=meet_node.title,
            starts_at=timezone.now() - timedelta(hours=2),
            ends_at=timezone.now() - timedelta(hours=1),
            source_timezone="Africa/Nairobi",
        )

        response = self._gradebook(session=meet)

        self.assertEqual(response.status_code, 200)
        props = response.json()["props"]
        self.assertEqual(
            props["googleWorkspaceConnection"]["grantedCapabilities"],
            ["calendar_events"],
        )
        connection.assert_called_once()

    def test_atomic_bulk_marking_is_audited_and_completes_lessons(self):
        response = self._mark([row.id for row in self.enrollments])

        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            SessionAttendance.objects.filter(
                session=self.session,
                status=SessionAttendance.Status.PRESENT,
            ).count(),
            2,
        )
        self.assertEqual(
            SessionAttendanceAudit.objects.filter(session=self.session).count(),
            2,
        )
        self.assertEqual(
            NodeCompletion.objects.filter(node=self.node).count(),
            2,
        )
        self.assertFalse(
            NodeCompletion.objects.filter(
                node=self.node,
            ).exclude(completion_type="attendance").exists()
        )

    def test_invalid_enrollment_rejects_entire_bulk_selection(self):
        other_program = Program.objects.create(
            name="Other course",
            code="OTHER-ATTENDANCE",
            level="beginner",
        )
        outsider = Enrollment.objects.create(
            user=UserFactory(),
            program=other_program,
        )

        self._mark([self.enrollments[0].id, outsider.id])

        self.assertFalse(
            SessionAttendance.objects.filter(session=self.session).exists()
        )
        self.assertFalse(NodeCompletion.objects.filter(node=self.node).exists())

    def test_reason_is_required(self):
        self._mark([self.enrollments[0].id], reason="")

        self.assertFalse(
            SessionAttendance.objects.filter(session=self.session).exists()
        )

    def test_physical_attendance_is_rejected_before_start(self):
        self.session.starts_at = timezone.now() + timedelta(hours=1)
        self.session.ends_at = timezone.now() + timedelta(hours=2)
        self.session.save(update_fields=["starts_at", "ends_at", "updated_at"])

        self._mark([self.enrollments[0].id])

        self.assertFalse(
            SessionAttendance.objects.filter(session=self.session).exists()
        )

    def test_absent_reverses_only_attendance_origin_completion(self):
        enrollment = self.enrollments[0]
        self._mark([enrollment.id], status="present")
        enrollment.refresh_from_db()
        self.assertTrue(
            NodeCompletion.objects.filter(enrollment=enrollment, node=self.node).exists()
        )
        self.assertEqual(enrollment.status, "completed")

        self._mark([enrollment.id], status="absent", reason="Register corrected")

        self.assertFalse(
            NodeCompletion.objects.filter(enrollment=enrollment, node=self.node).exists()
        )
        enrollment.refresh_from_db()
        self.assertEqual(enrollment.status, "active")
        attendance = SessionAttendance.objects.get(
            session=self.session,
            enrollment=enrollment,
        )
        self.assertEqual(attendance.status, SessionAttendance.Status.ABSENT)
        self.assertEqual(float(attendance.attendance_percent), 0)

    def test_absent_preserves_completion_from_another_workflow(self):
        enrollment = self.enrollments[0]
        NodeCompletion.objects.create(
            enrollment=enrollment,
            node=self.node,
            completed_at=timezone.now(),
            completion_type="view",
            metadata={"source": "lesson_view"},
        )

        self._mark([enrollment.id], status="present")
        self._mark([enrollment.id], status="excused", reason="Approved absence")

        completion = NodeCompletion.objects.get(
            enrollment=enrollment,
            node=self.node,
        )
        self.assertEqual(completion.completion_type, "view")
        self.assertEqual(completion.metadata["source"], "lesson_view")

    def test_physical_reversal_does_not_change_google_manual_completion(self):
        from apps.live_sessions.services import override_attendance

        meet_node = CurriculumNode.objects.create(
            program=self.program,
            title="Remote review",
            node_type="Lesson",
            properties={"lesson_type": "google_meet"},
        )
        meet = ScheduledLearningSession.objects.create(
            node=meet_node,
            kind=ScheduledLearningSession.Kind.LIVE_MEETING,
            provider=ScheduledLearningSession.Provider.GOOGLE_MEET,
            title=meet_node.title,
            starts_at=timezone.now() - timedelta(hours=2),
            ends_at=timezone.now() - timedelta(hours=1),
            source_timezone="Africa/Nairobi",
        )
        enrollment = self.enrollments[0]
        override_attendance(
            session=meet,
            enrollment=enrollment,
            status=SessionAttendance.Status.PRESENT,
            reason="Instructor confirmed",
            actor=self.instructor,
        )

        override_attendance(
            session=meet,
            enrollment=enrollment,
            status=SessionAttendance.Status.ABSENT,
            reason="Provider record reviewed",
            actor=self.instructor,
        )

        completion = NodeCompletion.objects.get(
            enrollment=enrollment,
            node=meet_node,
        )
        self.assertEqual(completion.completion_type, "manual")
        self.assertEqual(completion.metadata["source"], "attendance_override")
