from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.live_sessions.models import ScheduledLearningSession
from apps.live_sessions.notifications import notify_in_person_session_learners
from apps.notifications.models import (
    Notification,
    NotificationEmailOutbox,
    NotificationPreference,
)
from apps.notifications.outbox import process_notification_outbox
from apps.progression.models import Enrollment


class InPersonSessionNotificationTests(TestCase):
    def setUp(self):
        self.program = Program.objects.create(
            name="On-campus course",
            code="ON-CAMPUS",
            level="beginner",
        )
        self.learner = UserFactory(email="learner@example.test")
        self.enrollment = Enrollment.objects.create(
            user=self.learner,
            program=self.program,
        )
        self.node = CurriculumNode.objects.create(
            program=self.program,
            title="Campus workshop",
            node_type="Lesson",
            properties={"lesson_type": "in_person_session"},
        )
        self.session = ScheduledLearningSession.objects.create(
            node=self.node,
            kind=ScheduledLearningSession.Kind.IN_PERSON,
            provider=ScheduledLearningSession.Provider.PHYSICAL,
            title=self.node.title,
            starts_at=timezone.now() + timedelta(days=1),
            ends_at=timezone.now() + timedelta(days=1, hours=2),
            source_timezone="Africa/Nairobi",
            venue="Main Campus",
            room="Lab 2",
            address="10 Learning Road",
        )

    def _enable(self):
        self.node.properties = {
            **self.node.properties,
            "notify_enrolled_learners": True,
        }
        self.node.save(update_fields=["properties", "updated_at"])

    def test_notifications_default_off(self):
        result = notify_in_person_session_learners(self.session)

        self.assertEqual(result["eligible"], 0)
        self.assertFalse(Notification.objects.exists())
        self.assertFalse(NotificationEmailOutbox.objects.exists())

    @patch("apps.live_sessions.notifications.notify_in_person_session_learners")
    def test_existing_node_save_persists_toggle_and_uses_notification_service(
        self,
        notify_learners,
    ):
        notify_learners.return_value = {"eligible": 1, "notified": 1, "failed": 0}
        self.learner.is_staff = True
        self.learner.save(update_fields=["is_staff"])
        self.client.force_login(self.learner)
        starts_at = timezone.localtime(timezone.now() + timedelta(days=1))
        ends_at = starts_at + timedelta(hours=2)

        response = self.client.post(
            reverse("core:instructor.node_update", args=[self.node.id]),
            data={
                "title": self.node.title,
                "description": "Bring protective equipment.",
                "properties": {
                    "lesson_type": "in_person_session",
                    "session_kind": "in_person_session",
                    "provider": "physical",
                    "start_date": starts_at.date().isoformat(),
                    "start_time": starts_at.strftime("%H:%M"),
                    "end_date": ends_at.date().isoformat(),
                    "end_time": ends_at.strftime("%H:%M"),
                    "timezone": "Africa/Nairobi",
                    "venue": "Main Campus",
                    "room": "Lab 2",
                    "address": "10 Learning Road",
                    "notify_enrolled_learners": True,
                },
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 302)
        self.node.refresh_from_db()
        self.assertTrue(self.node.properties["notify_enrolled_learners"])
        notify_learners.assert_called_once()
        saved_session = notify_learners.call_args.args[0]
        self.assertEqual(saved_session.kind, ScheduledLearningSession.Kind.IN_PERSON)

    @patch(
        "apps.live_sessions.notifications.notify_in_person_session_learners",
        side_effect=RuntimeError("Queue unavailable"),
    )
    def test_notification_failure_does_not_roll_back_node_save(self, _notify):
        self.learner.is_staff = True
        self.learner.save(update_fields=["is_staff"])
        self.client.force_login(self.learner)
        starts_at = timezone.localtime(timezone.now() + timedelta(days=1))
        ends_at = starts_at + timedelta(hours=2)

        response = self.client.post(
            reverse("core:instructor.node_update", args=[self.node.id]),
            data={
                "title": "Updated campus workshop",
                "description": "Bring protective equipment.",
                "properties": {
                    "lesson_type": "in_person_session",
                    "session_kind": "in_person_session",
                    "provider": "physical",
                    "start_date": starts_at.date().isoformat(),
                    "start_time": starts_at.strftime("%H:%M"),
                    "end_date": ends_at.date().isoformat(),
                    "end_time": ends_at.strftime("%H:%M"),
                    "timezone": "Africa/Nairobi",
                    "venue": "Main Campus",
                    "room": "Lab 3",
                    "address": "10 Learning Road",
                    "notify_enrolled_learners": True,
                },
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 302)
        self.node.refresh_from_db()
        self.assertEqual(self.node.title, "Updated campus workshop")
        self.assertEqual(self.node.properties["room"], "Lab 3")

    def test_creation_and_material_changes_are_idempotent(self):
        self._enable()

        notify_in_person_session_learners(self.session)
        notify_in_person_session_learners(self.session)
        self.assertEqual(Notification.objects.count(), 1)
        self.assertEqual(NotificationEmailOutbox.objects.count(), 1)

        self.session.starts_at += timedelta(hours=1)
        self.session.ends_at += timedelta(hours=1)
        self.session.save(update_fields=["starts_at", "ends_at", "updated_at"])
        notify_in_person_session_learners(self.session)
        self.assertEqual(Notification.objects.count(), 2)

        self.session.room = "Lab 3"
        self.session.save(update_fields=["room", "updated_at"])
        notify_in_person_session_learners(self.session)
        self.assertEqual(Notification.objects.count(), 3)

    def test_learner_preferences_control_both_channels(self):
        self._enable()
        NotificationPreference.objects.create(
            user=self.learner,
            type_preferences={
                "scheduled_session": {"in_app": False, "email": False}
            },
        )

        notify_in_person_session_learners(self.session)

        self.assertFalse(Notification.objects.exists())
        self.assertFalse(NotificationEmailOutbox.objects.exists())

    def test_only_active_enrollments_are_notified(self):
        self._enable()
        withdrawn_user = UserFactory(email="withdrawn@example.test")
        Enrollment.objects.create(
            user=withdrawn_user,
            program=self.program,
            status="withdrawn",
        )
        completed_user = UserFactory(email="completed@example.test")
        Enrollment.objects.create(
            user=completed_user,
            program=self.program,
            status="completed",
        )

        notify_in_person_session_learners(self.session)

        self.assertEqual(Notification.objects.count(), 1)
        self.assertEqual(Notification.objects.first().recipient, self.learner)

    @patch("apps.notifications.outbox.send_mail", side_effect=RuntimeError("SMTP down"))
    def test_email_failure_uses_outbox_retry_without_losing_lesson(self, _send):
        self._enable()

        notify_in_person_session_learners(self.session)

        row = NotificationEmailOutbox.objects.get()
        self.assertEqual(row.status, "failed")
        self.assertTrue(ScheduledLearningSession.objects.filter(pk=self.session.pk).exists())

        row.available_at = timezone.now()
        row.save(update_fields=["available_at", "updated_at"])
        with patch("apps.notifications.outbox.send_mail", return_value=1):
            process_notification_outbox(row_ids=[row.id])
        row.refresh_from_db()
        self.assertEqual(row.status, "sent")
