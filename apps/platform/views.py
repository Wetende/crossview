"""Platform views - admin settings and Django admin redirects."""

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.shortcuts import redirect
from inertia import render

from apps.core.utils import get_post_data, is_admin
from apps.core.models import Program
from apps.platform.models import PlatformSettings
from apps.platform.policy import (
    get_platform_capabilities,
    platform_capability_enabled,
)


def _require_superadmin(user) -> bool:
    return user.is_superuser


def _redirect_superadmin_to_django_admin() -> object:
    return redirect("admin:index")


def _redirect_superadmin_to_platform_settings() -> object:
    settings = PlatformSettings.get_settings()
    return redirect("admin:platform_platformsettings_change", settings.pk)


def _redirect_superadmin_to_preset_list() -> object:
    return redirect("admin:platform_presetblueprint_changelist")


def _redirect_superadmin_to_preset_create() -> object:
    return redirect("admin:platform_presetblueprint_add")


def _redirect_superadmin_to_preset_edit(pk: int) -> object:
    return redirect("admin:platform_presetblueprint_change", pk)


@login_required
def admin_settings(request):
    """Admin settings page - uses PlatformSettings for single-tenant mode."""
    if not is_admin(request.user):
        return redirect("/dashboard/")
    if not platform_capability_enabled("showAdminSettings"):
        return redirect("/dashboard/")
    
    from apps.platform.services import PlatformSettingsService
    
    if request.method == "POST":
        data = get_post_data(request)
        PlatformSettingsService.update_registration(
            data.get("registrationEnabled", True)
        )
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
                "host": request.get_host(),
                "capabilities": get_platform_capabilities(),
            },
            "settings": {
                "registrationEnabled": settings.get("features", {}).get(
                    "self_registration", True
                ),
            },
        },
    )


def _normalize_program_categories(raw_categories) -> list:
    if raw_categories is None:
        return []
    if isinstance(raw_categories, str):
        raw_categories = [raw_categories]
    if not isinstance(raw_categories, list):
        return []

    normalized = []
    seen = set()
    for category in raw_categories:
        label = " ".join(str(category).split())
        if label and label not in seen:
            normalized.append(label)
            seen.add(label)
    return normalized


@login_required
def admin_program_categories(request):
    """Admin-managed program category list for course setup."""
    if not is_admin(request.user):
        return redirect("/dashboard/")

    from apps.platform.services import PlatformSettingsService

    if request.method == "POST":
        data = get_post_data(request)
        categories = _normalize_program_categories(data.get("programCategories", []))
        PlatformSettingsService.update_program_categories(categories)
        messages.success(request, "Program categories updated successfully")
        return redirect("tenants:admin.program_categories")

    settings = PlatformSettings.get_settings()
    categories = settings.get_program_categories()
    usage_counts = dict(
        Program.objects.exclude(category__isnull=True)
        .exclude(category="")
        .values("category")
        .annotate(count=Count("id"))
        .values_list("category", "count")
    )

    return render(
        request,
        "Admin/ProgramCategories/Index",
        {
            "categories": [
                {
                    "name": category,
                    "programCount": usage_counts.get(category, 0),
                }
                for category in categories
            ],
            "uncategorizedProgramCount": Program.objects.filter(
                category__isnull=True
            ).count()
            + Program.objects.filter(category="").count(),
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


@login_required
def superadmin_dashboard(request):
    """Legacy superadmin dashboard route - redirect to Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_django_admin()


@login_required
def superadmin_presets(request):
    """Legacy preset list route - redirect to Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if not platform_capability_enabled("managePresets"):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_preset_list()


@login_required
def superadmin_preset_create(request):
    """Legacy preset create route - redirect to Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if not platform_capability_enabled("managePresets"):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_preset_create()


@login_required
def superadmin_preset_edit(request, pk: int):
    """Legacy preset edit route - redirect to Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if not platform_capability_enabled("managePresets"):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_preset_edit(pk)

@login_required
def superadmin_logs(request):
    """Legacy logs route - redirect to Django admin index."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_django_admin()


@login_required
def setup_wizard(request):
    """Legacy setup route - redirect to platform settings in Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if not platform_capability_enabled("runSetup"):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_platform_settings()


@login_required
def setup_institution(request):
    """Legacy setup step route - redirect to platform settings in Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if not platform_capability_enabled("runSetup"):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_platform_settings()


@login_required
def setup_mode(request):
    """Legacy setup step route - redirect to platform settings in Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if not platform_capability_enabled("runSetup"):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_platform_settings()


@login_required
def setup_branding(request):
    """Legacy setup step route - redirect to platform settings in Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if not platform_capability_enabled("runSetup"):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_platform_settings()


@login_required
def setup_features(request):
    """Legacy setup step route - redirect to platform settings in Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    if not platform_capability_enabled("runSetup"):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_platform_settings()


@login_required
def platform_settings(request):
    """Legacy platform settings route - redirect to Django admin."""
    if not _require_superadmin(request.user):
        return redirect("/dashboard/")
    return _redirect_superadmin_to_platform_settings()
