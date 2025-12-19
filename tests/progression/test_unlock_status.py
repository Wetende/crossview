"""
Property tests for Unlock Status Query.
Tests unlock status completeness and lock reason inclusion.
"""
import pytest
from hypothesis import given, strategies as st, settings, assume
from django.utils import timezone

from apps.progression.services import ProgressionEngine
from apps.progression.models import NodeCompletion

pytestmark = pytest.mark.django_db(transaction=True)


def _make_program_with_mixed_nodes(num_nodes: int, sequential: bool = True):
    """
    Helper to create a program with nodes for unlock status testing.
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
        progression_rules={'sequential': sequential}
    )
    
    program = Program.objects.create(
        name=f'Test Program {timestamp}',
        blueprint=blueprint,
        is_published=True
    )
    
    # Create a parent container
    parent = CurriculumNode.objects.create(
        program=program,
        node_type='Unit',
        title='Test Unit',
        position=0,
        completion_rules={'is_completable': False}
    )
    
    nodes = []
    for i in range(num_nodes):
        node = CurriculumNode.objects.create(
            program=program,
            parent=parent,
            node_type='Session',
            title=f'Session {i + 1}',
            position=i,
            completion_rules={'type': 'view', 'is_completable': True}
        )
        nodes.append(node)
    
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
        'parent': parent,
        'program': program,
        'blueprint': blueprint
    }


class TestUnlockStatusCompleteness:
    """
    **Feature: progression-engine, Property 13: Unlock Status Completeness**
    **Validates: Requirements 5.1**
    
    *For any* program, get_unlock_status SHALL return status for every node.
    """

    @given(
        num_nodes=st.integers(min_value=1, max_value=8),
        num_completed=st.integers(min_value=0, max_value=7)
    )
    @settings(max_examples=100, deadline=None)
    def test_status_returned_for_all_nodes(self, num_nodes, num_completed):
        """Status should be returned for every node in the program."""
        assume(num_completed <= num_nodes)
        
        data = _make_program_with_mixed_nodes(num_nodes)
        enrollment = data['enrollment']
        nodes = data['nodes']
        parent = data['parent']
        
        # Complete some nodes
        for i in range(num_completed):
            NodeCompletion.objects.create(
                enrollment=enrollment,
                node=nodes[i],
                completed_at=timezone.now(),
                completion_type='view'
            )
        
        engine = ProgressionEngine()
        statuses = engine.get_unlock_status(enrollment)
        
        # Should have status for all nodes (including parent container)
        all_node_ids = {parent.id} | {n.id for n in nodes}
        status_node_ids = {s['node_id'] for s in statuses}
        
        assert status_node_ids == all_node_ids

    @given(num_nodes=st.integers(min_value=1, max_value=6))
    @settings(max_examples=100, deadline=None)
    def test_each_status_has_required_fields(self, num_nodes):
        """Each status entry should have node_id and status fields."""
        data = _make_program_with_mixed_nodes(num_nodes)
        enrollment = data['enrollment']
        
        engine = ProgressionEngine()
        statuses = engine.get_unlock_status(enrollment)
        
        for status in statuses:
            assert 'node_id' in status
            assert 'status' in status
            assert status['status'] in ['locked', 'unlocked', 'completed']

    @given(
        num_nodes=st.integers(min_value=2, max_value=6),
        num_completed=st.integers(min_value=0, max_value=5)
    )
    @settings(max_examples=100, deadline=None)
    def test_completed_nodes_have_completed_status(self, num_nodes, num_completed):
        """Completed nodes should have 'completed' status."""
        assume(num_completed <= num_nodes)
        
        data = _make_program_with_mixed_nodes(num_nodes)
        enrollment = data['enrollment']
        nodes = data['nodes']
        
        completed_ids = set()
        for i in range(num_completed):
            NodeCompletion.objects.create(
                enrollment=enrollment,
                node=nodes[i],
                completed_at=timezone.now(),
                completion_type='view'
            )
            completed_ids.add(nodes[i].id)
        
        engine = ProgressionEngine()
        statuses = engine.get_unlock_status(enrollment)
        
        for status in statuses:
            if status['node_id'] in completed_ids:
                assert status['status'] == 'completed'


class TestLockReasonIncluded:
    """
    **Feature: progression-engine, Property 14: Lock Reason Included**
    **Validates: Requirements 5.2**
    
    *For any* locked node, the status SHALL include lock_reason and blocking_nodes.
    """

    @given(
        num_nodes=st.integers(min_value=3, max_value=6),
        target_idx=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=100, deadline=None)
    def test_sequential_lock_includes_reason(self, num_nodes, target_idx):
        """Sequentially locked nodes should include lock reason."""
        assume(target_idx < num_nodes)
        
        data = _make_program_with_mixed_nodes(num_nodes, sequential=True)
        enrollment = data['enrollment']
        nodes = data['nodes']
        
        engine = ProgressionEngine()
        statuses = engine.get_unlock_status(enrollment)
        
        # Find status for target node (should be locked)
        target_status = next(
            s for s in statuses if s['node_id'] == nodes[target_idx].id
        )
        
        assert target_status['status'] == 'locked'
        assert target_status['lock_reason'] == 'sequential'
        assert target_status['blocking_nodes'] is not None
        assert len(target_status['blocking_nodes']) > 0

    @given(num_nodes=st.integers(min_value=2, max_value=5))
    @settings(max_examples=100, deadline=None)
    def test_prerequisite_lock_includes_reason(self, num_nodes):
        """Prerequisite locked nodes should include lock reason."""
        from apps.core.models import User, Program
        from apps.blueprints.models import AcademicBlueprint
        from apps.curriculum.models import CurriculumNode
        from apps.progression.models import Enrollment
        
        timestamp = timezone.now().timestamp()
        
        blueprint = AcademicBlueprint.objects.create(
            name=f'Test Blueprint {timestamp}',
            hierarchy_structure=['Year', 'Unit', 'Session'],
            grading_logic={'type': 'weighted', 'components': []},
            progression_rules={'sequential': False}  # Disable sequential
        )
        
        program = Program.objects.create(
            name=f'Test Program {timestamp}',
            blueprint=blueprint,
            is_published=True
        )
        
        # Create prerequisite node
        prereq_node = CurriculumNode.objects.create(
            program=program,
            node_type='Session',
            title='Prerequisite Session',
            position=0,
            completion_rules={'type': 'view', 'is_completable': True}
        )
        
        # Create dependent node with prerequisite
        dependent_node = CurriculumNode.objects.create(
            program=program,
            node_type='Session',
            title='Dependent Session',
            position=1,
            completion_rules={
                'type': 'view',
                'is_completable': True,
                'prerequisites': [prereq_node.id]
            }
        )
        
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
        
        engine = ProgressionEngine()
        statuses = engine.get_unlock_status(enrollment)
        
        # Find status for dependent node
        dependent_status = next(
            s for s in statuses if s['node_id'] == dependent_node.id
        )
        
        assert dependent_status['status'] == 'locked'
        assert dependent_status['lock_reason'] == 'prerequisite'
        assert dependent_status['blocking_nodes'] == [prereq_node.id]

    @given(num_nodes=st.integers(min_value=1, max_value=5))
    @settings(max_examples=100, deadline=None)
    def test_unlocked_nodes_have_no_lock_reason(self, num_nodes):
        """Unlocked nodes should have null lock_reason."""
        data = _make_program_with_mixed_nodes(num_nodes, sequential=False)
        enrollment = data['enrollment']
        
        engine = ProgressionEngine()
        statuses = engine.get_unlock_status(enrollment)
        
        for status in statuses:
            if status['status'] == 'unlocked':
                assert status['lock_reason'] is None
