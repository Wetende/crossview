"""
Context processors for platform branding.
"""
from .models import PlatformSettings


def platform_branding(request):
    """
    Add platform branding to template context from PlatformSettings.
    """
    try:
        settings = PlatformSettings.get_settings()
        return {
            'platform_branding': {
                'logo_url': settings.get_logo_url(),
                'favicon_url': settings.get_favicon_url(),
                'primary_color': settings.primary_color,
                'secondary_color': settings.secondary_color,
                'institution_name': settings.institution_name,
                'tagline': settings.tagline,
            },
        }
    except Exception:
        # Fallback if PlatformSettings doesn't exist yet
        return {
            'platform_branding': {
                'logo_url': None,
                'favicon_url': None,
                'primary_color': '#3B82F6',
                'secondary_color': '#1E40AF',
                'institution_name': 'LMS',
                'tagline': '',
            },
        }
