from django.contrib import admin
from .models import AcademicBlueprint


@admin.register(AcademicBlueprint)
class AcademicBlueprintAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "tenant",
        "gamification_enabled",
        "certificate_enabled",
        "created_at",
    ]
    list_filter = ["gamification_enabled", "certificate_enabled", "tenant"]
    search_fields = ["name", "description"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"
