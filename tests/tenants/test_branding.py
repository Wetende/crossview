"""
Property tests for branding configuration.
**Property 8: Branding Configuration**
**Validates: Requirements 4.1, 4.3**
"""
import pytest
from unittest.mock import patch

from apps.tenants.models import Tenant, TenantBranding
from apps.tenants.services import TenantService


@pytest.mark.django_db
class TestBrandingConfiguration:
    """
    Property tests for branding configuration.
    Feature: multi-tenancy, Property 8: Branding Configuration
    """
    
    def _create_tenant_with_branding(self, subdomain: str) -> Tenant:
        """Helper to create a tenant with branding."""
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email'):
            return service.create(
                name=f"Test Tenant {subdomain}",
                subdomain=subdomain,
                admin_email=f"admin@{subdomain}.test.com",
            )
    
    def test_branding_settings_persisted(self):
        """
        Property: For any branding update, settings SHALL be persisted.
        **Validates: Requirements 4.1**
        """
        tenant = self._create_tenant_with_branding("branding1")
        service = TenantService()
        
        service.update_branding(
            tenant,
            logo_path="/logos/custom.png",
            primary_color="#FF5733",
            secondary_color="#C70039",
            institution_name="Custom Institution",
            tagline="Excellence in Education",
        )
        
        # Refresh and verify
        tenant.refresh_from_db()
        branding = tenant.branding
        
        assert branding.logo_path == "/logos/custom.png"
        assert branding.primary_color == "#FF5733"
        assert branding.secondary_color == "#C70039"
        assert branding.institution_name == "Custom Institution"
        assert branding.tagline == "Excellence in Education"
    
    def test_partial_branding_update(self):
        """
        Property: Partial branding updates SHALL only change specified fields.
        **Validates: Requirements 4.1**
        """
        tenant = self._create_tenant_with_branding("branding2")
        service = TenantService()
        
        # Set initial branding
        service.update_branding(
            tenant,
            primary_color="#111111",
            secondary_color="#222222",
        )
        
        # Update only primary color
        service.update_branding(
            tenant,
            primary_color="#333333",
        )
        
        branding = tenant.branding
        assert branding.primary_color == "#333333"
        assert branding.secondary_color == "#222222"  # Unchanged
    
    def test_missing_branding_falls_back_to_defaults(self):
        """
        Property: Missing branding SHALL fall back to defaults.
        **Validates: Requirements 4.3**
        """
        # Create tenant without using service (no branding created)
        tenant = Tenant.objects.create(
            name="No Branding Tenant",
            subdomain="nobranding",
            admin_email="admin@nobranding.test.com",
        )
        
        service = TenantService()
        branding = service.get_branding(tenant)
        
        # Should return defaults
        assert branding['primary_color'] == '#3B82F6'
        assert branding['secondary_color'] == '#1E40AF'
        assert branding['institution_name'] == tenant.name
    
    def test_get_branding_returns_configured_values(self):
        """
        Property: get_branding SHALL return configured values when set.
        **Validates: Requirements 4.1, 4.3**
        """
        tenant = self._create_tenant_with_branding("branding3")
        service = TenantService()
        
        service.update_branding(
            tenant,
            logo_path="/custom/logo.png",
            primary_color="#AABBCC",
        )
        
        branding = service.get_branding(tenant)
        
        assert branding['logo_path'] == "/custom/logo.png"
        assert branding['primary_color'] == "#AABBCC"
    
    def test_branding_isolated_between_tenants(self):
        """
        Property: Each tenant SHALL have independent branding.
        **Validates: Requirements 4.1**
        """
        tenant1 = self._create_tenant_with_branding("branding4")
        tenant2 = self._create_tenant_with_branding("branding5")
        service = TenantService()
        
        service.update_branding(tenant1, primary_color="#111111")
        service.update_branding(tenant2, primary_color="#222222")
        
        branding1 = service.get_branding(tenant1)
        branding2 = service.get_branding(tenant2)
        
        assert branding1['primary_color'] == "#111111"
        assert branding2['primary_color'] == "#222222"
    
    def test_favicon_path_persisted(self):
        """
        Property: Favicon path SHALL be persisted.
        **Validates: Requirements 4.1**
        """
        tenant = self._create_tenant_with_branding("branding6")
        service = TenantService()
        
        service.update_branding(
            tenant,
            favicon_path="/favicons/custom.ico",
        )
        
        branding = service.get_branding(tenant)
        assert branding['favicon_path'] == "/favicons/custom.ico"
