"""URL configuration for LMS project."""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("django-admin/", admin.site.urls),  # Renamed to avoid conflict with /admin/* app routes
    # App URLs - Inertia pages and REST APIs
    path("", include("apps.core.urls")),
    path("", include("apps.progression.urls")),  # Student portal routes
    path("", include("apps.practicum.urls")),  # Practicum API routes
    path("", include("apps.certifications.urls")),  # Certificate routes
    path("", include("apps.commerce.urls")),
    path("", include("apps.reports.urls")),
    path("", include("apps.blueprints.urls")),  # Blueprint admin routes
    path("", include("apps.learning_operations.public_urls")),

    path("", include("apps.platform.urls")),  # Platform settings routes
    path("assessments/", include("apps.assessments.urls")),
    path("content/", include("apps.content.urls")),
    path("notifications/", include("apps.notifications.urls")),  # Inertia-based notifications
    path("api/notifications/", include("apps.notifications.api_urls")),  # REST notifications API
    path("messages/", include("apps.messaging.urls")),
    path("api/messages/", include("apps.messaging.api_urls")),
    path("api/discussions/", include("apps.discussions.urls")),
    path("api/inquiries/", include("apps.inquiries.urls")),
    path("api/learning-operations/", include("apps.learning_operations.urls")),
    path("api/live-sessions/", include("apps.live_sessions.urls")),
    path("api/google-workspace/", include("apps.google_classroom.workspace_urls")),
    path("api/google-classroom/", include("apps.google_classroom.urls")),
    path("events/", include("apps.events.urls")),  # Events app routes
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    if "debug_toolbar" in settings.INSTALLED_APPS:
        urlpatterns = [
            path("__debug__/", include("debug_toolbar.urls")),
            *urlpatterns,
        ]
