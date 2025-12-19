"""
Progression Engine services.
Handles sequential locking, prerequisite checking, and progress calculation.
"""
from dataclasses import dataclass
from typing import Optional, List, Set, Dict, Any
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


@dataclass
class ValidationResult:
    """Result of completion rules validation."""
    is_valid: bool
    errors: List[str]


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


class PrerequisiteLockChecker:
    """
    Checks prerequisite locking rules for curriculum nodes.
    Requirements: 2.1, 2.2, 2.3, 2.4
    """

    def are_prerequisites_met(
        self,
        node: CurriculumNode,
        completed_ids: Set[int]
    ) -> AccessResult:
        """
        Check if all prerequisites for a node are completed.
        
        Args:
            node: The node to check prerequisites for
            completed_ids: Set of completed node IDs
            
        Returns:
            AccessResult indicating if prerequisites are met
        """
        prerequisites = self._get_prerequisites(node)
        
        if not prerequisites:
            return AccessResult(can_access=True, status='unlocked')
        
        incomplete = [p for p in prerequisites if p not in completed_ids]
        
        if incomplete:
            return AccessResult(
                can_access=False,
                status='locked',
                lock_reason='prerequisite',
                blocking_nodes=incomplete
            )
        
        return AccessResult(can_access=True, status='unlocked')

    def get_incomplete_prerequisites(
        self,
        node: CurriculumNode,
        completed_ids: Set[int]
    ) -> List[int]:
        """
        Get list of incomplete prerequisite node IDs.
        
        Args:
            node: The node to check prerequisites for
            completed_ids: Set of completed node IDs
            
        Returns:
            List of incomplete prerequisite node IDs
        """
        prerequisites = self._get_prerequisites(node)
        return [p for p in prerequisites if p not in completed_ids]

    def _get_prerequisites(self, node: CurriculumNode) -> List[int]:
        """Extract prerequisites from node's completion_rules."""
        if not node.completion_rules:
            return []
        return node.completion_rules.get('prerequisites', [])


class ProgressCalculator:
    """
    Calculates progress percentage for enrollments.
    Requirements: 4.1, 4.2, 4.3, 4.4
    """

    def calculate(
        self,
        enrollment: Enrollment,
        subtree_root: Optional[CurriculumNode] = None
    ) -> float:
        """
        Calculate progress percentage for an enrollment.
        
        Args:
            enrollment: The enrollment to calculate progress for
            subtree_root: Optional root node to scope calculation to subtree
            
        Returns:
            Progress percentage (0.0 to 100.0)
        """
        if subtree_root:
            all_nodes = self.get_subtree_nodes(subtree_root)
        else:
            all_nodes = list(enrollment.program.curriculum_nodes.all())
        
        completable_nodes = self.get_completable_nodes(all_nodes)
        
        if not completable_nodes:
            return 100.0
        
        completable_ids = [n.id for n in completable_nodes]
        completed_count = NodeCompletion.objects.filter(
            enrollment=enrollment,
            node_id__in=completable_ids
        ).count()
        
        return (completed_count / len(completable_nodes)) * 100

    def get_completable_nodes(self, nodes: List[CurriculumNode]) -> List[CurriculumNode]:
        """
        Filter nodes to only those that are completable (not containers).
        
        Args:
            nodes: List of nodes to filter
            
        Returns:
            List of completable nodes
        """
        completable = []
        for node in nodes:
            if node.completion_rules:
                if node.completion_rules.get('is_completable', True):
                    completable.append(node)
            else:
                # Nodes without completion_rules are not completable (containers)
                pass
        return completable

    def get_subtree_nodes(self, root: CurriculumNode) -> List[CurriculumNode]:
        """
        Get all nodes in a subtree including the root.
        
        Args:
            root: The root node of the subtree
            
        Returns:
            List of all nodes in the subtree
        """
        nodes = [root]
        for child in root.children.all():
            nodes.extend(self.get_subtree_nodes(child))
        return nodes


class CompletionTriggerHandler:
    """
    Handles different completion trigger types.
    Requirements: 3.2, 3.3, 3.4
    """

    def can_complete(
        self,
        node: CurriculumNode,
        trigger_type: str,
        trigger_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Check if a node can be completed based on trigger type.
        
        Args:
            node: The node to check
            trigger_type: The type of trigger ('view', 'quiz_pass', 'upload')
            trigger_data: Additional data for the trigger (e.g., quiz score)
            
        Returns:
            True if the node can be completed
        """
        if not node.completion_rules:
            return False
        
        required_type = node.completion_rules.get('type', 'view')
        
        if trigger_type != required_type:
            return False
        
        if trigger_type == 'view':
            return True
        
        if trigger_type == 'quiz_pass':
            return self._check_quiz_pass(node, trigger_data)
        
        if trigger_type == 'upload':
            return self._check_upload(trigger_data)
        
        return False

    def _check_quiz_pass(
        self,
        node: CurriculumNode,
        trigger_data: Optional[Dict[str, Any]]
    ) -> bool:
        """Check if quiz pass requirements are met."""
        if not trigger_data:
            return False
        
        min_score = node.completion_rules.get('min_score', 0)
        actual_score = trigger_data.get('score', 0)
        
        return actual_score >= min_score

    def _check_upload(self, trigger_data: Optional[Dict[str, Any]]) -> bool:
        """Check if upload requirements are met."""
        if not trigger_data:
            return False
        
        return trigger_data.get('file_uploaded', False)


class CompletionRulesValidator:
    """
    Validates completion rules configuration.
    Requirements: 6.1, 6.2, 6.3
    """

    def validate(
        self,
        completion_rules: Dict[str, Any],
        program_node_ids: Set[int]
    ) -> ValidationResult:
        """
        Validate completion rules configuration.
        
        Args:
            completion_rules: The completion rules to validate
            program_node_ids: Set of valid node IDs in the program
            
        Returns:
            ValidationResult with is_valid and errors
        """
        errors = []
        
        if not completion_rules:
            return ValidationResult(is_valid=True, errors=[])
        
        completion_type = completion_rules.get('type')
        
        # Validate quiz_pass type has quiz_id
        if completion_type == 'quiz_pass':
            if 'quiz_id' not in completion_rules:
                errors.append("quiz_pass type requires quiz_id to be specified")
        
        # Validate prerequisites exist
        prerequisites = completion_rules.get('prerequisites', [])
        for prereq_id in prerequisites:
            if prereq_id not in program_node_ids:
                errors.append(f"Prerequisite node {prereq_id} does not exist in program")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )


class ProgressionEngine:
    """
    Main service combining all progression checks.
    Requirements: 1.3, 3.1, 5.1, 5.2
    """

    def __init__(
        self,
        sequential_checker: Optional[SequentialLockChecker] = None,
        prerequisite_checker: Optional[PrerequisiteLockChecker] = None,
        progress_calculator: Optional[ProgressCalculator] = None,
        completion_handler: Optional[CompletionTriggerHandler] = None
    ):
        self.sequential_checker = sequential_checker or SequentialLockChecker()
        self.prerequisite_checker = prerequisite_checker or PrerequisiteLockChecker()
        self.progress_calculator = progress_calculator or ProgressCalculator()
        self.completion_handler = completion_handler or CompletionTriggerHandler()

    def can_access(
        self,
        enrollment: Enrollment,
        node: CurriculumNode
    ) -> AccessResult:
        """
        Check if a student can access a node.
        Combines sequential and prerequisite checks.
        
        Args:
            enrollment: The student's enrollment
            node: The node to check access for
            
        Returns:
            AccessResult indicating if access is allowed
        """
        # Check if already completed
        if NodeCompletion.objects.filter(enrollment=enrollment, node=node).exists():
            return AccessResult(can_access=True, status='completed')
        
        completed_ids = set(NodeCompletion.objects.filter(
            enrollment=enrollment
        ).values_list('node_id', flat=True))
        
        # Check sequential lock
        progression_rules = {}
        if enrollment.program.blueprint:
            progression_rules = enrollment.program.blueprint.progression_rules or {}
        
        if progression_rules.get('sequential', True):
            seq_result = self.sequential_checker.is_unlocked(
                enrollment, node, completed_ids
            )
            if not seq_result.can_access:
                return seq_result
        
        # Check prerequisites (always checked, even if sequential is disabled)
        prereq_result = self.prerequisite_checker.are_prerequisites_met(
            node, completed_ids
        )
        if not prereq_result.can_access:
            return prereq_result
        
        return AccessResult(can_access=True, status='unlocked')

    def mark_complete(
        self,
        enrollment: Enrollment,
        node: CurriculumNode,
        completion_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> NodeCompletion:
        """
        Mark a node as complete for an enrollment.
        Uses get_or_create for idempotency.
        
        Args:
            enrollment: The student's enrollment
            node: The node to mark complete
            completion_type: Type of completion
            metadata: Optional metadata for the completion
            
        Returns:
            The NodeCompletion record
        """
        completion, created = NodeCompletion.objects.get_or_create(
            enrollment=enrollment,
            node=node,
            defaults={
                'completed_at': timezone.now(),
                'completion_type': completion_type,
                'metadata': metadata
            }
        )
        
        # Check for program completion
        if self.check_program_completion(enrollment):
            enrollment.status = 'completed'
            enrollment.completed_at = timezone.now()
            enrollment.save()
        
        return completion

    def get_unlock_status(
        self,
        enrollment: Enrollment
    ) -> List[Dict[str, Any]]:
        """
        Get unlock status for all nodes in a program.
        
        Args:
            enrollment: The student's enrollment
            
        Returns:
            List of status dicts for each node
        """
        nodes = list(enrollment.program.curriculum_nodes.all())
        completed_ids = set(NodeCompletion.objects.filter(
            enrollment=enrollment
        ).values_list('node_id', flat=True))
        
        statuses = []
        for node in nodes:
            if node.id in completed_ids:
                statuses.append({
                    'node_id': node.id,
                    'status': 'completed',
                    'lock_reason': None,
                    'blocking_nodes': None
                })
            else:
                result = self.can_access(enrollment, node)
                statuses.append({
                    'node_id': node.id,
                    'status': result.status,
                    'lock_reason': result.lock_reason,
                    'blocking_nodes': result.blocking_nodes
                })
        
        return statuses

    def calculate_progress(
        self,
        enrollment: Enrollment,
        subtree_root: Optional[CurriculumNode] = None
    ) -> float:
        """
        Calculate progress percentage for an enrollment.
        
        Args:
            enrollment: The enrollment to calculate progress for
            subtree_root: Optional root node to scope calculation
            
        Returns:
            Progress percentage (0.0 to 100.0)
        """
        return self.progress_calculator.calculate(enrollment, subtree_root)

    def check_program_completion(self, enrollment: Enrollment) -> bool:
        """
        Check if a program is complete (100% progress).
        
        Args:
            enrollment: The enrollment to check
            
        Returns:
            True if program is complete
        """
        return self.calculate_progress(enrollment) >= 100.0
