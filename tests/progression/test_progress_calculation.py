"""
Property tests for Progress Calculation.
Tests progress formula, subtree scoping, container exclusion, and program completion.
"""
import pytest
from hypothesis import given, strategies as st, settings, assume
from django.utils import timezone

from apps.progression.services import ProgressCalculator, ProgressionEngine
from apps.progression.models import NodeCompletion

pytestmark = pytest.mark.django_db(transaction=True)


def _make_program_with_nodes(num_completable: int, num_containers: int = 0):
    """
    Helper to create a program with completable and container nodes.
    
    Args:
        num_completable: Number of completable nodes
        num_containers: Number of container nodes (not completable)
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
        progression_rules={'sequential': False}
    )
    
    program = Program.objects.create(
        name=f'Test Program {timestamp}',
        blueprint=blueprint,
        is_published=True
    )
    
    completable_nodes = []
    container_nodes = []
    
    # Create container nodes first
    for i in range(num_containers):
        node = CurriculumNode.objects.create(
            program=program,
            node_type='Unit',
            title=f'Container {i + 1}',
            position=i,
            completion_rules={'is_completable': False}
        )
        container_nodes.append(node)
    
    # Create completable nodes
    for i in range(num_completable):
        node = CurriculumNode.objects.create(
            program=program,
            node_type='Session',
            title=f'Session {i + 1}',
            position=num_containers + i,
            completion_rules={'type': 'view', 'is_completable': True}
        )
        completable_nodes.append(node)
    
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
        'completable_nodes': completable_nodes,
        'container_nodes': container_nodes,
        'program': program,
        'blueprint': blueprint
    }


def _make_program_with_subtree():
    """Helper to create a program with a subtree structure."""
    from apps.core.models import User, Program
    from apps.blueprints.models import AcademicBlueprint
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment
    
    timestamp = timezone.now().timestamp()
    
    blueprint = AcademicBlueprint.objects.create(
        name=f'Test Blueprint {timestamp}',
        hierarchy_structure=['Year', 'Unit', 'Session'],
        grading_logic={'type': 'weighted', 'components': []},
        progression_rules={'sequential': False}
    )
    
    program = Program.objects.create(
        name=f'Test Program {timestamp}',
        blueprint=blueprint,
        is_published=True
    )
    
    # Create root container
    root = CurriculumNode.objects.create(
        program=program,
        node_type='Year',
        title='Year 1',
        position=0,
        completion_rules={'is_completable': False}
    )
    
    # Create two units under root
    unit1 = CurriculumNode.objects.create(
        program=program,
        parent=root,
        node_type='Unit',
        title='Unit 1',
        position=0,
        completion_rules={'is_completable': False}
    )
    
    unit2 = CurriculumNode.objects.create(
        program=program,
        parent=root,
        node_type='Unit',
        title='Unit 2',
        position=1,
        completion_rules={'is_completable': False}
    )
    
    # Create sessions under each unit
    unit1_sessions = []
    for i in range(3):
        session = CurriculumNode.objects.create(
            program=program,
            parent=unit1,
            node_type='Session',
            title=f'Unit 1 Session {i + 1}',
            position=i,
            completion_rules={'type': 'view', 'is_completable': True}
        )
        unit1_sessions.append(session)
    
    unit2_sessions = []
    for i in range(2):
        session = CurriculumNode.objects.create(
            program=program,
            parent=unit2,
            node_type='Session',
            title=f'Unit 2 Session {i + 1}',
            position=i,
            completion_rules={'type': 'view', 'is_completable': True}
        )
        unit2_sessions.append(session)
    
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
        'root': root,
        'unit1': unit1,
        'unit2': unit2,
        'unit1_sessions': unit1_sessions,
        'unit2_sessions': unit2_sessions,
        'program': program
    }


class TestProgressCalculationFormula:
    """
    **Feature: progression-engine, Property 9: Progress Calculation Formula**
    **Validates: Requirements 4.1**
    
    *For any* program, progress SHALL be (completed nodes / total completable nodes) × 100.
    """

    @given(
        num_completable=st.integers(min_value=1, max_value=10),
        num_completed=st.integers(min_value=0, max_value=10)
    )
    @settings(max_examples=100, deadline=None)
    def test_progress_formula_correct(self, num_completable, num_completed):
        """Progress should equal (completed / total) * 100."""
        assume(num_completed <= num_completable)
        
        data = _make_program_with_nodes(num_completable)
        enrollment = data['enrollment']
        completable_nodes = data['completable_nodes']
        
        # Complete some nodes
        for i in range(num_completed):
            NodeCompletion.objects.create(
                enrollment=enrollment,
                node=completable_nodes[i],
                completed_at=timezone.now(),
                completion_type='view'
            )
        
        calculator = ProgressCalculator()
        progress = calculator.calculate(enrollment)
        
        expected = (num_completed / num_completable) * 100
        assert abs(progress - expected) < 0.01

    @given(num_completable=st.integers(min_value=1, max_value=10))
    @settings(max_examples=100, deadline=None)
    def test_zero_completions_is_zero_progress(self, num_completable):
        """No completions should result in 0% progress."""
        data = _make_program_with_nodes(num_completable)
        enrollment = data['enrollment']
        
        calculator = ProgressCalculator()
        progress = calculator.calculate(enrollment)
        
        assert progress == 0.0

    @given(num_completable=st.integers(min_value=1, max_value=10))
    @settings(max_examples=100, deadline=None)
    def test_all_completions_is_100_progress(self, num_completable):
        """All completions should result in 100% progress."""
        data = _make_program_with_nodes(num_completable)
        enrollment = data['enrollment']
        completable_nodes = data['completable_nodes']
        
        # Complete all nodes
        for node in completable_nodes:
            NodeCompletion.objects.create(
                enrollment=enrollment,
                node=node,
                completed_at=timezone.now(),
                completion_type='view'
            )
        
        calculator = ProgressCalculator()
        progress = calculator.calculate(enrollment)
        
        assert progress == 100.0


class TestProgressSubtreeScoping:
    """
    **Feature: progression-engine, Property 10: Progress Subtree Scoping**
    **Validates: Requirements 4.2**
    
    *For any* subtree, progress calculation SHALL only count nodes within that subtree.
    """

    @given(
        unit1_completed=st.integers(min_value=0, max_value=3),
        unit2_completed=st.integers(min_value=0, max_value=2)
    )
    @settings(max_examples=100, deadline=None)
    def test_subtree_progress_only_counts_subtree_nodes(
        self, unit1_completed, unit2_completed
    ):
        """Subtree progress should only count nodes in that subtree."""
        data = _make_program_with_subtree()
        enrollment = data['enrollment']
        unit1 = data['unit1']
        unit1_sessions = data['unit1_sessions']
        unit2_sessions = data['unit2_sessions']
        
        # Complete some nodes in each unit
        for i in range(unit1_completed):
            NodeCompletion.objects.create(
                enrollment=enrollment,
                node=unit1_sessions[i],
                completed_at=timezone.now(),
                completion_type='view'
            )
        
        for i in range(unit2_completed):
            NodeCompletion.objects.create(
                enrollment=enrollment,
                node=unit2_sessions[i],
                completed_at=timezone.now(),
                completion_type='view'
            )
        
        calculator = ProgressCalculator()
        
        # Calculate progress for unit1 subtree only
        unit1_progress = calculator.calculate(enrollment, subtree_root=unit1)
        
        # Should only count unit1 sessions (3 total)
        expected_unit1 = (unit1_completed / 3) * 100
        assert abs(unit1_progress - expected_unit1) < 0.01


class TestContainerNodeExclusion:
    """
    **Feature: progression-engine, Property 11: Container Node Exclusion**
    **Validates: Requirements 4.3**
    
    *For any* container node (not completable), it SHALL be excluded from progress calculation.
    """

    @given(
        num_completable=st.integers(min_value=1, max_value=8),
        num_containers=st.integers(min_value=1, max_value=4),
        num_completed=st.integers(min_value=0, max_value=8)
    )
    @settings(max_examples=100, deadline=None)
    def test_containers_excluded_from_progress(
        self, num_completable, num_containers, num_completed
    ):
        """Container nodes should not affect progress calculation."""
        assume(num_completed <= num_completable)
        
        data = _make_program_with_nodes(num_completable, num_containers)
        enrollment = data['enrollment']
        completable_nodes = data['completable_nodes']
        
        # Complete some completable nodes
        for i in range(num_completed):
            NodeCompletion.objects.create(
                enrollment=enrollment,
                node=completable_nodes[i],
                completed_at=timezone.now(),
                completion_type='view'
            )
        
        calculator = ProgressCalculator()
        progress = calculator.calculate(enrollment)
        
        # Progress should be based only on completable nodes
        expected = (num_completed / num_completable) * 100
        assert abs(progress - expected) < 0.01

    @given(num_containers=st.integers(min_value=1, max_value=5))
    @settings(max_examples=100, deadline=None)
    def test_only_containers_gives_100_progress(self, num_containers):
        """Program with only containers should show 100% progress."""
        data = _make_program_with_nodes(0, num_containers)
        enrollment = data['enrollment']
        
        calculator = ProgressCalculator()
        progress = calculator.calculate(enrollment)
        
        assert progress == 100.0


class TestProgramCompletion:
    """
    **Feature: progression-engine, Property 12: Program Completion at 100%**
    **Validates: Requirements 4.4**
    
    *For any* enrollment, when progress reaches 100%, the enrollment SHALL be marked as completed.
    """

    @given(num_completable=st.integers(min_value=1, max_value=5))
    @settings(max_examples=100, deadline=None)
    def test_100_progress_marks_enrollment_completed(self, num_completable):
        """Completing all nodes should mark enrollment as completed."""
        data = _make_program_with_nodes(num_completable)
        enrollment = data['enrollment']
        completable_nodes = data['completable_nodes']
        
        engine = ProgressionEngine()
        
        # Complete all nodes using the engine
        for node in completable_nodes:
            engine.mark_complete(enrollment, node, 'view')
        
        # Refresh enrollment from database
        enrollment.refresh_from_db()
        
        assert enrollment.status == 'completed'
        assert enrollment.completed_at is not None

    @given(
        num_completable=st.integers(min_value=2, max_value=5),
        num_completed=st.integers(min_value=0, max_value=4)
    )
    @settings(max_examples=100, deadline=None)
    def test_partial_progress_keeps_enrollment_active(self, num_completable, num_completed):
        """Partial completion should keep enrollment active."""
        assume(num_completed < num_completable)
        
        data = _make_program_with_nodes(num_completable)
        enrollment = data['enrollment']
        completable_nodes = data['completable_nodes']
        
        engine = ProgressionEngine()
        
        # Complete only some nodes
        for i in range(num_completed):
            engine.mark_complete(enrollment, completable_nodes[i], 'view')
        
        # Refresh enrollment from database
        enrollment.refresh_from_db()
        
        assert enrollment.status == 'active'
