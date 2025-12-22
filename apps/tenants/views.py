"""
Tenant views - Admin settings and branding.
Requirements: US-10.1, US-10.2, US-10.3, US-10.4, US-10.5
"""

import json
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.contrib import messages
from inertia import render


def _require_admin(user) -> bool:
    """Check if user is admin or superadmin."""
    return user.is_staff or user.is_superuser


def _get_post_data(request) -> dict:
    """Get POST data from request, handling both form-encoded and JSON."""
    if request.POST:
        return request.POST
    if request.body:
        try:
            return json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            pass
    return {}


@login_required
def admin_settings(request):
    """
    General tenant settings page.
    Requirements: US-10.3, US-10.4, US-10.5
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    tenant = request.user.tenant
    if not tenant:
        return redirect("/dashboard/")

    if request.method == "POST":
        data = _get_post_data(request)

        # Update settings
        settings = tenant.settings or {}
        settings["registration_enabled"] = data.get("registrationEnabled", True)
        tenant.settings = settings
        tenant.save()

        messages.success(request, "Settings updated successfully")
        return redirect("tenants:admin.settings")

    # Get subscription info
    tier = tenant.subscription_tier
    limits = getattr(tenant, "limits", None)

    return render(
        request,
        "Admin/Settings/Index",
        {
            "tenant": {
                "id": tenant.id,
                "name": tenant.name,
                "subdomain": tenant.subdomain,
                "createdAt": tenant.created_at.isoformat(),
            },
            "settings": {
                "registrationEnabled": (
                    tenant.settings.get("registration_enabled", True)
                    if tenant.settings
                    else True
                ),
            },
            "subscription": {
                "tierName": tier.name if tier else "Free",
                "tierCode": tier.code if tier else "free",
                "maxStudents": limits.max_students if limits else 100,
                "maxPrograms": limits.max_programs if limits else 10,
                "maxStorageMb": limits.max_storage_mb if limits else 5000,
                "currentStudents": limits.current_students if limits else 0,
                "currentPrograms": limits.current_programs if limits else 0,
                "currentStorageMb": limits.current_storage_mb if limits else 0,
            },
        },
    )


@login_required
def admin_branding(request):
    """
    Branding settings page.
    Requirements: US-10.1, US-10.2
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    tenant = request.user.tenant
    if not tenant:
        return redirect("/dashboard/")

    if request.method == "POST":
        data = _get_post_data(request)

        # Update branding settings
        settings = tenant.settings or {}
        settings["branding"] = {
            "primaryColor": data.get("primaryColor", "#2563EB"),
            "secondaryColor": data.get("secondaryColor", "#7C3AED"),
            "customCss": data.get("customCss", ""),
        }
        tenant.settings = settings
        tenant.save()

        messages.success(request, "Branding updated successfully")
        return redirect("tenants:admin.branding")

    # Get current branding
    branding = (tenant.settings or {}).get("branding", {})

    return render(
        request,
        "Admin/Settings/Branding",
        {
            "branding": {
                "primaryColor": branding.get("primaryColor", "#2563EB"),
                "secondaryColor": branding.get("secondaryColor", "#7C3AED"),
                "logoUrl": branding.get("logoUrl", ""),
                "customCss": branding.get("customCss", ""),
            },
        },
    )
