import secrets

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.api_permissions import IsInstructorOrStaff, get_object_in_instructor_scope
from apps.core.models import Program

from .adapter import ClassroomAPIError, GoogleClassroomAdapter
from .configuration import classroom_configuration, require_capabilities
from .jobs import enqueue_job, process_classroom_jobs, queue_resource_publish
from .models import (
    ClassroomCourseLink,
    ClassroomGradeSync,
    ClassroomResourceMapping,
    ClassroomSyncAudit,
)
from .oauth import (
    build_authorization_url,
    complete_authorization,
    disconnect_classroom,
)
from .publishing import inspect_mapping_drift, unlink_resource_mapping
from .roster import apply_roster_preview, create_roster_preview
from .serializers import (
    ClassroomCourseCreateSerializer,
    ClassroomCourseLinkSerializer,
    OAuthConnectSerializer,
    ResourcePublishSerializer,
    RosterApplySerializer,
    RosterPreviewSerializer,
)
from .services import (
    course_link_for,
    link_classroom_course,
    require_connected_credential,
    serialize_connection,
    serialize_course_link,
    unlink_classroom_course,
)


def _program(request, program_id):
    return get_object_in_instructor_scope(
        Program.objects.all(), request.user, "id", pk=program_id
    )


def _enabled_link(program):
    link = course_link_for(program)
    if not link or not link.enabled:
        raise ValidationError("Link this course to Google Classroom first.")
    return link


def _adapter_for(user, course_id=None):
    adapter = GoogleClassroomAdapter(require_connected_credential(user))
    if course_id:
        adapter.ensure_teacher(course_id)
    return adapter


def _error_response(exc):
    if isinstance(exc, ClassroomAPIError):
        code = status.HTTP_403_FORBIDDEN if exc.category == "teacher_role_required" else status.HTTP_400_BAD_REQUEST
        return Response({"detail": str(exc), "category": exc.category}, status=code)
    if isinstance(exc, ImproperlyConfigured):
        return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    message = exc.messages[0] if isinstance(exc, ValidationError) else str(exc)
    return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)


class ClassroomConnectionView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request):
        return Response(serialize_connection(request.user))

    def post(self, request):
        serializer = OAuthConnectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            authorization_url = build_authorization_url(
                request,
                serializer.validated_data["capabilities"],
                serializer.validated_data.get("returnTo", ""),
            )
        except (ImproperlyConfigured, ValueError) as exc:
            return _error_response(exc)
        return Response({"authorizationUrl": authorization_url})

    def delete(self, request):
        try:
            credential = require_connected_credential(request.user)
            disconnect_classroom(credential)
        except (ValidationError, ValueError, RuntimeError) as exc:
            return _error_response(exc)
        return Response({"disconnected": True})


@login_required
def oauth_callback(request):
    if request.GET.get("error"):
        messages.error(request, "Google Classroom authorization was cancelled.")
        return redirect("/instructor/programs/")
    try:
        _, return_to = complete_authorization(
            request,
            state=request.GET.get("state", ""),
            code=request.GET.get("code", ""),
        )
    except Exception:
        messages.error(request, "Google Classroom authorization could not be completed.")
        return redirect("/instructor/programs/")
    messages.success(request, "Google Classroom connected.")
    return redirect(return_to)


class ClassroomCoursesView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request):
        try:
            credential = require_connected_credential(request.user)
            require_capabilities(credential, ["course_read"])
            courses = GoogleClassroomAdapter(credential).list_courses()
        except (ValidationError, ClassroomAPIError) as exc:
            return _error_response(exc)
        return Response(
            {
                "results": [
                    {
                        "id": item.get("id"),
                        "name": item.get("name", ""),
                        "section": item.get("section", ""),
                        "courseState": item.get("courseState", ""),
                        "enrollmentCode": item.get("enrollmentCode", ""),
                        "alternateLink": item.get("alternateLink", ""),
                    }
                    for item in courses
                ]
            }
        )

    def post(self, request):
        serializer = ClassroomCourseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            credential = require_connected_credential(request.user)
            require_capabilities(credential, ["course_manage"])
            adapter = GoogleClassroomAdapter(credential)
            remote = adapter.create_course(**serializer.validated_data)
            adapter.ensure_teacher(remote["id"])
        except (ValidationError, ClassroomAPIError) as exc:
            return _error_response(exc)
        return Response(remote, status=status.HTTP_201_CREATED)


class ClassroomCourseLinkView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _program(request, program_id)
        return Response(
            {
                "configurationAvailable": classroom_configuration()["available"],
                "connection": serialize_connection(request.user),
                "link": serialize_course_link(course_link_for(program)),
            }
        )

    def post(self, request, program_id):
        program = _program(request, program_id)
        serializer = ClassroomCourseLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            link = link_classroom_course(
                program=program,
                actor=request.user,
                classroom_course_id=serializer.validated_data["courseId"],
            )
        except (ValidationError, ClassroomAPIError) as exc:
            return _error_response(exc)
        return Response(serialize_course_link(link))

    def delete(self, request, program_id):
        program = _program(request, program_id)
        try:
            link = _enabled_link(program)
            unlink_classroom_course(link, request.user)
        except ValidationError as exc:
            return _error_response(exc)
        return Response({"unlinked": True})


class ClassroomRosterPreviewView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id):
        program = _program(request, program_id)
        serializer = RosterPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            link = _enabled_link(program)
            require_capabilities(require_connected_credential(request.user), ["roster_read"])
            adapter = _adapter_for(request.user, link.classroom_course_id)
            preview, token, summary = create_roster_preview(
                link, request.user, adapter, serializer.validated_data["direction"]
            )
        except (ValidationError, ClassroomAPIError) as exc:
            return _error_response(exc)
        return Response(
            {
                "previewId": preview.id,
                "confirmationToken": token,
                "expiresAt": preview.expires_at.isoformat(),
                "summary": summary,
                "rows": preview.rows,
            }
        )


class ClassroomRosterApplyView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id):
        program = _program(request, program_id)
        serializer = RosterApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            link = _enabled_link(program)
            require_capabilities(require_connected_credential(request.user), ["roster_manage"])
            _adapter_for(request.user, link.classroom_course_id)
            results = apply_roster_preview(
                course_link=link,
                actor=request.user,
                raw_token=serializer.validated_data["confirmationToken"],
                request=request,
            )
            delivery = process_classroom_jobs(link_ids=[link.id])
        except (ValidationError, ClassroomAPIError) as exc:
            return _error_response(exc)
        return Response({"results": results, "delivery": delivery})


class ClassroomResourcePublishView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id):
        program = _program(request, program_id)
        serializer = ResourcePublishSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            link = _enabled_link(program)
            capabilities = ["content"]
            if any(
                item["localType"] in {"assignment", "quiz"}
                for item in serializer.validated_data["resources"]
            ):
                capabilities.extend(["grades", "roster_read"])
            require_capabilities(require_connected_credential(request.user), capabilities)
            _adapter_for(request.user, link.classroom_course_id)
            jobs = [
                queue_resource_publish(
                    course_link=link,
                    actor=request.user,
                    local_type=item["localType"],
                    local_id=item["localId"],
                    force=item["force"],
                )
                for item in serializer.validated_data["resources"]
            ]
            delivery = process_classroom_jobs(job_ids=[job.id for job in jobs])
        except (ValidationError, ClassroomAPIError, ImproperlyConfigured) as exc:
            return _error_response(exc)
        return Response({"jobIds": [job.id for job in jobs], "delivery": delivery})


class ClassroomSyncPreviewView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _program(request, program_id)
        try:
            link = _enabled_link(program)
            if link.resource_mappings.filter(google_resource_id__gt="").exists():
                require_capabilities(require_connected_credential(request.user), ["content"])
            adapter = _adapter_for(request.user, link.classroom_course_id)
            remote = adapter.get_course(link.classroom_course_id)
            resources = [
                inspect_mapping_drift(mapping, adapter)
                for mapping in link.resource_mappings.all()
            ]
        except (ValidationError, ClassroomAPIError) as exc:
            return _error_response(exc)
        return Response(
            {
                "course": {
                    "id": remote.get("id"),
                    "name": remote.get("name", ""),
                    "courseState": remote.get("courseState", ""),
                },
                "resources": resources,
            }
        )


class ClassroomResourceUnlinkView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def delete(self, request, program_id, mapping_id):
        program = _program(request, program_id)
        try:
            link = _enabled_link(program)
            mapping = link.resource_mappings.get(pk=mapping_id)
            unlink_resource_mapping(mapping, request.user)
        except ClassroomResourceMapping.DoesNotExist:
            return Response({"detail": "Classroom resource mapping not found."}, status=404)
        except ValidationError as exc:
            return _error_response(exc)
        return Response({"unlinked": True})


class ClassroomSyncNowView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id):
        program = _program(request, program_id)
        try:
            link = _enabled_link(program)
            _adapter_for(request.user, link.classroom_course_id)
            enqueue_job(
                course_link=link,
                actor=request.user,
                job_type="course_sync",
                idempotency_key=f"classroom-manual-sync:{link.id}:{secrets.token_hex(8)}",
            )
            result = process_classroom_jobs(link_ids=[link.id])
        except (ValidationError, ClassroomAPIError) as exc:
            return _error_response(exc)
        return Response(result)


class ClassroomSyncHistoryView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _program(request, program_id)
        try:
            link = _enabled_link(program)
        except ValidationError as exc:
            return _error_response(exc)
        jobs = link.sync_jobs.order_by("-created_at")[:50]
        audits = link.sync_audits.order_by("-created_at")[:50]
        grades = ClassroomGradeSync.objects.filter(
            resource_mapping__course_link=link
        ).order_by("-updated_at")[:50]
        return Response(
            {
                "jobs": [
                    {
                        "id": job.id,
                        "type": job.job_type,
                        "status": job.status,
                        "attempts": job.attempts,
                        "errorCategory": job.error_category,
                        "lastError": job.last_error,
                        "createdAt": job.created_at.isoformat(),
                        "finishedAt": job.finished_at.isoformat() if job.finished_at else None,
                    }
                    for job in jobs
                ],
                "grades": [
                    {
                        "id": item.id,
                        "enrollmentId": item.enrollment_id,
                        "sourceType": item.local_source_type,
                        "sourceId": item.local_source_id,
                        "grade": float(item.grade),
                        "status": item.status,
                        "errorCategory": item.error_category,
                        "lastError": item.last_error,
                    }
                    for item in grades
                ],
                "audits": [
                    {
                        "id": audit.id,
                        "action": audit.action,
                        "details": audit.details,
                        "createdAt": audit.created_at.isoformat(),
                    }
                    for audit in audits
                ],
            }
        )
