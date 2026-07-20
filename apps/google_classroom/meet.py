from __future__ import annotations

import hashlib
from datetime import datetime
from urllib.parse import urlparse

from django.db import transaction
from django.utils import timezone

from apps.progression.models import Enrollment
from apps.progression.services import ProgressionEngine

from .adapter import ClassroomAPIError, categorize_google_error
from .configuration import (
    classroom_public_base_url,
    decrypt_refresh_token,
    require_capabilities,
    require_workspace_configuration,
)
from .models import ClassroomRosterMapping
from .services import require_connected_credential


def _credentials(credential):
    from google.oauth2.credentials import Credentials

    configuration = require_workspace_configuration()
    return Credentials(
        token=None,
        refresh_token=decrypt_refresh_token(credential.refresh_token_ciphertext),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=configuration["client_id"],
        client_secret=configuration["client_secret"],
        scopes=credential.granted_scopes,
    )


def _execute(credential, request):
    try:
        return request.execute()
    except Exception as exc:
        category = categorize_google_error(exc)
        if category == "authorization_invalid":
            credential.status = credential.Status.INVALID
            credential.last_error = "Google Workspace authorization is no longer valid."
            credential.save(update_fields=["status", "last_error", "updated_at"])
            credential.course_links.update(sync_paused=True)
            set_google_meet_sync_paused(
                credential.user, True, reason="authorization_invalid"
            )
        raise ClassroomAPIError(
            "Google Workspace rejected the meeting request.",
            category=category,
            status_code=getattr(getattr(exc, "resp", None), "status", None),
        ) from exc


def _list_all(credential, method, collection_key, **kwargs):
    rows = []
    page_token = None
    while True:
        response = _execute(
            credential,
            method(pageToken=page_token, **kwargs),
        )
        rows.extend(response.get(collection_key, []))
        page_token = response.get("nextPageToken")
        if not page_token:
            return rows


def _meeting_code(url):
    parsed = urlparse(str(url or ""))
    return parsed.path.strip("/").split("/")[0] if parsed.hostname == "meet.google.com" else ""


class GoogleMeetAdapter:
    """Calendar and Meet API boundary for one connected teacher account."""

    def __init__(self, credential, *, calendar_service=None, meet_service=None):
        self.credential = credential
        self._calendar_service = calendar_service
        self._meet_service = meet_service

    @property
    def calendar_service(self):
        if self._calendar_service is None:
            from googleapiclient.discovery import build

            self._calendar_service = build(
                "calendar", "v3", credentials=_credentials(self.credential), cache_discovery=False
            )
        return self._calendar_service

    @property
    def meet_service(self):
        if self._meet_service is None:
            from googleapiclient.discovery import build

            self._meet_service = build(
                "meet", "v2", credentials=_credentials(self.credential), cache_discovery=False
            )
        return self._meet_service

    def _event_body(self, session, *, attendees=None):
        launch_url = (
            f"{classroom_public_base_url()}/student/courses/"
            f"{session.node.program_id}/lessons/{session.node_id}/launch/"
        )
        description = "\n\n".join(
            value for value in [session.summary.strip(), f"Open this lesson: {launch_url}"] if value
        )
        metadata = session.provider_metadata or {}
        body = {
            "summary": session.title,
            "description": description,
            "start": {
                "dateTime": session.starts_at.isoformat(),
                "timeZone": session.source_timezone,
            },
            "end": {
                "dateTime": session.ends_at.isoformat(),
                "timeZone": session.source_timezone,
            },
            "visibility": metadata.get("calendarVisibility", "private"),
            "extendedProperties": {
                "private": {
                    "lmsSessionId": str(session.id),
                    "lmsNodeId": str(session.node_id),
                }
            },
        }
        if attendees is not None:
            body["attendees"] = [{"email": email} for email in attendees]
        return body

    def create_event(self, session, *, attendee_emails=None, request_id=None):
        attendee_emails = list(dict.fromkeys(attendee_emails or []))
        request_id = request_id or f"lms-meet-{session.id}"
        body = self._event_body(session, attendees=attendee_emails)
        body["id"] = hashlib.sha256(request_id.encode()).hexdigest()[:32]
        body["conferenceData"] = {
            "createRequest": {
                "requestId": request_id,
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        }
        endpoint = self.calendar_service.events()
        try:
            return _execute(
                self.credential,
                endpoint.insert(
                    calendarId="primary",
                    body=body,
                    conferenceDataVersion=1,
                    sendUpdates="all" if attendee_emails else "none",
                ),
            )
        except ClassroomAPIError as exc:
            if exc.status_code != 409:
                raise
            return _execute(
                self.credential,
                endpoint.get(calendarId="primary", eventId=body["id"]),
            )

    def update_event(self, session):
        return _execute(
            self.credential,
            self.calendar_service.events().patch(
                calendarId="primary",
                eventId=session.provider_event_id,
                body=self._event_body(session),
                conferenceDataVersion=1,
                sendUpdates="all",
            ),
        )

    def cancel_event(self, session):
        return _execute(
            self.credential,
            self.calendar_service.events().delete(
                calendarId="primary",
                eventId=session.provider_event_id,
                sendUpdates="all",
            ),
        )

    def collect_conference(self, session):
        metadata = session.provider_metadata or {}
        meeting_code = metadata.get("meetingCode") or _meeting_code(session.join_url)
        if not meeting_code:
            raise ClassroomAPIError(
                "The Google Meet code is unavailable.", category="conference_not_ready"
            )
        records = _list_all(
            self.credential,
            self.meet_service.conferenceRecords().list,
            "conferenceRecords",
            filter=f'space.meeting_code = "{meeting_code}"',
            pageSize=100,
        )
        if not records:
            raise ClassroomAPIError(
                "Google Meet attendance is not ready yet.", category="conference_not_ready"
            )
        record = max(records, key=lambda item: item.get("startTime", ""))
        record_name = record["name"]
        participants = _list_all(
            self.credential,
            self.meet_service.conferenceRecords().participants().list,
            "participants",
            parent=record_name,
            pageSize=250,
        )
        attendance = []
        for participant in participants:
            participant_name = participant.get("name", "")
            sessions = _list_all(
                self.credential,
                self.meet_service.conferenceRecords()
                .participants()
                .participantSessions()
                .list,
                "participantSessions",
                parent=participant_name,
                pageSize=250,
            )
            attendance.append(
                {
                    "participantName": participant_name,
                    "externalUserId": participant.get("signedinUser", {}).get("user", ""),
                    "displayName": (
                        participant.get("signedinUser", {}).get("displayName")
                        or participant.get("anonymousUser", {}).get("displayName")
                        or participant.get("phoneUser", {}).get("displayName")
                        or "Unidentified participant"
                    ),
                    "sessions": sessions,
                }
            )
        recordings = _list_all(
            self.credential,
            self.meet_service.conferenceRecords().recordings().list,
            "recordings",
            parent=record_name,
            pageSize=100,
        )
        ready_recording = next(
            (
                item.get("driveDestination", {}).get("exportUri", "")
                for item in recordings
                if item.get("state") == "FILE_GENERATED"
                and item.get("driveDestination", {}).get("exportUri")
            ),
            "",
        )
        return {
            "record": record,
            "attendance": attendance,
            "recordingUrl": ready_recording,
        }


def eligible_attendee_preview(session):
    enrollments = Enrollment.objects.filter(
        program=session.node.program,
        status="active",
    ).select_related("user")
    rows = [
        {
            "enrollmentId": enrollment.id,
            "name": enrollment.user.get_full_name() or enrollment.user.email,
            "email": enrollment.user.email,
            "eligible": bool(enrollment.user.email),
        }
        for enrollment in enrollments
    ]
    return {
        "eligible": sum(1 for row in rows if row["eligible"]),
        "ineligible": sum(1 for row in rows if not row["eligible"]),
        "learners": rows,
    }


@transaction.atomic
def store_created_event(
    session,
    remote,
    *,
    invited_enrollment_ids=None,
    credential=None,
):
    conference_data = remote.get("conferenceData", {})
    entry_points = conference_data.get("entryPoints", [])
    join_url = remote.get("hangoutLink") or next(
        (item.get("uri", "") for item in entry_points if item.get("entryPointType") == "video"),
        "",
    )
    if not join_url:
        raise ClassroomAPIError(
            "Google Calendar did not return a Meet link.", category="conference_not_ready"
        )
    metadata = dict(session.provider_metadata or {})
    metadata.update(
        {
            "meetingCode": _meeting_code(join_url),
            "calendarHtmlLink": remote.get("htmlLink", ""),
            "calendarVisibility": remote.get("visibility", metadata.get("calendarVisibility", "private")),
            "invitedEnrollmentIds": invited_enrollment_ids or [],
            **(
                {
                    "googleCredentialId": credential.id,
                    "googleOrganizerEmail": credential.google_email,
                }
                if credential
                else {}
            ),
        }
    )
    session.provider_event_id = str(remote.get("id", ""))
    session.provider_conference_id = str(conference_data.get("conferenceId", ""))
    session.join_url = join_url
    session.provider_metadata = metadata
    session.last_sync_at = timezone.now()
    session.last_sync_error = ""
    session.save()
    properties = dict(session.node.properties or {})
    properties.update(
        {
            "provider": "google_meet",
            "session_provider": "google_meet",
            "session_url": join_url,
            "video_url": join_url,
            "provider_event_id": session.provider_event_id,
            "provider_conference_id": session.provider_conference_id,
        }
    )
    session.node.properties = properties
    session.node.save(update_fields=["properties", "updated_at"])
    return session


def _parse_time(value):
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _attended_seconds(session, participant_sessions):
    intervals = []
    for item in participant_sessions:
        if not item.get("startTime"):
            continue
        start = max(_parse_time(item["startTime"]), session.starts_at)
        end = min(
            _parse_time(item.get("endTime") or timezone.now().isoformat()),
            session.ends_at,
        )
        if end > start:
            intervals.append((start, end))
    intervals.sort()
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return int(sum((end - start).total_seconds() for start, end in merged))


@transaction.atomic
def apply_meet_conference(session, result):
    from apps.live_sessions.models import ScheduledLearningSession, SessionAttendance

    mappings = ClassroomRosterMapping.objects.filter(
        course_link__program=session.node.program,
        enrollment__isnull=False,
        google_user_id__gt="",
        status=ClassroomRosterMapping.Status.MATCHED,
    ).select_related("enrollment")
    by_google_id = {
        mapping.google_user_id.removeprefix("users/"): mapping.enrollment
        for mapping in mappings
    }
    scheduled_seconds = max(int((session.ends_at - session.starts_at).total_seconds()), 1)
    unmatched = []
    for row in result["attendance"]:
        external_id = row["externalUserId"].removeprefix("users/")
        enrollment = by_google_id.get(external_id)
        if not enrollment:
            unmatched.append(
                {
                    "participantName": row["participantName"],
                    "displayName": row["displayName"],
                    "externalUserId": row["externalUserId"],
                }
            )
            continue
        attended_seconds = _attended_seconds(session, row["sessions"])
        percent = min((attended_seconds / scheduled_seconds) * 100, 100)
        status = (
            SessionAttendance.Status.PRESENT
            if percent >= session.attendance_threshold_percent
            else SessionAttendance.Status.ABSENT
        )
        attendance, _ = SessionAttendance.objects.update_or_create(
            session=session,
            enrollment=enrollment,
            defaults={
                "status": status,
                "source": SessionAttendance.Source.PROVIDER,
                "attended_seconds": attended_seconds,
                "attendance_percent": percent,
                "external_participant_id": row["participantName"],
                "verified_at": timezone.now(),
                "verified_by": None,
            },
        )
        if attendance.status == SessionAttendance.Status.PRESENT:
            ProgressionEngine().mark_complete(
                enrollment=enrollment,
                node=session.node,
                completion_type="attendance",
                metadata={"source": "google_meet", "sessionId": session.id},
            )
    metadata = dict(session.provider_metadata or {})
    metadata["conferenceRecord"] = result["record"].get("name", "")
    metadata["unmatchedParticipants"] = unmatched
    session.provider_metadata = metadata
    if result.get("recordingUrl"):
        session.recording_url = result["recordingUrl"]
    if result["record"].get("endTime"):
        session.status = ScheduledLearningSession.Status.COMPLETED
    session.last_sync_at = timezone.now()
    session.last_sync_error = ""
    session.save()
    return {
        "matched": len(result["attendance"]) - len(unmatched),
        "unmatched": len(unmatched),
        "recordingAvailable": bool(result.get("recordingUrl")),
    }


def credential_for_session(session, actor=None):
    if (session.provider_metadata or {}).get("syncPaused"):
        raise ClassroomAPIError(
            "Google Meet synchronization is paused until the teacher reconnects Google.",
            category="sync_paused",
        )
    credential_id = (session.provider_metadata or {}).get("googleCredentialId")
    if credential_id:
        from .models import ClassroomOAuthCredential

        credential = ClassroomOAuthCredential.objects.filter(
            pk=credential_id,
            status=ClassroomOAuthCredential.Status.CONNECTED,
        ).first()
        if not credential:
            raise ClassroomAPIError(
                "Reconnect the Google account that created this meeting.",
                category="authorization_invalid",
            )
    else:
        credential = require_connected_credential(actor or session.created_by)
    require_capabilities(credential, ["calendar_events", "meet_attendance"])
    return credential


def set_google_meet_sync_paused(user, paused, *, reason=""):
    from apps.live_sessions.models import ScheduledLearningSession

    sessions = ScheduledLearningSession.objects.filter(
        provider=ScheduledLearningSession.Provider.GOOGLE_MEET,
        created_by=user,
    )
    for session in sessions.iterator():
        metadata = dict(session.provider_metadata or {})
        if paused:
            metadata["syncPaused"] = True
            metadata["syncPausedReason"] = reason
        else:
            metadata.pop("syncPaused", None)
            metadata.pop("syncPausedReason", None)
        session.provider_metadata = metadata
        session.save(update_fields=["provider_metadata", "updated_at"])
