"""
Core middleware - Inertia shared data and tenant context.
Requirements: 2.6, 3.6, 6.1, 6.2, 6.4
"""

from django.http import HttpRequest, HttpResponse
from django.contrib import messages
from inertia import share


class InertiaShareMiddleware:
    """
    Middleware to share common data with all Inertia pages.

    Shares:
    - auth: Current user info (if authenticated)
    - tenant: Tenant branding (if on tenant subdomain)
    - flash: Flash messages for feedback

    Requirements: 2.6, 3.6, 6.1, 6.2, 6.4
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

        # Share tenant branding if on tenant subdomain
        tenant = getattr(request, "tenant", None)
        if tenant:
            branding = getattr(tenant, "branding", None)
            share(
                request,
                tenant={
                    "id": tenant.id,
                    "name": tenant.name,
                    "subdomain": tenant.subdomain,
                    "institutionName": (
                        branding.institution_name if branding else tenant.name
                    ),
                    "tagline": branding.tagline if branding else None,
                    "logoUrl": branding.logo_path if branding else None,
                    "faviconUrl": branding.favicon_path if branding else None,
                    "primaryColor": branding.primary_color if branding else "#3B82F6",
                    "secondaryColor": (
                        branding.secondary_color if branding else "#1E40AF"
                    ),
                    "customCss": branding.custom_css if branding else None,
                    "registrationEnabled": tenant.settings.get(
                        "registration_enabled", True
                    ),
                    "isActive": tenant.is_active,
                },
            )
        else:
            share(request, tenant=None)

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
