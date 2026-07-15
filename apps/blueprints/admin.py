from django.contrib import admin
from .models import AcademicBlueprint
from apps.platform.policy import platform_capability_enabled


@admin.register(AcademicBlueprint)
class AcademicBlueprintAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "gamification_enabled",
        "certificate_enabled",
        "created_at",
    ]
    list_filter = ["gamification_enabled", "certificate_enabled"]
    search_fields = ["name", "description"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    def has_module_permission(self, request):
        return platform_capability_enabled(
            "manageBlueprints"
        ) and super().has_module_permission(request)

    def has_view_permission(self, request, obj=None):
        return platform_capability_enabled(
            "manageBlueprints"
        ) and super().has_view_permission(request, obj)

    def has_add_permission(self, request):
        return platform_capability_enabled(
            "manageBlueprints"
        ) and super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        return platform_capability_enabled(
            "manageBlueprints"
        ) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return platform_capability_enabled(
            "manageBlueprints"
        ) and super().has_delete_permission(request, obj)
