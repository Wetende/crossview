"""
URL configuration for Crossview LMS project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # App URLs
    path('', include('apps.core.urls')),
    path('blueprints/', include('apps.blueprints.urls')),
    path('curriculum/', include('apps.curriculum.urls')),
    path('assessments/', include('apps.assessments.urls')),
    path('progression/', include('apps.progression.urls')),
    path('certifications/', include('apps.certifications.urls')),
    path('practicum/', include('apps.practicum.urls')),
    path('content/', include('apps.content.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
