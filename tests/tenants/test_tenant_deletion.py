"""
Property tests for tenant deletion cascade.
**Property 6: Tenant Deletion Cascade**
**Validates: Requirements 2.4**
"""

import pytest
from unittest.mock import patch

from django.contrib.auth import get_user_model

from apps.tenants.models import Tenant, TenantBranding
from apps.tenants.services import TenantService
from apps.blueprints.models import AcademicBlueprint

User = get_user_model()


@pytest.mark.django_db
class TestTenantDeletionCascade:
    """
    Property tests for tenant deletion cascade.
    Feature: multi-tenancy, Property 6: Tenant Deletion Cascade
    """

    def _create_tenant_with_data(self, subdomain: str) -> Tenant:
        """Helper to create a tenant with associated data."""
        tenant = TenantService.create_tenant(
            name=f"Test Tenant {subdomain}",
            subdomain=subdomain,
            admin_email=f"admin@{subdomain}.test.com",
        )

        # Add a blueprint
        AcademicBlueprint.objects.create(
            tenant=tenant,
            name="Test Blueprint",
            hierarchy_structure=["Year"],
            grading_logic={"type": "weighted", "components": []},
        )

        return tenant

    def test_tenant_deletion_removes_tenant_record(self):
        """
        Property: For any tenant deletion, the Tenant record SHALL be removed.
        **Validates: Requirements 2.4**
        """
        tenant = self._create_tenant_with_data("delete1")
        tenant_id = tenant.id

        TenantService.delete(tenant)

        assert not Tenant.objects.filter(id=tenant_id).exists()

    def test_tenant_deletion_removes_branding(self):
        """
        Property: For any tenant deletion, TenantBranding SHALL be removed.
        **Validates: Requirements 2.4**
        """
        tenant = self._create_tenant_with_data("delete2")
        tenant_id = tenant.id

        # Create branding
        TenantBranding.objects.create(tenant=tenant, institution_name="Test")

        # Verify branding exists
        assert TenantBranding.objects.filter(tenant_id=tenant_id).exists()

        TenantService.delete(tenant)

        assert not TenantBranding.objects.filter(tenant_id=tenant_id).exists()

    def test_tenant_deletion_removes_users(self):
        """
        Property: For any tenant deletion, associated Users SHALL be removed.
        **Validates: Requirements 2.4**
        """
        tenant = self._create_tenant_with_data("delete4")
        tenant_id = tenant.id

        # Verify users exist (admin created by create_tenant)
        assert User.objects.filter(tenant_id=tenant_id).exists()

        TenantService.delete(tenant)

        assert not User.objects.filter(tenant_id=tenant_id).exists()

    def test_tenant_deletion_removes_blueprints(self):
        """
        Property: For any tenant deletion, associated AcademicBlueprints SHALL be removed.
        **Validates: Requirements 2.4**
        """
        tenant = self._create_tenant_with_data("delete5")
        tenant_id = tenant.id

        # Verify blueprints exist
        assert AcademicBlueprint.all_objects.filter(tenant_id=tenant_id).exists()

        TenantService.delete(tenant)

        assert not AcademicBlueprint.all_objects.filter(tenant_id=tenant_id).exists()

    def test_tenant_deletion_does_not_affect_other_tenants(self):
        """
        Property: Deleting one tenant SHALL NOT affect other tenants.
        **Validates: Requirements 2.4**
        """
        tenant1 = self._create_tenant_with_data("delete6")
        tenant2 = self._create_tenant_with_data("delete7")
        tenant2_id = tenant2.id

        TenantService.delete(tenant1)

        # Tenant2 should still exist with all data
        assert Tenant.objects.filter(id=tenant2_id).exists()
        assert User.objects.filter(tenant_id=tenant2_id).exists()
