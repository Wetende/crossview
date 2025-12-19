"""
Property tests for subdomain identification.
**Property 7: Subdomain Identification**
**Validates: Requirements 3.1, 3.2, 3.3**
"""
import pytest
from unittest.mock import patch, MagicMock
from django.test import RequestFactory, override_settings
from django.http import Http404

from apps.tenants.models import Tenant
from apps.tenants.middleware import TenantMiddleware
from apps.tenants.context import TenantContext


@pytest.mark.django_db
class TestSubdomainIdentification:
    """
    Property tests for subdomain identification.
    Feature: multi-tenancy, Property 7: Subdomain Identification
    """
    
    def setup_method(self):
        """Set up test fixtures."""
        self.factory = RequestFactory()
        TenantContext.clear()
    
    def teardown_method(self):
        """Clean up after tests."""
        TenantContext.clear()
    
    def _create_tenant(self, subdomain: str, is_active: bool = True) -> Tenant:
        """Helper to create a tenant."""
        return Tenant.objects.create(
            name=f"Test Tenant {subdomain}",
            subdomain=subdomain,
            admin_email=f"admin@{subdomain}.test.com",
            is_active=is_active,
        )
    
    def _create_request_with_host(self, host: str):
        """Create a request and mock get_host to return the specified host."""
        request = self.factory.get('/')
        request.get_host = MagicMock(return_value=host)
        return request
    
    def test_valid_subdomain_sets_tenant_context(self):
        """
        Property: For any valid subdomain, tenant context SHALL be set.
        **Validates: Requirements 3.1, 3.3**
        """
        tenant = self._create_tenant("crossview")
        
        request = self._create_request_with_host('crossview.lms.co.ke')
        
        def get_response(req):
            # Verify context is set during request
            assert TenantContext.check() is True
            assert TenantContext.get().id == tenant.id
            return None
        
        middleware = TenantMiddleware(get_response)
        middleware(request)
    
    def test_unknown_subdomain_returns_404(self):
        """
        Property: For any unknown subdomain, 404 SHALL be returned.
        **Validates: Requirements 3.2**
        """
        request = self._create_request_with_host('unknown.lms.co.ke')
        
        middleware = TenantMiddleware(lambda r: None)
        
        with pytest.raises(Http404):
            middleware(request)
    
    def test_inactive_tenant_returns_404(self):
        """
        Property: For any inactive tenant subdomain, 404 SHALL be returned.
        **Validates: Requirements 3.2**
        """
        self._create_tenant("inactive", is_active=False)
        
        request = self._create_request_with_host('inactive.lms.co.ke')
        
        middleware = TenantMiddleware(lambda r: None)
        
        with pytest.raises(Http404):
            middleware(request)
    
    def test_context_cleared_after_request(self):
        """
        Property: After request completes, tenant context SHALL be cleared.
        **Validates: Requirements 3.3**
        """
        self._create_tenant("cleartest")
        
        request = self._create_request_with_host('cleartest.lms.co.ke')
        
        middleware = TenantMiddleware(lambda r: None)
        middleware(request)
        
        # Context should be cleared after request
        assert TenantContext.check() is False
    
    def test_request_has_tenant_attribute(self):
        """
        Property: For any identified tenant, request SHALL have tenant attribute.
        **Validates: Requirements 3.3**
        """
        tenant = self._create_tenant("attrtest")
        
        request = self._create_request_with_host('attrtest.lms.co.ke')
        
        def get_response(req):
            assert hasattr(req, 'tenant')
            assert req.tenant.id == tenant.id
            return None
        
        middleware = TenantMiddleware(get_response)
        middleware(request)
    
    def test_subdomain_extraction_with_port(self):
        """
        Property: Subdomain extraction SHALL work with port numbers.
        **Validates: Requirements 3.1**
        """
        tenant = self._create_tenant("porttest")
        
        request = self._create_request_with_host('porttest.lms.co.ke:8000')
        
        def get_response(req):
            assert TenantContext.get().id == tenant.id
            return None
        
        middleware = TenantMiddleware(get_response)
        middleware(request)
    
    def test_excluded_subdomains_skip_tenant_resolution(self):
        """
        Property: Excluded subdomains (www, api, admin) SHALL not resolve to tenant.
        **Validates: Requirements 3.1**
        """
        # Create a tenant with 'www' subdomain (should be excluded)
        self._create_tenant("www")
        
        request = self._create_request_with_host('www.lms.co.ke')
        
        def get_response(req):
            # www is excluded, so no tenant context
            assert req.tenant is None
            return None
        
        middleware = TenantMiddleware(get_response)
        middleware(request)
    
    def test_multiple_tenants_isolated(self):
        """
        Property: Each subdomain SHALL resolve to its own tenant.
        **Validates: Requirements 3.1, 3.3**
        """
        tenant1 = self._create_tenant("tenant1")
        tenant2 = self._create_tenant("tenant2")
        
        # Request to tenant1
        request1 = self._create_request_with_host('tenant1.lms.co.ke')
        
        def check_tenant1(req):
            assert TenantContext.get().id == tenant1.id
            return None
        
        middleware = TenantMiddleware(check_tenant1)
        middleware(request1)
        
        # Request to tenant2
        request2 = self._create_request_with_host('tenant2.lms.co.ke')
        
        def check_tenant2(req):
            assert TenantContext.get().id == tenant2.id
            return None
        
        middleware = TenantMiddleware(check_tenant2)
        middleware(request2)
