from django import forms
from django.contrib import admin
from django.contrib import messages
from django.db import models
from django.shortcuts import redirect

from .models import (
    PresetBlueprint,
    PlatformSettings,
)
from .services import PlatformSettingsService, PresetBlueprintService


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
    actions = [
        "create_academic_blueprints",
        "use_as_active_blueprint",
    ]

    @admin.action(description="Create Academic Blueprint(s) from selected preset(s)")
    def create_academic_blueprints(self, request, queryset):
        created = 0
        for preset in queryset:
            PresetBlueprintService.create_academic_blueprint_from_preset(preset)
            created += 1

        self.message_user(
            request,
            f"Created {created} academic blueprint(s) from selected preset(s).",
            level=messages.SUCCESS,
        )

    @admin.action(description="Use as Active Blueprint")
    def use_as_active_blueprint(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(
                request,
                "Select exactly one preset for this action.",
                level=messages.WARNING,
            )
            return

        preset = queryset.first()
        blueprint, created = PresetBlueprintService.get_or_create_academic_blueprint_from_preset(
            preset,
            set_as_active=True,
        )

        if created:
            message = (
                f"Created '{blueprint.name}' and set it as the active platform "
                "blueprint."
            )
        else:
            message = (
                f"Set existing '{blueprint.name}' as the active platform blueprint "
                "(no duplicate created)."
            )

        self.message_user(request, message, level=messages.SUCCESS)


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
                "fields": (
                    "features",
                    "course_levels",
                    "program_categories",
                    "public_content",
                    "social_links",
                ),
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

    def _ensure_active_blueprint(self, request, obj: PlatformSettings):
        """Ensure there is a builder-compatible active blueprint for non-custom modes."""
        before_id = obj.active_blueprint_id
        active = PlatformSettingsService.ensure_active_blueprint_for_mode(obj)
        after_id = active.id if active else None
        changed = before_id != after_id

        if changed and after_id is not None:
            self.message_user(
                request,
                "A default active blueprint was assigned for this deployment mode.",
                level=messages.INFO,
            )

        return active, changed

    def save_model(self, request, obj, form, change):
        self._ensure_active_blueprint(request, obj)
        super().save_model(request, obj, form, change)

    def has_add_permission(self, request):
        return not PlatformSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        settings = PlatformSettings.get_settings()
        _, changed = self._ensure_active_blueprint(request, settings)
        if changed:
            settings.save(update_fields=["active_blueprint", "updated_at"])
        return redirect("admin:platform_platformsettings_change", settings.pk)
