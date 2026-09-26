"""
Tests for notification services.
"""

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core import mail
from apps.core.models import Program
from apps.progression.models import Enrollment
from apps.notifications.models import Notification
from apps.notifications.models import NotificationPreference
from apps.notifications.services import NotificationService
from apps.platform.models import PlatformSettings

User = get_user_model()


class NotificationServiceTests(TestCase):
    """Test cases for NotificationService."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.program = Program.objects.create(
            name="Notification Test Program",
            code="NOTIF-TEST-1",
            level="beginner",
        )

    def test_create_notification(self):
        """Test creating a single notification."""
        notification = NotificationService.create(
            recipient=self.user,
            notification_type='system',
            title='Test Notification',
            message='This is a test message.',
        )
        
        self.assertIsNotNone(notification.id)
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.notification_type, 'system')
        self.assertEqual(notification.title, 'Test Notification')
        self.assertFalse(notification.is_read)

    def test_create_notification_with_action_url(self):
        """Test creating a notification with action URL."""
        notification = NotificationService.create(
            recipient=self.user,
            notification_type='announcement',
            title='New Announcement',
            message='Check out the new announcement.',
            action_url='/programs/1/announcements/',
        )
        
        self.assertEqual(notification.action_url, '/programs/1/announcements/')

    def test_notify_user_registered_uses_platform_identity(self):
        platform = PlatformSettings.get_settings()
        platform.institution_name = "Example Academy"
        platform.contact_email = "help@example.test"
        platform.save()

        sent = NotificationService.notify_user_registered(
            self.user,
            authentication_method="google",
        )

        self.assertTrue(sent)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Welcome to Example Academy")
        self.assertIn("signing in with Google", mail.outbox[0].body)
        self.assertIn("help@example.test", mail.outbox[0].body)

    def test_bulk_create_notifications(self):
        """Test bulk creating notifications for multiple users."""
        user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        
        users = [self.user, user2]
        notifications = NotificationService.bulk_create(
            recipients=users,
            notification_type='system',
            title='Bulk Notification',
            message='This is sent to all users.',
        )
        
        self.assertEqual(len(notifications), 2)
        self.assertEqual(Notification.objects.filter(title='Bulk Notification').count(), 2)

    def test_mark_as_read(self):
        """Test marking a notification as read."""
        notification = NotificationService.create(
            recipient=self.user,
            notification_type='system',
            title='Test',
            message='Test message',
        )
        
        self.assertFalse(notification.is_read)
        
        updated = NotificationService.mark_as_read(notification.id, self.user)
        self.assertEqual(updated, 1)
        
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)

    def test_mark_as_read_wrong_user(self):
        """Test that marking as read fails for wrong user."""
        notification = NotificationService.create(
            recipient=self.user,
            notification_type='system',
            title='Test',
            message='Test message',
        )
        
        other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='testpass123'
        )
        
        updated = NotificationService.mark_as_read(notification.id, other_user)
        self.assertEqual(updated, 0)

    def test_mark_all_as_read(self):
        """Test marking all notifications as read."""
        for i in range(3):
            NotificationService.create(
                recipient=self.user,
                notification_type='system',
                title=f'Test {i}',
                message='Test message',
            )
        
        self.assertEqual(
            Notification.objects.filter(recipient=self.user, is_read=False).count(),
            3
        )
        
        updated = NotificationService.mark_all_as_read(self.user)
        self.assertEqual(updated, 3)
        
        self.assertEqual(
            Notification.objects.filter(recipient=self.user, is_read=False).count(),
            0
        )

    def test_get_unread_count(self):
        """Test getting unread notification count."""
        for i in range(5):
            NotificationService.create(
                recipient=self.user,
                notification_type='system',
                title=f'Test {i}',
                message='Test message',
            )
        
        count = NotificationService.get_unread_count(self.user)
        self.assertEqual(count, 5)
        
        # Mark some as read
        NotificationService.mark_all_as_read(self.user)
        count = NotificationService.get_unread_count(self.user)
        self.assertEqual(count, 0)

    def test_notify_enrollment_confirmed_creates_in_app_and_email(self):
        """Enrollment confirmation should create in-app notification and send email."""
        enrollment = Enrollment.objects.create(
            user=self.user,
            program=self.program,
            status="active",
        )

        notification = NotificationService.notify_enrollment_confirmed(enrollment)

        self.assertEqual(notification.notification_type, "enrollment_confirmed")
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.email, mail.outbox[0].to)
        self.assertIn(self.program.name, mail.outbox[0].subject)

    def test_notify_enrollment_approved_respects_email_preference(self):
        """Email should not be sent when user has email notifications disabled."""
        NotificationPreference.objects.create(
            user=self.user,
            email_enabled=False,
        )
        enrollment = Enrollment.objects.create(
            user=self.user,
            program=self.program,
            status="active",
        )

        notification = NotificationService.notify_enrollment_approved(enrollment)

        self.assertEqual(notification.notification_type, "enrollment_approved")
        self.assertEqual(
            Notification.objects.filter(
                recipient=self.user,
                notification_type="enrollment_approved",
            ).count(),
            1,
        )
        self.assertEqual(len(mail.outbox), 0)


class CompletionNotificationTests(TestCase):
    """Course completion and certificate issue notifications."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="completion-learner",
            email="completion@example.com",
            password="testpass123",
            first_name="Sam",
        )
        self.program = Program.objects.create(
            name="Completion Program",
            code="NOTIF-COMPLETE-1",
            level="beginner",
        )
        self.enrollment = Enrollment.objects.create(
            user=self.user,
            program=self.program,
            status="active",
        )

    def _certificate(self):
        from apps.certifications.models import Certificate, CertificateTemplate

        template = CertificateTemplate.objects.get(
            name="Classic Formal",
            is_starter=True,
        )
        return Certificate.objects.create(
            enrollment=self.enrollment,
            template=template,
            serial_number="LMS-2026-NOTIFY",
            student_name="Sam",
            program_title=self.program.name,
            completion_date="2026-09-26",
            issue_date="2026-09-26",
            pdf_path="certificates/LMS-2026-NOTIFY.pdf",
        )

    def test_notify_course_completed_sends_in_app_and_email_once(self):
        first = NotificationService.notify_course_completed(self.enrollment)
        second = NotificationService.notify_course_completed(self.enrollment)

        self.assertEqual(first.pk, second.pk)
        self.assertEqual(first.notification_type, "course_completed")
        self.assertEqual(
            first.action_url,
            f"/student/programs/{self.enrollment.id}/complete/",
        )
        self.assertEqual(first.related_enrollment_id, self.enrollment.id)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(
            mail.outbox[0].subject, "Course completed: Completion Program"
        )
        self.assertIn("Hello Sam,", mail.outbox[0].body)

    def test_notify_course_completed_respects_type_preferences(self):
        NotificationPreference.objects.create(
            user=self.user,
            type_preferences={"course_completed": {"in_app": False, "email": False}},
        )

        notification = NotificationService.notify_course_completed(self.enrollment)

        self.assertIsNone(notification)
        self.assertFalse(
            Notification.objects.filter(notification_type="course_completed").exists()
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_notify_certificate_issued_sends_in_app_and_email_once(self):
        certificate = self._certificate()

        first = NotificationService.notify_certificate_issued(certificate)
        second = NotificationService.notify_certificate_issued(certificate)

        self.assertEqual(first.pk, second.pk)
        self.assertEqual(first.notification_type, "certificate_issued")
        self.assertEqual(first.action_url, "/student/certificates/")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(
            mail.outbox[0].subject, "Certificate issued: Completion Program"
        )
        self.assertIn("LMS-2026-NOTIFY", mail.outbox[0].body)

    def test_notify_certificate_issued_respects_email_preference(self):
        NotificationPreference.objects.create(user=self.user, email_enabled=False)
        certificate = self._certificate()

        notification = NotificationService.notify_certificate_issued(certificate)

        self.assertEqual(notification.notification_type, "certificate_issued")
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(PLATFORM_PUBLIC_BASE_URL="https://learn.example")
    def test_completion_emails_link_to_absolute_urls(self):
        from apps.notifications.models import NotificationEmailOutbox

        notification = NotificationService.notify_course_completed(self.enrollment)
        NotificationService.notify_certificate_issued(self._certificate())

        summary_url = (
            f"https://learn.example/student/programs/{self.enrollment.id}/complete/"
        )
        self.assertEqual(
            notification.action_url,
            f"/student/programs/{self.enrollment.id}/complete/",
        )
        self.assertIn(summary_url, mail.outbox[0].body)
        self.assertIn(
            "https://learn.example/student/certificates/", mail.outbox[1].body
        )
        course_row = NotificationEmailOutbox.objects.get(
            notification_type="course_completed"
        )
        self.assertEqual(course_row.metadata["action_url"], summary_url)
