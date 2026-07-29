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
    # Admin certificate management
    path("admin/certificates/", views.admin_certificates, name="admin.certificates"),
    path(
        "admin/certificates/refresh/",
        views.admin_certificate_refresh_queue,
        name="admin.certificates.refresh",
    ),
    path(
        "admin/certificates/release/<int:eligibility_id>/",
        views.admin_certificate_release,
        name="admin.certificates.release",
    ),
    # Visual certificate template builder
    path(
        "admin/certificate-templates/",
        views.admin_certificate_templates,
        name="admin.certificate_templates",
    ),
    path(
        "admin/certificate-templates/create/",
        views.admin_certificate_template_create,
        name="admin.certificate_template.create",
    ),
    path(
        "admin/certificate-templates/<int:template_id>/clone/",
        views.admin_certificate_template_clone,
        name="admin.certificate_template.clone",
    ),
    path(
        "admin/certificate-templates/<int:template_id>/builder/",
        views.admin_certificate_template_builder,
        name="admin.certificate_template.builder",
    ),
    path(
        "admin/certificate-templates/<int:template_id>/save/",
        views.admin_certificate_template_save,
        name="admin.certificate_template.save",
    ),
    path(
        "admin/certificate-templates/<int:template_id>/publish/",
        views.admin_certificate_template_publish,
        name="admin.certificate_template.publish",
    ),
]
