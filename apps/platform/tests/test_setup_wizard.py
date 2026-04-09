"""Tests for legacy setup routes that now redirect to Django admin."""

import pytest
from django.urls import reverse

from apps.core.tests.factories import UserFactory
from apps.platform.models import PlatformSettings


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
@pytest.mark.parametrize(
    "path_name",
    [
        "tenants:setup.wizard",
        "tenants:setup.institution",
        "tenants:setup.mode",
        "tenants:setup.branding",
        "tenants:setup.features",
    ],
)
def test_setup_routes_redirect_superadmin_to_platform_settings_admin(
    authenticated_superadmin, path_name
):
    settings = PlatformSettings.get_settings()
    response = authenticated_superadmin.get(reverse(path_name))
    assert response.status_code == 302
    assert response.url == reverse("admin:platform_platformsettings_change", args=[settings.pk])


@pytest.mark.django_db
@pytest.mark.parametrize(
    "path_name",
    [
        "tenants:setup.wizard",
        "tenants:setup.institution",
        "tenants:setup.mode",
        "tenants:setup.branding",
        "tenants:setup.features",
    ],
)
def test_setup_routes_redirect_regular_users_to_dashboard(authenticated_regular, path_name):
    response = authenticated_regular.get(reverse(path_name))
    assert response.status_code == 302
    assert response.url == "/dashboard/"
