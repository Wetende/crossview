"""Tests for PlatformSettings singleton behavior in Django admin."""

import pytest
from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory
from django.urls import reverse

from apps.core.tests.factories import UserFactory
from apps.platform.admin import PlatformSettingsAdmin
from apps.platform.models import PlatformSettings


@pytest.fixture
def platform_settings_admin():
    return PlatformSettingsAdmin(PlatformSettings, AdminSite())


@pytest.mark.django_db
def test_platform_settings_admin_changelist_redirects_to_singleton_change(client):
    user = UserFactory(password="TestPass123", superadmin=True)
    client.force_login(user)
    settings = PlatformSettings.get_settings()

    response = client.get(reverse("admin:platform_platformsettings_changelist"))

    assert response.status_code == 302
    assert response.url == reverse(
        "admin:platform_platformsettings_change", args=[settings.pk]
    )


@pytest.mark.django_db
def test_platform_settings_admin_disables_add_and_delete(platform_settings_admin):
    PlatformSettings.get_settings()
    request = RequestFactory().get("/admin/platform/platformsettings/")
    request.user = UserFactory(superadmin=True)

    assert platform_settings_admin.has_add_permission(request) is False
    assert platform_settings_admin.has_delete_permission(request) is False
