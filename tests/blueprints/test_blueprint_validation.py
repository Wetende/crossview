"""
Property test for Blueprint Validation.

**Feature: blueprint-engine, Property 2: Blueprint Validation Rejects Invalid Configurations**
**Validates: Requirements 1.3, 1.4**

Tests that invalid hierarchy structures and grading logic are rejected.
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings

from apps.blueprints.services import BlueprintValidationService
from apps.blueprints.exceptions import (
    InvalidHierarchyStructureException,
    InvalidGradingLogicException
)


@pytest.mark.django_db
class TestBlueprintValidation:
    """
    Property 2: Blueprint Validation Rejects Invalid Configurations
    
    *For any* invalid hierarchy structure (empty, non-strings) or invalid grading logic
    (missing type, missing required fields), validation should raise appropriate exceptions.
    """

    def setup_method(self):
        self.validator = BlueprintValidationService()

    # Valid hierarchy tests
    @given(
        hierarchy=st.lists(
            st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=('L',))),
            min_size=1,
            max_size=10
        )
    )
    @hyp_settings(max_examples=50, deadline=None)
    def test_valid_hierarchy_passes(self, hierarchy):
        """Valid hierarchies should pass validation."""
        assert self.validator.validate_hierarchy_structure(hierarchy) == True

    # Invalid hierarchy tests
    def test_empty_hierarchy_rejected(self):
        """Empty hierarchy should be rejected."""
        with pytest.raises(InvalidHierarchyStructureException):
            self.validator.validate_hierarchy_structure([])

    def test_none_hierarchy_rejected(self):
        """None hierarchy should be rejected."""
        with pytest.raises(InvalidHierarchyStructureException):
            self.validator.validate_hierarchy_structure(None)

    @given(
        hierarchy=st.lists(
            st.one_of(st.integers(), st.none(), st.floats()),
            min_size=1,
            max_size=5
        )
    )
    @hyp_settings(max_examples=30, deadline=None)
    def test_non_string_items_rejected(self, hierarchy):
        """
        **Feature: blueprint-engine, Property 2: Blueprint Validation Rejects Invalid Configurations**
        **Validates: Requirements 1.3**
        
        Hierarchies with non-string items should be rejected.
        """
        with pytest.raises(InvalidHierarchyStructureException):
            self.validator.validate_hierarchy_structure(hierarchy)

    # Valid grading logic tests
    @given(
        grading_type=st.sampled_from(['weighted', 'points', 'percentage', 'competency', 'pass_fail']),
        components=st.lists(
            st.fixed_dictionaries({
                'name': st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('L',))),
                'weight': st.integers(min_value=1, max_value=100)
            }),
            min_size=1,
            max_size=5
        )
    )
    @hyp_settings(max_examples=50, deadline=None)
    def test_valid_grading_logic_passes(self, grading_type, components):
        """Valid grading logic should pass validation."""
        logic = {'type': grading_type}
        if grading_type == 'weighted':
            logic['components'] = components
        assert self.validator.validate_grading_logic(logic) == True

    # Invalid grading logic tests
    def test_missing_type_rejected(self):
        """Grading logic without type should be rejected."""
        with pytest.raises(InvalidGradingLogicException):
            self.validator.validate_grading_logic({})

    def test_none_grading_rejected(self):
        """None grading logic should be rejected."""
        with pytest.raises(InvalidGradingLogicException):
            self.validator.validate_grading_logic(None)

    def test_weighted_without_components_rejected(self):
        """
        **Feature: blueprint-engine, Property 2: Blueprint Validation Rejects Invalid Configurations**
        **Validates: Requirements 1.4**
        
        Weighted grading without components should be rejected.
        """
        with pytest.raises(InvalidGradingLogicException):
            self.validator.validate_grading_logic({'type': 'weighted'})

    @given(unknown_type=st.text(min_size=1, max_size=20).filter(lambda x: x not in ['weighted', 'points', 'percentage', 'competency', 'pass_fail']))
    @hyp_settings(max_examples=30, deadline=None)
    def test_unknown_grading_type_rejected(self, unknown_type):
        """Unknown grading types should be rejected."""
        with pytest.raises(InvalidGradingLogicException):
            self.validator.validate_grading_logic({'type': unknown_type})
