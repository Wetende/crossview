"""Content app views - Inertia redirect pattern for browser use."""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST, require_http_methods

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
    Uses Inertia redirect pattern.
    """
    data = get_post_data(request)
    node_id = data.get('node')
    block_type = data.get('block_type', 'text')
    block_data = data.get('data', {})
    position = data.get('position')
    
    referer = request.META.get('HTTP_REFERER', '/admin/')
    
    if not node_id:
        messages.error(request, "Node ID required")
        return redirect(referer)
    
    # Authorization: verify user has access to this node's program
    if not is_instructor(request.user):
        messages.error(request, "Permission denied")
        return redirect(referer)
    
    program_ids = get_instructor_program_ids(request.user)
    node = get_object_or_404(CurriculumNode, pk=node_id, program_id__in=program_ids)
    
    # Auto-position if not provided
    if position is None:
        position = ContentBlock.objects.filter(node=node).count()
    
    ContentBlock.objects.create(
        node=node,
        block_type=block_type,
        position=position,
        data=block_data,
    )
    
    messages.success(request, f"Block added")
    return redirect(referer)


@login_required
@require_POST
def content_block_update(request, pk: int):
    """
    Update a content block.
    POST: {block_type: 'text', data: {...}}
    Uses Inertia redirect pattern.
    """
    data = get_post_data(request)
    referer = request.META.get('HTTP_REFERER', '/admin/')
    
    # Authorization: verify user has access to this block's node's program
    if not is_instructor(request.user):
        messages.error(request, "Permission denied")
        return redirect(referer)
    
    block = get_object_or_404(ContentBlock, pk=pk)
    program_ids = get_instructor_program_ids(request.user)
    if block.node.program_id not in program_ids:
        messages.error(request, "Permission denied")
        return redirect(referer)
    
    if 'block_type' in data:
        block.block_type = data['block_type']
    if 'data' in data:
        block.data = data['data']
    if 'position' in data:
        block.position = data['position']
    
    block.save()
    
    messages.success(request, "Block updated")
    return redirect(referer)


@login_required
@require_POST
def content_block_delete(request, pk: int):
    """
    Delete a content block.
    Uses Inertia redirect pattern.
    """
    referer = request.META.get('HTTP_REFERER', '/admin/')
    
    # Authorization: verify user has access to this block's node's program
    if not is_instructor(request.user):
        messages.error(request, "Permission denied")
        return redirect(referer)
    
    block = get_object_or_404(ContentBlock, pk=pk)
    program_ids = get_instructor_program_ids(request.user)
    if block.node.program_id not in program_ids:
        messages.error(request, "Permission denied")
        return redirect(referer)
    
    block.delete()
    
    messages.success(request, "Block deleted")
    return redirect(referer)


@login_required
@require_POST
def content_blocks_reorder(request):
    """
    Reorder blocks for a node.
    POST: {node_id: 123, order: [1, 2, 3]}
    Uses Inertia redirect pattern.
    """
    data = get_post_data(request)
    node_id = data.get('node_id')
    order = data.get('order', [])
    
    referer = request.META.get('HTTP_REFERER', '/admin/')
    
    if not node_id:
        messages.error(request, "Node ID required")
        return redirect(referer)
    
    # Authorization: verify user has access to this node's program
    if not is_instructor(request.user):
        messages.error(request, "Permission denied")
        return redirect(referer)
    
    program_ids = get_instructor_program_ids(request.user)
    node = get_object_or_404(CurriculumNode, pk=node_id, program_id__in=program_ids)
    
    blocks = ContentBlock.objects.filter(node=node)
    block_map = {b.id: b for b in blocks}
    
    updated = []
    current_pos = 0
    for block_id in order:
        # Fix type mismatch: block_id from JSON may be string or other type
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
    
    messages.success(request, "Blocks reordered")
    return redirect(referer)


# Keep DRF ViewSet for backward compatibility during transition
# TODO: Remove after confirming all frontend uses new endpoints
from rest_framework import viewsets, decorators, response, status, permissions
from .serializers import ContentBlockSerializer

class ContentBlockViewSet(viewsets.ModelViewSet):
    """DRF ViewSet - kept for backward compatibility with authorization."""
    queryset = ContentBlock.objects.all()
    serializer_class = ContentBlockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter queryset to only blocks the user has access to."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Authorization: only return blocks from programs user can access
        if not is_instructor(user):
            return queryset.none()
        
        program_ids = get_instructor_program_ids(user)
        queryset = queryset.filter(node__program_id__in=program_ids)
        
        node_id = self.request.query_params.get('node_id')
        if node_id:
            queryset = queryset.filter(node_id=node_id)
        return queryset

    def perform_create(self, serializer):
        node = serializer.validated_data.get('node')
        
        # Authorization: verify user has access to this node's program
        if node:
            program_ids = get_instructor_program_ids(self.request.user)
            if node.program_id not in program_ids:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Permission denied")
        
        if not serializer.validated_data.get('position') and node:
            last_pos = ContentBlock.objects.filter(node=node).count()
            serializer.save(position=last_pos)
        else:
            serializer.save()

    def perform_update(self, serializer):
        """Authorization check on update."""
        block = self.get_object()
        program_ids = get_instructor_program_ids(self.request.user)
        if block.node.program_id not in program_ids:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Permission denied")
        serializer.save()

    def perform_destroy(self, instance):
        """Authorization check on delete."""
        program_ids = get_instructor_program_ids(self.request.user)
        if instance.node.program_id not in program_ids:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Permission denied")
        instance.delete()

    @decorators.action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        node_id = request.data.get('node_id')
        order = request.data.get('order', [])
        
        if not node_id:
            return response.Response(
                {"error": "node_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authorization: verify user has access to this node's program
        if not is_instructor(request.user):
            return response.Response(
                {"error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        program_ids = get_instructor_program_ids(request.user)
        try:
            node = CurriculumNode.objects.get(pk=node_id)
            if node.program_id not in program_ids:
                return response.Response(
                    {"error": "Permission denied"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except CurriculumNode.DoesNotExist:
            return response.Response(
                {"error": "Node not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        blocks = ContentBlock.objects.filter(node=node)
        block_map = {b.id: b for b in blocks}
        
        updated_blocks = []
        current_pos = 0
        for block_id in order:
            # Fix type mismatch: block_id from JSON may be string
            block_id = int(block_id) if isinstance(block_id, str) else block_id
            if block_id in block_map:
                block = block_map[block_id]
                block.position = current_pos
                updated_blocks.append(block)
                current_pos += 1
        
        ContentBlock.objects.bulk_update(updated_blocks, ['position'])
        return response.Response({"status": "reordered"})
