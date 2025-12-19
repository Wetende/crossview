"""
Context processors for tenant branding.
Requirements: 4.1, 4.3
"""
from .context import TenantContext
from .services import TenantService


def tenant_branding(request):
    """
    Add tenant branding to template context.
    Requirements: 4.1, 4.3
    """
    tenant = TenantContext.get()
    
    if tenant:
        service = TenantService()
        branding = service.get_branding(tenant)
        return {
            'tenant': tenant,
            'tenant_branding': branding,
        }
    
    # Default branding when no tenant
    return {
        'tenant': None,
        'tenant_branding': {
            'logo_path': None,
            'favicon_path': None,
            'primary_color': '#3B82F6',
            'secondary_color': '#1E40AF',
            'institution_name': 'Crossview LMS',
            'tagline': '',
        },
    }
