from __future__ import annotations

from datetime import datetime, timedelta, timezone as datetime_timezone
from decimal import Decimal
from urllib.parse import urlencode, urlparse
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.progression.models import Enrollment
from apps.progression.services import ProgressionEngine

from .crypto import decrypt_session_secret, encrypt_session_secret
from .models import ScheduledLearningSession, SessionAttendance, SessionAttendanceAudit


SCHEDULED_ACTIVITY_TYPES = {
    "live_class",
    ScheduledLearningSession.Kind.LIVE_MEETING,
    ScheduledLearningSession.Kind.LIVE_STREAM,
    ScheduledLearningSession.Kind.IN_PERSON,
}
LEGACY_TIMEZONE_ALIASES = {
    "PST": "America/Los_Angeles",
    "EST": "America/New_York",
}
PROVIDER_HOSTS = {
    ScheduledLearningSession.Provider.GOOGLE_MEET: {"meet.google.com"},
    ScheduledLearningSession.Provider.ZOOM: {"zoom.us"},
    ScheduledLearningSession.Provider.TEAMS: {"teams.microsoft.com"},
    ScheduledLearningSession.Provider.YOUTUBE: {"youtube.com", "www.youtube.com", "youtu.be"},
    ScheduledLearningSession.Provider.VIMEO: {"vimeo.com", "www.vimeo.com", "player.vimeo.com"},
}


def normalize_source_timezone(value):
    name = LEGACY_TIMEZONE_ALIASES.get(str(value or "").strip(), str(value or "").strip())
    if not name:
        raise ValidationError("Select an IANA timezone for this session.")
    try:
        ZoneInfo(name)
    except ZoneInfoNotFoundError as exc:
        raise ValidationError("Select a valid IANA timezone.") from exc
    return name


def infer_session_kind(properties):
    lesson_type = str(properties.get("lesson_type") or "").strip().lower()
    if lesson_type != "live_class":
        return lesson_type
    explicit = str(properties.get("session_kind") or "").strip().lower()
    if explicit in {
        ScheduledLearningSession.Kind.LIVE_MEETING,
        ScheduledLearningSession.Kind.LIVE_STREAM,
        ScheduledLearningSession.Kind.IN_PERSON,
    }:
        return explicit
    url = str(properties.get("session_url") or properties.get("video_url") or "")
    hostname = (urlparse(url).hostname or "").lower()
    if hostname.endswith("youtube.com") or hostname == "youtu.be" or hostname.endswith("vimeo.com"):
        return ScheduledLearningSession.Kind.LIVE_STREAM
    return ScheduledLearningSession.Kind.LIVE_MEETING


def infer_provider(kind, url=""):
    if kind == ScheduledLearningSession.Kind.IN_PERSON:
        return ScheduledLearningSession.Provider.PHYSICAL
    hostname = (urlparse(str(url or "")).hostname or "").lower()
    if hostname == "meet.google.com":
        return ScheduledLearningSession.Provider.GOOGLE_MEET
    if hostname == "zoom.us" or hostname.endswith(".zoom.us"):
        return ScheduledLearningSession.Provider.ZOOM
    if hostname == "teams.microsoft.com" or hostname.endswith(".teams.microsoft.com"):
        return ScheduledLearningSession.Provider.TEAMS
    if hostname in {"youtube.com", "www.youtube.com", "youtu.be"}:
        return ScheduledLearningSession.Provider.YOUTUBE
    if hostname in {"vimeo.com", "www.vimeo.com", "player.vimeo.com"}:
        return ScheduledLearningSession.Provider.VIMEO
    return ScheduledLearningSession.Provider.CUSTOM


def _parse_datetime(properties, prefix, timezone_name):
    direct = properties.get(f"{prefix}s_at") or properties.get(f"{prefix}_at")
    if direct:
        try:
            parsed = datetime.fromisoformat(str(direct).replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValidationError(f"Enter a valid {prefix} date and time.") from exc
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=ZoneInfo(timezone_name))
        return parsed.astimezone(datetime_timezone.utc)

    date_value = properties.get(f"{prefix}_date")
    time_value = properties.get(f"{prefix}_time")
    if not date_value or not time_value:
        raise ValidationError(f"Enter the session {prefix} date and time.")
    try:
        local_value = datetime.fromisoformat(f"{date_value}T{time_value}")
    except ValueError as exc:
        raise ValidationError(f"Enter a valid {prefix} date and time.") from exc
    return local_value.replace(tzinfo=ZoneInfo(timezone_name)).astimezone(
        datetime_timezone.utc
    )


def _validate_secure_url(value, *, field_name, provider):
    parsed = urlparse(str(value or "").strip())
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValidationError(f"{field_name} must be a secure HTTPS URL.")
    allowed_hosts = PROVIDER_HOSTS.get(provider)
    hostname = parsed.hostname.lower()
    if allowed_hosts and not any(
        hostname == allowed or hostname.endswith(f".{allowed}") for allowed in allowed_hosts
    ):
        raise ValidationError(f"The URL does not match the selected {provider.replace('_', ' ')} provider.")
    return parsed.geturl()


def validate_session_properties(properties):
    properties = properties if isinstance(properties, dict) else {}
    kind = infer_session_kind(properties)
    valid_kinds = {choice[0] for choice in ScheduledLearningSession.Kind.choices}
    if kind not in valid_kinds:
        raise ValidationError("Select meeting, stream, or in-person session.")

    timezone_name = normalize_source_timezone(properties.get("timezone"))
    starts_at = _parse_datetime(properties, "start", timezone_name)
    ends_at = _parse_datetime(properties, "end", timezone_name)
    if ends_at <= starts_at:
        raise ValidationError("Session end time must be after its start time.")

    raw_url = str(properties.get("session_url") or properties.get("video_url") or "").strip()
    provider = str(properties.get("provider") or infer_provider(kind, raw_url)).strip().lower()
    if kind == ScheduledLearningSession.Kind.LIVE_MEETING:
        allowed = {
            ScheduledLearningSession.Provider.GOOGLE_MEET,
            ScheduledLearningSession.Provider.ZOOM,
            ScheduledLearningSession.Provider.TEAMS,
            ScheduledLearningSession.Provider.CUSTOM,
        }
        if provider not in allowed:
            raise ValidationError("Select a meeting provider.")
        if raw_url:
            raw_url = _validate_secure_url(
                raw_url, field_name="Meeting URL", provider=provider
            )
        elif provider != ScheduledLearningSession.Provider.GOOGLE_MEET:
            raise ValidationError("Meeting URL must be a secure HTTPS URL.")
    elif kind == ScheduledLearningSession.Kind.LIVE_STREAM:
        allowed = {
            ScheduledLearningSession.Provider.YOUTUBE,
            ScheduledLearningSession.Provider.VIMEO,
            ScheduledLearningSession.Provider.CUSTOM,
        }
        if provider not in allowed:
            raise ValidationError("Select a streaming provider.")
        raw_url = _validate_secure_url(raw_url, field_name="Stream URL", provider=provider)
    else:
        provider = ScheduledLearningSession.Provider.PHYSICAL
        raw_url = ""
        if not str(properties.get("venue") or "").strip():
            raise ValidationError("Enter the venue for this in-person session.")
        if not str(properties.get("address") or "").strip():
            raise ValidationError("Enter the address for this in-person session.")

    recording_url = str(properties.get("recording_url") or "").strip()
    if recording_url:
        recording_url = _validate_secure_url(
            recording_url,
            field_name="Recording URL",
            provider=ScheduledLearningSession.Provider.CUSTOM,
        )
    return {
        "kind": kind,
        "provider": provider,
        "starts_at": starts_at,
        "ends_at": ends_at,
        "source_timezone": timezone_name,
        "join_url": raw_url,
        "recording_url": recording_url,
    }


@transaction.atomic
def sync_scheduled_session_from_node(node, *, actor=None):
    properties = dict(node.properties or {})
    lesson_type = str(properties.get("lesson_type") or "").strip().lower()
    if lesson_type not in SCHEDULED_ACTIVITY_TYPES:
        return None
    schedule = validate_session_properties(properties)
    defaults = {
        **schedule,
        "title": node.title,
        "summary": node.description or "",
        "venue": str(properties.get("venue") or "").strip(),
        "room": str(properties.get("room") or "").strip(),
        "address": str(properties.get("address") or "").strip(),
        "directions": str(properties.get("directions") or "").strip(),
        "attendance_instructions": str(properties.get("attendance_instructions") or "").strip(),
    }
    session, created = ScheduledLearningSession.objects.update_or_create(
        node=node,
        defaults={**defaults, **({"created_by": actor} if actor and not hasattr(node, "scheduled_session") else {})},
    )
    provider_metadata = dict(session.provider_metadata or {})
    provider_metadata["calendarVisibility"] = str(
        properties.get("session_visibility") or "private"
    )
    if provider_metadata != session.provider_metadata:
        session.provider_metadata = provider_metadata
        session.save(update_fields=["provider_metadata", "updated_at"])
    passcode = str(properties.get("meeting_password") or "")
    if passcode:
        session.passcode_ciphertext = encrypt_session_secret(passcode)
        session.save(update_fields=["passcode_ciphertext", "updated_at"])
    elif properties.get("clear_meeting_password"):
        session.passcode_ciphertext = ""
        session.save(update_fields=["passcode_ciphertext", "updated_at"])

    for secret_or_legacy_setting in (
        "meeting_password",
        "clear_meeting_password",
        "host_video",
        "participant_video",
        "mute_upon_entry",
        "require_auth",
    ):
        properties.pop(secret_or_legacy_setting, None)
    properties.update(
        {
            "scheduled_session_id": session.id,
            "session_kind": session.kind,
            "provider": session.provider,
            "timezone": session.source_timezone,
        }
    )
    node.properties = properties
    node.save(update_fields=["properties", "updated_at"])
    return session


def _calendar_url(session):
    details = session.summary or session.attendance_instructions
    location = session.join_url if session.kind != ScheduledLearningSession.Kind.IN_PERSON else ", ".join(
        value for value in [session.venue, session.room, session.address] if value
    )
    params = {
        "action": "TEMPLATE",
        "text": session.title,
        "dates": f"{session.starts_at:%Y%m%dT%H%M%SZ}/{session.ends_at:%Y%m%dT%H%M%SZ}",
        "details": details,
        "location": location,
    }
    return f"https://calendar.google.com/calendar/render?{urlencode(params)}"


def serialize_session_for_author(session):
    if not session:
        return None
    return {
        "id": session.id,
        "kind": session.kind,
        "provider": session.provider,
        "title": session.title,
        "summary": session.summary,
        "startsAt": session.starts_at.isoformat(),
        "endsAt": session.ends_at.isoformat(),
        "timezone": session.source_timezone,
        "joinUrl": session.join_url,
        "recordingUrl": session.recording_url,
        "hasPasscode": bool(session.passcode_ciphertext),
        "venue": session.venue,
        "room": session.room,
        "address": session.address,
        "directions": session.directions,
        "attendanceInstructions": session.attendance_instructions,
        "attendanceThresholdPercent": session.attendance_threshold_percent,
        "status": session.status,
        "providerEventId": session.provider_event_id,
        "calendarVisibility": (session.provider_metadata or {}).get(
            "calendarVisibility", "private"
        ),
        "calendarHtmlLink": (session.provider_metadata or {}).get(
            "calendarHtmlLink", ""
        ),
        "unmatchedAttendanceCount": len(
            (session.provider_metadata or {}).get("unmatchedParticipants", [])
        ),
        "lastSyncAt": session.last_sync_at.isoformat() if session.last_sync_at else None,
        "lastSyncError": session.last_sync_error,
    }


def serialize_session_for_student(session, *, enrollment=None, now=None):
    if not session:
        return None
    now = now or timezone.now()
    join_opens_at = session.starts_at - timedelta(minutes=session.join_opens_before_minutes)
    join_closes_at = session.ends_at
    is_joinable = (
        session.status == ScheduledLearningSession.Status.SCHEDULED
        and session.kind != ScheduledLearningSession.Kind.IN_PERSON
        and bool(session.join_url)
        and join_opens_at <= now <= join_closes_at
    )
    has_ended = now > session.ends_at or session.status == ScheduledLearningSession.Status.COMPLETED
    attendance = (
        session.attendance_records.filter(enrollment=enrollment).first()
        if enrollment
        else None
    )
    return {
        "id": session.id,
        "kind": session.kind,
        "provider": session.provider,
        "title": session.title,
        "summary": session.summary,
        "startsAt": session.starts_at.isoformat(),
        "endsAt": session.ends_at.isoformat(),
        "timezone": session.source_timezone,
        "status": session.status,
        "isJoinable": is_joinable,
        "hasJoinDetails": bool(session.join_url),
        "hasEnded": has_ended,
        "joinUrl": session.join_url if is_joinable else None,
        "passcode": decrypt_session_secret(session.passcode_ciphertext) if is_joinable else None,
        "recordingUrl": session.recording_url if has_ended and session.recording_url else None,
        "calendarUrl": _calendar_url(session),
        "venue": session.venue,
        "room": session.room,
        "address": session.address,
        "directions": session.directions,
        "attendanceInstructions": session.attendance_instructions,
        "attendance": {
            "status": attendance.status,
            "source": attendance.source,
            "attendancePercent": float(attendance.attendance_percent),
        }
        if attendance
        else {"status": "pending", "source": None, "attendancePercent": 0},
        "lessonUrl": (
            f"/student/programs/{enrollment.id}/session/{session.node_id}/"
            if enrollment
            else None
        ),
        "providerState": (
            "authorization_required"
            if (session.provider_metadata or {}).get("syncPaused")
            else "sync_failed"
            if session.last_sync_error
            else "ready"
        ),
    }


def build_player_delivery_context(program, enrollment):
    from apps.curriculum.activity_types import normalize_activity_type
    from apps.learning_operations.services import get_course_delivery_profile

    now = timezone.now()
    profile = get_course_delivery_profile(program)
    sessions = list(
        ScheduledLearningSession.objects.filter(
            node__program=program,
            node__is_published=True,
        )
        .exclude(status=ScheduledLearningSession.Status.CANCELLED)
        .select_related("node")
        .order_by("starts_at", "id")
    )
    upcoming = [session for session in sessions if session.ends_at >= now]
    next_session = upcoming[0] if upcoming else None
    recent_recording = next(
        (
            session
            for session in reversed(sessions)
            if session.ends_at < now and session.recording_url
        ),
        None,
    )
    online_kinds = {
        ScheduledLearningSession.Kind.LIVE_MEETING,
        ScheduledLearningSession.Kind.LIVE_STREAM,
    }
    has_online_session = any(session.kind in online_kinds for session in upcoming)
    has_physical_session = any(
        session.kind == ScheduledLearningSession.Kind.IN_PERSON
        for session in upcoming
    )
    leaf_nodes = program.curriculum_nodes.filter(
        is_published=True,
        children__isnull=True,
    ).values_list("node_type", "properties")
    has_independent_content = any(
        normalize_activity_type(node_type, properties)
        not in {
            "live_meeting",
            "live_stream",
            "in_person_session",
        }
        for node_type, properties in leaf_nodes
    )
    warnings = []
    if profile.delivery_mode == "live_online" and not has_online_session:
        warnings.append("No upcoming live meeting or stream is scheduled yet.")
    elif profile.delivery_mode == "blended":
        if not has_independent_content:
            warnings.append("Independent online learning content is not available yet.")
        if not (has_online_session or has_physical_session):
            warnings.append("No upcoming live or in-person session is scheduled yet.")
    elif profile.delivery_mode == "in_person" and not has_physical_session:
        warnings.append("No upcoming in-person session is scheduled yet.")
    elif profile.delivery_mode == "self_paced" and upcoming:
        warnings.append("This self-paced course includes scheduled attendance.")
    return {
        "deliveryMode": profile.delivery_mode,
        "deliveryReadiness": {
            "ready": not warnings,
            "warnings": warnings,
            "hasIndependentContent": has_independent_content,
            "hasOnlineSession": has_online_session,
            "hasPhysicalSession": has_physical_session,
        },
        "nextScheduledSession": serialize_session_for_student(
            next_session, enrollment=enrollment, now=now
        ),
        "upcomingSessionCount": len(upcoming),
        "recentSessionRecording": serialize_session_for_student(
            recent_recording, enrollment=enrollment, now=now
        ),
    }


def serialize_attendance_roster(session):
    existing = {row.enrollment_id: row for row in session.attendance_records.all()}
    rows = []
    enrollments = Enrollment.objects.filter(
        program=session.node.program,
        status__in=["active", "completed"],
    ).select_related("user")
    for enrollment in enrollments:
        attendance = existing.get(enrollment.id)
        rows.append(
            {
                "enrollmentId": enrollment.id,
                "learner": {
                    "id": enrollment.user_id,
                    "name": enrollment.user.get_full_name() or enrollment.user.email,
                    "email": enrollment.user.email,
                },
                "status": attendance.status if attendance else SessionAttendance.Status.PENDING,
                "source": attendance.source if attendance else None,
                "attendedSeconds": attendance.attended_seconds if attendance else 0,
                "attendancePercent": float(attendance.attendance_percent) if attendance else 0,
                "verifiedAt": attendance.verified_at.isoformat() if attendance and attendance.verified_at else None,
            }
        )
    return rows


@transaction.atomic
def override_attendance(*, session, enrollment, status, reason, actor):
    if enrollment.program_id != session.node.program_id:
        raise ValidationError("Enrollment does not belong to this course.")
    if not str(reason or "").strip():
        raise ValidationError("Give a reason for the attendance override.")
    allowed = {choice[0] for choice in SessionAttendance.Status.choices}
    if status not in allowed - {SessionAttendance.Status.PENDING}:
        raise ValidationError("Select present, absent, or excused.")
    attendance, _ = SessionAttendance.objects.select_for_update().get_or_create(
        session=session,
        enrollment=enrollment,
    )
    previous = attendance.status
    attendance.status = status
    attendance.source = SessionAttendance.Source.INSTRUCTOR
    attendance.verified_at = timezone.now()
    attendance.verified_by = actor
    if status == SessionAttendance.Status.PRESENT:
        attendance.attendance_percent = Decimal("100")
    attendance.save()
    SessionAttendanceAudit.objects.create(
        session=session,
        enrollment=enrollment,
        actor=actor,
        previous_status=previous,
        resulting_status=status,
        reason=str(reason).strip(),
    )
    if status == SessionAttendance.Status.PRESENT:
        ProgressionEngine().mark_complete(
            enrollment=enrollment,
            node=session.node,
            completion_type="manual",
            metadata={"source": "attendance_override", "sessionId": session.id},
        )
    return attendance
