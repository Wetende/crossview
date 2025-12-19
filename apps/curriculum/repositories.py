"""
Curriculum repositories - Data access layer for curriculum nodes.
"""
from typing import List, Optional
from django.db import connection
from django.db.models import QuerySet

from .models import CurriculumNode
from .exceptions import MaxDepthExceededException


class CurriculumNodeRepository:
    """Repository for curriculum node operations."""

    def get_tree_for_program(self, program_id: int) -> List[CurriculumNode]:
        """
        Get the complete curriculum tree for a program using recursive CTE.
        Returns nodes ordered by depth and position.
        """
        # For SQLite compatibility, use Django ORM with prefetch
        # For PostgreSQL, we could use raw SQL with recursive CTE
        nodes = CurriculumNode.objects.filter(
            program_id=program_id
        ).select_related('parent').order_by('position')
        
        return self._build_tree(list(nodes))

    def _build_tree(self, nodes: List[CurriculumNode]) -> List[CurriculumNode]:
        """Build hierarchical tree structure from flat list."""
        node_map = {node.pk: node for node in nodes}
        roots = []
        
        for node in nodes:
            node._children_cache = []
        
        for node in nodes:
            if node.parent_id is None:
                roots.append(node)
            elif node.parent_id in node_map:
                parent = node_map[node.parent_id]
                parent._children_cache.append(node)
        
        return roots

    def get_subtree(self, node_id: int) -> List[CurriculumNode]:
        """
        Get a node and all its descendants.
        """
        try:
            root = CurriculumNode.objects.get(pk=node_id)
        except CurriculumNode.DoesNotExist:
            return []
        
        descendants = [root]
        descendants.extend(root.get_descendants())
        return descendants

    def get_ancestors(self, node_id: int) -> List[CurriculumNode]:
        """
        Get all ancestors of a node (for breadcrumb paths).
        Returns list from root to immediate parent.
        """
        try:
            node = CurriculumNode.objects.get(pk=node_id)
        except CurriculumNode.DoesNotExist:
            return []
        
        return node.get_ancestors()

    def move_node(self, node_id: int, new_parent_id: Optional[int]) -> CurriculumNode:
        """
        Move a node to a new parent.
        Validates that the move doesn't exceed blueprint hierarchy depth.
        """
        node = CurriculumNode.objects.select_related('program__blueprint').get(pk=node_id)
        
        # Calculate new depth
        if new_parent_id is None:
            new_depth = 0
        else:
            new_parent = CurriculumNode.objects.get(pk=new_parent_id)
            new_depth = new_parent.get_depth() + 1
        
        # Check against blueprint hierarchy depth
        if node.program and node.program.blueprint:
            max_depth = node.program.blueprint.get_hierarchy_depth()
            
            # Calculate subtree depth
            subtree_depth = self._get_subtree_depth(node)
            total_depth = new_depth + subtree_depth
            
            if total_depth >= max_depth:
                raise MaxDepthExceededException(
                    f"Moving node would exceed maximum depth. "
                    f"New depth: {new_depth}, subtree depth: {subtree_depth}, max: {max_depth - 1}"
                )
        
        # Perform the move
        node.parent_id = new_parent_id
        node.save(skip_validation=True)
        
        return node

    def _get_subtree_depth(self, node: CurriculumNode) -> int:
        """Get the maximum depth of the subtree rooted at node."""
        max_depth = 0
        for child in node.children.all():
            child_depth = 1 + self._get_subtree_depth(child)
            max_depth = max(max_depth, child_depth)
        return max_depth

    def reorder_siblings(self, node_ids: List[int]) -> List[CurriculumNode]:
        """
        Reorder sibling nodes by updating their position field.
        node_ids should be in the desired order.
        """
        nodes = []
        for position, node_id in enumerate(node_ids):
            node = CurriculumNode.objects.get(pk=node_id)
            node.position = position
            node.save(skip_validation=True)
            nodes.append(node)
        
        return nodes

    def get_siblings(self, node_id: int) -> QuerySet:
        """Get all siblings of a node (same parent)."""
        node = CurriculumNode.objects.get(pk=node_id)
        return CurriculumNode.objects.filter(
            program=node.program,
            parent=node.parent
        ).exclude(pk=node_id).order_by('position')
