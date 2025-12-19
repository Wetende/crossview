"""
Property tests for Completion Type Triggers.
Tests view, quiz_pass, and upload completion types.
"""
import pytest
from hypothesis import given, strategies as st, settings, assume
from django.utils import timezone

from apps.progression.services import CompletionTriggerHandler

pytestmark = pytest.mark.django_db(transaction=True)


def _make_node_with_completion_type(completion_type: str, **extra_rules):
    """Helper to create a node with specific completion type."""
    from apps.core.models import Program
    from apps.blueprints.models import AcademicBlueprint
    from apps.curriculum.models import CurriculumNode
    
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
    
    completion_rules = {
        'type': completion_type,
        'is_completable': True,
        **extra_rules
    }
    
    node = CurriculumNode.objects.create(
        program=program,
        node_type='Session',
        title='Test Session',
        position=0,
        completion_rules=completion_rules
    )
    
    return node


class TestCompletionTypeTriggers:
    """
    **Feature: progression-engine, Property 7: Completion Type Triggers**
    **Validates: Requirements 3.2, 3.3, 3.4**
    
    *For any* node with completion_rules.type, completion SHALL only occur 
    when the corresponding trigger fires (view, quiz_pass, or upload).
    """

    @given(st.just('view'))
    @settings(max_examples=100, deadline=None)
    def test_view_type_completes_on_view_trigger(self, _):
        """View type nodes complete when view trigger fires."""
        node = _make_node_with_completion_type('view')
        handler = CompletionTriggerHandler()
        
        result = handler.can_complete(node, 'view')
        assert result is True

    @given(wrong_trigger=st.sampled_from(['quiz_pass', 'upload']))
    @settings(max_examples=100, deadline=None)
    def test_view_type_rejects_wrong_trigger(self, wrong_trigger):
        """View type nodes don't complete on wrong trigger."""
        node = _make_node_with_completion_type('view')
        handler = CompletionTriggerHandler()
        
        result = handler.can_complete(node, wrong_trigger)
        assert result is False

    @given(
        min_score=st.integers(min_value=0, max_value=100),
        actual_score=st.integers(min_value=0, max_value=100)
    )
    @settings(max_examples=100, deadline=None)
    def test_quiz_pass_type_checks_score(self, min_score, actual_score):
        """Quiz pass type completes only when score meets minimum."""
        node = _make_node_with_completion_type(
            'quiz_pass',
            quiz_id=123,
            min_score=min_score
        )
        handler = CompletionTriggerHandler()
        
        trigger_data = {'score': actual_score, 'quiz_id': 123}
        result = handler.can_complete(node, 'quiz_pass', trigger_data)
        
        expected = actual_score >= min_score
        assert result is expected

    @given(wrong_trigger=st.sampled_from(['view', 'upload']))
    @settings(max_examples=100, deadline=None)
    def test_quiz_pass_type_rejects_wrong_trigger(self, wrong_trigger):
        """Quiz pass type nodes don't complete on wrong trigger."""
        node = _make_node_with_completion_type('quiz_pass', quiz_id=123, min_score=40)
        handler = CompletionTriggerHandler()
        
        result = handler.can_complete(node, wrong_trigger)
        assert result is False

    @given(st.just('upload'))
    @settings(max_examples=100, deadline=None)
    def test_upload_type_completes_on_upload(self, _):
        """Upload type nodes complete when file is uploaded."""
        node = _make_node_with_completion_type('upload')
        handler = CompletionTriggerHandler()
        
        trigger_data = {'file_uploaded': True, 'file_name': 'test.pdf'}
        result = handler.can_complete(node, 'upload', trigger_data)
        assert result is True

    @given(st.just('upload'))
    @settings(max_examples=100, deadline=None)
    def test_upload_type_rejects_no_file(self, _):
        """Upload type nodes don't complete without file."""
        node = _make_node_with_completion_type('upload')
        handler = CompletionTriggerHandler()
        
        trigger_data = {'file_uploaded': False}
        result = handler.can_complete(node, 'upload', trigger_data)
        assert result is False

    @given(wrong_trigger=st.sampled_from(['view', 'quiz_pass']))
    @settings(max_examples=100, deadline=None)
    def test_upload_type_rejects_wrong_trigger(self, wrong_trigger):
        """Upload type nodes don't complete on wrong trigger."""
        node = _make_node_with_completion_type('upload')
        handler = CompletionTriggerHandler()
        
        result = handler.can_complete(node, wrong_trigger)
        assert result is False


class TestCompletionTriggerEdgeCases:
    """Edge case tests for completion triggers."""

    @given(trigger_type=st.sampled_from(['view', 'quiz_pass', 'upload']))
    @settings(max_examples=100, deadline=None)
    def test_node_without_completion_rules_cannot_complete(self, trigger_type):
        """Nodes without completion_rules (empty dict) cannot be completed."""
        from apps.core.models import Program
        from apps.blueprints.models import AcademicBlueprint
        from apps.curriculum.models import CurriculumNode
        
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
        
        # Use empty dict - model doesn't allow null, but empty dict means no rules
        node = CurriculumNode.objects.create(
            program=program,
            node_type='Unit',
            title='Container Unit',
            position=0,
            completion_rules={}  # Empty completion rules (container node)
        )
        
        handler = CompletionTriggerHandler()
        result = handler.can_complete(node, trigger_type)
        assert result is False

    @given(st.just('quiz_pass'))
    @settings(max_examples=100, deadline=None)
    def test_quiz_pass_without_data_fails(self, _):
        """Quiz pass without trigger data should fail."""
        node = _make_node_with_completion_type('quiz_pass', quiz_id=123, min_score=40)
        handler = CompletionTriggerHandler()
        
        result = handler.can_complete(node, 'quiz_pass', None)
        assert result is False

    @given(st.just('upload'))
    @settings(max_examples=100, deadline=None)
    def test_upload_without_data_fails(self, _):
        """Upload without trigger data should fail."""
        node = _make_node_with_completion_type('upload')
        handler = CompletionTriggerHandler()
        
        result = handler.can_complete(node, 'upload', None)
        assert result is False
