"""
Core middleware - Inertia shared data.
"""

from django.http import HttpRequest, HttpResponse
from django.contrib import messages
from django.middleware.csrf import get_token
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
                        "isSuperuser": request.user.is_superuser,
                    },
                },
            )
        else:
            share(request, auth={"user": None})

        # Share platform branding from PlatformSettings
        try:
            share(request, platform=PlatformSettings.get_cached_platform_payload())
        except Exception:
            share(request, platform=None)

        # Share flash messages lazily so messages created in the current view
        # are available in the same Inertia response.
        def _flash_messages():
            flash_messages = []
            storage = messages.get_messages(request)
            for message in storage:
                flash_messages.append(
                    {
                        "type": message.tags,
                        "message": str(message),
                    }
                )
            return flash_messages

        share(request, flash=_flash_messages)

        return self.get_response(request)

    def _get_user_role(self, user) -> str:
        """
        Determine the app-facing user role for dashboard routing.

        Returns: 'student', 'instructor', or 'admin'
        """
        if user.is_superuser:
            return "admin"
        if user.is_staff:
            return "admin"
        # Check for instructor role (could be in groups or a field)
        if hasattr(user, "groups") and user.groups.filter(name="Instructors").exists():
            return "instructor"
        return "student"
