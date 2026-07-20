"""Canonical curriculum activity types shared by builder and player services."""

from __future__ import annotations

from copy import deepcopy


TEXT = "text"
VIDEO = "video"
DOCUMENT = "document"
AUDIO = "audio"
CODE = "code"
QUIZ = "quiz"
ASSIGNMENT = "assignment"
LIVE_MEETING = "live_meeting"
LIVE_STREAM = "live_stream"
IN_PERSON_SESSION = "in_person_session"

ACTIVITY_TYPES = {
    TEXT,
    VIDEO,
    DOCUMENT,
    AUDIO,
    CODE,
    QUIZ,
    ASSIGNMENT,
    LIVE_MEETING,
    LIVE_STREAM,
    IN_PERSON_SESSION,
}

ACTIVITY_TYPE_ALIASES = {
    "video_lesson": VIDEO,
    "live_class": LIVE_MEETING,
    "stream": LIVE_STREAM,
}

AUTHOR_ONLY_PROPERTY_KEYS = {
    "answer_key",
    "grading_rules",
    "meeting_password",
    "solution_code",
}


def normalize_activity_type(node_type="", properties=None) -> str:
    """Return a stable player activity type for legacy and current nodes."""
    properties = properties if isinstance(properties, dict) else {}
    raw_type = str(properties.get("lesson_type") or node_type or TEXT).strip().lower()
    normalized = ACTIVITY_TYPE_ALIASES.get(raw_type, raw_type)
    return normalized if normalized in ACTIVITY_TYPES else TEXT


def sanitize_student_activity_properties(properties) -> dict:
    """Remove author-only activity configuration from a student payload."""
    safe_properties = deepcopy(properties) if isinstance(properties, dict) else {}
    for key in AUTHOR_ONLY_PROPERTY_KEYS:
        safe_properties.pop(key, None)
    lesson_type = str(safe_properties.get("lesson_type") or "").lower()
    if lesson_type in {"live_class", LIVE_MEETING, LIVE_STREAM, IN_PERSON_SESSION}:
        for key in (
            "session_url",
            "video_url",
            "recording_url",
            "provider_event_id",
            "provider_conference_id",
        ):
            safe_properties.pop(key, None)
    return safe_properties


def sanitize_student_block_data(block_type, data) -> dict:
    """Remove author-only fields from supplementary block data."""
    safe_data = deepcopy(data) if isinstance(data, dict) else {}
    for key in AUTHOR_ONLY_PROPERTY_KEYS:
        safe_data.pop(key, None)

    if str(block_type or "").upper() == "QUIZ":
        for question in safe_data.get("questions", []):
            if isinstance(question, dict):
                question.pop("answer_data", None)
                question.pop("correct_answer", None)
                question.pop("correctAnswer", None)
    return safe_data
