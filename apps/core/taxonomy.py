"""
Shared taxonomy contract for Course Builder.

Program.level is the student-facing course level and lives outside the
curriculum tree. The builder tree itself has exactly two editable labels:
container at depth 0 and content at depth 1.
"""

from __future__ import annotations

from typing import Iterable

MAX_BUILDER_DEPTH = 1

# Course/program labels must never be used as in-tree container labels.
RESERVED_CONTAINER_LABELS = {"course", "program"}

DEFAULT_BUILDER_HIERARCHY = ["Section", "Lesson"]

# Dynamic defaults by deployment mode. These are defaults only; admins may
# still use editable blueprints as long as they satisfy validation rules.
MODE_BUILDER_HIERARCHY = {
    # Deployment modes (institution-level)
    "tvet": ["Unit", "Session"],
    "theology": ["Chapter", "Lesson"],
    "driving": ["Phase", "Lesson"],
    "cbc": ["Strand", "Lesson"],
    "online": ["Section", "Lesson"],
    "custom": DEFAULT_BUILDER_HIERARCHY,
    # Exam-body-specific (used when blueprint is auto-assigned from registry)
    "kasneb": ["Paper", "Topic"],
    "cdacc": ["Unit of Competency", "Session"],
    "knec": ["Module", "Topic"],
    "nita_trade": ["Practical Skill", "Task"],
    "icm_exam": ["Unit", "Topic"],
    "icm_professional": ["Assignment", "Submission"],
}


def _normalized_pair(structure: Iterable[object]) -> list[str]:
    pair: list[str] = []
    for raw in structure:
        value = str(raw).strip()
        pair.append(value)
    return pair


def validate_builder_hierarchy(structure: object) -> tuple[bool, str | None]:
    """
    Validate that hierarchy is a 2-label builder hierarchy:
    [Container, Content].
    """
    if not isinstance(structure, list) or not structure:
        return False, "Hierarchy structure must be a non-empty list"

    pair = _normalized_pair(structure)

    if len(pair) != 2:
        return (
            False,
            "Hierarchy structure must contain exactly 2 levels: Container and Content",
        )

    for label in pair:
        if not label:
            return False, "All hierarchy items must be non-empty strings"

    container = pair[0].strip().lower()
    if container in RESERVED_CONTAINER_LABELS:
        return (
            False,
            f"Container label '{pair[0]}' is reserved. "
            "Course level is configured separately and cannot be used in builder hierarchy.",
        )

    return True, None


def is_valid_builder_hierarchy(structure: object) -> bool:
    valid, _ = validate_builder_hierarchy(structure)
    return valid


def get_mode_builder_hierarchy(mode: str | None) -> list[str]:
    key = (mode or "").strip().lower()
    return list(MODE_BUILDER_HIERARCHY.get(key, DEFAULT_BUILDER_HIERARCHY))


def get_builder_hierarchy_or_default(
    structure: object, deployment_mode: str | None = None
) -> list[str]:
    """
    Return a valid builder hierarchy. Invalid inputs fall back to mode defaults.
    """
    valid, _ = validate_builder_hierarchy(structure)
    if valid:
        return _normalized_pair(structure)  # type: ignore[arg-type]
    return get_mode_builder_hierarchy(deployment_mode)
