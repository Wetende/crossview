from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.api_permissions import IsInstructorOrStaff, get_object_in_instructor_scope
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment

from .jobs import enqueue_session_job
from .models import ScheduledLearningSession
from .serializers import AttendanceOverrideSerializer, ScheduledLearningSessionWriteSerializer
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
