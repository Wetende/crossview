from __future__ import annotations

import hashlib
from datetime import datetime
from urllib.parse import urlparse

from django.db import transaction
from django.utils import timezone

from apps.progression.models import Enrollment
from .adapter import GoogleWorkspaceAPIError, categorize_google_error
from .configuration import decrypt_refresh_token, require_capabilities, require_workspace_configuration, workspace_public_base_url
from .models import GoogleParticipantIdentity, GoogleWorkspaceCredential
from .services import require_connected_credential


def _credentials(credential):
    from google.oauth2.credentials import Credentials
    configuration = require_workspace_configuration()
    return Credentials(token=None, refresh_token=decrypt_refresh_token(credential.refresh_token_ciphertext), token_uri="https://oauth2.googleapis.com/token", client_id=configuration["client_id"], client_secret=configuration["client_secret"], scopes=credential.granted_scopes)


def _execute(credential, request):
    try:
        return request.execute()
    except Exception as exc:
        category = categorize_google_error(exc)
        if category == "authorization_invalid":
            credential.status = credential.Status.INVALID
            credential.last_error = "Google Workspace authorization is no longer valid."
            credential.save(update_fields=["status", "last_error", "updated_at"])
            set_google_meet_sync_paused(credential.user, True, reason="authorization_invalid")
        raise GoogleWorkspaceAPIError("Google Workspace rejected the meeting request.", category=category, status_code=getattr(getattr(exc, "resp", None), "status", None)) from exc


def _list_all(credential, method, key, **kwargs):
    rows, page_token = [], None
    while True:
        response = _execute(credential, method(pageToken=page_token, **kwargs))
        rows.extend(response.get(key, []))
        page_token = response.get("nextPageToken")
        if not page_token:
            return rows


def _meeting_code(url):
    parsed = urlparse(str(url or ""))
    return parsed.path.strip("/").split("/")[0] if parsed.hostname == "meet.google.com" else ""


class GoogleMeetAdapter:
    def __init__(self, credential, *, calendar_service=None, meet_service=None):
        self.credential, self._calendar_service, self._meet_service = credential, calendar_service, meet_service
    @property
    def calendar_service(self):
        if self._calendar_service is None:
            from googleapiclient.discovery import build
            self._calendar_service = build("calendar", "v3", credentials=_credentials(self.credential), cache_discovery=False)
        return self._calendar_service
    @property
    def meet_service(self):
        if self._meet_service is None:
            from googleapiclient.discovery import build
            self._meet_service = build("meet", "v2", credentials=_credentials(self.credential), cache_discovery=False)
        return self._meet_service
    def _event_body(self, session, attendees=None):
        launch_url = f"{workspace_public_base_url()}/student/courses/{session.node.program_id}/lessons/{session.node_id}/launch/"
        description = "\n\n".join(value for value in [session.summary.strip(), f"Open this lesson: {launch_url}"] if value)
        body = {"summary": session.title, "description": description, "start": {"dateTime": session.starts_at.isoformat(), "timeZone": session.source_timezone}, "end": {"dateTime": session.ends_at.isoformat(), "timeZone": session.source_timezone}, "visibility": session.calendar_visibility, "extendedProperties": {"private": {"lmsSessionId": str(session.id), "lmsNodeId": str(session.node_id)}}, "reminders": {"useDefault": False, "overrides": [{"method": "popup", "minutes": session.reminder_minutes}]}}
        if attendees is not None:
            body["attendees"] = [{"email": email} for email in attendees]
        return body
    def create_event(self, session, *, attendee_emails=None, request_id=None):
        request_id = request_id or f"lms-meet-{session.id}"
        body = self._event_body(session, list(dict.fromkeys(attendee_emails or [])))
        body["id"] = hashlib.sha256(request_id.encode()).hexdigest()[:32]
        body["conferenceData"] = {"createRequest": {"requestId": request_id, "conferenceSolutionKey": {"type": "hangoutsMeet"}}}
        endpoint = self.calendar_service.events()
        try:
            return _execute(self.credential, endpoint.insert(calendarId="primary", body=body, conferenceDataVersion=1, sendUpdates=session.send_updates if attendee_emails else "none"))
        except GoogleWorkspaceAPIError as exc:
            if exc.status_code != 409:
                raise
            return _execute(self.credential, endpoint.get(calendarId="primary", eventId=body["id"]))
    def update_event(self, session, attendee_emails=None):
        return _execute(self.credential, self.calendar_service.events().patch(calendarId="primary", eventId=session.provider_event_id, body=self._event_body(session, attendee_emails), conferenceDataVersion=1, sendUpdates=session.send_updates))
    def cancel_event(self, session):
        return _execute(self.credential, self.calendar_service.events().delete(calendarId="primary", eventId=session.provider_event_id, sendUpdates=session.send_updates))
    def collect_conference(self, session):
        meeting_code = (session.provider_metadata or {}).get("meetingCode") or _meeting_code(session.join_url)
        if not meeting_code:
            raise GoogleWorkspaceAPIError("The Google Meet code is unavailable.", category="conference_not_ready")
        records = _list_all(self.credential, self.meet_service.conferenceRecords().list, "conferenceRecords", filter=f'space.meeting_code = "{meeting_code}"', pageSize=100)
        if not records:
            raise GoogleWorkspaceAPIError("Google Meet attendance is not ready yet.", category="conference_not_ready")
        record = max(records, key=lambda item: item.get("startTime", ""))
        attendance = []
        for participant in _list_all(self.credential, self.meet_service.conferenceRecords().participants().list, "participants", parent=record["name"], pageSize=250):
            participant_name = participant.get("name", "")
            attendance.append({"participantName": participant_name, "externalUserId": participant.get("signedinUser", {}).get("user", ""), "displayName": participant.get("signedinUser", {}).get("displayName") or participant.get("anonymousUser", {}).get("displayName") or participant.get("phoneUser", {}).get("displayName") or "Unidentified participant", "sessions": _list_all(self.credential, self.meet_service.conferenceRecords().participants().participantSessions().list, "participantSessions", parent=participant_name, pageSize=250)})
        recordings = _list_all(self.credential, self.meet_service.conferenceRecords().recordings().list, "recordings", parent=record["name"], pageSize=100)
        recording = next((row.get("driveDestination", {}).get("exportUri", "") for row in recordings if row.get("state") == "FILE_GENERATED" and row.get("driveDestination", {}).get("exportUri")), "")
        return {"record": record, "attendance": attendance, "recordingUrl": recording}


def eligible_attendee_preview(session):
    rows = [{"enrollmentId": item.id, "name": item.user.get_full_name() or item.user.email, "email": item.user.email, "eligible": bool(item.user.email)} for item in Enrollment.objects.filter(program=session.node.program, status="active").select_related("user")]
    return {"eligible": sum(row["eligible"] for row in rows), "ineligible": sum(not row["eligible"] for row in rows), "learners": rows}


@transaction.atomic
def store_created_event(session, remote, *, invited_enrollment_ids=None, credential=None):
    conference = remote.get("conferenceData", {})
    join_url = remote.get("hangoutLink") or next((row.get("uri", "") for row in conference.get("entryPoints", []) if row.get("entryPointType") == "video"), "")
    session.provider_event_id = str(remote.get("id", session.provider_event_id))
    metadata = dict(session.provider_metadata or {})
    metadata.update({"calendarHtmlLink": remote.get("htmlLink", metadata.get("calendarHtmlLink", "")), "invitedEnrollmentIds": invited_enrollment_ids if invited_enrollment_ids is not None else metadata.get("invitedEnrollmentIds", []), **({"googleCredentialId": credential.id, "googleOrganizerEmail": credential.google_email} if credential else {})})
    if not join_url:
        session.provider_metadata = metadata
        session.save(update_fields=["provider_event_id", "provider_metadata", "updated_at"])
        raise GoogleWorkspaceAPIError("Google Calendar is still generating the Meet link.", category="conference_not_ready")
    metadata["meetingCode"] = _meeting_code(join_url)
    session.provider_conference_id = str(conference.get("conferenceId", ""))
    session.join_url, session.provider_metadata = join_url, metadata
    session.last_sync_at, session.last_sync_error = timezone.now(), ""
    session.save()
    properties = dict(session.node.properties or {})
    properties.update({"provider": "google_meet", "session_url": join_url, "video_url": join_url, "provider_event_id": session.provider_event_id, "provider_conference_id": session.provider_conference_id})
    session.node.properties = properties
    session.node.save(update_fields=["properties", "updated_at"])
    return session


def _attended_seconds(session, records):
    intervals = []
    for row in records:
        if not row.get("startTime"):
            continue
        start = max(datetime.fromisoformat(row["startTime"].replace("Z", "+00:00")), session.starts_at)
        end = min(datetime.fromisoformat(row.get("endTime", timezone.now().isoformat()).replace("Z", "+00:00")), session.ends_at)
        if end > start: intervals.append((start, end))
    merged = []
    for start, end in sorted(intervals):
        if merged and start <= merged[-1][1]: merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else: merged.append((start, end))
    return int(sum((end - start).total_seconds() for start, end in merged))


@transaction.atomic
def apply_meet_conference(session, result):
    from apps.live_sessions.models import ScheduledLearningSession, SessionAttendance
    identity_map = {item.google_user_id.removeprefix("users/"): item.user_id for item in GoogleParticipantIdentity.objects.filter(user__enrollments__program=session.node.program, user__enrollments__status__in=["active", "completed"]).distinct()}
    enrollments = {item.user_id: item for item in Enrollment.objects.filter(program=session.node.program, status__in=["active", "completed"])}
    scheduled_seconds, unmatched, matched = max(int((session.ends_at - session.starts_at).total_seconds()), 1), [], 0
    for row in result["attendance"]:
        external_id = row["externalUserId"].removeprefix("users/")
        enrollment = enrollments.get(identity_map.get(external_id)) if external_id else None
        if not enrollment:
            unmatched.append({"participantName": row["participantName"], "displayName": row["displayName"], "externalUserId": row["externalUserId"], "anonymous": not bool(external_id)})
            continue
        seconds = _attended_seconds(session, row["sessions"]); percent = min(seconds / scheduled_seconds * 100, 100)
        SessionAttendance.objects.update_or_create(session=session, enrollment=enrollment, defaults={"status": SessionAttendance.Status.PRESENT if percent >= session.attendance_threshold_percent else SessionAttendance.Status.ABSENT, "source": SessionAttendance.Source.PROVIDER, "attended_seconds": seconds, "attendance_percent": percent, "external_participant_id": row["participantName"], "verified_at": timezone.now(), "verified_by": None})
        matched += 1
    metadata = dict(session.provider_metadata or {})
    metadata.update({"conferenceRecord": result["record"].get("name", ""), "unmatchedParticipants": unmatched})
    session.provider_metadata = metadata
    if result.get("recordingUrl"): session.recording_url = result["recordingUrl"]
    if result["record"].get("endTime"): session.status = ScheduledLearningSession.Status.COMPLETED
    session.last_sync_at, session.last_sync_error = timezone.now(), ""
    session.save()
    return {"matched": matched, "unmatched": len(unmatched), "recordingAvailable": bool(result.get("recordingUrl"))}


def credential_for_session(session, actor=None, *, capability="calendar_events"):
    if (session.provider_metadata or {}).get("syncPaused"):
        raise GoogleWorkspaceAPIError("Google Meet synchronization is paused until the teacher reconnects Google.", category="sync_paused")
    credential_id = (session.provider_metadata or {}).get("googleCredentialId")
    credential = GoogleWorkspaceCredential.objects.filter(pk=credential_id, status=GoogleWorkspaceCredential.Status.CONNECTED).first() if credential_id else require_connected_credential(actor or session.created_by)
    if not credential:
        raise GoogleWorkspaceAPIError("Reconnect the Google account that created this meeting.", category="authorization_invalid")
    require_capabilities(credential, [capability])
    return credential


def set_google_meet_sync_paused(user, paused, *, reason=""):
    from apps.live_sessions.models import ScheduledLearningSession
    for session in ScheduledLearningSession.objects.filter(provider=ScheduledLearningSession.Provider.GOOGLE_MEET, created_by=user).iterator():
        metadata = dict(session.provider_metadata or {})
        if paused: metadata.update({"syncPaused": True, "syncPausedReason": reason})
        else: metadata.pop("syncPaused", None); metadata.pop("syncPausedReason", None)
        session.provider_metadata = metadata
        session.save(update_fields=["provider_metadata", "updated_at"])
