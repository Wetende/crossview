from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.api_permissions import IsInstructorOrStaff, get_object_in_instructor_scope
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment

from .jobs import enqueue_session_job, process_live_session_jobs
from .models import ScheduledLearningSession
from .serializers import (
    AttendanceOverrideSerializer,
    GoogleMeetCreateSerializer,
    ScheduledLearningSessionWriteSerializer,
)
from .services import (
    override_attendance,
    serialize_attendance_roster,
    serialize_session_for_author,
    sync_scheduled_session_from_node,
    validate_session_properties,
)


def _node(request, node_id):
    return get_object_in_instructor_scope(
        CurriculumNode.objects.select_related("program"),
        request.user,
        "program_id",
        pk=node_id,
    )


def _error(exc):
    message = exc.messages[0] if isinstance(exc, DjangoValidationError) else str(exc)
    return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)


class ScheduledLearningSessionView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, node_id):
        node = _node(request, node_id)
        session = ScheduledLearningSession.objects.filter(node=node).first()
        return Response({"session": serialize_session_for_author(session)})

    @transaction.atomic
    def put(self, request, node_id):
        node = _node(request, node_id)
        serializer = ScheduledLearningSessionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        properties = dict(node.properties or {})
        properties.update(
            {
                "lesson_type": data["kind"],
                "session_kind": data["kind"],
                "provider": data["provider"],
                "starts_at": data["startsAt"].isoformat(),
                "ends_at": data["endsAt"].isoformat(),
                "timezone": data["timezone"],
                "session_url": data.get("joinUrl", ""),
                "recording_url": data.get("recordingUrl", ""),
                "session_visibility": data.get("calendarVisibility", "private"),
                "venue": data.get("venue", ""),
                "room": data.get("room", ""),
                "address": data.get("address", ""),
                "directions": data.get("directions", ""),
                "attendance_instructions": data.get("attendanceInstructions", ""),
            }
        )
        if "meetingPassword" in data:
            properties["meeting_password"] = data["meetingPassword"]
        if data.get("clearMeetingPassword"):
            properties["clear_meeting_password"] = True
        try:
            validate_session_properties(properties)
            if data.get("title"):
                node.title = data["title"]
            if "summary" in data:
                node.description = data["summary"]
            node.properties = properties
            node.save()
            session = sync_scheduled_session_from_node(node, actor=request.user)
        except DjangoValidationError as exc:
            transaction.set_rollback(True)
            return _error(exc)
        enqueue_session_job(session, "update", actor=request.user)
        return Response({"session": serialize_session_for_author(session)})

    def delete(self, request, node_id):
        node = _node(request, node_id)
        session = get_object_or_404(ScheduledLearningSession, node=node)
        session.status = ScheduledLearningSession.Status.CANCELLED
        session.save(update_fields=["status", "updated_at"])
        enqueue_session_job(session, "cancel", actor=request.user)
        return Response({"session": serialize_session_for_author(session)})


class SessionAttendanceView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, node_id):
        node = _node(request, node_id)
        session = get_object_or_404(ScheduledLearningSession, node=node)
        return Response({"results": serialize_attendance_roster(session)})


class SessionAttendanceOverrideView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def patch(self, request, node_id, enrollment_id):
        node = _node(request, node_id)
        session = get_object_or_404(ScheduledLearningSession, node=node)
        enrollment = get_object_or_404(
            Enrollment, pk=enrollment_id, program=node.program
        )
        serializer = AttendanceOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            attendance = override_attendance(
                session=session,
                enrollment=enrollment,
                status=serializer.validated_data["status"],
                reason=serializer.validated_data["reason"],
                actor=request.user,
            )
        except DjangoValidationError as exc:
            return _error(exc)
        return Response(
            {
                "enrollmentId": enrollment.id,
                "status": attendance.status,
                "source": attendance.source,
                "verifiedAt": attendance.verified_at.isoformat(),
            }
        )


def _google_meet_session(request, node_id):
    node = _node(request, node_id)
    return get_object_or_404(
        ScheduledLearningSession,
        node=node,
        kind=ScheduledLearningSession.Kind.LIVE_MEETING,
        provider=ScheduledLearningSession.Provider.GOOGLE_MEET,
    )


class GoogleMeetPreviewView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, node_id):
        from apps.google_classroom.meet import eligible_attendee_preview
        from apps.google_classroom.services import serialize_connection

        session = _google_meet_session(request, node_id)
        return Response(
            {
                "session": serialize_session_for_author(session),
                "connection": serialize_connection(request.user),
                "attendees": eligible_attendee_preview(session),
            }
        )


class GoogleMeetCreateView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, node_id):
        from apps.google_classroom.adapter import ClassroomAPIError
        from apps.google_classroom.configuration import require_capabilities
        from apps.google_classroom.meet import eligible_attendee_preview
        from apps.google_classroom.services import require_connected_credential

        session = _google_meet_session(request, node_id)
        serializer = GoogleMeetCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if session.provider_event_id and session.join_url:
            return Response(
                {"session": serialize_session_for_author(session), "created": False}
            )
        try:
            credential = require_connected_credential(request.user)
            require_capabilities(
                credential, ["calendar_events", "meet_attendance"]
            )
        except (DjangoValidationError, ClassroomAPIError) as exc:
            return _error(exc)
        preview = eligible_attendee_preview(session)
        enrollment_ids = (
            [
                row["enrollmentId"]
                for row in preview["learners"]
                if row["eligible"]
            ]
            if serializer.validated_data["inviteLearners"]
            else []
        )
        job = enqueue_session_job(
            session,
            "google_meet_create",
            actor=request.user,
            payload={"inviteEnrollmentIds": enrollment_ids},
            operation_id=serializer.validated_data.get("operationId"),
        )
        delivery = process_live_session_jobs(job_ids=[job.id])
        job.refresh_from_db()
        session.refresh_from_db()
        response_status = (
            status.HTTP_201_CREATED
            if job.status == "succeeded"
            else status.HTTP_202_ACCEPTED
        )
        return Response(
            {
                "created": job.status == "succeeded",
                "session": serialize_session_for_author(session),
                "job": {
                    "id": job.id,
                    "status": job.status,
                    "errorCategory": job.error_category,
                    "lastError": job.last_error,
                },
                "delivery": delivery,
            },
            status=response_status,
        )


class GoogleMeetSyncView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, node_id):
        session = _google_meet_session(request, node_id)
        jobs = session.sync_jobs.order_by("-created_at")[:20]
        return Response(
            {
                "session": serialize_session_for_author(session),
                "unmatchedParticipants": (session.provider_metadata or {}).get(
                    "unmatchedParticipants", []
                ),
                "jobs": [
                    {
                        "id": job.id,
                        "type": job.job_type,
                        "status": job.status,
                        "attempts": job.attempts,
                        "errorCategory": job.error_category,
                        "lastError": job.last_error,
                        "finishedAt": (
                            job.finished_at.isoformat() if job.finished_at else None
                        ),
                    }
                    for job in jobs
                ],
            }
        )

    def post(self, request, node_id):
        import uuid

        session = _google_meet_session(request, node_id)
        if not session.provider_event_id:
            return Response(
                {"detail": "Create the Google Meet before synchronizing it."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        job = enqueue_session_job(
            session,
            "google_meet_attendance",
            actor=request.user,
            operation_id=uuid.uuid4(),
        )
        delivery = process_live_session_jobs(job_ids=[job.id])
        job.refresh_from_db()
        session.refresh_from_db()
        return Response(
            {
                "session": serialize_session_for_author(session),
                "job": {
                    "id": job.id,
                    "status": job.status,
                    "errorCategory": job.error_category,
                    "lastError": job.last_error,
                },
                "delivery": delivery,
            }
        )
