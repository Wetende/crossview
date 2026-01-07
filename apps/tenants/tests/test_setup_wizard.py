import pytest
import json
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.test import TestCase
from apps.tenants.models import PlatformSettings, Tenant, PresetBlueprint
from apps.tenants.services import PlatformSettingsService

User = get_user_model()

@pytest.mark.django_db
class TestSetupWizard(TestCase):
    """Tests for the multi-step setup wizard."""

    def setUp(self):
        """Set up test user and clear existing settings."""
        self.user = User.objects.create_superuser(
            username="admin@test.com",
            email="admin@test.com",
            password="password123"
        )
        self.client.login(username="admin@test.com", password="password123")
        # Ensure fresh settings
        PlatformSettings.objects.all().delete()
        self.settings = PlatformSettings.get_settings()

    def test_setup_wizard_redirects_if_complete(self):
        """If setup is complete, setup_wizard should redirect to dashboard."""
        self.settings.is_setup_complete = True
        self.settings.save()
        
        response = self.client.get(reverse('tenants:setup.wizard'))
        assert response.status_code == 302
        assert response.url == reverse('tenants:superadmin.dashboard')

    def test_setup_wizard_redirects_to_first_step_if_incomplete(self):
        """If setup is incomplete, setup_wizard should redirect to institution step."""
        self.settings.is_setup_complete = False
        self.settings.save()
        
        response = self.client.get(reverse('tenants:setup.wizard'))
        assert response.status_code == 302
        assert response.url == reverse('tenants:setup.institution')

    def test_setup_institution_get(self):
        """Step 1: Institution information (GET)."""
        response = self.client.get(reverse('tenants:setup.institution'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'SuperAdmin/Setup/Institution'

    def test_setup_institution_post(self):
        """Step 1: Institution information (POST)."""
        data = {
            "institutionName": "Test Academy",
            "tagline": "Learning is fun",
            "contactEmail": "hello@testacademy.com",
            "contactPhone": "123456789",
            "address": "123 Test St",
        }
        response = self.client.post(reverse('tenants:setup.institution'), data=data)
        assert response.status_code == 302
        assert response.url == reverse('tenants:setup.mode')
        
        self.settings.refresh_from_db()
        assert self.settings.institution_name == "Test Academy"
        assert self.settings.tagline == "Learning is fun"

    def test_setup_mode_get(self):
        """Step 2: Deployment mode (GET)."""
        response = self.client.get(reverse('tenants:setup.mode'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'SuperAdmin/Setup/Mode'

    def test_setup_mode_post(self):
        """Step 2: Deployment mode (POST)."""
        data = {
            "deploymentMode": "tvet"
        }
        response = self.client.post(reverse('tenants:setup.mode'), data=data)
        assert response.status_code == 302
        assert response.url == reverse('tenants:setup.branding')
        
        self.settings.refresh_from_db()
        assert self.settings.deployment_mode == "tvet"
        assert self.settings.active_blueprint is not None
        assert self.settings.active_blueprint.name == "TVET Standard (CDACC)"

    def test_setup_branding_get(self):
        """Step 3: Branding (GET)."""
        response = self.client.get(reverse('tenants:setup.branding'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'SuperAdmin/Setup/Branding'

    def test_setup_branding_post(self):
        """Step 3: Branding (POST)."""
        data = {
            "primaryColor": "#FF0000",
            "secondaryColor": "#00FF00",
            "customCss": "body { background: red; }",
        }
        response = self.client.post(reverse('tenants:setup.branding'), data=data)
        assert response.status_code == 302
        assert response.url == reverse('tenants:setup.features')
        
        self.settings.refresh_from_db()
        assert self.settings.primary_color == "#FF0000"
        assert self.settings.custom_css == "body { background: red; }"

    def test_setup_features_get(self):
        """Step 4: Features (GET)."""
        response = self.client.get(reverse('tenants:setup.features'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'SuperAdmin/Setup/Features'

    def test_setup_features_post(self):
        """Step 4: Features (POST)."""
        data = {
            "certificates": True,
            "gamification": True,
            "selfRegistration": True
        }
        response = self.client.post(reverse('tenants:setup.features'), data=data, content_type='application/json')
        assert response.status_code == 302
        assert response.url == reverse('tenants:superadmin.dashboard')
        
        self.settings.refresh_from_db()
        assert self.settings.is_setup_complete is True
        assert self.settings.is_feature_enabled("gamification") is True
        assert self.settings.is_feature_enabled("self_registration") is True
