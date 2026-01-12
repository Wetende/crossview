from rest_framework import viewsets, decorators, response, status, permissions
from django.shortcuts import get_object_or_404
from .models import ContentBlock
from .serializers import ContentBlockSerializer
from apps.curriculum.models import CurriculumNode

class ContentBlockViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing content blocks.
    Supports CRUD and reordering.
    """
    queryset = ContentBlock.objects.all()
    serializer_class = ContentBlockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter blocks by node_id if provided in query params.
        """
        queryset = super().get_queryset()
        node_id = self.request.query_params.get('node_id')
        if node_id:
            queryset = queryset.filter(node_id=node_id)
        return queryset

    def perform_create(self, serializer):
        """
        Set position automatically if not provided.
        """
        node = serializer.validated_data.get('node')
        if not serializer.validated_data.get('position') and node:
            last_pos = ContentBlock.objects.filter(node=node).count()
            serializer.save(position=last_pos)
        else:
            serializer.save()

    @decorators.action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        """
        Reorder blocks for a specific node.
        Expects JSON: { "node_id": 123, "order": [block_id_1, block_id_2, ...] }
        """
        node_id = request.data.get('node_id')
        order = request.data.get('order', [])
        
        if not node_id:
            return response.Response(
                {"error": "node_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Verify node permission here (TODO in Phase 5)
        
        blocks = ContentBlock.objects.filter(node_id=node_id)
        block_map = {b.id: b for b in blocks}
        
        # Validation: Ensure all IDs belong to this node
        if set(order) != set(block_map.keys()) and set(order).issubset(set(block_map.keys())):
             # Allow subset reordering? No, usually expect full list for consistency
             pass
        
        updated_blocks = []
        for index, block_id in enumerate(order):
            if block_id in block_map:
                block = block_map[block_id]
                block.position = index
                updated_blocks.append(block)
        
        ContentBlock.objects.bulk_update(updated_blocks, ['position'])
        
        return response.Response({"status": "reordered"})
