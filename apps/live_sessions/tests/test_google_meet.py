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
from apps.google_workspace.configuration import encrypt_refresh_token
from apps.google_workspace.meet import GoogleMeetAdapter, apply_meet_conference
from apps.google_workspace.models import GoogleParticipantIdentity, GoogleWorkspaceCredential
from apps.progression.models import Enrollment, NodeCompletion
from apps.live_sessions.models import LiveSessionSyncJob, ScheduledLearningSession


class GoogleMeetLessonTests(TestCase):
    def setUp(self):
        settings.GOOGLE_WORKSPACE_ENABLED = True
        settings.GOOGLE_WORKSPACE_CLIENT_ID = "workspace-client"
        settings.GOOGLE_WORKSPACE_CLIENT_SECRET = "workspace-secret"
        settings.GOOGLE_WORKSPACE_REDIRECT_URI = "https://virtual.airads.ac.ke/api/google-workspace/oauth/callback/"
        settings.GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY = Fernet.generate_key().decode()
        settings.PLATFORM_PUBLIC_BASE_URL = "https://virtual.airads.ac.ke"
        self.instructor, self.student = UserFactory(admin=True, email="teacher@example.test"), UserFactory(email="learner@example.test")
        self.program = Program.objects.create(name="Live course", code="LIVE-COURSE", level="beginner")
        self.enrollment = Enrollment.objects.create(user=self.student, program=self.program, status="active")
        self.node = CurriculumNode.objects.create(program=self.program, title="Weekly Meet", node_type="Lesson", properties={"lesson_type": "live_meeting"})
        start = timezone.now() + timedelta(days=1)
        self.session = ScheduledLearningSession.objects.create(node=self.node, kind="live_meeting", provider="google_meet", title="Weekly Meet", starts_at=start, ends_at=start + timedelta(hours=1), source_timezone="Africa/Nairobi", created_by=self.instructor)
        self.credential = GoogleWorkspaceCredential.objects.create(user=self.instructor, google_email=self.instructor.email, refresh_token_ciphertext=encrypt_refresh_token("refresh-token"), granted_scopes=["https://www.googleapis.com/auth/calendar.events"])

    def test_calendar_scope_creates_meet_without_optional_meet_scope(self):
        endpoint, calendar = Mock(), Mock(); calendar.events.return_value = endpoint
        endpoint.insert.return_value.execute.return_value = {"id": "calendar-event", "hangoutLink": "https://meet.google.com/abc-defg-hij"}
        GoogleMeetAdapter(self.credential, calendar_service=calendar).create_event(self.session, attendee_emails=[self.student.email], request_id="stable")
        self.assertEqual(endpoint.insert.call_args.kwargs["conferenceDataVersion"], 1)
        self.assertEqual(endpoint.insert.call_args.kwargs["sendUpdates"], "none")

    def test_create_api_is_calendar_only_and_does_not_queue_attendance(self):
        self.client.force_login(self.instructor)
        adapter = Mock(); adapter.create_event.return_value = {"id": "event", "hangoutLink": "https://meet.google.com/abc-defg-hij", "conferenceData": {"conferenceId": "abc", "entryPoints": [{"entryPointType": "video", "uri": "https://meet.google.com/abc-defg-hij"}]}}
        with patch("apps.google_workspace.meet.GoogleMeetAdapter", return_value=adapter):
            response = self.client.post(reverse("live_sessions:google-meet-create", args=[self.node.id]), {"inviteLearners": True, "operationId": "0f159ea5-ed69-42b6-bef2-638750218b65"}, content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertFalse(LiveSessionSyncJob.objects.filter(session=self.session, job_type="google_meet_attendance").exists())
        self.session.refresh_from_db()
        self.assertTrue(self.session.invite_learners)
        self.assertEqual(self.session.send_updates, "all")

    def test_attendance_requires_identity_mapping_and_never_completes_lesson(self):
        self.session.starts_at = timezone.now() - timedelta(hours=2); self.session.ends_at = self.session.starts_at + timedelta(hours=1); self.session.save()
        GoogleParticipantIdentity.objects.create(user=self.student, google_user_id="learner")
        outcome = apply_meet_conference(self.session, {"record": {"name": "conferenceRecords/1", "endTime": timezone.now().isoformat()}, "attendance": [{"participantName": "p/1", "externalUserId": "users/learner", "displayName": "Learner", "sessions": [{"startTime": self.session.starts_at.isoformat(), "endTime": self.session.ends_at.isoformat()}]}, {"participantName": "p/2", "externalUserId": "", "displayName": "Anonymous", "sessions": []}], "recordingUrl": ""})
        self.assertEqual(outcome["matched"], 1); self.assertEqual(outcome["unmatched"], 1)
        self.assertFalse(NodeCompletion.objects.filter(enrollment=self.enrollment, node=self.node).exists())
