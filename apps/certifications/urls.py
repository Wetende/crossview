"""Certifications app URLs."""

from django.urls import path
from . import views

app_name = "certifications"

urlpatterns = [
    # Public verification page (Inertia)
    path("verify/<str:serial_number>/", views.verify_certificate, name="verify"),
    # REST API for certificate download (file download needs REST)
    path(
        "api/v1/student/certificates/<int:pk>/download/",
        views.certificate_download,
        name="student.certificate.download.api",
    ),
]
