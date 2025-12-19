"""
Property tests for tenant creation and provisioning.
**Property 1: Tenant Creation with Admin**
**Validates: Requirements 1.1, 1.2**
"""
import pytest
from unittest.mock import patch

from django.contrib.auth import get_user_model

from apps.tenants.models import Tenant, TenantBranding, TenantLimits
from apps.tenants.services import TenantService, TenantCreationError

User = get_user_model()


@pytest.mark.django_db
class TestTenantCreationWithAdmin:
    """
    Property tests for tenant creation with admin user.
    Feature: multi-tenancy, Property 1: Tenant Creation with Admin
    """
    
    def test_tenant_created_with_unique_subdomain(self):
        """
        Property: For any tenant registration, a Tenant record SHALL be created with unique subdomain.
        **Validates: Requirements 1.1**
        """
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email'):
            tenant = service.create(
                name="Test Institution",
                subdomain="testinst",
                admin_email="admin@testinst.com",
            )
        
        assert tenant.id is not None
        assert tenant.subdomain == "testinst"
        assert Tenant.objects.filter(subdomain="testinst").exists()
    
    def test_duplicate_subdomain_raises_error(self):
        """
        Property: Duplicate subdomains SHALL be rejected.
        **Validates: Requirements 1.1**
        """
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email'):
            service.create(
                name="First Institution",
                subdomain="duplicate",
                admin_email="admin@first.com",
            )
        
        with pytest.raises(TenantCreationError) as exc_info:
            with patch.object(service, 'send_welcome_email'):
                service.create(
                    name="Second Institution",
                    subdomain="duplicate",
                    admin_email="admin@second.com",
                )
        
        assert "already taken" in str(exc_info.value)
    
    def test_admin_user_provisioned(self):
        """
        Property: For any tenant creation, a User with admin role SHALL be provisioned.
        **Validates: Requirements 1.2**
        """
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email'):
            tenant = service.create(
                name="Admin Test",
                subdomain="admintest",
                admin_email="admin@admintest.com",
            )
        
        # Check admin user exists
        admin_user = User.objects.filter(tenant=tenant, is_staff=True).first()
        assert admin_user is not None
        assert admin_user.email == "admin@admintest.com"
        assert admin_user.is_staff is True
    
    def test_branding_created_on_provision(self):
        """
        Property: For any tenant creation, TenantBranding SHALL be created.
        **Validates: Requirements 1.2**
        """
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email'):
            tenant = service.create(
                name="Branding Test",
                subdomain="brandingtest",
                admin_email="admin@brandingtest.com",
            )
        
        assert TenantBranding.objects.filter(tenant=tenant).exists()
        branding = tenant.branding
        assert branding.institution_name == "Branding Test"
    
    def test_limits_created_on_provision(self):
        """
        Property: For any tenant creation, TenantLimits SHALL be created.
        **Validates: Requirements 1.2**
        """
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email'):
            tenant = service.create(
                name="Limits Test",
                subdomain="limitstest",
                admin_email="admin@limitstest.com",
            )
        
        assert TenantLimits.objects.filter(tenant=tenant).exists()
        limits = tenant.limits
        assert limits.max_students > 0
        assert limits.current_students == 0
    
    def test_tenant_activated_on_provision(self):
        """
        Property: For any tenant creation, activated_at SHALL be set.
        **Validates: Requirements 1.2**
        """
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email'):
            tenant = service.create(
                name="Activation Test",
                subdomain="activationtest",
                admin_email="admin@activationtest.com",
            )
        
        tenant.refresh_from_db()
        assert tenant.activated_at is not None
    
    def test_welcome_email_called(self):
        """
        Property: For any tenant creation, welcome email SHALL be sent.
        **Validates: Requirements 1.4**
        """
        service = TenantService()
        
        with patch.object(service, 'send_welcome_email') as mock_email:
            tenant = service.create(
                name="Email Test",
                subdomain="emailtest",
                admin_email="admin@emailtest.com",
            )
            
            mock_email.assert_called_once()
            call_args = mock_email.call_args
            assert call_args[0][0] == tenant  # First arg is tenant
