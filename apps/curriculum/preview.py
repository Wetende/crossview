"""Rules for free preview lessons that visitors can open without enrolling.

``CurriculumNode.is_preview`` is the single source of truth. The Course Builder
stores the toggle in ``properties.is_preview`` and the save views copy it into the
column with :func:`coerce_preview_flag`.
"""

from __future__ import annotations

from apps.curriculum.activity_types import (
    AUDIO,
    DOCUMENT,
    TEXT,
    VIDEO,
    normalize_activity_type,
)

# Self-contained lessons only. Quizzes, assignments, code labs and scheduled or
# live sessions need an enrollment to work, so they are never previewable even
# when the flag is set.
PREVIEWABLE_ACTIVITY_TYPES = frozenset({TEXT, VIDEO, DOCUMENT, AUDIO})
_ENROLLMENT_ONLY_RAW_TYPES = frozenset(
    {"quiz", "assignment", "practicum", "peer_review", "code"}
)
_TRUE_STRINGS = frozenset({"true", "1", "yes", "on"})


def coerce_preview_flag(value) -> bool:
    """Return True only for explicit truthy flag values (fail closed)."""
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value == 1
    if isinstance(value, str):
        return value.strip().lower() in _TRUE_STRINGS
    return False


def is_previewable_activity(node_type, properties) -> bool:
    """Whether this kind of lesson can be shown to visitors at all."""
    props = properties if isinstance(properties, dict) else {}
    raw_types = {
        str(node_type or "").strip().lower(),
        str(props.get("lesson_type") or "").strip().lower(),
    }
    if raw_types & _ENROLLMENT_ONLY_RAW_TYPES:
        return False
    return normalize_activity_type(node_type, props) in PREVIEWABLE_ACTIVITY_TYPES


def public_preview_url(program, node_id: int) -> str:
    """Public, login-free URL of a preview lesson."""
    from django.urls import reverse

    return reverse(
        "core:program_preview_lesson",
        kwargs={"slug": program.slug, "node_id": node_id},
    )


def is_public_preview_lesson(node) -> bool:
    """Flagged, previewable, childless node.

    Publication of the node, its ancestors and the program is checked by the
    callers, which walk the published curriculum tree.
    """
    if not node.is_preview:
        return False
    if not is_previewable_activity(node.node_type, node.properties):
        return False
    if node.children.exists():
        return False

    # Legacy text lessons may carry their real activity in a primary block.
    from apps.learning_operations.activity_progress import resolve_activity_definition

    activity_type, _ = resolve_activity_definition(node)
    return activity_type in PREVIEWABLE_ACTIVITY_TYPES
