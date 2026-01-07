"""
Core middleware - Inertia shared data.
"""

from django.http import HttpRequest, HttpResponse
from django.contrib import messages
from inertia import share

from apps.platform.models import PlatformSettings


class InertiaShareMiddleware:
    """
    Middleware to share common data with all Inertia pages.

    Shares:
    - auth: Current user info (if authenticated)
    - platform: Platform branding from PlatformSettings
    - flash: Flash messages for feedback
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Share auth data
        if request.user.is_authenticated:
            share(
                request,
                auth={
                    "user": {
                        "id": request.user.id,
                        "email": request.user.email,
                        "firstName": request.user.first_name,
                        "lastName": request.user.last_name,
                        "fullName": request.user.get_full_name() or request.user.email,
                        "role": self._get_user_role(request.user),
                    },
                },
            )
        else:
            share(request, auth={"user": None})

        # Share platform branding from PlatformSettings
        try:
            settings = PlatformSettings.get_settings()
            share(
                request,
                platform={
                    "institutionName": settings.institution_name,
                    "tagline": settings.tagline,
                    "logoUrl": settings.logo.url if settings.logo else None,
                    "faviconUrl": settings.favicon.url if settings.favicon else None,
                    "primaryColor": settings.primary_color,
                    "secondaryColor": settings.secondary_color,
                    "deploymentMode": settings.deployment_mode,
                    "isSetupComplete": settings.is_setup_complete,
                },
            )
        except Exception:
            share(request, platform=None)

        # Share flash messages
        flash_messages = []
        storage = messages.get_messages(request)
        for message in storage:
            flash_messages.append(
                {
                    "type": message.tags,
                    "message": str(message),
                }
            )
        share(request, flash=flash_messages)

        return self.get_response(request)

    def _get_user_role(self, user) -> str:
        """
        Determine user role for dashboard redirect.

        Returns: 'student', 'instructor', 'admin', or 'superadmin'
        """
        if user.is_superuser:
            return "superadmin"
        if user.is_staff:
            return "admin"
        # Check for instructor role (could be in groups or a field)
        if hasattr(user, "groups") and user.groups.filter(name="Instructors").exists():
            return "instructor"
        return "student"
