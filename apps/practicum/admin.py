from django.contrib import admin
from .models import Rubric, PracticumSubmission, SubmissionReview


@admin.register(Rubric)
class RubricAdmin(admin.ModelAdmin):
    list_display = ["name", "max_score", "created_at"]
    search_fields = ["name", "description"]
    ordering = ["name"]


@admin.register(PracticumSubmission)
class PracticumSubmissionAdmin(admin.ModelAdmin):
    list_display = [
        "enrollment",
        "node",
        "version",
        "status",
        "file_type",
        "submitted_at",
    ]
    list_filter = ["status", "file_type"]
    search_fields = ["enrollment__user__username", "node__title"]
    ordering = ["-submitted_at"]
    date_hierarchy = "submitted_at"
    raw_id_fields = ["enrollment", "node"]


@admin.register(SubmissionReview)
class SubmissionReviewAdmin(admin.ModelAdmin):
    list_display = ["submission", "reviewer", "status", "total_score", "reviewed_at"]
    list_filter = ["status"]
    search_fields = ["submission__enrollment__user__username", "reviewer__username"]
    ordering = ["-reviewed_at"]
    date_hierarchy = "reviewed_at"
    raw_id_fields = ["submission", "reviewer"]
