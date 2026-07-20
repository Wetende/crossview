"""Student-safe assessment property serialization."""

from __future__ import annotations

from apps.curriculum.activity_types import sanitize_student_activity_properties


def sanitize_assessment_properties(properties) -> dict:
    """Remove authoring answer data for quizzes backed by the runtime service."""
    safe_properties = sanitize_student_activity_properties(properties)
    if safe_properties.get("quiz_id"):
        safe_properties.pop("questions", None)
        safe_properties.pop("question_banks", None)
    return safe_properties
