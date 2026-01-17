"""
Tests for notification API views.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.notifications.models import Notification
from apps.notifications.services import NotificationService

User = get_user_model()


class NotificationViewsTests(TestCase):
    """Test cases for notification API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        # Create test notifications
        for i in range(5):
            NotificationService.create(
                recipient=self.user,
                notification_type='system',
                title=f'Notification {i}',
                message=f'Message {i}',
            )

    def test_list_notifications_unauthenticated(self):
        """Test that unauthenticated users cannot list notifications."""
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, 403)

    def test_list_notifications_authenticated(self):
        """Test listing notifications for authenticated user."""
        self.client.force_login(self.user)
        response = self.client.get('/api/notifications/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['notifications']), 5)
        self.assertEqual(data['total'], 5)

    def test_list_notifications_pagination(self):
        """Test notification list pagination."""
        self.client.force_login(self.user)
        response = self.client.get('/api/notifications/?page=1&per_page=2')
        
        data = response.json()
        self.assertEqual(len(data['notifications']), 2)
        self.assertTrue(data['has_more'])

    def test_unread_count(self):
        """Test unread count endpoint."""
        self.client.force_login(self.user)
        response = self.client.get('/api/notifications/unread-count/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['count'], 5)

    def test_mark_as_read(self):
        """Test marking a notification as read."""
        self.client.force_login(self.user)
        
        notification = Notification.objects.filter(recipient=self.user).first()
        response = self.client.post(f'/api/notifications/{notification.id}/read/')
        
        self.assertEqual(response.status_code, 200)
        
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_mark_all_as_read(self):
        """Test marking all notifications as read."""
        self.client.force_login(self.user)
        response = self.client.post('/api/notifications/mark-all-read/')
        
        self.assertEqual(response.status_code, 200)
        
        unread_count = Notification.objects.filter(
            recipient=self.user, is_read=False
        ).count()
        self.assertEqual(unread_count, 0)

    def test_delete_notification(self):
        """Test deleting a notification."""
        self.client.force_login(self.user)
        
        notification = Notification.objects.filter(recipient=self.user).first()
        notification_id = notification.id
        
        response = self.client.delete(f'/api/notifications/{notification_id}/')
        
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Notification.objects.filter(id=notification_id).exists())

    def test_cannot_access_other_user_notifications(self):
        """Test that users cannot access other users' notifications."""
        other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='testpass123'
        )
        
        self.client.force_login(other_user)
        response = self.client.get('/api/notifications/')
        
        data = response.json()
        self.assertEqual(len(data['notifications']), 0)
