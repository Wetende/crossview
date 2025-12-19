"""
Tenant middleware - Identifies tenant from subdomain and sets context.
Requirements: 3.1, 3.2, 3.3
"""
import logging
from django.http import Http404, HttpRequest, HttpResponse
from django.conf import settings

from .context import TenantContext
from .models import Tenant

logger = logging.getLogger(__name__)


class TenantMiddleware:
    """
    Middleware to identify tenant from subdomain and set context.
    Requirements: 3.1, 3.2, 3.3
    """
    
    # Subdomains that should not be treated as tenant subdomains
    EXCLUDED_SUBDOMAINS = {'www', 'api', 'admin', 'static', 'media'}
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request: HttpRequest) -> HttpResponse:
        subdomain = self.extract_subdomain(request)
        
        # Skip tenant resolution for excluded subdomains or if no subdomain
        if subdomain and subdomain not in self.EXCLUDED_SUBDOMAINS:
            try:
                tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)
                TenantContext.set(tenant)
                request.tenant = tenant
            except Tenant.DoesNotExist:
                logger.warning(f"Unknown subdomain requested: {subdomain}")
                raise Http404(f"Tenant not found: {subdomain}")
        else:
            # No tenant context for main domain or excluded subdomains
            request.tenant = None
        
        try:
            response = self.get_response(request)
        finally:
            TenantContext.clear()
        
        return response
    
    def extract_subdomain(self, request: HttpRequest) -> str:
        """
        Extract subdomain from request host.
        Requirements: 3.1
        
        Examples:
            - crossview.lms.co.ke -> crossview
            - beauty.lms.co.ke -> beauty
            - lms.co.ke -> '' (empty, main domain)
            - localhost:8000 -> '' (empty, development)
        """
        host = request.get_host().split(':')[0]  # Remove port
        
        # Get base domain from settings or use default
        base_domain = getattr(settings, 'BASE_DOMAIN', None)
        
        if base_domain:
            # Production: extract subdomain from full domain
            if host.endswith(base_domain):
                prefix = host[:-len(base_domain)].rstrip('.')
                return prefix if prefix else ''
        
        # Development: check for subdomain pattern
        parts = host.split('.')
        
        # Handle localhost and IP addresses
        if host in ('localhost', '127.0.0.1') or host.replace('.', '').isdigit():
            return ''
        
        # For domains like subdomain.example.com
        if len(parts) > 2:
            return parts[0]
        
        return ''


class TenantNotFoundMiddleware:
    """
    Alternative middleware that allows requests without tenant context.
    Useful for public pages or API endpoints.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request: HttpRequest) -> HttpResponse:
        subdomain = self._extract_subdomain(request)
        
        if subdomain:
            tenant = Tenant.objects.filter(subdomain=subdomain, is_active=True).first()
            if tenant:
                TenantContext.set(tenant)
                request.tenant = tenant
            else:
                request.tenant = None
        else:
            request.tenant = None
        
        try:
            response = self.get_response(request)
        finally:
            TenantContext.clear()
        
        return response
    
    def _extract_subdomain(self, request: HttpRequest) -> str:
        host = request.get_host().split(':')[0]
        parts = host.split('.')
        if len(parts) > 2:
            return parts[0]
        return ''
