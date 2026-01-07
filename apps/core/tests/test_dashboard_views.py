import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase

User = get_user_model()

@pytest.mark.django_db
class TestDashboardViews(TestCase):
    """Tests for the unified dashboard view."""

    def setUp(self):
        """Set up test users and groups."""
        self.instructor_group, _ = Group.objects.get_or_create(name="Instructors")
        
        self.superadmin = User.objects.create_superuser(
            username="super@test.com", email="super@test.com", password="password123"
        )
        self.admin = User.objects.create_user(
            username="admin@test.com", email="admin@test.com", password="password123", is_staff=True
        )
        self.instructor = User.objects.create_user(
            username="inst@test.com", email="inst@test.com", password="password123"
        )
        self.instructor.groups.add(self.instructor_group)
        
        self.student = User.objects.create_user(
            username="student@test.com", email="student@test.com", password="password123"
        )

    def test_dashboard_redirect_to_superadmin(self):
        """SuperAdmin should see superadmin dashboard."""
        self.client.login(username="super@test.com", password="password123")
        response = self.client.get(reverse('core:dashboard'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'Dashboard'
        assert data['props']['role'] == 'superadmin'

    def test_dashboard_redirect_to_admin(self):
        """Admin should see admin dashboard."""
        self.client.login(username="admin@test.com", password="password123")
        response = self.client.get(reverse('core:dashboard'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'Dashboard'
        assert data['props']['role'] == 'admin'

    def test_dashboard_redirect_to_instructor(self):
        """Instructor should see instructor dashboard."""
        self.client.login(username="inst@test.com", password="password123")
        response = self.client.get(reverse('core:dashboard'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'Dashboard'
        assert data['props']['role'] == 'instructor'

    def test_dashboard_redirect_to_student(self):
        """Student should see student dashboard."""
        self.client.login(username="student@test.com", password="password123")
        response = self.client.get(reverse('core:dashboard'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'Dashboard'
        assert data['props']['role'] == 'student'

    def test_landing_page_accessible(self):
        """Verify landing page is accessible without auth."""
        response = self.client.get(reverse('core:landing'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'Public/Landing'
