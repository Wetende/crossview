from django.contrib import admin
from .models import AssessmentResult


@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    list_display = ["enrollment", "node", "is_published", "graded_by", "created_at"]
    list_filter = ["is_published", "published_at"]
    search_fields = ["enrollment__user__username", "node__title"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"
    raw_id_fields = ["enrollment", "node", "graded_by"]
