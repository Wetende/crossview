from django import forms
from django.contrib import admin
from django.db import models
from django.shortcuts import redirect

from .models import (
    PresetBlueprint,
    PlatformSettings,
)


@admin.register(PresetBlueprint)
class PresetBlueprintAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "regulatory_body", "is_active", "updated_at"]
    list_filter = ["is_active", "regulatory_body"]
    search_fields = ["name", "code", "regulatory_body"]
    ordering = ["name"]
    readonly_fields = ["created_at", "updated_at"]
    save_on_top = True
    fieldsets = (
        (
            "Identity",
            {
                "fields": ("name", "code", "is_active", "regulatory_body"),
                "description": "Reusable blueprint presets for regulated or repeatable academic structures.",
            },
        ),
        (
            "Builder Structure",
            {
                "fields": ("hierarchy_labels", "structure_rules"),
                "description": "Hierarchy labels and optional builder constraints used when applying this preset.",
            },
        ),
        (
            "Grading and Description",
            {
                "fields": ("grading_config", "description"),
            },
        ),
        (
            "Audit",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
    formfield_overrides = {
        models.JSONField: {
            "widget": forms.Textarea(
                attrs={"rows": 8, "style": "font-family: monospace;"}
            )
        }
    }


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = [
        "institution_name",
        "deployment_mode",
        "is_setup_complete",
        "updated_at",
    ]
    readonly_fields = ["created_at", "updated_at"]
    save_on_top = True
    fieldsets = (
        (
            "Institution",
            {
                "fields": (
                    "institution_name",
                    "tagline",
                    "contact_email",
                    "contact_phone",
                    "address",
                )
            },
        ),
        (
            "Deployment",
            {
                "fields": ("deployment_mode", "active_blueprint", "is_setup_complete"),
                "description": "Platform-wide mode and active blueprint selection.",
            },
        ),
        (
            "Branding",
            {
                "fields": (
                    "logo",
                    "favicon",
                    "primary_color",
                    "secondary_color",
                    "custom_css",
                )
            },
        ),
        (
            "Platform Configuration",
            {
                "fields": ("features", "course_levels", "program_categories"),
                "description": "JSON-backed flags and lists previously managed through the frontend superadmin screens.",
            },
        ),
        (
            "Audit",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
    formfield_overrides = {
        models.JSONField: {
            "widget": forms.Textarea(
                attrs={"rows": 8, "style": "font-family: monospace;"}
            )
        }
    }

    def has_add_permission(self, request):
        return not PlatformSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        settings = PlatformSettings.get_settings()
        return redirect("admin:platform_platformsettings_change", settings.pk)
