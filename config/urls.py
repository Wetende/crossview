"""
URL configuration for Crossview LMS project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("django-admin/", admin.site.urls),  # Renamed to avoid conflict with /admin/* app routes
    # App URLs - Inertia pages and REST APIs
    path("", include("apps.progression.urls")),  # Student portal routes
    path("", include("apps.core.urls")),
    path("", include("apps.practicum.urls")),  # Practicum API routes
    path("", include("apps.certifications.urls")),  # Certificate routes
    path("", include("apps.blueprints.urls")),  # Blueprint admin routes

    path("", include("apps.platform.urls")),  # Platform settings routes
    path("assessments/", include("apps.assessments.urls")),
    path("content/", include("apps.content.urls")),
    path("notifications/", include("apps.notifications.urls")),  # Inertia-based notifications
    path("events/", include("apps.events.urls")),  # Events app routes
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
