"""
Progression Engine services.
Handles sequential locking, prerequisite checking, and progress calculation.
"""
from dataclasses import dataclass
from typing import Optional, List, Set
from django.utils import timezone

from apps.curriculum.models import CurriculumNode
from apps.progression.models import NodeCompletion, Enrollment


@dataclass
class AccessResult:
    """Result of an access check for a curriculum node."""
    can_access: bool
    status: str  # 'unlocked', 'locked', 'completed'
    lock_reason: Optional[str] = None  # 'sequential', 'prerequisite'
    blocking_nodes: Optional[List[int]] = None


class SequentialLockChecker:
    """
    Checks sequential locking rules for curriculum nodes.
    Requirements: 1.1, 1.2
    """

    def is_unlocked(
        self, 
        enrollment: Enrollment, 
        node: CurriculumNode, 
        completed_ids: Set[int]
    ) -> AccessResult:
        """
        Check if a node is unlocked under sequential locking rules.
        A node is unlocked if it's the first uncompleted sibling by position.
        
        Args:
            enrollment: The student's enrollment
            node: The node to check access for
            completed_ids: Set of completed node IDs for this enrollment
            
        Returns:
            AccessResult indicating if access is allowed
        """
        # Get siblings ordered by position
        siblings = CurriculumNode.objects.filter(
            program=node.program,
            parent=node.parent
        ).order_by('position')
        
        for sibling in siblings:
            if sibling.id == node.id:
                # We reached the target node without finding uncompleted siblings
                return AccessResult(can_access=True, status='unlocked')
            if sibling.id not in completed_ids:
                # Found an uncompleted sibling before target node
                return AccessResult(
                    can_access=False,
                    status='locked',
                    lock_reason='sequential',
                    blocking_nodes=[sibling.id]
                )
        
        return AccessResult(can_access=True, status='unlocked')

    def get_first_uncompleted_sibling(
        self, 
        node: CurriculumNode, 
        completed_ids: Set[int]
    ) -> Optional[CurriculumNode]:
        """
        Get the first uncompleted sibling node by position.
        
        Args:
            node: The reference node
            completed_ids: Set of completed node IDs
            
        Returns:
            The first uncompleted sibling, or None if all are completed
        """
        siblings = CurriculumNode.objects.filter(
            program=node.program,
            parent=node.parent
        ).order_by('position')
        
        for sibling in siblings:
            if sibling.id not in completed_ids:
                return sibling
        return None
