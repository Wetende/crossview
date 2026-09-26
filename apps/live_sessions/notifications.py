from __future__ import annotations

import hashlib
import json
import logging
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from apps.notifications.services import NotificationService
from apps.progression.models import Enrollment

from .models import ScheduledLearningSession


logger = logging.getLogger(__name__)


def _session_fingerprint(session):
    material = {
        "startsAt": session.starts_at.isoformat(),
        "endsAt": session.ends_at.isoformat(),
        "timezone": session.source_timezone,
        "venue": session.venue.strip(),
        "room": session.room.strip(),
        "address": session.address.strip(),
        "directions": session.directions.strip(),
        "attendanceInstructions": session.attendance_instructions.strip(),
    }
    encoded = json.dumps(material, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()[:24]


def _local_schedule(session):
    try:
        zone = ZoneInfo(session.source_timezone)
    except ZoneInfoNotFoundError:
        zone = ZoneInfo("UTC")
    start = session.starts_at.astimezone(zone)
    end = session.ends_at.astimezone(zone)
    date_label = start.strftime("%A, %d %B %Y")
    time_label = f"{start.strftime('%H:%M')}–{end.strftime('%H:%M')}"
    return f"{date_label}, {time_label} ({session.source_timezone})"


def notify_in_person_session_learners(session):
    """Queue preference-aware notifications for a material physical-session change."""
    properties = session.node.properties if isinstance(session.node.properties, dict) else {}
    if (
        session.kind != ScheduledLearningSession.Kind.IN_PERSON
        or not properties.get("notify_enrolled_learners", False)
    ):
        return {"eligible": 0, "notified": 0, "failed": 0}

    enrollments = list(
        Enrollment.objects.filter(
            program_id=session.node.program_id,
            status="active",
            user__is_active=True,
        ).select_related("user")
    )
    location = ", ".join(
        value for value in [session.venue, session.room, session.address] if value
    )
    schedule = _local_schedule(session)
    message = f"{session.title} is scheduled for {schedule}. Location: {location}."
    if session.attendance_instructions:
        message += f" Attendance instructions: {session.attendance_instructions.strip()}"

    fingerprint = _session_fingerprint(session)
    notified = failed = 0
    for enrollment in enrollments:
        key = f"scheduled-session:{session.id}:{enrollment.id}:{fingerprint}"
        try:
            NotificationService.notify_with_email(
                recipient=enrollment.user,
                notification_type="scheduled_session",
                title=f"In-person class: {session.title}",
                message=message,
                action_url=(
                    f"/student/programs/{enrollment.id}/session/{session.node_id}/"
                ),
                related_program_id=session.node.program_id,
                related_enrollment_id=enrollment.id,
                idempotency_key=key,
                email_metadata={
                    "sessionId": session.id,
                    "nodeId": session.node_id,
                    "scheduleFingerprint": fingerprint,
                },
            )
            notified += 1
        except Exception:
            failed += 1
            logger.exception(
                "Could not queue in-person session notification session_id=%s enrollment_id=%s",
                session.id,
                enrollment.id,
            )
    return {"eligible": len(enrollments), "notified": notified, "failed": failed}
