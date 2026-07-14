"""Student-safe assessment property serialization."""

from __future__ import annotations


def sanitize_assessment_properties(properties) -> dict:
    """Remove authoring answer data for quizzes backed by the runtime service."""
    safe_properties = dict(properties) if isinstance(properties, dict) else {}
    if safe_properties.get("quiz_id"):
        safe_properties.pop("questions", None)
        safe_properties.pop("question_banks", None)
    return safe_properties
