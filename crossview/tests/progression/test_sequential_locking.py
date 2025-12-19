"""
Property tests for Sequential Locking.
Tests sequential unlock progression, lock denial, and disabled sequential mode.
"""
import pytest
from hypothesis import given, strategies as st, settings, assume
from django.utils import timezone

from apps.progression.services import SequentialLockChecker

pytestmark = pytest.mark.django_db(transaction=True)


def _make_program_with_siblings(num_siblings: int, sequential: bool = True):
    """Helper to create a program with multiple sibling nodes for sequential testing."""
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
    
    parent_node = CurriculumNode.objects.create(
        program=program,
        node_type='Unit',
        title='Test Unit',
        position=0,
        completion_rules={'is_completable': False}
    )
    
    siblings = []
    for i in range(num_siblings):
        node = CurriculumNode.objects.create(
            program=program,
            parent=parent_node,
            node_type='Session',
            title=f'Session {i + 1}',
            position=i,
            completion_rules={'type': 'view', 'is_completable': True}
        )
        siblings.append(node)
    
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
        'siblings': siblings,
        'parent': parent_node,
        'program': program,
        'blueprint': blueprint
    }


class TestSequentialUnlockProgression:
    """
    **Feature: progression-engine, Property 1: Sequential Unlock Progression**
    **Validates: Requirements 1.1, 1.2**
    """

    @given(
        num_siblings=st.integers(min_value=2, max_value=8),
        completed_count=st.integers(min_value=0, max_value=7)
    )
    @settings(max_examples=100, deadline=None)
    def test_first_uncompleted_is_unlocked(self, num_siblings, completed_count):
        assume(completed_count < num_siblings)
        
        checker = SequentialLockChecker()
        data = create_program_with_siblings(num_siblings, sequential=True)
        siblings = data['siblings']
        enrollment = data['enrollment']
        
        completed_ids = set()
        for i in range(completed_count):
            completed_ids.add(siblings[i].id)
        
        first_uncompleted = siblings[completed_count]
        result = checker.is_unlocked(enrollment, first_uncompleted, completed_ids)
        
        assert result.can_access is True
        assert result.status == 'unlocked'

    @given(
        num_siblings=st.integers(min_value=3, max_value=8),
        completed_count=st.integers(min_value=0, max_value=5),
        target_offset=st.integers(min_value=2, max_value=6)
    )
    @settings(max_examples=100, deadline=None)
    def test_later_siblings_are_locked(self, num_siblings, completed_count, target_offset):
        assume(completed_count < num_siblings)
        assume(completed_count + target_offset < num_siblings)
        
        checker = SequentialLockChecker()
        data = create_program_with_siblings(num_siblings, sequential=True)
        siblings = data['siblings']
        enrollment = data['enrollment']
        
        completed_ids = set()
        for i in range(completed_count):
            completed_ids.add(siblings[i].id)
        
        target_idx = completed_count + target_offset
        target_node = siblings[target_idx]
        
        result = checker.is_unlocked(enrollment, target_node, completed_ids)
        
        assert result.can_access is False
        assert result.status == 'locked'
        assert result.lock_reason == 'sequential'
        assert result.blocking_nodes == [siblings[completed_count].id]


class TestSequentialLockDenial:
    """
    **Feature: progression-engine, Property 2: Sequential Lock Denial**
    **Validates: Requirements 1.3**
    """

    @given(
        num_siblings=st.integers(min_value=2, max_value=6),
        target_idx=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=100, deadline=None)
    def test_locked_node_identifies_blocker(self, num_siblings, target_idx):
        assume(target_idx < num_siblings)
        
        checker = SequentialLockChecker()
        data = create_program_with_siblings(num_siblings, sequential=True)
        siblings = data['siblings']
        enrollment = data['enrollment']
        
        completed_ids = set()
        target_node = siblings[target_idx]
        
        result = checker.is_unlocked(enrollment, target_node, completed_ids)
        
        assert result.can_access is False
        assert result.lock_reason == 'sequential'
        assert result.blocking_nodes is not None
        assert len(result.blocking_nodes) == 1
        assert result.blocking_nodes[0] == siblings[0].id


class TestSequentialDisabled:
    """
    **Feature: progression-engine, Property 3: Sequential Disabled Allows All**
    **Validates: Requirements 1.4**
    """

    @given(
        num_siblings=st.integers(min_value=2, max_value=8),
        target_idx=st.integers(min_value=0, max_value=7)
    )
    @settings(max_examples=100, deadline=None)
    def test_all_nodes_accessible_when_sequential_disabled(self, num_siblings, target_idx):
        assume(target_idx < num_siblings)
        
        checker = SequentialLockChecker()
        data = create_program_with_siblings(num_siblings, sequential=False)
        siblings = data['siblings']
        enrollment = data['enrollment']
        
        completed_ids = set()
        first_node = siblings[0]
        result = checker.is_unlocked(enrollment, first_node, completed_ids)
        assert result.can_access is True


class TestGetFirstUncompletedSibling:
    """Tests for get_first_uncompleted_sibling helper method."""

    @given(
        num_siblings=st.integers(min_value=2, max_value=8),
        completed_count=st.integers(min_value=0, max_value=7)
    )
    @settings(max_examples=100, deadline=None)
    def test_returns_correct_first_uncompleted(self, num_siblings, completed_count):
        assume(completed_count < num_siblings)
        
        checker = SequentialLockChecker()
        data = create_program_with_siblings(num_siblings, sequential=True)
        siblings = data['siblings']
        
        completed_ids = set()
        for i in range(completed_count):
            completed_ids.add(siblings[i].id)
        
        result = checker.get_first_uncompleted_sibling(siblings[0], completed_ids)
        
        assert result is not None
        assert result.id == siblings[completed_count].id

    @given(num_siblings=st.integers(min_value=1, max_value=5))
    @settings(max_examples=100, deadline=None)
    def test_returns_none_when_all_completed(self, num_siblings):
        checker = SequentialLockChecker()
        data = create_program_with_siblings(num_siblings, sequential=True)
        siblings = data['siblings']
        
        completed_ids = {s.id for s in siblings}
        result = checker.get_first_uncompleted_sibling(siblings[0], completed_ids)
        
        assert result is None
