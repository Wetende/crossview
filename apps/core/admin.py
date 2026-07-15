from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Program


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
    ]
    list_filter = ["is_staff", "is_superuser", "is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering = ["username"]

    fieldsets = BaseUserAdmin.fieldsets + (("Additional Info", {"fields": ("phone",)}),)
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Additional Info", {"fields": ("phone",)}),
    )


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "blueprint", "is_published", "created_at"]
    list_filter = ["is_published", "blueprint"]
    search_fields = ["name", "code", "description"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    def get_readonly_fields(self, request, obj=None):
        from apps.platform.policy import platform_capability_enabled

        readonly_fields = list(super().get_readonly_fields(request, obj))
        if not platform_capability_enabled("manageBlueprints"):
            readonly_fields.append("blueprint")
        return readonly_fields

    def save_model(self, request, obj, form, change):
        from apps.platform.models import PlatformSettings
        from apps.platform.policy import platform_capability_enabled
        from apps.platform.services import PlatformSettingsService

        if not platform_capability_enabled("manageBlueprints"):
            settings = PlatformSettings.get_settings()
            active = PlatformSettingsService.ensure_active_blueprint_for_mode(settings)
            if active:
                obj.blueprint = active
        super().save_model(request, obj, form, change)
