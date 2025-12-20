from django.contrib import admin
from .models import (
    Tenant,
    TenantBranding,
    TenantLimits,
    SubscriptionTier,
    PresetBlueprint,
)


@admin.register(SubscriptionTier)
class SubscriptionTierAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "code",
        "max_students",
        "max_programs",
        "price_monthly",
        "is_active",
    ]
    list_filter = ["is_active"]
    search_fields = ["name", "code"]
    ordering = ["name"]


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "subdomain",
        "admin_email",
        "subscription_tier",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active", "subscription_tier"]
    search_fields = ["name", "subdomain", "admin_email"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"


@admin.register(TenantBranding)
class TenantBrandingAdmin(admin.ModelAdmin):
    list_display = ["tenant", "institution_name", "primary_color", "secondary_color"]
    search_fields = ["tenant__name", "institution_name"]


@admin.register(TenantLimits)
class TenantLimitsAdmin(admin.ModelAdmin):
    list_display = [
        "tenant",
        "max_students",
        "current_students",
        "max_programs",
        "current_programs",
    ]
    search_fields = ["tenant__name"]


@admin.register(PresetBlueprint)
class PresetBlueprintAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "regulatory_body", "is_active", "created_at"]
    list_filter = ["is_active", "regulatory_body"]
    search_fields = ["name", "code", "regulatory_body"]
    ordering = ["name"]
