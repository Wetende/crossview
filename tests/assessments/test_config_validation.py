"""
Property tests for GradingConfigValidator.

**Feature: assessment-engine, Property 4: Grading Config Validation**
**Validates: Requirements 1.4**
"""
import pytest
from hypothesis import given, strategies as st, settings as hyp_settings, assume

from apps.assessments.validators import GradingConfigValidator
from apps.assessments.exceptions import InvalidGradingConfigException


# Strategy for generating valid weighted configs
@st.composite
def valid_weighted_config(draw):
    """Generate valid weighted grading config with weights summing to 1.0."""
    num_components = draw(st.integers(min_value=1, max_value=4))
    component_names = ['cat', 'exam', 'assignment', 'practical'][:num_components]
    
    # Generate weights that sum to 1.0
    if num_components == 1:
        weights = [1.0]
    else:
        weights = []
        remaining = 1.0
        for i in range(num_components - 1):
            max_w = remaining - (num_components - i - 1) * 0.01
            w = draw(st.floats(min_value=0.01, max_value=max(0.01, max_w)))
            weights.append(w)
            remaining -= w
        weights.append(remaining)
    
    components = [
        {'name': name, 'weight': weight}
        for name, weight in zip(component_names, weights)
    ]
    
    return {
        'type': 'weighted',
        'components': components,
        'pass_mark': draw(st.floats(min_value=0, max_value=100))
    }


# Strategy for generating invalid weighted configs (weights don't sum to 1.0)
@st.composite
def invalid_weighted_weights(draw):
    """Generate weighted config where weights don't sum to 1.0."""
    num_components = draw(st.integers(min_value=2, max_value=4))
    component_names = ['cat', 'exam', 'assignment', 'practical'][:num_components]
    
    # Generate weights that explicitly don't sum to 1.0
    weights = [draw(st.floats(min_value=0.1, max_value=0.3)) for _ in range(num_components)]
    total = sum(weights)
    assume(abs(total - 1.0) > 0.01)  # Ensure they don't accidentally sum to 1.0
    
    components = [
        {'name': name, 'weight': weight}
        for name, weight in zip(component_names, weights)
    ]
    
    return {
        'type': 'weighted',
        'components': components
    }


class TestGradingConfigValidation:
    """
    Property 4: Grading Config Validation
    
    *For any* grading_logic missing required fields for its declared type,
    the Assessment Engine SHALL reject with a validation error.
    """

    @given(config=valid_weighted_config())
    @hyp_settings(max_examples=100, deadline=None)
    def test_valid_weighted_config_passes(self, config):
        """
        **Feature: assessment-engine, Property 4: Grading Config Validation**
        **Validates: Requirements 1.4**
        
        Valid weighted configs should pass validation.
        """
        validator = GradingConfigValidator()
        assert validator.validate(config) is True

    @given(config=invalid_weighted_weights())
    @hyp_settings(max_examples=50, deadline=None)
    def test_invalid_weighted_weights_rejected(self, config):
        """
        **Feature: assessment-engine, Property 4: Grading Config Validation**
        **Validates: Requirements 1.4**
        
        Weighted configs with weights not summing to 1.0 should be rejected.
        """
        validator = GradingConfigValidator()
        with pytest.raises(InvalidGradingConfigException) as exc_info:
            validator.validate(config)
        assert "sum to 1.0" in str(exc_info.value)

    def test_weighted_missing_components_rejected(self):
        """Weighted config without components should be rejected."""
        validator = GradingConfigValidator()
        
        with pytest.raises(InvalidGradingConfigException) as exc_info:
            validator.validate({'type': 'weighted'})
        assert "components" in str(exc_info.value)

    def test_weighted_empty_components_rejected(self):
        """Weighted config with empty components should be rejected."""
        validator = GradingConfigValidator()
        
        with pytest.raises(InvalidGradingConfigException) as exc_info:
            validator.validate({'type': 'weighted', 'components': []})
        assert "empty" in str(exc_info.value)

    def test_weighted_component_missing_name_rejected(self):
        """Component without name should be rejected."""
        validator = GradingConfigValidator()
        
        config = {
            'type': 'weighted',
            'components': [{'weight': 1.0}]
        }
        
        with pytest.raises(InvalidGradingConfigException) as exc_info:
            validator.validate(config)
        assert "name" in str(exc_info.value)

    def test_weighted_component_missing_weight_rejected(self):
        """Component without weight should be rejected."""
        validator = GradingConfigValidator()
        
        config = {
            'type': 'weighted',
            'components': [{'name': 'exam'}]
        }
        
        with pytest.raises(InvalidGradingConfigException) as exc_info:
            validator.validate(config)
        assert "weight" in str(exc_info.value)

    @given(threshold=st.floats(min_value=0, max_value=100, allow_nan=False, allow_infinity=False))
    @hyp_settings(max_examples=50, deadline=None)
    def test_valid_pass_fail_config_passes(self, threshold):
        """Valid pass/fail configs should pass validation."""
        validator = GradingConfigValidator()
        
        config = {'type': 'pass_fail', 'threshold': threshold}
        assert validator.validate(config) is True
        
        config = {'type': 'pass_fail', 'pass_mark': threshold}
        assert validator.validate(config) is True

    def test_pass_fail_missing_threshold_rejected(self):
        """Pass/fail config without threshold should be rejected."""
        validator = GradingConfigValidator()
        
        with pytest.raises(InvalidGradingConfigException) as exc_info:
            validator.validate({'type': 'pass_fail'})
        assert "threshold" in str(exc_info.value) or "pass_mark" in str(exc_info.value)

    def test_competency_valid_config_passes(self):
        """Valid competency configs should pass validation."""
        validator = GradingConfigValidator()
        
        # Minimal config
        assert validator.validate({'type': 'competency'}) is True
        
        # With required_evidences
        config = {
            'type': 'competency',
            'required_evidences': ['practical', 'portfolio']
        }
        assert validator.validate(config) is True
        
        # With custom labels
        config = {
            'type': 'competency',
            'competency_labels': {'pass': 'Competent', 'fail': 'Not Yet Competent'}
        }
        assert validator.validate(config) is True

    def test_competency_invalid_labels_rejected(self):
        """Competency config with incomplete labels should be rejected."""
        validator = GradingConfigValidator()
        
        # Missing 'fail' key
        config = {
            'type': 'competency',
            'competency_labels': {'pass': 'Competent'}
        }
        with pytest.raises(InvalidGradingConfigException):
            validator.validate(config)

    def test_empty_config_rejected(self):
        """Empty config should be rejected."""
        validator = GradingConfigValidator()
        
        with pytest.raises(InvalidGradingConfigException):
            validator.validate({})
        
        with pytest.raises(InvalidGradingConfigException):
            validator.validate(None)

    def test_missing_type_rejected(self):
        """Config without type should be rejected."""
        validator = GradingConfigValidator()
        
        with pytest.raises(InvalidGradingConfigException) as exc_info:
            validator.validate({'components': []})
        assert "type" in str(exc_info.value)

    @given(grading_type=st.text(min_size=1, max_size=20).filter(
        lambda x: x not in ['weighted', 'competency', 'pass_fail']
    ))
    @hyp_settings(max_examples=50, deadline=None)
    def test_unknown_type_rejected(self, grading_type):
        """Unknown grading types should be rejected."""
        validator = GradingConfigValidator()
        
        with pytest.raises(InvalidGradingConfigException) as exc_info:
            validator.validate({'type': grading_type})
        assert "Unknown grading type" in str(exc_info.value)
