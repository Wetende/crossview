from datetime import timedelta
from unittest.mock import Mock, patch

from cryptography.fernet import Fernet
from django.conf import settings
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.google_classroom.configuration import encrypt_refresh_token
from apps.google_classroom.adapter import ClassroomAPIError
from apps.google_classroom.meet import (
    GoogleMeetAdapter,
    apply_meet_conference,
    eligible_attendee_preview,
)
from apps.google_classroom.oauth import disconnect_classroom
from apps.google_classroom.models import (
    ClassroomCourseLink,
    ClassroomOAuthCredential,
    ClassroomRosterMapping,
)
from apps.progression.models import Enrollment, NodeCompletion

from apps.live_sessions.models import LiveSessionSyncJob, ScheduledLearningSession


class GoogleMeetLessonTests(TestCase):
    def setUp(self):
        settings.GOOGLE_CLASSROOM_ENABLED = True
        settings.GOOGLE_CLASSROOM_CLIENT_ID = "workspace-client"
        settings.GOOGLE_CLASSROOM_CLIENT_SECRET = "workspace-secret"
        settings.GOOGLE_CLASSROOM_REDIRECT_URI = (
            "https://courses.example.test/api/google-workspace/oauth/callback/"
        )
        settings.GOOGLE_CLASSROOM_TOKEN_ENCRYPTION_KEY = (
            Fernet.generate_key().decode()
        )
        settings.PLATFORM_PUBLIC_BASE_URL = "https://courses.example.test"
        self.instructor = UserFactory(admin=True, email="teacher@example.test")
        self.student = UserFactory(email="learner@example.test")
        self.program = Program.objects.create(
            name="Live course",
            code="LIVE-COURSE",
            level="beginner",
            is_published=False,
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status="active",
        )
        self.node = CurriculumNode.objects.create(
            program=self.program,
            title="Weekly Meet",
            description="Instructor-led online workshop.",
            node_type="Lesson",
            properties={"lesson_type": "live_meeting"},
        )
        start = timezone.now() + timedelta(days=1)
        self.session = ScheduledLearningSession.objects.create(
            node=self.node,
            kind="live_meeting",
            provider="google_meet",
            title=self.node.title,
            summary=self.node.description,
            starts_at=start,
            ends_at=start + timedelta(hours=1),
            source_timezone="Africa/Nairobi",
            created_by=self.instructor,
        )
        self.credential = ClassroomOAuthCredential.objects.create(
            user=self.instructor,
            google_user_id="google-teacher",
            google_email=self.instructor.email,
            refresh_token_ciphertext=encrypt_refresh_token("refresh-token"),
            granted_scopes=[
                "https://www.googleapis.com/auth/classroom.courses.readonly",
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/meetings.space.created",
            ],
        )

    def test_calendar_adapter_creates_one_unique_meet_and_optional_invitations(self):
        endpoint = Mock()
        endpoint.insert.return_value.execute.return_value = {
            "id": "calendar-event",
            "hangoutLink": "https://meet.google.com/abc-defg-hij",
        }
        calendar = Mock()
        calendar.events.return_value = endpoint
        adapter = GoogleMeetAdapter(self.credential, calendar_service=calendar)

        adapter.create_event(
            self.session,
            attendee_emails=[self.student.email],
            request_id="stable-operation",
        )

        kwargs = endpoint.insert.call_args.kwargs
        self.assertEqual(kwargs["conferenceDataVersion"], 1)
        self.assertEqual(kwargs["sendUpdates"], "all")
        self.assertEqual(
            kwargs["body"]["conferenceData"]["createRequest"][
                "conferenceSolutionKey"
            ]["type"],
            "hangoutsMeet",
        )
        self.assertEqual(
            kwargs["body"]["attendees"], [{"email": self.student.email}]
        )
        self.assertIn(
            f"/student/courses/{self.program.id}/lessons/{self.node.id}/launch/",
            kwargs["body"]["description"],
        )

    def test_preview_lists_only_active_learners(self):
        withdrawn = UserFactory(email="withdrawn@example.test")
        Enrollment.objects.create(
            user=withdrawn,
            program=self.program,
            status="withdrawn",
        )

        preview = eligible_attendee_preview(self.session)

        self.assertEqual(preview["eligible"], 1)
        self.assertEqual(preview["learners"][0]["email"], self.student.email)

    def test_create_api_persists_meet_and_queues_attendance_sync(self):
        self.client.force_login(self.instructor)
        adapter = Mock()
        adapter.create_event.return_value = {
            "id": "calendar-event-1",
            "hangoutLink": "https://meet.google.com/abc-defg-hij",
            "htmlLink": "https://calendar.google.com/event?eid=1",
            "visibility": "private",
            "conferenceData": {
                "conferenceId": "abc-defg-hij",
                "entryPoints": [
                    {
                        "entryPointType": "video",
                        "uri": "https://meet.google.com/abc-defg-hij",
                    }
                ],
            },
        }

        with patch(
            "apps.google_classroom.meet.GoogleMeetAdapter", return_value=adapter
        ):
            response = self.client.post(
                reverse("live_sessions:google-meet-create", args=[self.node.id]),
                {
                    "inviteLearners": True,
                    "operationId": "0f159ea5-ed69-42b6-bef2-638750218b65",
                },
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 201)
        self.session.refresh_from_db()
        self.node.refresh_from_db()
        self.assertEqual(
            self.session.join_url, "https://meet.google.com/abc-defg-hij"
        )
        self.assertEqual(self.node.properties["provider_event_id"], "calendar-event-1")
        self.assertTrue(
            LiveSessionSyncJob.objects.filter(
                session=self.session,
                job_type="google_meet_attendance",
                status="pending",
            ).exists()
        )
        adapter.create_event.assert_called_once()
        self.assertEqual(
            adapter.create_event.call_args.kwargs["attendee_emails"],
            [self.student.email],
        )

    def test_transient_create_failure_is_retried_without_duplicate_jobs(self):
        self.client.force_login(self.instructor)
        adapter = Mock()
        adapter.create_event.side_effect = ClassroomAPIError(
            "Quota temporarily exhausted.", category="quota_or_transient"
        )
        payload = {
            "inviteLearners": False,
            "operationId": "0f159ea5-ed69-42b6-bef2-638750218b66",
        }

        with patch(
            "apps.google_classroom.meet.GoogleMeetAdapter", return_value=adapter
        ):
            first = self.client.post(
                reverse("live_sessions:google-meet-create", args=[self.node.id]),
                payload,
                content_type="application/json",
            )
            second = self.client.post(
                reverse("live_sessions:google-meet-create", args=[self.node.id]),
                payload,
                content_type="application/json",
            )

        self.assertEqual(first.status_code, 202)
        self.assertEqual(second.status_code, 202)
        self.assertEqual(
            LiveSessionSyncJob.objects.filter(
                session=self.session, job_type="google_meet_create"
            ).count(),
            1,
        )
        job = LiveSessionSyncJob.objects.get(
            session=self.session, job_type="google_meet_create"
        )
        self.assertEqual(job.status, "failed")
        self.assertGreater(job.available_at, timezone.now())

    def test_verified_attendance_completes_and_unmatched_people_wait_for_review(self):
        link = ClassroomCourseLink.objects.create(
            program=self.program,
            credential=self.credential,
            classroom_course_id="classroom-course",
            classroom_name="Companion",
        )
        ClassroomRosterMapping.objects.create(
            course_link=link,
            enrollment=self.enrollment,
            lms_user=self.student,
            google_user_id="google-learner",
            verified_email=self.student.email,
            status="matched",
        )
        self.session.starts_at = timezone.now() - timedelta(hours=2)
        self.session.ends_at = self.session.starts_at + timedelta(hours=1)
        self.session.save(update_fields=["starts_at", "ends_at", "updated_at"])
        result = {
            "record": {
                "name": "conferenceRecords/record-1",
                "endTime": self.session.ends_at.isoformat(),
            },
            "recordingUrl": "https://drive.google.com/file/d/recording/view",
            "attendance": [
                {
                    "participantName": "participants/known",
                    "externalUserId": "users/google-learner",
                    "displayName": "Known learner",
                    "sessions": [
                        {
                            "startTime": self.session.starts_at.isoformat(),
                            "endTime": (
                                self.session.starts_at + timedelta(minutes=40)
                            ).isoformat(),
                        }
                    ],
                },
                {
                    "participantName": "participants/anonymous",
                    "externalUserId": "",
                    "displayName": "Guest",
                    "sessions": [],
                },
            ],
        }

        summary = apply_meet_conference(self.session, result)

        self.assertEqual(summary, {"matched": 1, "unmatched": 1, "recordingAvailable": True})
        completion = NodeCompletion.objects.get(
            enrollment=self.enrollment, node=self.node
        )
        self.assertEqual(completion.completion_type, "attendance")
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "completed")
        self.assertEqual(
            self.session.provider_metadata["unmatchedParticipants"][0]["displayName"],
            "Guest",
        )

    def test_disconnect_pauses_linked_meet_synchronization(self):
        with patch(
            "apps.google_classroom.oauth.requests.post",
            return_value=Mock(status_code=200),
        ):
            disconnect_classroom(self.credential)

        self.session.refresh_from_db()
        self.assertTrue(self.session.provider_metadata["syncPaused"])
        self.assertEqual(
            self.session.provider_metadata["syncPausedReason"],
            "authorization_revoked",
        )
