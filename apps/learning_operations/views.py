import csv
import json

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assessments.models import AssignmentSubmission, Question, Quiz, QuizAttempt
from apps.core.api_permissions import IsInstructorOrStaff, get_object_in_instructor_scope
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment

from .learner_management import (
    accept_course_invitation,
    add_or_invite_learner,
    change_enrollment_status,
    create_roster_preview_token,
    get_invitation_by_token,
    grant_quiz_attempt,
    invitation_status,
    parse_csv_rows,
    preview_learner_rows,
    resend_course_invitation,
    reset_lesson_completion,
    return_assignment_for_resubmission,
    validate_roster_preview_token,
)
from .models import CourseInvitation, LearnerManagementAudit

from .selectors import (
    get_engagement_matrix,
    get_program_learners,
    get_program_operations_summary,
    get_program_revenue,
    get_student_operations,
    serialize_enrollment_operations,
)
from .serializers import (
    AssignmentReturnSerializer,
    BulkLearnerActionSerializer,
    CourseDeliveryProfileSerializer,
    EngagementMatrixQuerySerializer,
    InvitationAcceptanceSerializer,
    InvitationBulkActionSerializer,
    LearnerListQuerySerializer,
    LearnerInviteSerializer,
    ManualQuizGradeReadSerializer,
    ManualQuizGradeWriteSerializer,
    ProgressAdjustmentSerializer,
    RosterRowsSerializer,
)
from .services import (
    delivery_mode_locked,
    get_course_delivery_profile,
    grade_manual_quiz_response,
    update_course_delivery_profile,
)


def _instructor_program(request, program_id):
    return get_object_in_instructor_scope(
        Program.objects.all(),
        request.user,
        "id",
        pk=program_id,
    )


class StudentOperationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(get_student_operations(request.user))


class CourseDeliveryProfileView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _instructor_program(request, program_id)
        profile = get_course_delivery_profile(program)
        data = CourseDeliveryProfileSerializer(profile).data
        data["deliveryModeLocked"] = delivery_mode_locked()
        return Response(data)

    def patch(self, request, program_id):
        program = _instructor_program(request, program_id)
        serializer = CourseDeliveryProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            profile = update_course_delivery_profile(
                program,
                serializer.validated_data.get(
                    "delivery_mode", get_course_delivery_profile(program).delivery_mode
                ),
            )
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        data = CourseDeliveryProfileSerializer(profile).data
        data["deliveryModeLocked"] = delivery_mode_locked()
        return Response(data)


class ProgramOperationsSummaryView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _instructor_program(request, program_id)
        return Response(get_program_operations_summary(program))


class ProgramLearnersView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _instructor_program(request, program_id)
        query = LearnerListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        data = query.validated_data
        rows = get_program_learners(
            program,
            state=data.get("state") or None,
            search=data.get("search") or None,
        )
        offset = data["offset"]
        limit = data["limit"]
        return Response(
            {
                "results": rows[offset : offset + limit],
                "pagination": {
                    "offset": offset,
                    "limit": limit,
                    "total": len(rows),
                    "hasMore": offset + limit < len(rows),
                },
            }
        )


class ProgramLearnerDetailView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id, enrollment_id):
        program = _instructor_program(request, program_id)
        enrollment = get_object_or_404(
            Enrollment.objects.select_related(
                "user", "program", "learning_activity"
            ),
            pk=enrollment_id,
            program=program,
        )
        data = serialize_enrollment_operations(enrollment)
        data.update(
            {
                "enrollmentId": enrollment.id,
                "userId": enrollment.user_id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "email": enrollment.user.email,
                "status": enrollment.status,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
                "grades": enrollment.grades or {},
            }
        )
        return Response(data)


class ProgramEngagementMatrixView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _instructor_program(request, program_id)
        query = EngagementMatrixQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        data = query.validated_data
        return Response(
            get_engagement_matrix(
                program,
                enrollment_offset=data["enrollmentOffset"],
                enrollment_limit=data["enrollmentLimit"],
                node_offset=data["nodeOffset"],
                node_limit=data["nodeLimit"],
            )
        )


class ProgramRevenueView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _instructor_program(request, program_id)
        return Response({"programId": program.id, "currencies": get_program_revenue(program)})


class ManualQuizGradeView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, attempt_id):
        attempt = get_object_in_instructor_scope(
            QuizAttempt.objects.select_related("quiz__node__program"),
            request.user,
            "quiz__node__program_id",
            pk=attempt_id,
        )
        serializer = ManualQuizGradeWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = get_object_or_404(
            Question,
            pk=serializer.validated_data["questionId"],
            quiz=attempt.quiz,
        )
        try:
            grade, updated_attempt = grade_manual_quiz_response(
                attempt=attempt,
                question=question,
                points_awarded=serializer.validated_data["pointsAwarded"],
                feedback=serializer.validated_data.get("feedback", ""),
                grader=request.user,
            )
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "grade": ManualQuizGradeReadSerializer(grade).data,
                "attempt": {
                    "id": updated_attempt.id,
                    "score": float(updated_attempt.score or 0),
                    "pointsEarned": float(updated_attempt.points_earned or 0),
                    "pointsPossible": updated_attempt.points_possible,
                    "passed": updated_attempt.passed,
                },
            }
        )


class CourseLearnerInviteView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _instructor_program(request, program_id)
        invitations = CourseInvitation.objects.filter(program=program).order_by(
            "-created_at"
        )[:100]
        return Response(
            {
                "results": [
                    {
                        "id": invitation.id,
                        "email": invitation.email,
                        "status": invitation_status(invitation),
                        "expiresAt": invitation.expires_at.isoformat(),
                        "acceptedAt": (
                            invitation.accepted_at.isoformat()
                            if invitation.accepted_at
                            else None
                        ),
                    }
                    for invitation in invitations
                ]
            }
        )

    def post(self, request, program_id):
        program = _instructor_program(request, program_id)
        serializer = LearnerInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = add_or_invite_learner(
            program=program,
            email=serializer.validated_data["email"],
            actor=request.user,
            request=request,
        )
        payload = {"status": result["status"]}
        if result["status"] == "enrolled":
            payload.update(
                enrollmentId=result["enrollment"].id,
                created=result["created"],
            )
        else:
            payload.update(
                invitationId=result["invitation"].id,
                emailSent=result["emailSent"],
            )
        return Response(payload, status=status.HTTP_201_CREATED)


def _request_roster_rows(request):
    upload = request.FILES.get("file")
    if upload:
        return parse_csv_rows(upload), request.data.get("confirmationToken", "")
    serializer = RosterRowsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return (
        serializer.validated_data.get("rows", []),
        serializer.validated_data.get("confirmationToken", ""),
    )


class CourseRosterPreviewView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id):
        program = _instructor_program(request, program_id)
        try:
            rows, _ = _request_roster_rows(request)
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "results": preview_learner_rows(program, rows),
                "rowCount": len(rows),
                "confirmationToken": create_roster_preview_token(program, rows),
            }
        )


class CourseRosterImportView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id):
        program = _instructor_program(request, program_id)
        try:
            rows, confirmation_token = _request_roster_rows(request)
            validate_roster_preview_token(program, rows, confirmation_token)
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        preview = preview_learner_rows(program, rows)
        accepted = {
            item["email"]
            for item in preview
            if item["status"] in {"ready_to_enroll", "ready_to_invite"}
        }
        results = []
        for email in accepted:
            result = add_or_invite_learner(
                program=program,
                email=email,
                actor=request.user,
                request=request,
            )
            results.append({"email": email, "status": result["status"]})
        return Response(
            {
                "results": results,
                "imported": sum(item["status"] == "enrolled" for item in results),
                "invited": sum(item["status"] == "invited" for item in results),
                "skipped": len(rows) - len(results),
            },
            status=status.HTTP_201_CREATED,
        )


class CourseRosterExportView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _instructor_program(request, program_id)
        rows = get_program_learners(program)
        enrollments = {
            enrollment.id: enrollment
            for enrollment in Enrollment.objects.filter(program=program)
        }
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="course-{program.id}-learners.csv"'
        )
        writer = csv.writer(response)
        writer.writerow(
            [
                "name",
                "email",
                "enrollment_status",
                "learner_state",
                "enrolled_at",
                "expires_at",
                "progress_percent",
                "last_activity",
                "grade",
            ]
        )
        for row in rows:
            enrollment = enrollments[row["enrollmentId"]]
            writer.writerow(
                [
                    row["name"],
                    row["email"],
                    row["status"],
                    row["learnerState"],
                    row["enrolledAt"],
                    row["expiresAt"],
                    row["progressPercent"],
                    row["lastActivity"],
                    json.dumps(enrollment.grades or {}, sort_keys=True),
                ]
            )
        return response


class CourseInvitationBulkActionView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id):
        program = _instructor_program(request, program_id)
        serializer = InvitationBulkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        invitations = list(
            CourseInvitation.objects.filter(
                program=program,
                id__in=data["invitationIds"],
            )
        )
        if len(invitations) != len(set(data["invitationIds"])):
            return Response(
                {"detail": "One or more invitations were not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        processed = 0
        sent = 0
        try:
            for invitation in invitations:
                if data["action"] == "revoke":
                    if invitation_status(invitation) == "pending":
                        invitation.revoked_at = timezone.now()
                        invitation.save(update_fields=["revoked_at", "updated_at"])
                        processed += 1
                else:
                    _, email_sent = resend_course_invitation(
                        invitation=invitation,
                        actor=request.user,
                        request=request,
                    )
                    processed += 1
                    sent += int(email_sent)
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"processed": processed, "emailsSent": sent})


class CourseBulkLearnerActionView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id):
        program = _instructor_program(request, program_id)
        serializer = BulkLearnerActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        enrollments = list(
            Enrollment.objects.filter(
                program=program,
                id__in=data["enrollmentIds"],
            ).select_related("user")
        )
        if len(enrollments) != len(set(data["enrollmentIds"])):
            return Response(
                {"detail": "One or more enrollments were not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        status_map = {
            "activate": "active",
            "reactivate": "active",
            "suspend": "suspended",
            "withdraw": "withdrawn",
        }
        if data["action"] == "send_reminder":
            from apps.notifications.services import NotificationService

            for enrollment in enrollments:
                NotificationService.create(
                    recipient=enrollment.user,
                    notification_type="system",
                    title="Course reminder",
                    message=f"You have learning activities waiting in {program.name}.",
                    related_program_id=program.id,
                    related_enrollment_id=enrollment.id,
                )
                LearnerManagementAudit.objects.create(
                    enrollment=enrollment,
                    action="send_reminder",
                    actor=request.user,
                    reason=data.get("reason", ""),
                    previous_state={},
                    resulting_state={"notificationCreated": True},
                )
        else:
            for enrollment in enrollments:
                change_enrollment_status(
                    enrollment=enrollment,
                    status=status_map[data["action"]],
                    actor=request.user,
                    reason=data.get("reason", ""),
                )
        return Response({"updated": len(enrollments), "action": data["action"]})


class LessonCompletionResetView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id, enrollment_id, node_id):
        program = _instructor_program(request, program_id)
        enrollment = get_object_or_404(
            Enrollment,
            pk=enrollment_id,
            program=program,
        )
        node = get_object_or_404(CurriculumNode, pk=node_id, program=program)
        serializer = ProgressAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            audit = reset_lesson_completion(
                enrollment=enrollment,
                node=node,
                actor=request.user,
                reason=serializer.validated_data.get("reason", ""),
            )
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"auditId": audit.id, "completed": False})


class QuizAttemptGrantView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id, enrollment_id, quiz_id):
        program = _instructor_program(request, program_id)
        enrollment = get_object_or_404(
            Enrollment,
            pk=enrollment_id,
            program=program,
        )
        quiz = get_object_or_404(
            Quiz.objects.select_related("node"),
            pk=quiz_id,
            node__program=program,
        )
        serializer = ProgressAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            grant = grant_quiz_attempt(
                enrollment=enrollment,
                quiz=quiz,
                actor=request.user,
                reason=serializer.validated_data.get("reason", ""),
            )
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"grantId": grant.id, "extraAttempts": grant.extra_attempts},
            status=status.HTTP_201_CREATED,
        )


class AssignmentReturnView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id, submission_id):
        program = _instructor_program(request, program_id)
        submission = get_object_or_404(
            AssignmentSubmission.objects.select_related("assignment", "enrollment"),
            pk=submission_id,
            assignment__program=program,
        )
        serializer = AssignmentReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            returned, grant = return_assignment_for_resubmission(
                submission=submission,
                actor=request.user,
                feedback=serializer.validated_data.get("feedback", ""),
            )
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "submissionId": returned.id,
                "status": returned.status,
                "grantId": grant.id,
            }
        )


class InvitationAcceptanceView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            invitation = get_invitation_by_token(token)
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_410_GONE)
        existing = get_user_model().objects.filter(email__iexact=invitation.email).exists()
        return Response(
            {
                "email": invitation.email,
                "program": {
                    "id": invitation.program_id,
                    "name": invitation.program.name,
                },
                "expiresAt": invitation.expires_at.isoformat(),
                "accountExists": existing,
            }
        )

    def post(self, request, token):
        serializer = InvitationAcceptanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user, enrollment = accept_course_invitation(
                raw_token=token,
                authenticated_user=request.user,
                first_name=serializer.validated_data.get("firstName", ""),
                last_name=serializer.validated_data.get("lastName", ""),
                password=serializer.validated_data.get("password", ""),
            )
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "userId": user.id,
                "enrollmentId": enrollment.id,
                "programId": enrollment.program_id,
            }
        )
