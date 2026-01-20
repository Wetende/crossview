"""Content app views - JSON endpoints for Course Builder."""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST
from django.core.exceptions import PermissionDenied

from .models import ContentBlock
from apps.curriculum.models import CurriculumNode
from apps.core.utils import get_post_data, is_instructor, get_instructor_program_ids


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
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    program_ids = get_instructor_program_ids(request.user)
    node = get_object_or_404(CurriculumNode, pk=node_id)
    if node.program_id not in program_ids:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    blocks = ContentBlock.objects.filter(node_id=node_id).order_by('position')
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
        return JsonResponse({'error': 'Node ID required'}, status=400)
    
    # Authorization
    if not is_instructor(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    program_ids = get_instructor_program_ids(request.user)
    node = get_object_or_404(CurriculumNode, pk=node_id)
    
    if node.program_id not in program_ids:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
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
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    block = get_object_or_404(ContentBlock, pk=pk)
    program_ids = get_instructor_program_ids(request.user)
    
    if block.node.program_id not in program_ids:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
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
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    block = get_object_or_404(ContentBlock, pk=pk)
    program_ids = get_instructor_program_ids(request.user)
    
    if block.node.program_id not in program_ids:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
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
        return JsonResponse({'error': 'Node ID required'}, status=400)
    
    # Authorization
    if not is_instructor(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    program_ids = get_instructor_program_ids(request.user)
    node = get_object_or_404(CurriculumNode, pk=node_id)
    
    if node.program_id not in program_ids:
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
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
