"""Tenant views - Admin settings, branding, and Super Admin management."""

import json
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login
from django.core.exceptions import ValidationError
from inertia import render

from apps.tenants.models import Tenant, SubscriptionTier, PresetBlueprint
from apps.tenants.services import (
    PlatformStatsService,
    TenantService,
    SubscriptionTierService,
    PresetBlueprintService,
)


def _require_admin(user) -> bool:
    return user.is_staff or user.is_superuser


def _require_superadmin(user) -> bool:
    return user.is_superuser


def _get_post_data(request) -> dict:
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
    if not _require_admin(request.user):
        return redirect("/dashboard/")
    tenant = request.user.tenant
    if not tenant:
        return redirect("/dashboard/")
    if request.method == "POST":
        data = _get_post_data(request)
        settings = tenant.settings or {}
        settings["registration_enabled"] = data.get("registrationEnabled", True)
        tenant.settings = settings
        tenant.save()
        messages.success(request, "Settings updated successfully")
        return redirect("tenants:admin.settings")
    tier = tenant.subscription_tier
    limits = getattr(tenant, "limits", None)
    return render(request, "Admin/Settings/Index", {
        "tenant": {"id": tenant.id, "name": tenant.name, "subdomain": tenant.subdomain, "createdAt": tenant.created_at.isoformat()},
        "settings": {"registrationEnabled": tenant.settings.get("registration_enabled", True) if tenant.settings else True},
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
    })


@login_required
def admin_branding(request):
    if not _require_admin(request.user):
        return redirect("/dashboard/")
    tenant = request.user.tenant
    if not tenant:
        return redirect("/dashboard/")
    if request.method == "POST":
        data = _get_post_data(request)
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
    branding = (tenant.settings or {}).get("branding", {})
    return render(request, "Admin/Settings/Branding", {
        "branding": {
            "primaryColor": branding.get("primaryColor", "#2563EB"),
            "secondaryColor": branding.get("secondaryColor", "#7C3AED"),
            "logoUrl": branding.get("logoUrl", ""),
            "customCss": branding.get("customCss", ""),
        },
    })


@login_required
def superadmin_dashboard(request):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    stats = PlatformStatsService.get_dashboard_stats()
    tenant_growth, user_growth = PlatformStatsService.get_growth_data()
    tier_distribution = PlatformStatsService.get_tier_distribution()
    recent_tenants = PlatformStatsService.get_recent_tenants()
    return render(request, "SuperAdmin/Dashboard", {
        "stats": stats,
        "tenantGrowth": tenant_growth,
        "userGrowth": user_growth,
        "tierDistribution": tier_distribution,
        "recentTenants": recent_tenants,
    })


@login_required
def superadmin_tenants(request):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    tier_id = request.GET.get("tier", "")
    status = request.GET.get("status", "")
    search = request.GET.get("search", "")
    page = int(request.GET.get("page", 1))
    per_page = 20
    tenants_data, total = TenantService.list_tenants(
        tier_id=int(tier_id) if tier_id else None,
        status=status or None,
        search=search or None,
        page=page,
        per_page=per_page,
    )
    tiers = SubscriptionTier.objects.filter(is_active=True).values("id", "name")
    return render(request, "SuperAdmin/Tenants/Index", {
        "tenants": tenants_data,
        "tiers": list(tiers),
        "filters": {"tier": tier_id, "status": status, "search": search},
        "pagination": {"page": page, "perPage": per_page, "total": total, "totalPages": (total + per_page - 1) // per_page},
    })


@login_required
def superadmin_tenant_detail(request, pk: int):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    try:
        detail = TenantService.get_tenant_detail(pk)
    except Tenant.DoesNotExist:
        messages.error(request, "Tenant not found")
        return redirect("tenants:superadmin.tenants")
    return render(request, "SuperAdmin/Tenants/Show", detail)


@login_required
def superadmin_tenant_create(request):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if request.method == "POST":
        data = _get_post_data(request)
        try:
            tenant = TenantService.create_tenant(
                name=data.get("name", "").strip(),
                subdomain=data.get("subdomain", "").strip().lower(),
                admin_email=data.get("adminEmail", "").strip().lower(),
                admin_name=data.get("adminName", "").strip(),
                tier_id=data.get("tierId") or None,
            )
            messages.success(request, f"Tenant '{tenant.name}' created successfully")
            return redirect("tenants:superadmin.tenant", pk=tenant.id)
        except ValidationError as e:
            tiers = SubscriptionTierService.list_tiers()
            return render(request, "SuperAdmin/Tenants/Create", {"errors": e.message_dict, "formData": data, "tiers": tiers})
    tiers = SubscriptionTierService.list_tiers()
    return render(request, "SuperAdmin/Tenants/Create", {"mode": "create", "tiers": tiers})


@login_required
def superadmin_tenant_edit(request, pk: int):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    tenant = get_object_or_404(Tenant, pk=pk)
    if request.method == "POST":
        data = _get_post_data(request)
        try:
            TenantService.update_tenant(
                tenant_id=pk,
                name=data.get("name", "").strip(),
                subdomain=data.get("subdomain", "").strip().lower(),
                admin_email=data.get("adminEmail", "").strip().lower() or None,
                tier_id=data.get("tierId") or None,
            )
            messages.success(request, "Tenant updated successfully")
            return redirect("tenants:superadmin.tenant", pk=pk)
        except ValidationError as e:
            tiers = SubscriptionTierService.list_tiers()
            return render(request, "SuperAdmin/Tenants/Edit", {"tenant": _serialize_tenant(tenant), "errors": e.message_dict, "tiers": tiers, "mode": "edit"})
    tiers = SubscriptionTierService.list_tiers()
    return render(request, "SuperAdmin/Tenants/Edit", {"tenant": _serialize_tenant(tenant), "tiers": tiers, "mode": "edit"})


@login_required
def superadmin_tenant_suspend(request, pk: int):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if request.method != "POST":
        return redirect("tenants:superadmin.tenants")
    tenant = TenantService.toggle_tenant_status(pk)
    status = "activated" if tenant.is_active else "suspended"
    messages.success(request, f"Tenant {status} successfully")
    return redirect("tenants:superadmin.tenant", pk=pk)


@login_required
def superadmin_tenant_impersonate(request, pk: int):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    from apps.core.models import User
    tenant = get_object_or_404(Tenant, pk=pk)
    admin_user = User.objects.filter(tenant=tenant, is_staff=True).first()
    if not admin_user:
        messages.error(request, "No admin user found for this tenant")
        return redirect("tenants:superadmin.tenant", pk=pk)
    request.session["impersonating_from"] = request.user.id
    request.session["impersonating_tenant"] = tenant.id
    login(request, admin_user)
    messages.info(request, f"Now impersonating {admin_user.email}")
    return redirect("/dashboard/")


@login_required
def superadmin_exit_impersonation(request):
    original_user_id = request.session.get("impersonating_from")
    if not original_user_id:
        return redirect("/dashboard/")
    from apps.core.models import User
    original_user = User.objects.filter(pk=original_user_id, is_superuser=True).first()
    if original_user:
        del request.session["impersonating_from"]
        if "impersonating_tenant" in request.session:
            del request.session["impersonating_tenant"]
        login(request, original_user)
        messages.success(request, "Exited impersonation")
    return redirect("/dashboard/")


@login_required
def superadmin_tiers(request):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    tiers_data = SubscriptionTierService.list_tiers()
    return render(request, "SuperAdmin/Tiers/Index", {"tiers": tiers_data})


@login_required
def superadmin_tier_create(request):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if request.method == "POST":
        data = _get_post_data(request)
        try:
            SubscriptionTierService.create_tier(
                name=data.get("name", "").strip(),
                code=data.get("code", "").strip().lower(),
                price_monthly=float(data.get("priceMonthly", 0)),
                max_students=int(data.get("maxStudents", 100)),
                max_programs=int(data.get("maxPrograms", 10)),
                max_storage_mb=int(data.get("maxStorageMb", 5000)),
                features=data.get("features", {}),
                is_active=data.get("isActive", True),
            )
            messages.success(request, "Tier created successfully")
            return redirect("tenants:superadmin.tiers")
        except ValidationError as e:
            return render(request, "SuperAdmin/Tiers/Form", {"mode": "create", "errors": e.message_dict, "formData": data})
    return render(request, "SuperAdmin/Tiers/Form", {"mode": "create"})


@login_required
def superadmin_tier_edit(request, pk: int):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    tier = get_object_or_404(SubscriptionTier, pk=pk)
    if request.method == "POST":
        data = _get_post_data(request)
        try:
            SubscriptionTierService.update_tier(
                tier_id=pk,
                name=data.get("name", "").strip(),
                code=data.get("code", "").strip().lower(),
                price_monthly=float(data.get("priceMonthly", tier.price_monthly)),
                max_students=int(data.get("maxStudents", tier.max_students)),
                max_programs=int(data.get("maxPrograms", tier.max_programs)),
                max_storage_mb=int(data.get("maxStorageMb", tier.max_storage_mb)),
                features=data.get("features", tier.features),
                is_active=data.get("isActive", tier.is_active),
            )
            messages.success(request, "Tier updated successfully")
            return redirect("tenants:superadmin.tiers")
        except ValidationError as e:
            return render(request, "SuperAdmin/Tiers/Form", {"mode": "edit", "tier": _serialize_tier(tier), "errors": e.message_dict})
    return render(request, "SuperAdmin/Tiers/Form", {"mode": "edit", "tier": _serialize_tier(tier)})


@login_required
def superadmin_presets(request):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    presets_data = PresetBlueprintService.list_presets()
    return render(request, "SuperAdmin/Presets/Index", {"presets": presets_data})


@login_required
def superadmin_preset_create(request):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if request.method == "POST":
        data = _get_post_data(request)
        try:
            PresetBlueprintService.create_preset(
                name=data.get("name", "").strip(),
                code=data.get("code", "").strip().lower(),
                hierarchy_labels=data.get("hierarchyLabels", []),
                description=data.get("description", ""),
                regulatory_body=data.get("regulatoryBody", ""),
                grading_config=data.get("gradingConfig", {}),
                is_active=data.get("isActive", True),
            )
            messages.success(request, "Preset created successfully")
            return redirect("tenants:superadmin.presets")
        except ValidationError as e:
            return render(request, "SuperAdmin/Presets/Form", {"mode": "create", "errors": e.message_dict, "formData": data})
    return render(request, "SuperAdmin/Presets/Form", {"mode": "create"})


@login_required
def superadmin_preset_edit(request, pk: int):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    preset = get_object_or_404(PresetBlueprint, pk=pk)
    if request.method == "POST":
        data = _get_post_data(request)
        try:
            PresetBlueprintService.update_preset(
                preset_id=pk,
                name=data.get("name", "").strip(),
                code=data.get("code", "").strip().lower(),
                hierarchy_labels=data.get("hierarchyLabels", []),
                description=data.get("description", ""),
                regulatory_body=data.get("regulatoryBody", ""),
                grading_config=data.get("gradingConfig", preset.grading_config),
                is_active=data.get("isActive", preset.is_active),
            )
            messages.success(request, "Preset updated successfully")
            return redirect("tenants:superadmin.presets")
        except ValidationError as e:
            return render(request, "SuperAdmin/Presets/Form", {"mode": "edit", "preset": _serialize_preset(preset), "errors": e.message_dict})
    return render(request, "SuperAdmin/Presets/Form", {"mode": "edit", "preset": _serialize_preset(preset)})


@login_required
def superadmin_settings(request):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if request.method == "POST":
        messages.success(request, "Settings updated successfully")
        return redirect("tenants:superadmin.settings")
    return render(request, "SuperAdmin/Settings/Index", {
        "settings": {"platformName": "Crossview LMS", "supportEmail": "support@crossview.edu", "maintenanceMode": False},
    })


@login_required
def superadmin_logs(request):
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    page = int(request.GET.get("page", 1))
    level = request.GET.get("level", "")
    logs_data = [{"id": 1, "level": "info", "message": "Tenant created", "user": "admin@crossview.edu", "timestamp": "2024-01-15T10:30:00Z", "context": {}}]
    return render(request, "SuperAdmin/Logs", {
        "logs": logs_data,
        "filters": {"level": level},
        "pagination": {"page": page, "perPage": 50, "total": len(logs_data), "totalPages": 1},
    })


def _serialize_tenant(tenant) -> dict:
    return {"id": tenant.id, "name": tenant.name, "subdomain": tenant.subdomain, "adminEmail": tenant.admin_email, "tierId": tenant.subscription_tier_id, "isActive": tenant.is_active}


def _serialize_tier(tier) -> dict:
    return {"id": tier.id, "name": tier.name, "code": tier.code, "priceMonthly": float(tier.price_monthly), "maxStudents": tier.max_students, "maxPrograms": tier.max_programs, "maxStorageMb": tier.max_storage_mb, "features": tier.features or {}, "isActive": tier.is_active}


def _serialize_preset(preset) -> dict:
    return {"id": preset.id, "name": preset.name, "code": preset.code, "description": preset.description or "", "regulatoryBody": preset.regulatory_body or "", "hierarchyLabels": preset.hierarchy_labels or [], "gradingConfig": preset.grading_config or {}, "isActive": preset.is_active}
