"""Tests for super admin views."""

import pytest
from django.test import Client
from apps.core.tests.factories import UserFactory, TenantFactory
from apps.platform.tests.factories import PresetBlueprintFactory


@pytest.fixture
def superadmin_user(db):
    """Create a superadmin user."""
    tenant = TenantFactory()
    return UserFactory(tenant=tenant, is_superuser=True, is_staff=True)


@pytest.fixture
def regular_user(db):
    """Create a regular user."""
    tenant = TenantFactory()
    return UserFactory(tenant=tenant, is_superuser=False, is_staff=False)


@pytest.fixture
def authenticated_superadmin(client, superadmin_user):
    """Return client authenticated as superadmin."""
    client.force_login(superadmin_user)
    return client


@pytest.fixture
def authenticated_regular(client, regular_user):
    """Return client authenticated as regular user."""
    client.force_login(regular_user)
    return client


class TestSuperAdminDashboard:
    """Tests for super admin dashboard view."""

    def test_superadmin_can_access_dashboard(self, authenticated_superadmin):
        """Superadmin should be able to access dashboard."""
        response = authenticated_superadmin.get("/superadmin/")
        assert response.status_code == 200

    def test_regular_user_redirected_from_dashboard(self, authenticated_regular):
        """Regular user should be redirected from dashboard."""
        response = authenticated_regular.get("/superadmin/")
        assert response.status_code == 302
        assert "/dashboard/" in response.url




class TestSuperAdminPresets:
    """Tests for preset blueprint management views."""

    def test_superadmin_can_list_presets(self, authenticated_superadmin):
        """Superadmin should be able to list presets."""
        PresetBlueprintFactory.create_batch(3)
        response = authenticated_superadmin.get("/superadmin/presets/")
        assert response.status_code == 200

    def test_superadmin_can_access_preset_create(self, authenticated_superadmin):
        """Superadmin should be able to access preset create form."""
        response = authenticated_superadmin.get("/superadmin/presets/create/")
        assert response.status_code == 200

    def test_superadmin_can_access_preset_edit(self, authenticated_superadmin):
        """Superadmin should be able to access preset edit form."""
        preset = PresetBlueprintFactory()
        response = authenticated_superadmin.get(
            f"/superadmin/presets/{preset.id}/edit/"
        )
        assert response.status_code == 200


class TestSuperAdminSettings:
    """Tests for platform settings views."""

    def test_superadmin_can_access_settings(self, authenticated_superadmin):
        """Superadmin should be able to access settings."""
        response = authenticated_superadmin.get("/superadmin/platform/")
        assert response.status_code == 200

    def test_regular_user_cannot_access_settings(self, authenticated_regular):
        """Regular user should not be able to access settings."""
        response = authenticated_regular.get("/superadmin/platform/")
        assert response.status_code == 302


class TestSuperAdminLogs:
    """Tests for system logs views."""

    def test_superadmin_can_access_logs(self, authenticated_superadmin):
        """Superadmin should be able to access logs."""
        response = authenticated_superadmin.get("/superadmin/logs/")
        assert response.status_code == 200
