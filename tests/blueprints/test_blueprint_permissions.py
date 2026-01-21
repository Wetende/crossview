"""
Tests for blueprint view permissions.

Verifies the tiered permission model:
- Superadmins (is_superuser=True): Full access (CRUD)
- Client Admins (is_staff=True, is_superuser=False): Read-only access
- Regular users: No access
"""

import pytest
import json
import re
import html
from django.test import Client
from apps.core.tests.factories import UserFactory
from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program


def _get_inertia_props(response):
    """Helper to extract Inertia props from response."""
    content = response.content.decode('utf-8')
    match = re.search(r'data-page="([^"]+)"', content)
    if match:
        page_data = json.loads(html.unescape(match.group(1)))
        return page_data['props']
    raise ValueError("Could not find data-page in response")


@pytest.fixture
def superadmin_user(db):
    """Create a superadmin user (platform owner)."""
    return UserFactory(is_superuser=True, is_staff=True)


@pytest.fixture
def admin_user(db):
    """Create a client admin - staff but NOT superuser."""
    return UserFactory(is_superuser=False, is_staff=True)


@pytest.fixture
def regular_user(db):
    """Create a regular user - no admin privileges."""
    return UserFactory(is_superuser=False, is_staff=False)


@pytest.fixture
def test_blueprint(db):
    """Create a test blueprint."""
    return AcademicBlueprint.objects.create(
        name="Test Blueprint",
        description="For testing permissions",
        hierarchy_structure=["Level", "Module", "Session"],
        grading_logic={"type": "points"},
    )


class TestBlueprintListPermissions:
    """Test permissions for blueprint list view (read-only allowed for admins)."""

    def test_superadmin_can_list_blueprints(self, client, superadmin_user):
        """Superadmin should be able to list blueprints."""
        client.force_login(superadmin_user)
        response = client.get("/admin/blueprints/")
        assert response.status_code == 200

    def test_client_admin_can_list_blueprints(self, client, admin_user):
        """Client admin should be able to list blueprints (read-only)."""
        client.force_login(admin_user)
        response = client.get("/admin/blueprints/")
        assert response.status_code == 200

    def test_regular_user_cannot_list_blueprints(self, client, regular_user):
        """Regular user should be redirected."""
        client.force_login(regular_user)
        response = client.get("/admin/blueprints/")
        assert response.status_code == 302
        assert "/dashboard/" in response.url


class TestBlueprintDetailPermissions:
    """Test permissions for blueprint detail view (read-only allowed for admins)."""

    def test_superadmin_can_view_detail(self, client, superadmin_user, test_blueprint):
        """Superadmin should be able to view blueprint details."""
        client.force_login(superadmin_user)
        response = client.get(f"/admin/blueprints/{test_blueprint.id}/")
        assert response.status_code == 200

    def test_client_admin_can_view_detail(self, client, admin_user, test_blueprint):
        """Client admin should be able to view blueprint details (read-only)."""
        client.force_login(admin_user)
        response = client.get(f"/admin/blueprints/{test_blueprint.id}/")
        assert response.status_code == 200

    def test_detail_context_can_edit(self, client, superadmin_user, admin_user, test_blueprint):
        """Test 'canEdit' context variable logic."""
        # 1. Superadmin + No Programs -> True
        client.force_login(superadmin_user)
        response = client.get(f"/admin/blueprints/{test_blueprint.id}/")
        props = _get_inertia_props(response)
        assert props['canEdit'] is True

        # 2. Add a program to the blueprint
        program = Program.objects.create(
            name="Test Program", 
            code="TP1", 
            blueprint=test_blueprint,
            is_published=True
        )

        # 3. Superadmin + Programs -> False
        # (Assuming the logic is: canEdit is False if programs exist, even for superadmin, 
        # because the view logic says: "canEdit": is_superadmin(...) and not blueprint.programs.exists())
        response = client.get(f"/admin/blueprints/{test_blueprint.id}/")
        props = _get_inertia_props(response)
        assert props['canEdit'] is False

        # 4. Client Admin + Programs -> False
        client.force_login(admin_user)
        response = client.get(f"/admin/blueprints/{test_blueprint.id}/")
        props = _get_inertia_props(response)
        assert props['canEdit'] is False

        # 5. Client Admin + No Programs -> False (The Bug Fix)
        program.delete() # Remove program
        assert not test_blueprint.programs.exists()
        
        response = client.get(f"/admin/blueprints/{test_blueprint.id}/")
        props = _get_inertia_props(response)
        assert props['canEdit'] is False


class TestBlueprintCreatePermissions:
    """Test permissions for blueprint create (superadmin only)."""

    def test_superadmin_can_access_create(self, client, superadmin_user):
        """Superadmin should be able to access create form."""
        client.force_login(superadmin_user)
        response = client.get("/admin/blueprints/create/")
        assert response.status_code == 200

    def test_client_admin_cannot_create(self, client, admin_user):
        """Client admin should NOT be able to access create form."""
        client.force_login(admin_user)
        response = client.get("/admin/blueprints/create/")
        assert response.status_code == 302
        assert "/dashboard/" in response.url

    def test_regular_user_cannot_create(self, client, regular_user):
        """Regular user should NOT be able to access create form."""
        client.force_login(regular_user)
        response = client.get("/admin/blueprints/create/")
        assert response.status_code == 302


class TestBlueprintEditPermissions:
    """Test permissions for blueprint edit (superadmin only)."""

    def test_superadmin_can_access_edit(self, client, superadmin_user, test_blueprint):
        """Superadmin should be able to access edit form."""
        client.force_login(superadmin_user)
        response = client.get(f"/admin/blueprints/{test_blueprint.id}/edit/")
        assert response.status_code == 200

    def test_client_admin_cannot_edit(self, client, admin_user, test_blueprint):
        """Client admin should NOT be able to access edit form."""
        client.force_login(admin_user)
        response = client.get(f"/admin/blueprints/{test_blueprint.id}/edit/")
        assert response.status_code == 302
        assert "/dashboard/" in response.url


class TestBlueprintDeletePermissions:
    """Test permissions for blueprint delete (superadmin only)."""

    def test_superadmin_can_delete(self, client, superadmin_user, test_blueprint):
        """Superadmin should be able to delete blueprint."""
        client.force_login(superadmin_user)
        response = client.post(f"/admin/blueprints/{test_blueprint.id}/delete/")
        # Should redirect to list after delete
        assert response.status_code == 302
        assert not AcademicBlueprint.objects.filter(id=test_blueprint.id).exists()

    def test_client_admin_cannot_delete(self, client, admin_user, test_blueprint):
        """Client admin should NOT be able to delete blueprint."""
        client.force_login(admin_user)
        response = client.post(f"/admin/blueprints/{test_blueprint.id}/delete/")
        assert response.status_code == 302
        assert "/dashboard/" in response.url
        # Blueprint should still exist
        assert AcademicBlueprint.objects.filter(id=test_blueprint.id).exists()
