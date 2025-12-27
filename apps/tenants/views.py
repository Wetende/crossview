"""Tenant views - Admin settings, branding, and Super Admin management."""

import json
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login
from django.core.exceptions import ValidationError
from inertia import render

from apps.tenants.models import Tenant, PresetBlueprint
from apps.tenants.services import (
    PlatformStatsService,
    TenantService,
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
    """Admin settings page for tenant configuration."""
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
        },
    )


@login_required
def admin_branding(request):
    """Admin branding page for tenant customization."""
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


# =============================================================================
# Super Admin Views
# =============================================================================


@login_required
def superadmin_dashboard(request):
    """Super admin dashboard with platform settings and stats."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    
    from apps.tenants.services import PlatformSettingsService
    from apps.core.models import User, Program
    
    # Get platform settings
    platform_settings = PlatformSettingsService.get_settings()
    
    # Get basic stats
    total_users = User.objects.count()
    total_programs = Program.objects.count()
    
    # Check if setup is needed
    is_setup_required = PlatformSettingsService.is_setup_required()
    
    return render(
        request,
        "SuperAdmin/Dashboard",
        {
            "platformSettings": platform_settings,
            "stats": {
                "totalUsers": total_users,
                "totalPrograms": total_programs,
            },
            "isSetupRequired": is_setup_required,
        },
    )


@login_required
def superadmin_tenants(request):
    """List all tenants with filtering."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    status = request.GET.get("status", "")
    search = request.GET.get("search", "")
    page = int(request.GET.get("page", 1))
    per_page = 20
    tenants_data, total = TenantService.list_tenants(
        status=status or None,
        search=search or None,
        page=page,
        per_page=per_page,
    )
    return render(
        request,
        "SuperAdmin/Tenants/Index",
        {
            "tenants": tenants_data,
            "filters": {"status": status, "search": search},
            "pagination": {
                "page": page,
                "perPage": per_page,
                "total": total,
                "totalPages": (total + per_page - 1) // per_page,
            },
        },
    )


@login_required
def superadmin_tenant_detail(request, pk: int):
    """View tenant details."""
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
    """Create a new tenant."""
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
            )
            messages.success(request, f"Tenant '{tenant.name}' created successfully")
            return redirect("tenants:superadmin.tenant", pk=tenant.id)
        except ValidationError as e:
            return render(
                request,
                "SuperAdmin/Tenants/Create",
                {
                    "errors": e.message_dict,
                    "formData": data,
                },
            )
    return render(request, "SuperAdmin/Tenants/Create", {"mode": "create"})


@login_required
def superadmin_tenant_edit(request, pk: int):
    """Edit tenant details."""
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
            )
            messages.success(request, "Tenant updated successfully")
            return redirect("tenants:superadmin.tenant", pk=pk)
        except ValidationError as e:
            return render(
                request,
                "SuperAdmin/Tenants/Edit",
                {
                    "tenant": _serialize_tenant(tenant),
                    "errors": e.message_dict,
                    "mode": "edit",
                },
            )
    return render(
        request,
        "SuperAdmin/Tenants/Edit",
        {
            "tenant": _serialize_tenant(tenant),
            "mode": "edit",
        },
    )


@login_required
def superadmin_tenant_suspend(request, pk: int):
    """Suspend or reactivate a tenant."""
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
    """Impersonate a tenant admin for support purposes."""
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
    """Exit impersonation and return to super admin."""
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
def superadmin_presets(request):
    """List preset blueprints."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    presets_data = PresetBlueprintService.list_presets()
    return render(request, "SuperAdmin/Presets/Index", {"presets": presets_data})


@login_required
def superadmin_preset_create(request):
    """Create a new preset blueprint."""
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
            return render(
                request,
                "SuperAdmin/Presets/Form",
                {
                    "mode": "create",
                    "errors": e.message_dict,
                    "formData": data,
                },
            )
    return render(request, "SuperAdmin/Presets/Form", {"mode": "create"})


@login_required
def superadmin_preset_edit(request, pk: int):
    """Edit a preset blueprint."""
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
            return render(
                request,
                "SuperAdmin/Presets/Form",
                {
                    "mode": "edit",
                    "preset": _serialize_preset(preset),
                    "errors": e.message_dict,
                },
            )
    return render(
        request,
        "SuperAdmin/Presets/Form",
        {
            "mode": "edit",
            "preset": _serialize_preset(preset),
        },
    )


@login_required
def superadmin_settings(request):
    """Platform-wide settings."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if request.method == "POST":
        messages.success(request, "Settings updated successfully")
        return redirect("tenants:superadmin.settings")
    return render(
        request,
        "SuperAdmin/Settings/Index",
        {
            "settings": {
                "platformName": "Crossview LMS",
                "supportEmail": "support@crossview.edu",
                "maintenanceMode": False,
            },
        },
    )


@login_required
def superadmin_logs(request):
    """View platform audit logs."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    page = int(request.GET.get("page", 1))
    level = request.GET.get("level", "")
    # Placeholder logs - would come from actual logging system
    logs_data = [
        {
            "id": 1,
            "level": "info",
            "message": "Tenant created",
            "user": "admin@crossview.edu",
            "timestamp": "2024-01-15T10:30:00Z",
            "context": {},
        }
    ]
    return render(
        request,
        "SuperAdmin/Logs",
        {
            "logs": logs_data,
            "filters": {"level": level},
            "pagination": {
                "page": page,
                "perPage": 50,
                "total": len(logs_data),
                "totalPages": 1,
            },
        },
    )


# =============================================================================
# Serializers
# =============================================================================


def _serialize_tenant(tenant) -> dict:
    return {
        "id": tenant.id,
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "adminEmail": tenant.admin_email,
        "isActive": tenant.is_active,
    }


def _serialize_preset(preset) -> dict:
    return {
        "id": preset.id,
        "name": preset.name,
        "code": preset.code,
        "description": preset.description or "",
        "regulatoryBody": preset.regulatory_body or "",
        "hierarchyLabels": preset.hierarchy_labels or [],
        "gradingConfig": preset.grading_config or {},
        "isActive": preset.is_active,
    }


# =============================================================================
# Setup Wizard Views (Single-Tenant Mode)
# =============================================================================


@login_required
def setup_wizard(request):
    """Setup wizard - redirect to appropriate step or dashboard if complete."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    
    from apps.tenants.services import PlatformSettingsService
    
    if not PlatformSettingsService.is_setup_required():
        return redirect("/superadmin/")
    
    return redirect("tenants:setup.institution")


@login_required
def setup_institution(request):
    """Step 1: Institution information."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    
    from apps.tenants.services import PlatformSettingsService
    
    if request.method == "POST":
        data = _get_post_data(request)
        PlatformSettingsService.update_institution_info(
            institution_name=data.get("institutionName", "").strip(),
            tagline=data.get("tagline", "").strip(),
            contact_email=data.get("contactEmail", "").strip(),
            contact_phone=data.get("contactPhone", "").strip(),
            address=data.get("address", "").strip(),
        )
        messages.success(request, "Institution information saved")
        return redirect("tenants:setup.mode")
    
    current = PlatformSettingsService.get_settings()
    return render(
        request,
        "SuperAdmin/Setup/Institution",
        {
            "step": 1,
            "totalSteps": 4,
            "settings": current,
        },
    )


@login_required
def setup_mode(request):
    """Step 2: Deployment mode selection."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    
    from apps.tenants.services import PlatformSettingsService
    from apps.blueprints.models import AcademicBlueprint
    
    if request.method == "POST":
        data = _get_post_data(request)
        PlatformSettingsService.update_deployment_mode(
            deployment_mode=data.get("deploymentMode", "custom"),
            blueprint_id=data.get("blueprintId"),
        )
        messages.success(request, "Deployment mode saved")
        return redirect("tenants:setup.branding")
    
    current = PlatformSettingsService.get_settings()
    modes = PlatformSettingsService.get_deployment_modes()
    blueprints = [
        {"id": b.id, "name": b.name}
        for b in AcademicBlueprint.all_objects.all()
    ]
    
    return render(
        request,
        "SuperAdmin/Setup/Mode",
        {
            "step": 2,
            "totalSteps": 4,
            "settings": current,
            "modes": modes,
            "blueprints": blueprints,
        },
    )


@login_required
def setup_branding(request):
    """Step 3: Branding configuration."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    
    from apps.tenants.services import PlatformSettingsService
    
    if request.method == "POST":
        data = _get_post_data(request)
        logo = request.FILES.get("logo")
        favicon = request.FILES.get("favicon")
        
        PlatformSettingsService.update_branding(
            primary_color=data.get("primaryColor"),
            secondary_color=data.get("secondaryColor"),
            custom_css=data.get("customCss", ""),
            logo=logo,
            favicon=favicon,
        )
        messages.success(request, "Branding saved")
        return redirect("tenants:setup.features")
    
    current = PlatformSettingsService.get_settings()
    return render(
        request,
        "SuperAdmin/Setup/Branding",
        {
            "step": 3,
            "totalSteps": 4,
            "settings": current,
        },
    )


@login_required
def setup_features(request):
    """Step 4: Feature toggles."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    
    from apps.tenants.services import PlatformSettingsService
    
    if request.method == "POST":
        data = _get_post_data(request)
        features = {
            "certificates": data.get("certificates", False),
            "practicum": data.get("practicum", False),
            "gamification": data.get("gamification", False),
            "self_registration": data.get("selfRegistration", False),
            "payments": data.get("payments", False),
        }
        PlatformSettingsService.update_features(features)
        PlatformSettingsService.complete_setup()
        messages.success(request, "Setup complete!")
        return redirect("tenants:superadmin.dashboard")
    
    current = PlatformSettingsService.get_settings()
    return render(
        request,
        "SuperAdmin/Setup/Features",
        {
            "step": 4,
            "totalSteps": 4,
            "settings": current,
        },
    )


@login_required
def platform_settings(request):
    """View/edit platform settings after initial setup."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    
    from apps.tenants.services import PlatformSettingsService
    from apps.blueprints.models import AcademicBlueprint
    
    if request.method == "POST":
        data = _get_post_data(request)
        logo = request.FILES.get("logo")
        favicon = request.FILES.get("favicon")
        
        # Update institution info
        PlatformSettingsService.update_institution_info(
            institution_name=data.get("institutionName", "").strip(),
            tagline=data.get("tagline", "").strip(),
            contact_email=data.get("contactEmail", "").strip(),
            contact_phone=data.get("contactPhone", "").strip(),
            address=data.get("address", "").strip(),
        )
        
        # Update branding
        PlatformSettingsService.update_branding(
            primary_color=data.get("primaryColor"),
            secondary_color=data.get("secondaryColor"),
            custom_css=data.get("customCss", ""),
            logo=logo,
            favicon=favicon,
        )
        
        # Update mode if changed
        PlatformSettingsService.update_deployment_mode(
            deployment_mode=data.get("deploymentMode", "custom"),
            blueprint_id=data.get("blueprintId"),
        )
        
        messages.success(request, "Platform settings updated")
        return redirect("tenants:platform.settings")
    
    current = PlatformSettingsService.get_settings()
    modes = PlatformSettingsService.get_deployment_modes()
    blueprints = [
        {"id": b.id, "name": b.name}
        for b in AcademicBlueprint.all_objects.all()
    ]
    
    return render(
        request,
        "SuperAdmin/Settings/Platform",
        {
            "settings": current,
            "modes": modes,
            "blueprints": blueprints,
        },
    )

