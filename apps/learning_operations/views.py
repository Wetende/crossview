import csv
import json

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404, HttpResponse
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
    ALLOWED_ENROLLMENT_STATUS_TRANSITIONS,
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
from .engagement import (
    get_course_engagement_policy,
    serialize_engagement_policy,
    update_course_engagement_policy,
)
from .models import CourseInvitation, LearnerManagementAudit
from .reminders import preview_contextual_reminders, send_contextual_reminders

from .selectors import (
    get_engagement_matrix,
    get_program_learner_detail,
    get_program_learners,
    get_program_operations_summary,
    get_program_revenue,
    get_instructor_revenue,
    get_student_operations,
)
from .serializers import (
    AssignmentReturnSerializer,
    BulkLearnerActionSerializer,
    CourseDeliveryProfileSerializer,
    CourseEngagementPolicySerializer,
    EngagementMatrixQuerySerializer,
    InvitationAcceptanceSerializer,
    InvitationBulkActionSerializer,
    LearnerDetailQuerySerializer,
    LearnerListQuerySerializer,
    LearnerInviteSerializer,
    LearnerReminderPreviewSerializer,
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
                gamification_opt_in=serializer.validated_data.get(
                    "gamification_opt_in"
                ),
            )
        except DjangoValidationError as exc:
            return Response({"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)
        data = CourseDeliveryProfileSerializer(profile).data
        data["deliveryModeLocked"] = delivery_mode_locked()
        return Response(data)


class CourseEngagementPolicyView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, program_id):
        program = _instructor_program(request, program_id)
        return Response(
            serialize_engagement_policy(get_course_engagement_policy(program))
        )

    def patch(self, request, program_id):
        program = _instructor_program(request, program_id)
        serializer = CourseEngagementPolicySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            policy = update_course_engagement_policy(
                program, serializer.validated_data
            )
        except DjangoValidationError as exc:
            return Response(
                {"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(serialize_engagement_policy(policy))


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
        query = LearnerDetailQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        enrollment = get_object_or_404(
            Enrollment.objects.select_related(
                "user", "program", "learning_activity"
            ),
            pk=enrollment_id,
            program=program,
        )
        data = query.validated_data
        return Response(
            get_program_learner_detail(
                enrollment,
                curriculum_offset=data["curriculumOffset"],
                curriculum_limit=data["curriculumLimit"],
            )
        )


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


class InstructorRevenueView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request):
        return Response(get_instructor_revenue(request.user))


class ManualQuizGradeView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def get(self, request, attempt_id):
        attempt = get_object_in_instructor_scope(
            QuizAttempt.objects.select_related("quiz__node__program"),
            request.user,
            "quiz__node__program_id",
            pk=attempt_id,
        )
        from apps.assessments.question_snapshots import ensure_attempt_question_snapshots

        ensure_attempt_question_snapshots(attempt.quiz, attempt)
        answers = attempt.answers if isinstance(attempt.answers, dict) else {}
        results = []
        for row in attempt.question_snapshots.all():
            snapshot = row.snapshot or {}
            if snapshot.get("question_type") != "short_answer" or not (
                snapshot.get("answer_data") or {}
            ).get("manual_grading", True):
                continue
            if str(row.question_key) not in answers:
                continue
            results.append(
                {
                    "questionKey": row.question_key,
                    "questionText": snapshot.get("text", ""),
                    "answer": answers[str(row.question_key)],
                    "pointsPossible": snapshot.get("points", 0),
                    "pointsAwarded": (
                        float(row.manual_points_awarded)
                        if row.manual_points_awarded is not None
                        else None
                    ),
                    "feedback": row.manual_feedback,
                    "gradedAt": row.graded_at.isoformat() if row.graded_at else None,
                }
            )
        return Response({"attemptId": attempt.id, "questions": results})

    def post(self, request, attempt_id):
        attempt = get_object_in_instructor_scope(
            QuizAttempt.objects.select_related("quiz__node__program"),
            request.user,
            "quiz__node__program_id",
            pk=attempt_id,
        )
        serializer = ManualQuizGradeWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if "questionKey" in serializer.validated_data:
            from apps.assessments.question_snapshots import (
                ensure_attempt_question_snapshots,
                grade_attempt_question_snapshot,
            )

            ensure_attempt_question_snapshots(attempt.quiz, attempt)
            try:
                snapshot, updated_attempt = grade_attempt_question_snapshot(
                    attempt=attempt,
                    question_key=serializer.validated_data["questionKey"],
                    points_awarded=serializer.validated_data["pointsAwarded"],
                    feedback=serializer.validated_data.get("feedback", ""),
                    grader=request.user,
                )
            except DjangoValidationError as exc:
                return Response(
                    {"detail": exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {
                    "grade": {
                        "questionKey": snapshot.question_key,
                        "pointsAwarded": float(snapshot.manual_points_awarded),
                        "feedback": snapshot.manual_feedback,
                        "gradedAt": snapshot.graded_at.isoformat(),
                        "gradedBy": {
                            "id": request.user.id,
                            "name": request.user.get_full_name() or request.user.email,
                        },
                    },
                    "attempt": {
                        "id": updated_attempt.id,
                        "score": float(updated_attempt.score or 0),
                        "pointsEarned": float(updated_attempt.points_earned or 0),
                        "pointsPossible": updated_attempt.points_possible,
                        "passed": updated_attempt.passed,
                    },
                }
            )
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


class CourseLearnerReminderPreviewView(APIView):
    permission_classes = [IsInstructorOrStaff]

    def post(self, request, program_id):
        program = _instructor_program(request, program_id)
        serializer = LearnerReminderPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        enrollment_ids = list(dict.fromkeys(data["enrollmentIds"]))
        enrollments = list(
            Enrollment.objects.filter(
                program=program,
                id__in=enrollment_ids,
            ).select_related("user", "program", "learning_activity")
        )
        if len(enrollments) != len(enrollment_ids):
            raise Http404("One or more learners were not found in this course.")
        by_id = {enrollment.id: enrollment for enrollment in enrollments}
        ordered = [by_id[enrollment_id] for enrollment_id in enrollment_ids]
        return Response(
            preview_contextual_reminders(
                ordered,
                operation_id=data.get("operationId"),
            )
        )


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
            ).select_related("user", "program", "learning_activity")
        )
        if len(enrollments) != len(set(data["enrollmentIds"])):
            raise Http404("One or more learners were not found in this course.")
        status_map = {
            "activate": "active",
            "reactivate": "active",
            "suspend": "suspended",
            "withdraw": "withdrawn",
        }
        if data["action"] == "send_reminder":
            return Response(
                send_contextual_reminders(
                    enrollments,
                    actor=request.user,
                    operation_id=data.get("operationId"),
                )
            )
        else:
            target_status = status_map[data["action"]]
            if data.get("preview"):
                results = [
                    {
                        "enrollmentId": enrollment.id,
                        "status": (
                            "eligible"
                            if target_status
                            in ALLOWED_ENROLLMENT_STATUS_TRANSITIONS.get(
                                enrollment.status, set()
                            )
                            else "ineligible"
                        ),
                        "currentStatus": enrollment.status,
                        "resultingStatus": target_status,
                    }
                    for enrollment in enrollments
                ]
                eligible = sum(item["status"] == "eligible" for item in results)
                return Response(
                    {
                        "preview": True,
                        "requested": len(enrollments),
                        "eligible": eligible,
                        "ineligible": len(enrollments) - eligible,
                        "processed": 0,
                        "skipped": len(enrollments) - eligible,
                        "results": results,
                        "updated": 0,
                        "action": data["action"],
                    }
                )
            results = []
            for enrollment in enrollments:
                try:
                    change_enrollment_status(
                        enrollment=enrollment,
                        status=status_map[data["action"]],
                        actor=request.user,
                        reason=data.get("reason", ""),
                    )
                    results.append(
                        {
                            "enrollmentId": enrollment.id,
                            "status": "processed",
                            "resultingStatus": status_map[data["action"]],
                        }
                    )
                except DjangoValidationError as exc:
                    results.append(
                        {
                            "enrollmentId": enrollment.id,
                            "status": "skipped",
                            "detail": exc.messages[0],
                        }
                    )
            processed = sum(item["status"] == "processed" for item in results)
            return Response(
                {
                    "requested": len(enrollments),
                    "processed": processed,
                    "skipped": len(enrollments) - processed,
                    "results": results,
                    "updated": processed,
                    "action": data["action"],
                }
            )
        return Response(
            {
                "requested": len(enrollments),
                "processed": len(enrollments),
                "skipped": 0,
                "results": [
                    {"enrollmentId": enrollment.id, "status": "processed"}
                    for enrollment in enrollments
                ],
                "updated": len(enrollments),
                "action": data["action"],
            }
        )


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
    get_program_learner_detail,
