"""Previewed, permission-scoped learner direct messages."""

import logging
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.db.models.functions import Coalesce
from django.utils import timezone

from apps.messaging.services import MessagingService
from apps.learning_operations.models import EnrollmentLearningActivity
from apps.progression.models import Enrollment

from .access import (
    AccessDenied, ConnectorError, LEARNERS_SCOPE, MESSAGES_SCOPE,
    get_program_for_user, require_scope,
)
from .changes import _client_name, _finish, _load_own_change, _require_same_client
from .content import Links
from .models import CourseChange
from .sanitize import plain_text

MAX_RECIPIENTS = 50
MAX_MESSAGE_LENGTH = 5000
logger = logging.getLogger(__name__)


def _days(value):
    if value is None:
        return None
    try:
        days = int(value)
    except (TypeError, ValueError):
        raise ConnectorError("inactivity_days must be a whole number from 1 to 365.")
    if not 1 <= days <= 365:
        raise ConnectorError("inactivity_days must be from 1 to 365.")
    return days


def _last_activity(enrollment):
    try:
        activity = enrollment.learning_activity
    except EnrollmentLearningActivity.DoesNotExist:
        activity = None
    return activity.last_activity_at if activity and activity.last_activity_at else None


def _qualifies(enrollment, days, at):
    last = _last_activity(enrollment)
    basis = last or enrollment.enrolled_at
    return days is None or basis <= at - timedelta(days=days)


def _snapshot(enrollment):
    last = _last_activity(enrollment)
    return {
        "enrollment_id": enrollment.id,
        "user_id": enrollment.user_id,
        "name": enrollment.user.get_full_name() or enrollment.user.email,
        "email": enrollment.user.email,
        "last_recorded_activity_at": last.isoformat() if last else None,
        "enrolled_at": enrollment.enrolled_at.isoformat(),
    }


def prepare_message(*, user, token, links: Links, course_id, content, enrollment_ids=None, inactivity_days=None):
    require_scope(token, LEARNERS_SCOPE)
    require_scope(token, MESSAGES_SCOPE)
    program = get_program_for_user(user, course_id)
    body = plain_text(content)
    if not body or len(body) > MAX_MESSAGE_LENGTH:
        raise ConnectorError(f"Message must contain 1-{MAX_MESSAGE_LENGTH} plain-text characters.")
    days = _days(inactivity_days)
    if enrollment_ids is None and days is None:
        raise ConnectorError("Specify enrollment_ids or inactivity_days to select recipients.")
    now = timezone.now()
    active_enrollments = Enrollment.objects.filter(program=program, status="active").filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=now)
    )
    if enrollment_ids is not None:
        if not isinstance(enrollment_ids, list) or not enrollment_ids or len(enrollment_ids) > MAX_RECIPIENTS:
            raise ConnectorError(f"Select 1-{MAX_RECIPIENTS} enrollment IDs.")
        try:
            selected = [int(value) for value in enrollment_ids]
        except (TypeError, ValueError):
            raise ConnectorError("Enrollment IDs must be whole numbers.")
        if len(set(selected)) != len(selected):
            raise ConnectorError("Do not repeat an enrollment ID.")
        rows = list(active_enrollments.filter(pk__in=selected).select_related("user", "learning_activity"))
        if len(rows) != len(selected):
            raise AccessDenied("One or more selected learners are not active in this course.")
        by_id = {row.id: row for row in rows}
        rows = [by_id[pk] for pk in selected]
    else:
        matching = active_enrollments.alias(
            activity_basis=Coalesce("learning_activity__last_activity_at", "enrolled_at"),
        ).filter(activity_basis__lte=now - timedelta(days=days))
        match_count = matching.count()
        if match_count > MAX_RECIPIENTS:
            raise ConnectorError(
                f"{match_count} learners match. A single confirmed send is limited to {MAX_RECIPIENTS}; "
                "select a smaller set of enrollment_ids from list_course_learners."
            )
        rows = list(matching.select_related("user", "learning_activity").order_by("id"))
    if not rows:
        raise ConnectorError("No active learners match this selection.")
    if any(not _qualifies(row, days, now) for row in rows):
        raise ConnectorError("One or more selected learners do not meet the inactivity threshold.")
    if any(not row.user.is_active or not MessagingService.can_initiate_conversation(user, row.user) for row in rows):
        raise AccessDenied("Your account cannot message one or more selected learners.")
    recipients = [_snapshot(row) for row in rows]
    change = CourseChange.objects.create(
        user=user, user_email=user.email or "", kind="learner_message",
        program=program, program_code=program.code,
        application=getattr(token, "application", None), client_name=_client_name(token),
        summary=f"Message {len(rows)} learner(s) in {program.name}",
        operations=[{"op": "send_learner_message", "body": body, "enrollment_ids": [row.id for row in rows], "inactivity_days": days}],
        preview={"channel": "LMS private direct message and in-app notification", "body": body, "recipients": recipients, "inactivity_days": days},
        target_versions={},
        expires_at=now + timedelta(hours=getattr(settings, "AI_CONNECTOR_CHANGE_TTL_HOURS", 24)),
    )
    return {
        "change_id": str(change.id), "status": change.status,
        "course": {"id": program.id, "title": program.name},
        "preview": change.preview, "recipient_count": len(rows),
        "note": "No message was sent. Show the exact recipients and text; ask for separate confirmation before applying.",
        "expires_at": change.expires_at.isoformat(),
    }


def apply_message(*, user, token, links: Links, change_id):
    require_scope(token, LEARNERS_SCOPE)
    require_scope(token, MESSAGES_SCOPE)
    error = None
    with transaction.atomic():
        change = _load_own_change(user, change_id, lock=True)
        _require_same_client(change, token)
        if change.kind != "learner_message":
            raise ConnectorError("This ID is not a prepared learner message.")
        program = get_program_for_user(user, change.program_id)
        if change.status == CourseChange.Status.APPLIED:
            return {"change_id": str(change.id), "status": "applied", **change.result, "replayed": True}
        if change.status != CourseChange.Status.PREPARED:
            raise ConnectorError(f"This message is {change.status}; prepare a fresh preview.")
        if change.expires_at <= timezone.now():
            error = "The preview expired. Prepare a new message preview."
            _finish(change, CourseChange.Status.EXPIRED, error=error)
        else:
            operation = change.operations[0]
            ids = operation["enrollment_ids"]
            rows = list(
                Enrollment.objects.select_for_update().filter(
                    program=program, status="active", pk__in=ids,
                ).filter(
                    Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
                ).select_related("user").prefetch_related("learning_activity")
            )
            by_id = {row.id: row for row in rows}
            if len(rows) != len(ids) or any(
                not by_id[row_id].user.is_active
                or not _qualifies(by_id[row_id], operation["inactivity_days"], timezone.now())
                or not MessagingService.can_initiate_conversation(user, by_id[row_id].user)
                or _snapshot(by_id[row_id]) != snapshot
                for row_id, snapshot in zip(ids, change.preview["recipients"])
                if row_id in by_id
            ):
                error = "Recipients, permissions or activity changed since the preview. Nothing was sent. Prepare a fresh preview."
                _finish(change, CourseChange.Status.STALE, error=error)
            else:
                try:
                    with transaction.atomic():
                        sent = []
                        for row_id in ids:
                            recipient = by_id[row_id].user
                            conversation, _ = MessagingService.get_or_create_conversation(user, recipient)
                            message = MessagingService.send_message(conversation, user, operation["body"])
                            sent.append({"enrollment_id": row_id, "message_id": message.id, "conversation_id": conversation.id})
                except Exception:
                    logger.exception("AI connector learner-message change %s failed", change.id)
                    error = "Message delivery failed; no messages were saved. Check LMS logs before retrying."
                    _finish(change, CourseChange.Status.FAILED, error=error)
                else:
                    _finish(change, CourseChange.Status.APPLIED, token=token, result={
                        "course_id": program.id, "sent_count": len(sent),
                        "messages": sent,
                        "message": f"Sent {len(sent)} private LMS message(s).",
                    })
    if error:
        raise ConnectorError(error)
    return {"change_id": str(change.id), "status": "applied", **change.result}
