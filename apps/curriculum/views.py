"""
Curriculum views - Admin curriculum builder.
Requirements: FR-4.1, FR-4.2, FR-4.3, FR-4.4, FR-4.5
"""

import json
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from inertia import render

from apps.curriculum.models import CurriculumNode
from apps.core.models import Program


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


def _build_curriculum_tree(program_id: int) -> list:
    """Build hierarchical tree structure from flat nodes."""
    nodes = CurriculumNode.objects.filter(program_id=program_id).order_by("position")

    # Build lookup dict
    nodes_dict = {}
    for node in nodes:
        nodes_dict[node.id] = {
            "id": node.id,
            "parentId": node.parent_id,
            "nodeType": node.node_type,
            "title": node.title,
            "code": node.code or "",
            "description": node.description or "",
            "properties": node.properties or {},
            "completionRules": node.completion_rules or {},
            "position": node.position,
            "isPublished": node.is_published,
            "children": [],
        }

    # Build tree
    tree = []
    for node in nodes:
        node_data = nodes_dict[node.id]
        if node.parent_id and node.parent_id in nodes_dict:
            nodes_dict[node.parent_id]["children"].append(node_data)
        else:
            tree.append(node_data)

    return tree


# =============================================================================
# Curriculum Builder
# =============================================================================


@login_required
def admin_curriculum_builder(request):
    """
    Curriculum builder page.
    Requirements: FR-4.1
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    program_id = request.GET.get("program")
    if not program_id:
        return redirect("/admin/programs/")

    program = get_object_or_404(Program, pk=program_id, tenant=request.user.tenant)

    # Get blueprint hierarchy
    hierarchy = []
    if program.blueprint:
        hierarchy = program.blueprint.hierarchy_structure or []

    # Build curriculum tree
    tree = _build_curriculum_tree(program.id)

    return render(
        request,
        "Admin/Curriculum/Builder",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "blueprintId": program.blueprint_id,
                "blueprintName": program.blueprint.name if program.blueprint else None,
            },
            "hierarchy": hierarchy,
            "tree": tree,
        },
    )


# =============================================================================
# Node CRUD Operations
# =============================================================================


@login_required
def admin_node_create(request):
    """
    Create a new curriculum node.
    Requirements: FR-4.3
    """
    if not _require_admin(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = _get_post_data(request)
    program_id = data.get("programId")
    parent_id = data.get("parentId")
    node_type = data.get("nodeType", "").strip()
    title = data.get("title", "").strip()

    if not program_id or not node_type or not title:
        return JsonResponse({"error": "Missing required fields"}, status=400)

    # Verify program belongs to tenant
    program = get_object_or_404(Program, pk=program_id, tenant=request.user.tenant)

    # Get position (add at end of siblings)
    siblings = CurriculumNode.objects.filter(program=program, parent_id=parent_id)
    position = siblings.count()

    try:
        node = CurriculumNode.objects.create(
            program=program,
            parent_id=parent_id,
            node_type=node_type,
            title=title,
            code=data.get("code", ""),
            description=data.get("description", ""),
            properties=data.get("properties", {}),
            completion_rules=data.get("completionRules", {}),
            position=position,
            is_published=data.get("isPublished", False),
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse(
        {
            "id": node.id,
            "parentId": node.parent_id,
            "nodeType": node.node_type,
            "title": node.title,
            "code": node.code or "",
            "description": node.description or "",
            "properties": node.properties or {},
            "completionRules": node.completion_rules or {},
            "position": node.position,
            "isPublished": node.is_published,
            "children": [],
        },
        status=201,
    )


@login_required
def admin_node_update(request, pk: int):
    """
    Update a curriculum node.
    Requirements: FR-4.4
    """
    if not _require_admin(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    node = get_object_or_404(CurriculumNode, pk=pk, program__tenant=request.user.tenant)
    data = _get_post_data(request)

    # Update fields
    if "title" in data:
        node.title = data["title"].strip()
    if "code" in data:
        node.code = data["code"].strip() or None
    if "description" in data:
        node.description = data["description"]
    if "properties" in data:
        node.properties = data["properties"]
    if "completionRules" in data:
        node.completion_rules = data["completionRules"]
    if "isPublished" in data:
        node.is_published = data["isPublished"]

    try:
        node.save()
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse(
        {
            "id": node.id,
            "parentId": node.parent_id,
            "nodeType": node.node_type,
            "title": node.title,
            "code": node.code or "",
            "description": node.description or "",
            "properties": node.properties or {},
            "completionRules": node.completion_rules or {},
            "position": node.position,
            "isPublished": node.is_published,
        }
    )


@login_required
def admin_node_delete(request, pk: int):
    """
    Delete a curriculum node and its descendants.
    Requirements: FR-4.5
    """
    if not _require_admin(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    node = get_object_or_404(CurriculumNode, pk=pk, program__tenant=request.user.tenant)

    # Check for completions
    from apps.progression.models import NodeCompletion

    if NodeCompletion.objects.filter(node=node).exists():
        return JsonResponse(
            {"error": "Cannot delete node with student completions"}, status=400
        )

    # Delete node (cascades to children)
    node.delete()

    return JsonResponse({"success": True})


@login_required
def admin_node_reorder(request):
    """
    Reorder curriculum nodes.
    Requirements: FR-4.2
    """
    if not _require_admin(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = _get_post_data(request)
    node_id = data.get("nodeId")
    new_parent_id = data.get("newParentId")
    new_position = data.get("newPosition", 0)

    if not node_id:
        return JsonResponse({"error": "Missing nodeId"}, status=400)

    node = get_object_or_404(
        CurriculumNode, pk=node_id, program__tenant=request.user.tenant
    )

    # Update parent if changed
    if new_parent_id != node.parent_id:
        # Validate new parent is in same program
        if new_parent_id:
            new_parent = get_object_or_404(
                CurriculumNode, pk=new_parent_id, program=node.program
            )
            node.parent = new_parent
        else:
            node.parent = None

    # Update positions
    old_siblings = CurriculumNode.objects.filter(
        program=node.program, parent_id=node.parent_id
    ).exclude(pk=node.id)

    # Shift positions
    for i, sibling in enumerate(old_siblings.order_by("position")):
        if i >= new_position:
            sibling.position = i + 1
        else:
            sibling.position = i
        sibling.save(skip_validation=True)

    node.position = new_position
    node.save(skip_validation=True)

    return JsonResponse({"success": True})


@login_required
def admin_node_detail(request, pk: int):
    """Get node details for editing."""
    if not _require_admin(request.user):
        return JsonResponse({"error": "Unauthorized"}, status=403)

    node = get_object_or_404(CurriculumNode, pk=pk, program__tenant=request.user.tenant)

    return JsonResponse(
        {
            "id": node.id,
            "parentId": node.parent_id,
            "nodeType": node.node_type,
            "title": node.title,
            "code": node.code or "",
            "description": node.description or "",
            "properties": node.properties or {},
            "completionRules": node.completion_rules or {},
            "position": node.position,
            "isPublished": node.is_published,
        }
    )
