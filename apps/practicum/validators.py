"""
Practicum validators - File and configuration validation.
Requirements: 1.2, 1.3, 1.4, 2.3, 2.4
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of a validation check."""

    valid: bool
    errors: List[str]


# Valid evidence types for practicum submissions
VALID_EVIDENCE_TYPES = ["audio", "video", "image", "document"]

# MIME type mappings
MIME_TYPE_CATEGORIES = {
    "audio": ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"],
    "video": ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
    "image": ["image/jpeg", "image/png", "image/gif", "image/webp"],
    "document": [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
}


def validate_practicum_config(config: Dict[str, Any]) -> ValidationResult:
    """
    Validate practicum configuration in completion_rules.
    Requirements: 1.2, 1.3, 1.4

    Expected config structure:
    {
        "type": "practicum",
        "evidence_types": ["audio", "video"],
        "max_file_size_mb": 50,
        "max_duration_seconds": 600,
        "rubric_id": 1
    }
    """
    errors = []

    if config.get("type") != "practicum":
        errors.append("Configuration type must be 'practicum'")
        return ValidationResult(valid=False, errors=errors)

    # Validate evidence_types
    evidence_types = config.get("evidence_types", [])
    if evidence_types:
        for et in evidence_types:
            if et not in VALID_EVIDENCE_TYPES:
                errors.append(
                    f"Invalid evidence type: {et}. Valid types: {VALID_EVIDENCE_TYPES}"
                )

    # Validate max_file_size_mb
    max_size = config.get("max_file_size_mb")
    if max_size is not None:
        if not isinstance(max_size, (int, float)) or max_size <= 0:
            errors.append("max_file_size_mb must be a positive number")

    # Validate max_duration_seconds
    max_duration = config.get("max_duration_seconds")
    if max_duration is not None:
        if not isinstance(max_duration, int) or max_duration <= 0:
            errors.append("max_duration_seconds must be a positive integer")

    # Validate rubric_id if provided
    rubric_id = config.get("rubric_id")
    if rubric_id is not None:
        if not isinstance(rubric_id, int) or rubric_id <= 0:
            errors.append("rubric_id must be a positive integer")

    return ValidationResult(valid=len(errors) == 0, errors=errors)


class FileValidator:
    """
    Validates uploaded files against practicum configuration.
    Requirements: 2.3, 2.4
    """

    def validate(
        self,
        file_type: str,
        file_size: int,
        duration_seconds: Optional[int],
        config: Dict[str, Any],
    ) -> ValidationResult:
        """
        Validate a file against practicum requirements.

        Args:
            file_type: MIME type of the file
            file_size: Size in bytes
            duration_seconds: Duration for audio/video files
            config: Practicum configuration from completion_rules

        Returns:
            ValidationResult with valid flag and any errors
        """
        errors = []

        # Validate file type against evidence_types
        evidence_types = config.get("evidence_types", [])
        if evidence_types:
            file_category = self._get_file_category(file_type)
            if file_category not in evidence_types:
                errors.append(
                    f"File type '{file_type}' (category: {file_category}) "
                    f"not allowed. Allowed types: {evidence_types}"
                )

        # Validate file size
        max_size_mb = config.get("max_file_size_mb", 50)
        max_size_bytes = max_size_mb * 1024 * 1024
        if file_size > max_size_bytes:
            errors.append(
                f"File size {file_size / 1024 / 1024:.2f}MB exceeds "
                f"maximum {max_size_mb}MB"
            )

        # Validate duration for audio/video
        max_duration = config.get("max_duration_seconds")
        if max_duration is not None and duration_seconds is not None:
            if duration_seconds > max_duration:
                errors.append(
                    f"Duration {duration_seconds}s exceeds maximum {max_duration}s"
                )

        return ValidationResult(valid=len(errors) == 0, errors=errors)

    def _get_file_category(self, mime_type: str) -> Optional[str]:
        """Get the category (audio/video/image/document) for a MIME type."""
        for category, types in MIME_TYPE_CATEGORIES.items():
            if mime_type in types:
                return category
        # Fallback: check prefix
        prefix = mime_type.split("/")[0]
        if prefix in VALID_EVIDENCE_TYPES:
            return prefix
        return None


def validate_practicum_file(file, allowed_types: List[str], max_size_mb: int) -> None:
    """
    Validate an uploaded file for practicum submission.
    Requirements: 6.2, 6.3

    Args:
        file: The uploaded file object
        allowed_types: List of allowed file extensions (e.g., ['mp3', 'mp4', 'pdf'])
        max_size_mb: Maximum file size in megabytes

    Raises:
        ValueError: If validation fails
    """
    # Get file extension
    filename = file.name
    extension = filename.split(".")[-1].lower() if "." in filename else ""

    # Validate extension
    if extension not in allowed_types:
        raise ValueError(
            f"File type '.{extension}' is not allowed. "
            f"Allowed types: {', '.join(allowed_types)}"
        )

    # Validate file size
    max_size_bytes = max_size_mb * 1024 * 1024
    if file.size > max_size_bytes:
        raise ValueError(
            f"File size ({file.size / 1024 / 1024:.1f}MB) exceeds "
            f"maximum allowed size ({max_size_mb}MB)"
        )
