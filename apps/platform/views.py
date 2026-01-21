"""Platform views - Admin settings, branding, and Super Admin management."""

from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, get_object_or_404
from django.contrib import messages
from django.core.exceptions import ValidationError
from inertia import render

from apps.platform.models import PresetBlueprint
from apps.platform.services import (
    PresetBlueprintService,
)
from apps.core.utils import get_post_data, is_admin


def _require_superadmin(user) -> bool:
    return user.is_superuser


@login_required
def admin_settings(request):
    """Admin settings page - uses PlatformSettings for single-tenant mode."""
    if not is_admin(request.user):
        return redirect("/dashboard/")
    
    from apps.platform.services import PlatformSettingsService
    
    if request.method == "POST":
        data = get_post_data(request)
        features = {"self_registration": data.get("registrationEnabled", True)}
        PlatformSettingsService.update_features(features)
        messages.success(request, "Settings updated successfully")
        return redirect("tenants:admin.settings")
    
    settings = PlatformSettingsService.get_settings()
    return render(
        request,
        "Admin/Settings/Index",
        {
            "platform": {
                "institutionName": settings.get("institutionName", ""),
                "deploymentMode": settings.get("deploymentMode", "custom"),
            },
            "settings": {
                "registrationEnabled": settings.get("features", {}).get(
                    "self_registration", True
                ),
            },
        },
    )


# @login_required
# def admin_branding(request):
#     """Admin branding page - uses PlatformSettings for single-tenant mode."""
#     if not is_admin(request.user):
#         return redirect("/dashboard/")
#     
#     from apps.platform.services import PlatformSettingsService
#     
#     if request.method == "POST":
#         data = get_post_data(request)
#         logo = request.FILES.get("logo")
#         favicon = request.FILES.get("favicon")
#         
#         PlatformSettingsService.update_branding(
#             primary_color=data.get("primaryColor"),
#             secondary_color=data.get("secondaryColor"),
#             custom_css=data.get("customCss", ""),
#             logo=logo,
#             favicon=favicon,
#         )
#         messages.success(request, "Branding updated successfully")
#         return redirect("tenants:admin.branding")
#     
#     settings = PlatformSettingsService.get_settings()
#     return render(
#         request,
#         "Admin/Settings/Branding",
#         {
#             "branding": {
#                 "primaryColor": settings.get("primaryColor", "#3B82F6"),
#                 "secondaryColor": settings.get("secondaryColor", "#1E40AF"),
#                 "logoUrl": settings.get("logo", ""),
#                 "customCss": settings.get("customCss", ""),
#             },
#         },
#     )


# =============================================================================
# Super Admin Views
# =============================================================================


@login_required
def superadmin_dashboard(request):
    """Super admin dashboard with platform settings and stats."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    
    from apps.platform.services import PlatformSettingsService
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
        "Dashboard",
        {
            "role": "superadmin",
            "platformSettings": platform_settings,
            "stats": {
                "totalUsers": total_users,
                "totalPrograms": total_programs,
            },
            "isSetupRequired": is_setup_required,
        },
    )


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
        data = get_post_data(request)
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
        data = get_post_data(request)
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
            "message": "Platform configured",
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


# _serialize_tenant removed - not needed in single-tenant mode


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
    
    from apps.platform.services import PlatformSettingsService
    
    if not PlatformSettingsService.is_setup_required():
        return redirect("/superadmin/")
    
    return redirect("tenants:setup.institution")


@login_required
def setup_institution(request):
    """Step 1: Institution information."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    
    from apps.platform.services import PlatformSettingsService
    
    if request.method == "POST":
        data = get_post_data(request)
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
    
    from apps.platform.services import PlatformSettingsService
    from apps.blueprints.models import AcademicBlueprint
    
    if request.method == "POST":
        data = get_post_data(request)
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
        for b in AcademicBlueprint.objects.all()
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
    
    from apps.platform.services import PlatformSettingsService
    
    if request.method == "POST":
        data = get_post_data(request)
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
    
    from apps.platform.services import PlatformSettingsService
    
    if request.method == "POST":
        data = get_post_data(request)
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
    
    from apps.platform.services import PlatformSettingsService
    from apps.blueprints.models import AcademicBlueprint
    
    if request.method == "POST":
        data = get_post_data(request)
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
        for b in AcademicBlueprint.objects.all()
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

