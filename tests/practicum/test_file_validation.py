"""
Property tests for file validation.
**Feature: practicum-system, Property 3: File Validation Against Config**
**Validates: Requirements 2.3, 2.4**
"""
import pytest
from hypothesis import given, strategies as st, settings, assume

from apps.practicum.validators import (
    FileValidator,
    VALID_EVIDENCE_TYPES,
    MIME_TYPE_CATEGORIES,
)


# Strategies for file validation testing
file_size_strategy = st.integers(min_value=1, max_value=500 * 1024 * 1024)  # Up to 500MB
duration_strategy = st.integers(min_value=0, max_value=7200)  # Up to 2 hours
max_size_mb_strategy = st.integers(min_value=1, max_value=500)
max_duration_strategy = st.integers(min_value=1, max_value=7200)

# All valid MIME types
all_mime_types = []
for types in MIME_TYPE_CATEGORIES.values():
    all_mime_types.extend(types)

mime_type_strategy = st.sampled_from(all_mime_types)
evidence_types_strategy = st.lists(
    st.sampled_from(VALID_EVIDENCE_TYPES),
    min_size=1,
    max_size=4,
    unique=True
)


class TestFileValidation:
    """
    Property tests for file validation against practicum config.
    **Feature: practicum-system, Property 3: File Validation Against Config**
    **Validates: Requirements 2.3, 2.4**
    """

    @given(
        file_size=file_size_strategy,
        max_size_mb=max_size_mb_strategy,
    )
    @settings(max_examples=100)
    def test_file_size_validation(self, file_size, max_size_mb):
        """
        *For any* file, the system SHALL reject files that exceed max_file_size_mb.
        **Feature: practicum-system, Property 3: File Validation Against Config**
        **Validates: Requirements 2.3, 2.4**
        """
        validator = FileValidator()
        config = {
            'type': 'practicum',
            'max_file_size_mb': max_size_mb,
        }
        
        result = validator.validate(
            file_type='audio/mp3',
            file_size=file_size,
            duration_seconds=None,
            config=config
        )
        
        max_size_bytes = max_size_mb * 1024 * 1024
        if file_size > max_size_bytes:
            assert not result.valid, "File exceeding size limit should be rejected"
            assert any('size' in e.lower() for e in result.errors)
        else:
            # May still fail for other reasons, but not size
            size_errors = [e for e in result.errors if 'size' in e.lower()]
            assert len(size_errors) == 0, "File within size limit should not have size errors"

    @given(
        duration=duration_strategy,
        max_duration=max_duration_strategy,
    )
    @settings(max_examples=100)
    def test_duration_validation(self, duration, max_duration):
        """
        *For any* audio/video file, the system SHALL reject files that exceed max_duration_seconds.
        **Feature: practicum-system, Property 3: File Validation Against Config**
        **Validates: Requirements 2.3, 2.4**
        """
        validator = FileValidator()
        config = {
            'type': 'practicum',
            'max_duration_seconds': max_duration,
            'max_file_size_mb': 500,  # Large enough to not trigger size errors
        }
        
        result = validator.validate(
            file_type='video/mp4',
            file_size=1024,  # Small file
            duration_seconds=duration,
            config=config
        )
        
        if duration > max_duration:
            assert not result.valid, "File exceeding duration limit should be rejected"
            assert any('duration' in e.lower() for e in result.errors)
        else:
            duration_errors = [e for e in result.errors if 'duration' in e.lower()]
            assert len(duration_errors) == 0

    @given(
        mime_type=mime_type_strategy,
        evidence_types=evidence_types_strategy,
    )
    @settings(max_examples=100)
    def test_file_type_validation(self, mime_type, evidence_types):
        """
        *For any* file upload, the system SHALL reject files that don't match allowed evidence_types.
        **Feature: practicum-system, Property 3: File Validation Against Config**
        **Validates: Requirements 2.3, 2.4**
        """
        validator = FileValidator()
        config = {
            'type': 'practicum',
            'evidence_types': evidence_types,
            'max_file_size_mb': 500,
        }
        
        result = validator.validate(
            file_type=mime_type,
            file_size=1024,
            duration_seconds=None,
            config=config
        )
        
        # Determine if mime_type matches any allowed evidence type
        file_category = validator._get_file_category(mime_type)
        type_allowed = file_category in evidence_types
        
        if not type_allowed:
            assert not result.valid, f"File type {mime_type} should be rejected when not in {evidence_types}"
            assert any('type' in e.lower() or 'allowed' in e.lower() for e in result.errors)
        else:
            type_errors = [e for e in result.errors if 'type' in e.lower() and 'allowed' in e.lower()]
            assert len(type_errors) == 0

    def test_valid_file_passes_all_checks(self):
        """A file meeting all requirements should pass validation."""
        validator = FileValidator()
        config = {
            'type': 'practicum',
            'evidence_types': ['audio', 'video'],
            'max_file_size_mb': 50,
            'max_duration_seconds': 600,
        }
        
        result = validator.validate(
            file_type='audio/mp3',
            file_size=10 * 1024 * 1024,  # 10MB
            duration_seconds=300,  # 5 minutes
            config=config
        )
        
        assert result.valid, f"Valid file should pass: {result.errors}"

    def test_multiple_violations_reported(self):
        """All violations should be reported, not just the first."""
        validator = FileValidator()
        config = {
            'type': 'practicum',
            'evidence_types': ['document'],  # Not audio
            'max_file_size_mb': 1,  # 1MB
            'max_duration_seconds': 60,  # 1 minute
        }
        
        result = validator.validate(
            file_type='audio/mp3',  # Wrong type
            file_size=10 * 1024 * 1024,  # 10MB - too big
            duration_seconds=300,  # 5 minutes - too long
            config=config
        )
        
        assert not result.valid
        assert len(result.errors) >= 2, "Multiple violations should be reported"
