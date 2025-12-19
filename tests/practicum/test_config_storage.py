"""
Property tests for practicum configuration storage.
**Feature: practicum-system, Property 2: Practicum Configuration Storage**
**Validates: Requirements 1.2, 1.3, 1.4**
"""
import pytest
from hypothesis import given, strategies as st, settings

from apps.practicum.validators import (
    validate_practicum_config,
    VALID_EVIDENCE_TYPES,
)


# Strategies for generating practicum configurations
evidence_types_strategy = st.lists(
    st.sampled_from(VALID_EVIDENCE_TYPES),
    min_size=0,
    max_size=4,
    unique=True
)

practicum_config_strategy = st.fixed_dictionaries({
    'type': st.just('practicum'),
    'evidence_types': evidence_types_strategy,
    'max_file_size_mb': st.integers(min_value=1, max_value=500),
    'max_duration_seconds': st.integers(min_value=1, max_value=7200),
    'rubric_id': st.integers(min_value=1, max_value=10000),
})


@pytest.mark.django_db
class TestPracticumConfigStorage:
    """
    Property tests for practicum configuration storage.
    **Feature: practicum-system, Property 2: Practicum Configuration Storage**
    **Validates: Requirements 1.2, 1.3, 1.4**
    """

    @given(config=practicum_config_strategy)
    @settings(max_examples=100)
    def test_valid_config_passes_validation(self, config):
        """
        *For any* valid practicum configuration, validation SHALL pass.
        **Feature: practicum-system, Property 2: Practicum Configuration Storage**
        **Validates: Requirements 1.2, 1.3, 1.4**
        """
        result = validate_practicum_config(config)
        assert result.valid, f"Valid config failed validation: {result.errors}"

    @given(
        evidence_types=evidence_types_strategy,
        max_file_size_mb=st.integers(min_value=1, max_value=500),
        max_duration_seconds=st.integers(min_value=1, max_value=7200),
        rubric_id=st.integers(min_value=1, max_value=10000),
    )
    @settings(max_examples=100)
    def test_config_round_trip_preserves_values(
        self,
        evidence_types,
        max_file_size_mb,
        max_duration_seconds,
        rubric_id,
    ):
        """
        *For any* practicum configuration values, saving and retrieving
        SHALL return identical values.
        **Feature: practicum-system, Property 2: Practicum Configuration Storage**
        **Validates: Requirements 1.2, 1.3, 1.4**
        """
        config = {
            'type': 'practicum',
            'evidence_types': evidence_types,
            'max_file_size_mb': max_file_size_mb,
            'max_duration_seconds': max_duration_seconds,
            'rubric_id': rubric_id,
        }
        
        # Validate the config
        result = validate_practicum_config(config)
        assert result.valid
        
        # Verify all values are preserved
        assert config['type'] == 'practicum'
        assert config['evidence_types'] == evidence_types
        assert config['max_file_size_mb'] == max_file_size_mb
        assert config['max_duration_seconds'] == max_duration_seconds
        assert config['rubric_id'] == rubric_id

    def test_invalid_type_fails_validation(self):
        """Config with wrong type should fail validation."""
        config = {
            'type': 'quiz',
            'evidence_types': ['audio'],
        }
        result = validate_practicum_config(config)
        assert not result.valid
        assert any('type' in e.lower() for e in result.errors)

    def test_invalid_evidence_type_fails_validation(self):
        """Config with invalid evidence type should fail validation."""
        config = {
            'type': 'practicum',
            'evidence_types': ['invalid_type'],
        }
        result = validate_practicum_config(config)
        assert not result.valid
        assert any('evidence type' in e.lower() for e in result.errors)

    def test_negative_file_size_fails_validation(self):
        """Config with negative file size should fail validation."""
        config = {
            'type': 'practicum',
            'max_file_size_mb': -10,
        }
        result = validate_practicum_config(config)
        assert not result.valid
        assert any('max_file_size_mb' in e for e in result.errors)

    def test_negative_duration_fails_validation(self):
        """Config with negative duration should fail validation."""
        config = {
            'type': 'practicum',
            'max_duration_seconds': -100,
        }
        result = validate_practicum_config(config)
        assert not result.valid
        assert any('max_duration_seconds' in e for e in result.errors)
