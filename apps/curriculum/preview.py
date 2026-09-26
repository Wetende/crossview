"""Rules for free preview lessons that visitors can open without enrolling.

``CurriculumNode.is_preview`` is the single source of truth. The Course Builder
stores the toggle in ``properties.is_preview``; ``CurriculumNode.save()`` derives
the column from it with :func:`coerce_preview_flag`.
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
# Generic container labels. Builder containers always sit at depth 0, which
# is_preview_candidate() also rejects, whatever the blueprint calls them.
CONTAINER_NODE_TYPES = frozenset(
    {"section", "module", "unit", "chapter", "course", "program", "year"}
)
_TRUE_STRINGS = frozenset({"true", "1", "yes", "on"})

# Properties a visitor's player needs, per activity type. Everything else in
# the authoring payload stays server-side.
_COMMON_PREVIEW_PROPERTY_KEYS = ("lesson_type", "duration")
PREVIEW_PROPERTY_KEYS = {
    TEXT: ("content", "content_html"),
    VIDEO: ("video_url",),
    AUDIO: ("audio_url", "url"),
    DOCUMENT: ("document",),
}
PREVIEW_DOCUMENT_KEYS = (
    "viewer_pdf_url",
    "original_url",
    "original_ext",
    "original_name",
    "page_count",
    "strict_completion",
)


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
    """Whether this kind of node can be shown to visitors at all."""
    props = properties if isinstance(properties, dict) else {}
    normalized_node_type = str(node_type or "").strip().lower()
    if normalized_node_type in CONTAINER_NODE_TYPES:
        return False
    raw_types = {
        normalized_node_type,
        str(props.get("lesson_type") or "").strip().lower(),
    }
    if raw_types & _ENROLLMENT_ONLY_RAW_TYPES:
        return False
    return normalize_activity_type(node_type, props) in PREVIEWABLE_ACTIVITY_TYPES


def is_preview_candidate(node) -> bool:
    """Flagged lesson-tier node of a previewable kind (no database access)."""
    return bool(
        node.is_preview
        and node.parent_id is not None
        and is_previewable_activity(node.node_type, node.properties)
    )


def legacy_primary_activity_types(node_ids) -> dict:
    """Activity type carried by each text node's legacy primary block, in one query.

    Mirrors ``resolve_activity_definition`` for text nodes.
    """
    node_ids = list(node_ids)
    if not node_ids:
        return {}

    from apps.content.models import ContentBlock
    from apps.learning_operations.activity_progress import LEGACY_BLOCK_ACTIVITY_TYPES

    activity_types = {}
    blocks = (
        ContentBlock.objects.filter(
            node_id__in=node_ids,
            block_type__in=list(LEGACY_BLOCK_ACTIVITY_TYPES),
        )
        .order_by("node_id", "position", "id")
        .values_list("node_id", "block_type")
    )
    for node_id, block_type in blocks:
        activity_types.setdefault(node_id, LEGACY_BLOCK_ACTIVITY_TYPES[block_type])
    return activity_types


def public_preview_lesson_ids(nodes, *, parents_with_children) -> set:
    """IDs of the given nodes that are previewable lessons (one query at most).

    Publication of the nodes, their ancestors and the program is the caller's
    job: pass only nodes from the published curriculum tree.
    """
    candidates = [
        node
        for node in nodes
        if node.id not in parents_with_children and is_preview_candidate(node)
    ]
    legacy_types = legacy_primary_activity_types(
        node.id
        for node in candidates
        if normalize_activity_type(node.node_type, node.properties) == TEXT
    )
    return {
        node.id
        for node in candidates
        if legacy_types.get(node.id, TEXT) in PREVIEWABLE_ACTIVITY_TYPES
    }


def is_public_preview_lesson(node) -> bool:
    """Flagged, previewable, childless lesson-tier node."""
    if not is_preview_candidate(node):
        return False
    if node.children.exists():
        return False
    return node.id in public_preview_lesson_ids([node], parents_with_children=set())


def ancestors_published(node) -> bool:
    """Every ancestor is published (one query per level; the tree is shallow)."""
    return all(ancestor.is_published for ancestor in node.get_ancestors())


def preview_properties(activity_type: str, properties) -> dict:
    """Allowlisted properties for a visitor's player payload."""
    props = properties if isinstance(properties, dict) else {}
    keys = (
        *_COMMON_PREVIEW_PROPERTY_KEYS,
        *PREVIEW_PROPERTY_KEYS.get(activity_type, ()),
    )
    safe = {key: props[key] for key in keys if key in props}
    if "document" in safe:
        document = safe["document"]
        if isinstance(document, dict):
            safe["document"] = {
                key: document[key] for key in PREVIEW_DOCUMENT_KEYS if key in document
            }
        else:
            safe.pop("document")
    return safe


def public_preview_url(program, node_id: int) -> str:
    """Public, login-free URL of a preview lesson."""
    from django.urls import reverse

    return reverse(
        "core:program_preview_lesson",
        kwargs={"slug": program.slug, "node_id": node_id},
    )
