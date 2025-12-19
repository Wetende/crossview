"""
Property tests for Prerequisite Locking.
Tests prerequisite unlock, re-lock detection.
"""
import pytest
from hypothesis import given, strategies as st, settings, assume
from django.utils import timezone

from apps.progression.services import PrerequisiteLockChecker

pytestmark = pytest.mark.django_db(transaction=True)


def _make_program_with_prerequisites(num_nodes: int, prereq_map: dict):
    """
    Helper to create a program with nodes and prerequisite relationships.
    
    Args:
        num_nodes: Number of nodes to create
        prereq_map: Dict mapping node index to list of prerequisite node indices
    """
    from apps.core.models import User, Program
    from apps.blueprints.models import AcademicBlueprint
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment
    
    timestamp = timezone.now().timestamp()
    
    blueprint = AcademicBlueprint.objects.create(
        name=f'Test Blueprint {timestamp}',
        hierarchy_structure=['Year', 'Unit', 'Session'],
        grading_logic={'type': 'weighted', 'components': []},
        progression_rules={'sequential': False}  # Disable sequential for prereq tests
    )
    
    program = Program.objects.create(
        name=f'Test Program {timestamp}',
        blueprint=blueprint,
        is_published=True
    )
    
    # Create nodes first without prerequisites
    nodes = []
    for i in range(num_nodes):
        node = CurriculumNode.objects.create(
            program=program,
            node_type='Session',
            title=f'Session {i + 1}',
            position=i,
            completion_rules={'type': 'view', 'is_completable': True}
        )
        nodes.append(node)
    
    # Update nodes with prerequisites (using actual IDs)
    for node_idx, prereq_indices in prereq_map.items():
        if node_idx < len(nodes):
            prereq_ids = [nodes[i].id for i in prereq_indices if i < len(nodes)]
            nodes[node_idx].completion_rules = {
                'type': 'view',
                'is_completable': True,
                'prerequisites': prereq_ids
            }
            nodes[node_idx].save()
    
    user = User.objects.create_user(
        username=f'testuser_{timestamp}',
        email=f'test_{timestamp}@example.com',
        password='testpass123'
    )
    
    enrollment = Enrollment.objects.create(
        user=user,
        program=program,
        status='active'
    )
    
    return {
        'enrollment': enrollment,
        'nodes': nodes,
        'program': program,
        'blueprint': blueprint
    }


class TestPrerequisiteUnlock:
    """
    **Feature: progression-engine, Property 4: Prerequisite Unlock**
    **Validates: Requirements 2.1, 2.2, 2.3**
    
    *For any* node with prerequisites, the node SHALL be unlocked 
    if and only if ALL prerequisite nodes are completed.
    """

    @given(
        num_nodes=st.integers(min_value=3, max_value=6),
        prereq_count=st.integers(min_value=1, max_value=3)
    )
    @settings(max_examples=100, deadline=None)
    def test_all_prerequisites_completed_unlocks_node(self, num_nodes, prereq_count):
        """When all prerequisites are completed, node should be unlocked."""
        assume(prereq_count < num_nodes - 1)
        
        # Node at index num_nodes-1 has prerequisites at indices 0 to prereq_count-1
        prereq_indices = list(range(prereq_count))
        prereq_map = {num_nodes - 1: prereq_indices}
        
        data = _make_program_with_prerequisites(num_nodes, prereq_map)
        nodes = data['nodes']
        target_node = nodes[-1]
        
        # Complete all prerequisites
        completed_ids = {nodes[i].id for i in prereq_indices}
        
        checker = PrerequisiteLockChecker()
        result = checker.are_prerequisites_met(target_node, completed_ids)
        
        assert result.can_access is True
        assert result.status == 'unlocked'

    @given(
        num_nodes=st.integers(min_value=3, max_value=6),
        prereq_count=st.integers(min_value=2, max_value=4),
        incomplete_count=st.integers(min_value=1, max_value=3)
    )
    @settings(max_examples=100, deadline=None)
    def test_incomplete_prerequisites_locks_node(self, num_nodes, prereq_count, incomplete_count):
        """When any prerequisite is incomplete, node should be locked."""
        assume(prereq_count < num_nodes - 1)
        assume(incomplete_count <= prereq_count)
        
        prereq_indices = list(range(prereq_count))
        prereq_map = {num_nodes - 1: prereq_indices}
        
        data = _make_program_with_prerequisites(num_nodes, prereq_map)
        nodes = data['nodes']
        target_node = nodes[-1]
        
        # Complete only some prerequisites
        completed_count = prereq_count - incomplete_count
        completed_ids = {nodes[i].id for i in range(completed_count)}
        
        checker = PrerequisiteLockChecker()
        result = checker.are_prerequisites_met(target_node, completed_ids)
        
        assert result.can_access is False
        assert result.status == 'locked'
        assert result.lock_reason == 'prerequisite'
        assert result.blocking_nodes is not None
        assert len(result.blocking_nodes) == incomplete_count

    @given(num_nodes=st.integers(min_value=2, max_value=5))
    @settings(max_examples=100, deadline=None)
    def test_no_prerequisites_always_unlocked(self, num_nodes):
        """Nodes without prerequisites should always be unlocked."""
        data = _make_program_with_prerequisites(num_nodes, {})
        nodes = data['nodes']
        
        checker = PrerequisiteLockChecker()
        
        for node in nodes:
            result = checker.are_prerequisites_met(node, set())
            assert result.can_access is True
            assert result.status == 'unlocked'


class TestPrerequisiteRelock:
    """
    **Feature: progression-engine, Property 5: Prerequisite Re-lock**
    **Validates: Requirements 2.4**
    
    *For any* node that was unlocked via prerequisites, if any prerequisite 
    becomes un-completed, the node SHALL become locked again.
    """

    @given(
        num_nodes=st.integers(min_value=3, max_value=5),
        prereq_count=st.integers(min_value=1, max_value=3)
    )
    @settings(max_examples=100, deadline=None)
    def test_removing_prerequisite_relocks_node(self, num_nodes, prereq_count):
        """Removing a prerequisite completion should re-lock the dependent node."""
        assume(prereq_count < num_nodes - 1)
        
        prereq_indices = list(range(prereq_count))
        prereq_map = {num_nodes - 1: prereq_indices}
        
        data = _make_program_with_prerequisites(num_nodes, prereq_map)
        nodes = data['nodes']
        target_node = nodes[-1]
        
        checker = PrerequisiteLockChecker()
        
        # Initially all prerequisites completed - should be unlocked
        completed_ids = {nodes[i].id for i in prereq_indices}
        result1 = checker.are_prerequisites_met(target_node, completed_ids)
        assert result1.can_access is True
        
        # Remove one prerequisite - should be locked
        removed_prereq = nodes[0].id
        completed_ids.discard(removed_prereq)
        result2 = checker.are_prerequisites_met(target_node, completed_ids)
        
        assert result2.can_access is False
        assert result2.lock_reason == 'prerequisite'
        assert removed_prereq in result2.blocking_nodes


class TestGetIncompletePrerequisites:
    """Tests for get_incomplete_prerequisites helper method."""

    @given(
        num_nodes=st.integers(min_value=3, max_value=6),
        prereq_count=st.integers(min_value=1, max_value=4),
        completed_count=st.integers(min_value=0, max_value=3)
    )
    @settings(max_examples=100, deadline=None)
    def test_returns_correct_incomplete_list(self, num_nodes, prereq_count, completed_count):
        """Should return exactly the incomplete prerequisite IDs."""
        assume(prereq_count < num_nodes - 1)
        assume(completed_count <= prereq_count)
        
        prereq_indices = list(range(prereq_count))
        prereq_map = {num_nodes - 1: prereq_indices}
        
        data = _make_program_with_prerequisites(num_nodes, prereq_map)
        nodes = data['nodes']
        target_node = nodes[-1]
        
        completed_ids = {nodes[i].id for i in range(completed_count)}
        expected_incomplete = [nodes[i].id for i in range(completed_count, prereq_count)]
        
        checker = PrerequisiteLockChecker()
        result = checker.get_incomplete_prerequisites(target_node, completed_ids)
        
        assert set(result) == set(expected_incomplete)
