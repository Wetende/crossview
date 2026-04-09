"""Tests for legacy superadmin routes now backed by Django admin."""

import pytest
from django.urls import reverse

from apps.core.tests.factories import UserFactory
from apps.platform.models import PlatformSettings
from apps.platform.tests.factories import PresetBlueprintFactory


@pytest.fixture
def authenticated_superadmin(client):
    user = UserFactory(password="TestPass123", superadmin=True)
    client.force_login(user)
    return client


@pytest.fixture
def authenticated_regular(client):
    user = UserFactory(password="TestPass123")
    client.force_login(user)
    return client


@pytest.mark.django_db
class TestLegacySuperAdminRoutes:
    def test_superadmin_dashboard_redirects_to_django_admin(self, authenticated_superadmin):
        response = authenticated_superadmin.get("/superadmin/")
        assert response.status_code == 302
        assert response.url == reverse("admin:index")

    def test_regular_user_redirected_from_superadmin_dashboard(self, authenticated_regular):
        response = authenticated_regular.get("/superadmin/")
        assert response.status_code == 302
        assert response.url == "/dashboard/"

    def test_superadmin_presets_redirect_to_admin_changelist(self, authenticated_superadmin):
        PresetBlueprintFactory.create_batch(2)
        response = authenticated_superadmin.get("/superadmin/presets/")
        assert response.status_code == 302
        assert response.url == reverse("admin:platform_presetblueprint_changelist")

    def test_superadmin_preset_create_redirects_to_admin_add(self, authenticated_superadmin):
        response = authenticated_superadmin.get("/superadmin/presets/create/")
        assert response.status_code == 302
        assert response.url == reverse("admin:platform_presetblueprint_add")

    def test_superadmin_preset_edit_redirects_to_admin_change(self, authenticated_superadmin):
        preset = PresetBlueprintFactory()
        response = authenticated_superadmin.get(f"/superadmin/presets/{preset.id}/edit/")
        assert response.status_code == 302
        assert response.url == reverse("admin:platform_presetblueprint_change", args=[preset.id])

    def test_superadmin_platform_settings_redirect_to_admin_change(self, authenticated_superadmin):
        settings = PlatformSettings.get_settings()
        response = authenticated_superadmin.get("/superadmin/platform/")
        assert response.status_code == 302
        assert response.url == reverse("admin:platform_platformsettings_change", args=[settings.pk])

    def test_superadmin_logs_redirect_to_django_admin(self, authenticated_superadmin):
        response = authenticated_superadmin.get("/superadmin/logs/")
        assert response.status_code == 302
        assert response.url == reverse("admin:index")
