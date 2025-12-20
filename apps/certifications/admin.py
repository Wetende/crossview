from django.contrib import admin
from .models import CertificateTemplate, Certificate, VerificationLog


@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "blueprint", "is_default", "created_at"]
    list_filter = ["is_default", "blueprint"]
    search_fields = ["name"]
    ordering = ["name"]


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = [
        "serial_number",
        "student_name",
        "program_title",
        "issue_date",
        "is_revoked",
    ]
    list_filter = ["is_revoked", "issue_date"]
    search_fields = ["serial_number", "student_name", "program_title"]
    ordering = ["-issue_date"]
    date_hierarchy = "issue_date"
    raw_id_fields = ["enrollment", "template"]


@admin.register(VerificationLog)
class VerificationLogAdmin(admin.ModelAdmin):
    list_display = ["serial_number_queried", "result", "ip_address", "verified_at"]
    list_filter = ["result"]
    search_fields = ["serial_number_queried", "ip_address"]
    ordering = ["-verified_at"]
    date_hierarchy = "verified_at"
