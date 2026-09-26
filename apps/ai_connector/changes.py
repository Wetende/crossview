"""Prepare, apply and report prepared course changes."""

import logging
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.core.models import Program
from apps.curriculum.models import CurriculumNode

from .access import (
    READ_SCOPE,
    WRITE_SCOPE,
    AccessDenied,
    ConnectorError,
    get_program_for_user,
    require_scope,
)
from .content import Links, node_version, program_version
from .models import CourseChange
from .operations import apply_operations, plan_operations

logger = logging.getLogger(__name__)

PUBLISHED_NOTICE = (
    "This course is published. After the user confirms, these changes are visible "
    "to learners immediately. Saving never publishes or unpublishes the course."
)
DRAFT_NOTICE = (
    "This course is not published. These changes stay in the draft until the course "
    "is published separately in the course builder."
)


def _client_name(token) -> str:
    application = getattr(token, "application", None)
    return getattr(application, "name", "") or ""


def _course_ref(program):
    return {"id": program.id, "title": program.name, "is_published": program.is_published}


def prepare_change(*, user, token, links: Links, course_id, operations, summary="") -> dict:
    require_scope(token, WRITE_SCOPE)
    program = get_program_for_user(user, course_id)
    plan = plan_operations(program, operations, links)
    summary = " ".join(str(summary or "").split())[:500] or "; ".join(
        preview["summary"] for preview in plan.previews
    )[:500]
    ttl = timedelta(hours=getattr(settings, "AI_CONNECTOR_CHANGE_TTL_HOURS", 24))
    change = CourseChange.objects.create(
        user=user,
        user_email=user.email or "",
        program=program,
        program_code=program.code,
        application=getattr(token, "application", None),
        client_name=_client_name(token),
        summary=summary,
        operations=plan.operations,
        preview={"operations": plan.previews},
        target_versions=plan.targets,
        affects_published_content=plan.affects_published,
        expires_at=timezone.now() + ttl,
    )
    return {
        "change_id": str(change.id),
        "status": change.status,
        "summary": change.summary,
        "course": _course_ref(program),
        "affects_published_content": change.affects_published_content,
        "publication_notice": PUBLISHED_NOTICE if program.is_published else DRAFT_NOTICE,
        "operations": plan.previews,
        "expires_at": change.expires_at.isoformat(),
        "next_step": (
            "Show this preview to the user, including the publication notice. Call "
            "apply_course_change with this change_id only after the user explicitly "
            "confirms. Nothing has been saved yet."
        ),
    }


def _load_own_change(user, change_id, lock=False):
    try:
        change_uuid = uuid.UUID(str(change_id))
    except (TypeError, ValueError):
        raise AccessDenied("That change ID is not valid. Use the change_id returned by prepare_course_change.")
    queryset = CourseChange.objects.select_related("program")
    if lock:
        queryset = queryset.select_for_update()
    change = queryset.filter(pk=change_uuid, user=user).first()
    if change is None:
        raise AccessDenied("No prepared change with that ID was found for your account.")
    return change


def _finish(change, status, *, result=None, error="", token=None, applied_at=None):
    change.status = status
    change.result = result or {}
    change.error = error
    fields = ["status", "result", "error"]
    if status == CourseChange.Status.APPLIED:
        change.applied_at = applied_at or timezone.now()
        change.applied_by_application = getattr(token, "application", None)
        fields += ["applied_at", "applied_by_application"]
    change.save(update_fields=fields)


def _current_program(user, change):
    """The change's course if the user may still author it, else None."""
    try:
        return get_program_for_user(user, change.program_id)
    except AccessDenied:
        return None


def _lock_target_nodes(program, target_versions):
    """
    Lock the rows this change edits so a course-builder save cannot commit
    between the version check below and the change's own writes.
    """
    node_ids = [
        raw_id for kind, _, raw_id in (key.partition(":") for key in target_versions) if kind == "node"
    ]
    list(
        CurriculumNode.objects.select_for_update()
        .filter(program=program, pk__in=node_ids)
        .values_list("pk", flat=True)
    )


def _stale_targets(program, target_versions) -> list[str]:
    stale = []
    for key, expected in target_versions.items():
        kind, _, raw_id = key.partition(":")
        if kind == "course_published":
            if str(program.is_published) != expected:
                stale.append("the course's published state")
        elif kind == "course":
            if program_version(program) != expected:
                stale.append("the course details")
        elif kind == "node":
            node = CurriculumNode.objects.filter(program=program, pk=raw_id).first()
            if node is None:
                stale.append(f"item {raw_id} (it no longer exists)")
            elif node_version(node) != expected:
                stale.append(f"'{node.title}'")
    return stale


def _applied_payload(change, replayed=False):
    payload = {
        "change_id": str(change.id),
        "status": change.status,
        "summary": change.summary,
        "applied_at": change.applied_at.isoformat() if change.applied_at else None,
        **change.result,
    }
    if replayed:
        payload["message"] = "This change was already saved; nothing was applied twice."
    return payload


def apply_change(*, user, token, links: Links, change_id) -> dict:
    require_scope(token, WRITE_SCOPE)
    error = None
    with transaction.atomic():
        change = _load_own_change(user, change_id, lock=True)
        program = _current_program(user, change)
        if change.status == CourseChange.Status.APPLIED:
            if program is None:
                raise AccessDenied(
                    "This change was saved, but you no longer have access to the course, "
                    "so its details are not shown."
                )
            return _applied_payload(change, replayed=True)
        if change.status != CourseChange.Status.PREPARED:
            detail = f"{change.error} " if program is not None else ""
            raise ConnectorError(
                f"This change is {change.status} and cannot be applied. {detail}Prepare a fresh change."
            )

        if change.expires_at <= timezone.now():
            error = "This prepared change has expired. Prepare it again to get a fresh preview."
            _finish(change, CourseChange.Status.EXPIRED, error=error)
        elif program is None:
            error = "You no longer have access to this course, so the change was not saved."
            _finish(change, CourseChange.Status.REJECTED, error=error)
        else:
            program = Program.objects.select_for_update().select_related("blueprint").get(pk=program.pk)
            _lock_target_nodes(program, change.target_versions)
            stale = _stale_targets(program, change.target_versions)
            if stale:
                error = (
                    f"The course changed after this preview ({', '.join(stale)}). "
                    "Nothing was saved. Read the course again and prepare a fresh change."
                )
                _finish(change, CourseChange.Status.STALE, error=error)
            else:
                # Recorded as the save time before any write, so every row this
                # change touches is newer than it (the builder's conflict check
                # relies on this ordering).
                started_at = timezone.now()
                try:
                    with transaction.atomic():
                        results = apply_operations(program, change.operations, links)
                except ConnectorError as exc:
                    error = f"The change could not be saved and nothing was changed: {exc}"
                    _finish(change, CourseChange.Status.FAILED, error=error)
                except Exception:
                    logger.exception("AI connector change %s failed", change.id)
                    error = "The change could not be saved because of a server error. Nothing was changed."
                    _finish(change, CourseChange.Status.FAILED, error=error)
                else:
                    program.refresh_from_db()
                    _finish(
                        change,
                        CourseChange.Status.APPLIED,
                        token=token,
                        applied_at=started_at,
                        result={
                            "course": _course_ref(program),
                            "results": results,
                            "links": {
                                "builder": links.builder(program.id),
                                "preview": links.preview(program.id),
                            },
                            "message": f"Saved {len(results)} change(s) to '{program.name}'.",
                        },
                    )
    if error:
        raise ConnectorError(error)
    return _applied_payload(change)


def change_status(*, user, token, change_id) -> dict:
    require_scope(token, READ_SCOPE)
    change = _load_own_change(user, change_id)
    status = change.status
    if status == CourseChange.Status.PREPARED and change.expires_at <= timezone.now():
        status = CourseChange.Status.EXPIRED
    payload = {
        "change_id": str(change.id),
        "status": status,
        "created_at": change.created_at.isoformat(),
        "expires_at": change.expires_at.isoformat(),
        "applied_at": change.applied_at.isoformat() if change.applied_at else None,
    }
    if _current_program(user, change) is None:
        # Previews can contain course content such as answer keys; show only the
        # outcome once the person has lost access to the course.
        payload["message"] = "You no longer have access to this course, so the change details are hidden."
        return payload
    payload.update(
        {
            "summary": change.summary,
            "course": {"id": change.program_id, "code": change.program_code},
            "affects_published_content": change.affects_published_content,
            "operations": change.preview.get("operations", []),
            "result": change.result or None,
            "error": change.error or None,
        }
    )
    return payload
