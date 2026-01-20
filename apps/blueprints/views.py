"""
Blueprint views - Admin blueprint management.
Requirements: FR-2.1, FR-2.2, FR-2.3, FR-2.4
"""

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from django.db.models import Count
from inertia import render

from apps.blueprints.models import AcademicBlueprint
from apps.platform.models import PresetBlueprint
from apps.core.models import Program
from apps.core.utils import get_post_data, is_admin


# =============================================================================
# Blueprint List
# =============================================================================


@login_required
def admin_blueprints(request):
    """
    List all blueprints.
    Requirements: FR-2.1
    """
    if not is_admin(request.user):
        return redirect("/dashboard/")

    # Get filter params
    search = request.GET.get("search", "")
    page = int(request.GET.get("page", 1))
    per_page = 20

    # Build query
    blueprints_query = AcademicBlueprint.objects.all()

    if search:
        blueprints_query = blueprints_query.filter(name__icontains=search)

    # Count and paginate
    total = blueprints_query.count()
    blueprints_query = blueprints_query.order_by("-created_at")
    blueprints = blueprints_query[(page - 1) * per_page : page * per_page]

    # Get program counts
    # Note: Using manual annotation or separate query if annotate(Count("programs")) fails
    # But AcademicBlueprint.programs related_name exists, so simple annotation works
    blueprints = AcademicBlueprint.objects.annotate(program_count=Count("programs")).order_by("-created_at")
    
    # Re-apply filters and pagination on the annotated queryset
    if search:
        blueprints = blueprints.filter(name__icontains=search)
    blueprints = blueprints[(page - 1) * per_page : page * per_page]

    blueprints_data = [
        {
            "id": bp.id,
            "name": bp.name,
            "description": bp.description or "",
            "hierarchyLabels": bp.hierarchy_structure or [],
            "gradingMode": (
                bp.grading_logic.get("mode", "summative")
                if bp.grading_logic
                else "summative"
            ),
            "programCount": bp.program_count,
            "certificateEnabled": bp.certificate_enabled,
            "gamificationEnabled": bp.gamification_enabled,
            "createdAt": bp.created_at.isoformat(),
        }
        for bp in blueprints
    ]

    # Get available preset blueprints
    presets = PresetBlueprint.objects.filter(is_active=True).order_by("name")
    presets_data = [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "description": p.description or "",
            "regulatoryBody": p.regulatory_body or "",
            "hierarchyLabels": p.hierarchy_labels or [],
            "gradingMode": (
                p.grading_config.get("mode", "summative")
                if p.grading_config
                else "summative"
            ),
        }
        for p in presets
    ]

    return render(
        request,
        "Admin/Blueprints/Index",
        {
            "blueprints": blueprints_data,
            "presets": presets_data,
            "filters": {
                "search": search,
            },
            "pagination": {
                "page": page,
                "perPage": per_page,
                "total": total,
                "totalPages": (total + per_page - 1) // per_page,
            },
        },
    )


# =============================================================================
# Blueprint Detail
# =============================================================================


@login_required
def admin_blueprint_detail(request, pk: int):
    """
    View blueprint details.
    Requirements: FR-2.2
    """
    if not is_admin(request.user):
        return redirect("/dashboard/")

    blueprint = get_object_or_404(AcademicBlueprint, pk=pk)

    # Get programs using this blueprint
    programs = blueprint.programs.all().values("id", "name", "code", "is_published")

    return render(
        request,
        "Admin/Blueprints/Show",
        {
            "blueprint": _serialize_blueprint(blueprint),
            "programs": list(programs),
            "canEdit": not blueprint.programs.exists(),
        },
    )


# =============================================================================
# Blueprint Create
# =============================================================================


@login_required
def admin_blueprint_create(request):
    """
    Create a new blueprint.
    Requirements: US-2.2
    """
    if not is_admin(request.user):
        return redirect("/dashboard/")

    if request.method == "POST":
        data = get_post_data(request)
        errors = {}

        name = data.get("name", "").strip()
        if not name:
            errors["name"] = "Name is required"

        hierarchy_labels = data.get("hierarchyLabels", [])
        if not hierarchy_labels or len(hierarchy_labels) < 1:
            errors["hierarchyLabels"] = "At least one hierarchy level is required"

        grading_config = data.get("gradingConfig", {})
        if not grading_config.get("mode"):
            grading_config["mode"] = "summative"

        if errors:
            return render(
                request,
                "Admin/Blueprints/Create",
                {
                    "presets": _get_presets_data(),
                    "errors": errors,
                    "formData": data,
                },
            )

        # Create blueprint
        blueprint = AcademicBlueprint.objects.create(
            name=name,
            description=data.get("description", ""),
            hierarchy_structure=hierarchy_labels,
            grading_logic=grading_config,
            progression_rules=data.get("progressionRules", {}),
            certificate_enabled=data.get("certificateEnabled", False),
            gamification_enabled=data.get("gamificationEnabled", False),
            feature_flags=data.get("featureFlags", {}),
        )

        messages.success(request, f"Blueprint '{name}' created successfully")
        return redirect("blueprints:admin.blueprint", pk=blueprint.id)

    # GET - show create form
    return render(
        request,
        "Admin/Blueprints/Create",
        {
            "presets": _get_presets_data(),
        },
    )


# =============================================================================
# Blueprint Edit
# =============================================================================


@login_required
def admin_blueprint_edit(request, pk: int):
    """
    Edit a blueprint.
    Requirements: FR-2.4
    """
    if not is_admin(request.user):
        return redirect("/dashboard/")

    blueprint = get_object_or_404(AcademicBlueprint, pk=pk)

    # Check if blueprint can be edited (no programs using it)
    has_programs = blueprint.programs.exists()

    if request.method == "POST":
        if has_programs:
            return render(
                request,
                "Admin/Blueprints/Edit",
                {
                    "blueprint": _serialize_blueprint(blueprint),
                    "canEdit": False,
                    "errors": {
                        "_form": "Cannot edit blueprint with associated programs"
                    },
                },
            )

        data = get_post_data(request)
        errors = {}

        name = data.get("name", "").strip()
        if not name:
            errors["name"] = "Name is required"

        hierarchy_labels = data.get("hierarchyLabels", [])
        if not hierarchy_labels or len(hierarchy_labels) < 1:
            errors["hierarchyLabels"] = "At least one hierarchy level is required"

        if errors:
            return render(
                request,
                "Admin/Blueprints/Edit",
                {
                    "blueprint": _serialize_blueprint(blueprint),
                    "canEdit": True,
                    "errors": errors,
                },
            )

        # Update blueprint
        blueprint.name = name
        blueprint.description = data.get("description", "")
        blueprint.hierarchy_structure = hierarchy_labels
        blueprint.grading_logic = data.get("gradingConfig", blueprint.grading_logic)
        blueprint.progression_rules = data.get(
            "progressionRules", blueprint.progression_rules
        )
        blueprint.certificate_enabled = data.get("certificateEnabled", False)
        blueprint.gamification_enabled = data.get("gamificationEnabled", False)
        blueprint.feature_flags = data.get("featureFlags", {})
        blueprint.save()

        messages.success(request, f"Blueprint updated successfully")
        return redirect("blueprints:admin.blueprint", pk=blueprint.id)

    # GET - show edit form
    return render(
        request,
        "Admin/Blueprints/Edit",
        {
            "blueprint": _serialize_blueprint(blueprint),
            "canEdit": not has_programs,
        },
    )


# =============================================================================
# Blueprint Delete
# =============================================================================


@login_required
def admin_blueprint_delete(request, pk: int):
    """Delete a blueprint."""
    if not is_admin(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("blueprints:admin.blueprints")

    blueprint = get_object_or_404(AcademicBlueprint, pk=pk)

    if blueprint.programs.exists():
        messages.error(request, "Cannot delete blueprint with associated programs")
        return redirect("blueprints:admin.blueprint", pk=pk)

    try:
        blueprint.delete()
        messages.success(request, "Blueprint deleted successfully")
    except Exception as e:
        messages.error(request, str(e))

    return redirect("blueprints:admin.blueprints")


# =============================================================================
# Helper Functions
# =============================================================================


def _get_presets_data() -> list:
    """Get preset blueprints data."""
    presets = PresetBlueprint.objects.filter(is_active=True).order_by("name")
    return [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "description": p.description or "",
            "regulatoryBody": p.regulatory_body or "",
            "hierarchyLabels": p.hierarchy_labels or [],
            "gradingConfig": p.grading_config or {},
        }
        for p in presets
    ]


def _serialize_blueprint(blueprint: AcademicBlueprint) -> dict:
    """Serialize blueprint for frontend."""
    return {
        "id": blueprint.id,
        "name": blueprint.name,
        "description": blueprint.description or "",
        "hierarchyLabels": blueprint.hierarchy_structure or [],
        "gradingConfig": blueprint.grading_logic or {},
        "progressionRules": blueprint.progression_rules or {},
        "certificateEnabled": blueprint.certificate_enabled,
        "gamificationEnabled": blueprint.gamification_enabled,
        "featureFlags": blueprint.feature_flags or {},
    }
