from django.contrib import admin
from .models import AssessmentResult, Rubric


@admin.register(Rubric)
class RubricAdmin(admin.ModelAdmin):
    list_display = ["name", "scope", "program", "owner", "max_score", "created_at"]
    list_filter = ["scope", "created_at"]
    search_fields = ["name", "description", "owner__username"]
    ordering = ["name"]
    raw_id_fields = ["owner", "program"]


@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    list_display = ["enrollment", "node", "is_published", "graded_by", "created_at"]
    list_filter = ["is_published", "published_at"]
    search_fields = ["enrollment__user__username", "node__title"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"
    raw_id_fields = ["enrollment", "node", "graded_by"]
