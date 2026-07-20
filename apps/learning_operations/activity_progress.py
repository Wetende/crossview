"""Server-owned activity evidence and completion decisions for course-player nodes."""

from __future__ import annotations

from math import floor

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.content.models import ContentBlock
from apps.curriculum.activity_types import (
    AUDIO,
    CODE,
    DOCUMENT,
    IN_PERSON_SESSION,
    LIVE_MEETING,
    LIVE_STREAM,
    VIDEO,
    normalize_activity_type,
)
from apps.progression.models import NodeCompletion
from apps.progression.services import ProgressionEngine

from .models import CodeLabWork, LearnerContentSession, LearnerNodeProgress
from .services import record_learning_activity


TRACKED_PLAYBACK_TYPES = {VIDEO, AUDIO}
TRACKED_ACTIVITY_TYPES = {*TRACKED_PLAYBACK_TYPES, DOCUMENT, CODE}
SCHEDULED_ATTENDANCE_TYPES = {LIVE_MEETING, LIVE_STREAM, IN_PERSON_SESSION}
SERVER_EVIDENCE_ACTIVITY_TYPES = TRACKED_ACTIVITY_TYPES | SCHEDULED_ATTENDANCE_TYPES
BROWSER_CODE_LANGUAGES = {"html_css_js", "javascript"}
LEGACY_BLOCK_ACTIVITY_TYPES = {
    "VIDEO": VIDEO,
    "AUDIO": AUDIO,
    "PDF": DOCUMENT,
    "CODE": CODE,
}


def _positive_int(value, default=0):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return parsed if parsed > 0 else default


def resolve_activity_definition(node):
    """Return the canonical or compatible legacy activity type and properties."""
    properties = node.properties if isinstance(node.properties, dict) else {}
    activity_type = normalize_activity_type(node.node_type, properties)
    if activity_type != "text":
        return activity_type, properties

    legacy_block = (
        ContentBlock.objects.filter(node=node, block_type__in=LEGACY_BLOCK_ACTIVITY_TYPES)
        .order_by("position", "id")
        .first()
    )
    if legacy_block:
        return (
            LEGACY_BLOCK_ACTIVITY_TYPES[legacy_block.block_type],
            legacy_block.data if isinstance(legacy_block.data, dict) else {},
        )
    return activity_type, properties


def get_completion_policy(node):
    activity_type, properties = resolve_activity_definition(node)
    if activity_type in TRACKED_PLAYBACK_TYPES:
        required_percent = _positive_int(properties.get("required_progress"), 90)
        return {
            "kind": "active_time_percentage",
            "requiredPercent": min(required_percent, 100),
            "automatic": True,
        }
    if activity_type == DOCUMENT:
        document = properties.get("document") if isinstance(properties.get("document"), dict) else {}
        strict = document.get("strict_completion", properties.get("strict_completion", True))
        total_pages = _positive_int(
            document.get("page_count")
            or properties.get("page_count")
            or properties.get("required_pages")
        )
        return {
            "kind": "pages_viewed" if strict and total_pages else "manual",
            "requiredPages": total_pages if strict else 0,
            "automatic": bool(strict and total_pages),
        }
    if activity_type == CODE:
        return {"kind": "code_submission", "automatic": True}
    if activity_type == LIVE_MEETING:
        return {
            "kind": "verified_attendance",
            "requiredPercent": 50,
            "automatic": True,
            "learnerCanComplete": False,
        }
    if activity_type == LIVE_STREAM:
        return {
            "kind": "verified_watch_or_instructor",
            "automatic": False,
            "learnerCanComplete": False,
        }
    if activity_type == IN_PERSON_SESSION:
        return {
            "kind": "verified_attendance",
            "automatic": False,
            "learnerCanComplete": False,
        }
    return {"kind": "manual", "automatic": False}


def serialize_activity_progress(enrollment, node, progress=None):
    activity_type, _ = resolve_activity_definition(node)
    policy = get_completion_policy(node)
    if progress is None:
        progress = LearnerNodeProgress.objects.filter(
            enrollment=enrollment, node=node
        ).first()

    completed = NodeCompletion.objects.filter(enrollment=enrollment, node=node).exists()
    active_seconds = float(progress.active_seconds) if progress else 0
    duration_seconds = progress.duration_seconds if progress else None
    pages_viewed = sorted(set(progress.pages_viewed or [])) if progress else []
    percent = 0
    if activity_type in TRACKED_PLAYBACK_TYPES and duration_seconds:
        percent = min(100, floor((active_seconds / duration_seconds) * 100))
    elif activity_type == DOCUMENT and policy.get("requiredPages"):
        percent = min(100, floor((len(pages_viewed) / policy["requiredPages"]) * 100))
    elif activity_type == CODE and progress and progress.completed_at:
        percent = 100

    return {
        "activityType": activity_type,
        "completionPolicy": policy,
        "progressPercent": percent,
        "activeSeconds": round(active_seconds, 2),
        "durationSeconds": duration_seconds,
        "resumePositionSeconds": round(float(progress.resume_position_seconds), 2) if progress else 0,
        "pagesViewed": pages_viewed,
        "totalPages": progress.total_pages if progress else policy.get("requiredPages"),
        "lastEvidenceAt": progress.last_evidence_at.isoformat() if progress and progress.last_evidence_at else None,
        "isCompleted": completed,
    }


def _maybe_complete(enrollment, node, progress):
    policy = get_completion_policy(node)
    activity_type = progress.activity_type
    eligible = False
    if activity_type in TRACKED_PLAYBACK_TYPES and progress.duration_seconds:
        required_seconds = progress.duration_seconds * policy["requiredPercent"] / 100
        eligible = progress.active_seconds >= required_seconds
    elif activity_type == DOCUMENT and policy.get("requiredPages"):
        eligible = len(set(progress.pages_viewed or [])) >= policy["requiredPages"]
    elif activity_type == CODE:
        eligible = CodeLabWork.objects.filter(
            enrollment=enrollment, node=node, submitted_at__isnull=False
        ).exists()

    if not eligible:
        return False

    if progress.completed_at is None:
        progress.completed_at = timezone.now()
        progress.save(update_fields=["completed_at", "updated_at"])
    ProgressionEngine().mark_complete(
        enrollment=enrollment,
        node=node,
        completion_type="view",
        metadata={"source": "activity_evidence", "activityType": activity_type},
    )
    return True


@transaction.atomic
def record_activity_event(
    *, enrollment, node, event_type, session_key, sequence, position_seconds=None,
    duration_seconds=None, page_number=None
):
    activity_type, _ = resolve_activity_definition(node)
    if activity_type not in TRACKED_ACTIVITY_TYPES - {CODE}:
        raise ValidationError("This lesson does not accept playback or reading evidence.")

    now = timezone.now()
    progress, _ = LearnerNodeProgress.objects.select_for_update().get_or_create(
        enrollment=enrollment,
        node=node,
        defaults={"activity_type": activity_type},
    )
    if progress.activity_type != activity_type:
        progress.activity_type = activity_type

    content_session, _ = LearnerContentSession.objects.select_for_update().get_or_create(
        progress=progress,
        session_key=session_key,
    )
    if sequence <= content_session.last_sequence:
        return serialize_activity_progress(enrollment, node, progress), False

    if activity_type in TRACKED_PLAYBACK_TYPES:
        if event_type not in {"playback", "pause", "ended"}:
            raise ValidationError("Select a valid playback event type.")
        position = max(0.0, float(position_seconds or 0))
        reported_duration = _positive_int(duration_seconds)
        if reported_duration > 24 * 60 * 60 or position > 24 * 60 * 60:
            raise ValidationError("Playback duration is outside the supported range.")
        if reported_duration:
            progress.duration_seconds = max(progress.duration_seconds or 0, reported_duration)

        elapsed = (
            max(0.0, (now - content_session.last_event_at).total_seconds())
            if content_session.last_event_at
            else 0.0
        )
        position_delta = position - float(content_session.last_position_seconds)
        if content_session.last_event_at and 0 < position_delta <= 15:
            plausible_seconds = min(position_delta, max(1.0, elapsed * 1.5 + 1.0))
            content_session.active_seconds += plausible_seconds
            progress.active_seconds += plausible_seconds
        content_session.last_position_seconds = position
        progress.resume_position_seconds = position
    elif activity_type == DOCUMENT:
        if event_type != "page_view":
            raise ValidationError("Select a valid document event type.")
        policy = get_completion_policy(node)
        total_pages = _positive_int(policy.get("requiredPages"))
        page = _positive_int(page_number)
        if not total_pages or not page or page > total_pages:
            raise ValidationError("Select a page within this document.")
        pages = set(progress.pages_viewed or [])
        pages.add(page)
        progress.pages_viewed = sorted(pages)
        progress.total_pages = total_pages

    content_session.last_sequence = sequence
    content_session.last_event_at = now
    content_session.save()
    progress.last_evidence_at = now
    progress.save()
    record_learning_activity(enrollment, f"{activity_type}_progress", occurred_at=now)
    _maybe_complete(enrollment, node, progress)
    return serialize_activity_progress(enrollment, node, progress), True


def completion_evidence_satisfied(enrollment, node):
    activity_type, _ = resolve_activity_definition(node)
    if activity_type in SCHEDULED_ATTENDANCE_TYPES:
        return NodeCompletion.objects.filter(
            enrollment=enrollment,
            node=node,
        ).exists()
    if activity_type not in TRACKED_ACTIVITY_TYPES:
        return True
    progress = LearnerNodeProgress.objects.filter(enrollment=enrollment, node=node).first()
    return bool(progress and _maybe_complete(enrollment, node, progress))


def serialize_code_work(work, *, starter_code=""):
    return {
        "language": work.language,
        "draftCode": work.draft_code if work.pk else starter_code,
        "submittedAt": work.submitted_at.isoformat() if work.submitted_at else None,
        "revision": work.revision,
        "browserRunnable": work.language in BROWSER_CODE_LANGUAGES,
    }


@transaction.atomic
def save_code_work(*, enrollment, node, code, submit=False):
    activity_type, properties = resolve_activity_definition(node)
    if activity_type != CODE:
        raise ValidationError("This lesson is not a code lab.")
    language = str(properties.get("language") or "html_css_js")[:32]
    work, created = CodeLabWork.objects.select_for_update().get_or_create(
        enrollment=enrollment,
        node=node,
        defaults={"language": language, "draft_code": code},
    )
    if not created:
        work.language = language
        work.draft_code = code
        work.revision += 1
    if submit:
        work.submitted_code = code
        work.submitted_at = timezone.now()
    work.save()

    progress, _ = LearnerNodeProgress.objects.get_or_create(
        enrollment=enrollment,
        node=node,
        defaults={"activity_type": CODE},
    )
    progress.activity_type = CODE
    progress.last_evidence_at = timezone.now()
    progress.save()
    record_learning_activity(enrollment, "code_submission" if submit else "code_draft")
    if submit:
        _maybe_complete(enrollment, node, progress)
    return work
