from django.contrib import admin
from .models import (
    PresetBlueprint,
    PlatformSettings,
)


@admin.register(PresetBlueprint)
class PresetBlueprintAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "regulatory_body", "is_active", "created_at"]
    list_filter = ["is_active", "regulatory_body"]
    search_fields = ["name", "code", "regulatory_body"]
    ordering = ["name"]


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ["institution_name", "deployment_mode", "is_setup_complete"]
    readonly_fields = ["created_at", "updated_at"]
