"""Content app views - JSON endpoints for Course Builder."""
from django.contrib.auth.decorators import login_required
from django.http import Http404, JsonResponse
from django.views.decorators.http import require_POST

from .models import ContentBlock
from apps.curriculum.models import CurriculumNode
from apps.core.api_permissions import get_object_in_instructor_scope
from apps.core.utils import get_post_data, is_instructor


def _json_error(
    message: str,
    *,
    status: int = 400,
    code: str = "request_failed",
):
    return JsonResponse(
        {
            "code": code,
            "message": message,
            "error": message,
        },
        status=status,
    )


def _get_accessible_node(user, node_id):
    return get_object_in_instructor_scope(
        CurriculumNode.objects.select_related("program"),
        user,
        "program_id",
        pk=node_id,
    )


def _get_accessible_block(user, block_id):
    return get_object_in_instructor_scope(
        ContentBlock.objects.select_related("node", "node__program"),
        user,
        "node__program_id",
        pk=block_id,
    )


@login_required
def content_blocks_list(request):
    """
    Get content blocks for a node.
    GET: ?node_id=123
    Returns JSON since this is component-level data loading.
    """
    node_id = request.GET.get('node_id')
    if not node_id:
        return JsonResponse([], safe=False)

    # Authorization: verify user has access to this node's program
    if not is_instructor(request.user):
        return _json_error(
            "You do not have access to this content.",
            status=403,
            code="permission_denied",
        )

    try:
        node = _get_accessible_node(request.user, node_id)
    except Http404:
        return _json_error(
            "Node not found.",
            status=404,
            code="not_found",
        )

    blocks = ContentBlock.objects.filter(node_id=node.id).order_by('position')
    data = [{
        'id': b.id,
        'node': b.node_id,
        'block_type': b.block_type,
        'position': b.position,
        'data': b.data,
    } for b in blocks]

    return JsonResponse(data, safe=False)


@login_required
@require_POST
def content_block_create(request):
    """
    Create a new content block.
    POST: {node: 123, block_type: 'text', data: {...}}
    Returns JSON for Course Builder.
    """
    data = get_post_data(request)
    node_id = data.get('node')
    block_type = data.get('block_type', 'text')
    block_data = data.get('data', {})
    position = data.get('position')

    if not node_id:
        return _json_error(
            "Please select a lesson before saving content.",
            status=400,
            code="node_required",
        )

    # Authorization
    if not is_instructor(request.user):
        return _json_error(
            "You do not have access to this content.",
            status=403,
            code="permission_denied",
        )

    try:
        node = _get_accessible_node(request.user, node_id)
    except Http404:
        return _json_error(
            "Node not found.",
            status=404,
            code="not_found",
        )

    # Auto-position if not provided
    if position is None:
        position = ContentBlock.objects.filter(node=node).count()

    block = ContentBlock.objects.create(
        node=node,
        block_type=block_type,
        position=position,
        data=block_data,
    )

    return JsonResponse({'id': block.id, 'status': 'success'}, status=201)


@login_required
@require_POST
def content_block_update(request, pk: int):
    """
    Update a content block.
    POST: {block_type: 'text', data: {...}}
    Returns JSON for Course Builder.
    """
    data = get_post_data(request)

    # Authorization
    if not is_instructor(request.user):
        return _json_error(
            "You do not have access to this content.",
            status=403,
            code="permission_denied",
        )

    try:
        block = _get_accessible_block(request.user, pk)
    except Http404:
        return _json_error(
            "Content block not found.",
            status=404,
            code="not_found",
        )

    if 'block_type' in data:
        block.block_type = data['block_type']
    if 'data' in data:
        block.data = data['data']
    if 'position' in data:
        block.position = data['position']

    block.save()

    return JsonResponse({'id': block.id, 'status': 'success'})


@login_required
@require_POST
def content_block_delete(request, pk: int):
    """
    Delete a content block.
    Returns JSON for Course Builder.
    """
    # Authorization
    if not is_instructor(request.user):
        return _json_error(
            "You do not have access to this content.",
            status=403,
            code="permission_denied",
        )

    try:
        block = _get_accessible_block(request.user, pk)
    except Http404:
        return _json_error(
            "Content block not found.",
            status=404,
            code="not_found",
        )

    block.delete()

    return JsonResponse({'status': 'deleted'})


@login_required
@require_POST
def content_blocks_reorder(request):
    """
    Reorder blocks for a node.
    POST: {node_id: 123, order: [1, 2, 3]}
    Returns JSON for Course Builder.
    """
    data = get_post_data(request)
    node_id = data.get('node_id')
    order = data.get('order', [])

    if not node_id:
        return _json_error(
            "Please select a lesson before reordering content.",
            status=400,
            code="node_required",
        )

    # Authorization
    if not is_instructor(request.user):
        return _json_error(
            "You do not have access to this content.",
            status=403,
            code="permission_denied",
        )

    try:
        node = _get_accessible_node(request.user, node_id)
    except Http404:
        return _json_error(
            "Node not found.",
            status=404,
            code="not_found",
        )

    blocks = ContentBlock.objects.filter(node=node)
    block_map = {b.id: b for b in blocks}

    updated = []
    current_pos = 0
    for block_id in order:
        try:
            block_id = int(block_id)
        except (ValueError, TypeError):
            continue

        if block_id in block_map:
            block = block_map[block_id]
            block.position = current_pos
            updated.append(block)
            current_pos += 1

    if updated:
        ContentBlock.objects.bulk_update(updated, ['position'])

    return JsonResponse({'status': 'reordered'})
