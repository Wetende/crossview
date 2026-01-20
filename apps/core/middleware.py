"""
Core middleware - Inertia shared data.
"""

from django.http import HttpRequest, HttpResponse
from django.contrib import messages
from django.middleware.csrf import get_token
from inertia import share

from apps.platform.models import PlatformSettings
from apps.notifications.services import NotificationService


class CSRFHeaderMiddleware:
    """
    Middleware to ensure CSRF token header is found even if sent as X-XSRF-TOKEN.
    Inertia.js/Axios often sends 'X-XSRF-TOKEN' which Django doesn't read by default.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if "HTTP_X_CSRFTOKEN" not in request.META:
            if "HTTP_X_XSRF_TOKEN" in request.META:
                request.META["HTTP_X_CSRFTOKEN"] = request.META["HTTP_X_XSRF_TOKEN"]
        return self.get_response(request)


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
        # Share CSRF token with frontend (ensures token is available for Inertia requests)
        csrf_token = get_token(request)
        share(request, csrfToken=csrf_token)
        
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
            
            # Share notifications data (lazy evaluated)
            user = request.user
            share(
                request,
                notifications=lambda: {
                    "unread_count": NotificationService.get_unread_count(user),
                    "items": NotificationService.get_recent(user, limit=10),
                },
            )
        else:
            share(request, auth={"user": None})
            share(request, notifications=None)

        # Share platform branding from PlatformSettings
        try:
            settings = PlatformSettings.get_settings()
            # Get features with defaults from deployment mode
            features = settings.get_default_features_for_mode()
            if settings.features:
                features.update(settings.features)
            
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
                    "features": features,
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
