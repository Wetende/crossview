from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assessments.models import Question, QuizAttempt
from apps.core.api_permissions import IsInstructorOrStaff, get_object_in_instructor_scope
from apps.core.models import Program
from apps.progression.models import Enrollment

from .selectors import (
    get_engagement_matrix,
    get_program_learners,
    get_program_operations_summary,
    get_program_revenue,
    get_student_operations,
    serialize_enrollment_operations,
)
from .serializers import (
    CourseDeliveryProfileSerializer,
    EngagementMatrixQuerySerializer,
    LearnerListQuerySerializer,
    ManualQuizGradeReadSerializer,
    ManualQuizGradeWriteSerializer,
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

