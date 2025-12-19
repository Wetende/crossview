"""
Property tests for Completion Rules Validation.
Tests quiz_id validation, prerequisite validation, and error handling.
"""
import pytest
from hypothesis import given, strategies as st, settings, assume

from apps.progression.services import CompletionRulesValidator

pytestmark = pytest.mark.django_db(transaction=True)


class TestCompletionRulesValidation:
    """
    **Feature: progression-engine, Property 15: Completion Rules Validation**
    **Validates: Requirements 6.1, 6.2, 6.3**
    
    *For any* completion_rules configuration, validation SHALL catch invalid configurations.
    """

    @given(quiz_id=st.integers(min_value=1, max_value=10000))
    @settings(max_examples=100, deadline=None)
    def test_quiz_pass_with_quiz_id_is_valid(self, quiz_id):
        """quiz_pass type with quiz_id should be valid."""
        completion_rules = {
            'type': 'quiz_pass',
            'quiz_id': quiz_id,
            'min_score': 40
        }
        
        validator = CompletionRulesValidator()
        result = validator.validate(completion_rules, set())
        
        assert result.is_valid is True
        assert len(result.errors) == 0

    @given(min_score=st.integers(min_value=0, max_value=100))
    @settings(max_examples=100, deadline=None)
    def test_quiz_pass_without_quiz_id_is_invalid(self, min_score):
        """quiz_pass type without quiz_id should be invalid."""
        completion_rules = {
            'type': 'quiz_pass',
            'min_score': min_score
            # Missing quiz_id
        }
        
        validator = CompletionRulesValidator()
        result = validator.validate(completion_rules, set())
        
        assert result.is_valid is False
        assert any('quiz_id' in error for error in result.errors)

    @given(
        num_prereqs=st.integers(min_value=1, max_value=5),
        num_valid=st.integers(min_value=1, max_value=10)
    )
    @settings(max_examples=100, deadline=None)
    def test_valid_prerequisites_pass_validation(self, num_prereqs, num_valid):
        """Prerequisites that exist in program should be valid."""
        assume(num_prereqs <= num_valid)
        
        # Create a set of valid node IDs
        valid_node_ids = set(range(1, num_valid + 1))
        
        # Use some of them as prerequisites
        prereq_ids = list(range(1, num_prereqs + 1))
        
        completion_rules = {
            'type': 'view',
            'prerequisites': prereq_ids
        }
        
        validator = CompletionRulesValidator()
        result = validator.validate(completion_rules, valid_node_ids)
        
        assert result.is_valid is True
        assert len(result.errors) == 0

    @given(
        invalid_prereq_id=st.integers(min_value=100, max_value=1000),
        num_valid=st.integers(min_value=1, max_value=10)
    )
    @settings(max_examples=100, deadline=None)
    def test_invalid_prerequisites_fail_validation(self, invalid_prereq_id, num_valid):
        """Prerequisites that don't exist should fail validation."""
        # Create a set of valid node IDs (1 to num_valid)
        valid_node_ids = set(range(1, num_valid + 1))
        
        # Use an invalid prerequisite ID
        completion_rules = {
            'type': 'view',
            'prerequisites': [invalid_prereq_id]
        }
        
        validator = CompletionRulesValidator()
        result = validator.validate(completion_rules, valid_node_ids)
        
        assert result.is_valid is False
        assert any(str(invalid_prereq_id) in error for error in result.errors)

    @given(
        valid_prereqs=st.lists(st.integers(min_value=1, max_value=10), min_size=1, max_size=3),
        invalid_prereq=st.integers(min_value=100, max_value=1000)
    )
    @settings(max_examples=100, deadline=None)
    def test_mixed_prerequisites_reports_invalid_ones(self, valid_prereqs, invalid_prereq):
        """Mixed valid/invalid prerequisites should report only invalid ones."""
        valid_node_ids = set(valid_prereqs)
        
        # Mix valid and invalid prerequisites
        all_prereqs = valid_prereqs + [invalid_prereq]
        
        completion_rules = {
            'type': 'view',
            'prerequisites': all_prereqs
        }
        
        validator = CompletionRulesValidator()
        result = validator.validate(completion_rules, valid_node_ids)
        
        assert result.is_valid is False
        # Should only report the invalid one
        assert len(result.errors) == 1
        assert str(invalid_prereq) in result.errors[0]

    @given(completion_type=st.sampled_from(['view', 'upload']))
    @settings(max_examples=100, deadline=None)
    def test_view_and_upload_types_valid_without_quiz_id(self, completion_type):
        """view and upload types don't require quiz_id."""
        completion_rules = {
            'type': completion_type,
            'is_completable': True
        }
        
        validator = CompletionRulesValidator()
        result = validator.validate(completion_rules, set())
        
        assert result.is_valid is True

    @given(st.just(None))
    @settings(max_examples=100, deadline=None)
    def test_empty_completion_rules_is_valid(self, _):
        """Empty/null completion rules should be valid (container nodes)."""
        validator = CompletionRulesValidator()
        
        result = validator.validate(None, set())
        assert result.is_valid is True
        
        result = validator.validate({}, set())
        assert result.is_valid is True


class TestMultipleValidationErrors:
    """Tests for multiple validation errors."""

    @given(invalid_prereq=st.integers(min_value=100, max_value=1000))
    @settings(max_examples=100, deadline=None)
    def test_multiple_errors_all_reported(self, invalid_prereq):
        """Multiple validation errors should all be reported."""
        completion_rules = {
            'type': 'quiz_pass',
            # Missing quiz_id
            'prerequisites': [invalid_prereq]  # Invalid prerequisite
        }
        
        validator = CompletionRulesValidator()
        result = validator.validate(completion_rules, set())
        
        assert result.is_valid is False
        assert len(result.errors) == 2
        
        # Should have both errors
        error_text = ' '.join(result.errors)
        assert 'quiz_id' in error_text
        assert str(invalid_prereq) in error_text
