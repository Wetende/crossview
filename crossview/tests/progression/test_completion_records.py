"""
Property tests for NodeCompletion model.
Tests completion record creation and idempotency.
"""
import pytest
from hypothesis import given, strategies as st, settings
from django.utils import timezone
from django.db import IntegrityError

pytestmark = pytest.mark.django_db(transaction=True)


# Strategies
completion_type_strategy = st.sampled_from(['view', 'quiz_pass', 'upload', 'manual'])

metadata_strategy = st.one_of(
    st.none(),
    st.fixed_dictionaries({
        'quiz_id': st.integers(min_value=1, max_value=1000),
        'score': st.integers(min_value=0, max_value=100),
    }),
    st.fixed_dictionaries({
        'file_name': st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L', 'N'))),
    }),
)


def _make_test_enrollment():
    """Create test enrollment with program and node."""
    from apps.core.models import User, Program
    from apps.blueprints.models import AcademicBlueprint
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment
    
    timestamp = timezone.now().timestamp()
    
    # Create blueprint
    blueprint = AcademicBlueprint.objects.create(
        name=f'Test Blueprint {timestamp}',
        hierarchy_structure=['Year', 'Unit', 'Session'],
        grading_logic={'type': 'weighted', 'components': []},
        progression_rules={'sequential': True}
    )
    
    # Create program
    program = Program.objects.create(
        name=f'Test Program {timestamp}',
        blueprint=blueprint,
        is_published=True
    )
    
    # Create node
    node = CurriculumNode.objects.create(
        program=program,
        node_type='Session',
        title='Test Session',
        position=0,
        completion_rules={'type': 'view', 'is_completable': True}
    )
    
    # Create user and enrollment
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
        'node': node,
        'program': program,
        'user': user,
        'blueprint': blueprint
    }


class TestCompletionRecordCreation:
    """
    **Feature: progression-engine, Property 6: Completion Record Creation**
    **Validates: Requirements 3.1**
    
    *For any* node marked complete, a completion record SHALL exist 
    with a non-null timestamp and completion_type.
    """

    @given(
        completion_type=completion_type_strategy,
        metadata=metadata_strategy
    )
    @settings(max_examples=100, deadline=None)
    def test_completion_record_has_required_fields(
        self, completion_type, metadata
    ):
        """
        Property 6: Completion Record Creation
        For any completion record created, it must have:
        - Non-null completed_at timestamp
        - Valid completion_type
        """
        from apps.progression.models import NodeCompletion
        
        data = _make_test_enrollment()
        enrollment = data['enrollment']
        node = data['node']
        
        # Create completion
        completion = NodeCompletion.objects.create(
            enrollment=enrollment,
            node=node,
            completed_at=timezone.now(),
            completion_type=completion_type,
            metadata=metadata
        )
        
        # Verify required fields
        assert completion.completed_at is not None
        assert completion.completion_type in ['view', 'quiz_pass', 'upload', 'manual']
        assert completion.enrollment_id == enrollment.id
        assert completion.node_id == node.id
        
        # Verify created_at is auto-set
        assert completion.created_at is not None


class TestCompletionIdempotency:
    """
    **Feature: progression-engine, Property 8: Completion Idempotency**
    **Validates: Requirements 3.5**
    
    *For any* node marked complete multiple times, exactly one 
    completion record SHALL exist.
    """

    @given(
        completion_type=completion_type_strategy,
        attempt_count=st.integers(min_value=2, max_value=5)
    )
    @settings(max_examples=100, deadline=None)
    def test_duplicate_completion_prevented(
        self, completion_type, attempt_count
    ):
        """
        Property 8: Completion Idempotency
        Multiple completion attempts for the same enrollment+node 
        should result in exactly one record.
        """
        from apps.progression.models import NodeCompletion
        
        data = _make_test_enrollment()
        enrollment = data['enrollment']
        node = data['node']
        
        # First completion should succeed
        NodeCompletion.objects.create(
            enrollment=enrollment,
            node=node,
            completed_at=timezone.now(),
            completion_type=completion_type
        )
        
        # Subsequent attempts should fail with IntegrityError
        for _ in range(attempt_count - 1):
            with pytest.raises(IntegrityError):
                NodeCompletion.objects.create(
                    enrollment=enrollment,
                    node=node,
                    completed_at=timezone.now(),
                    completion_type=completion_type
                )
        
        # Verify exactly one record exists
        count = NodeCompletion.objects.filter(
            enrollment=enrollment,
            node=node
        ).count()
        assert count == 1

    @given(completion_type=completion_type_strategy)
    @settings(max_examples=100, deadline=None)
    def test_get_or_create_idempotency(self, completion_type):
        """
        Property 8: Using get_or_create ensures idempotency without errors.
        """
        from apps.progression.models import NodeCompletion
        
        data = _make_test_enrollment()
        enrollment = data['enrollment']
        node = data['node']
        
        # First call creates
        completion1, created1 = NodeCompletion.objects.get_or_create(
            enrollment=enrollment,
            node=node,
            defaults={
                'completed_at': timezone.now(),
                'completion_type': completion_type
            }
        )
        assert created1 is True
        
        # Second call retrieves existing
        completion2, created2 = NodeCompletion.objects.get_or_create(
            enrollment=enrollment,
            node=node,
            defaults={
                'completed_at': timezone.now(),
                'completion_type': completion_type
            }
        )
        assert created2 is False
        assert completion1.id == completion2.id
        
        # Verify exactly one record
        count = NodeCompletion.objects.filter(
            enrollment=enrollment,
            node=node
        ).count()
        assert count == 1
