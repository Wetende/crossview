from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone

from apps.assessments.models import Question, Quiz, QuizAttempt
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, InstructorAssignment, NodeCompletion
from apps.progression.tests.factories import ProgramFactory

from apps.learning_operations.models import (
    CourseDeliveryProfile,
    EnrollmentLearningActivity,
    LearningActivityDay,
    ManualQuizGrade,
)
from apps.learning_operations.services import classify_enrollment


@pytest.fixture
def instructor():
    user = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


@pytest.fixture
def program(instructor):
    value = ProgramFactory()
    InstructorAssignment.objects.create(instructor=instructor, program=value)
    return value


@pytest.fixture
def enrollment(program):
    return Enrollment.objects.create(user=UserFactory(), program=program)


@pytest.mark.django_db
def test_completion_records_activity_day(enrollment):
    node = CurriculumNode.objects.create(
        program=enrollment.program,
        node_type="Session",
        title="Activity lesson",
        properties={},
        position=1,
        is_published=True,
    )
    completed_at = timezone.now()

    NodeCompletion.objects.create(
        enrollment=enrollment,
        node=node,
        completed_at=completed_at,
        completion_type="view",
    )

    activity = EnrollmentLearningActivity.objects.get(enrollment=enrollment)
    day = LearningActivityDay.objects.get(enrollment=enrollment)
    assert activity.started_at == completed_at
    assert activity.last_activity_at == completed_at
    assert day.activity_date == timezone.localdate(completed_at)
    assert day.sources == ["node_completion"]


@pytest.mark.django_db
def test_learner_state_boundaries(enrollment):
    Enrollment.objects.filter(pk=enrollment.pk).update(
        enrolled_at=timezone.now() - timedelta(days=4)
    )
    enrollment.refresh_from_db()
    assert classify_enrollment(enrollment) == "not_started"

    activity = EnrollmentLearningActivity.objects.create(
        enrollment=enrollment,
        started_at=timezone.now() - timedelta(days=10),
        last_activity_at=timezone.now() - timedelta(days=8),
    )
    assert classify_enrollment(enrollment) == "stalled"

    activity.last_activity_at = timezone.now() - timedelta(days=31)
    activity.save(update_fields=["last_activity_at", "updated_at"])
    assert classify_enrollment(enrollment) == "inactive"


@pytest.mark.django_db
def test_instructor_can_update_delivery_mode(client, instructor, program):
    client.force_login(instructor)
    response = client.patch(
        reverse("learning_operations:delivery", kwargs={"program_id": program.id}),
        data={"deliveryMode": "self_paced"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["deliveryMode"] == "self_paced"
    assert CourseDeliveryProfile.objects.get(program=program).delivery_mode == "self_paced"


@pytest.mark.django_db
def test_unassigned_instructor_cannot_read_program_operations(client, instructor):
    unassigned = ProgramFactory()
    client.force_login(instructor)

    response = client.get(
        reverse("learning_operations:summary", kwargs={"program_id": unassigned.id})
    )

    assert response.status_code == 404


@pytest.mark.django_db
def test_manual_quiz_grade_finalizes_attempt(client, instructor, program, enrollment):
    node = CurriculumNode.objects.create(
        program=program,
        node_type="Session",
        title="Manual quiz",
        properties={"lesson_type": "quiz"},
        position=1,
        is_published=True,
    )
    quiz = Quiz.objects.create(node=node, title="Manual quiz", pass_threshold=50)
    question = Question.objects.create(
        quiz=quiz,
        question_type="short_answer",
        text="Explain the answer",
        points=10,
        position=0,
        answer_data={"manual_grading": True},
    )
    attempt = QuizAttempt.objects.create(
        enrollment=enrollment,
        quiz=quiz,
        attempt_number=1,
        started_at=timezone.now() - timedelta(minutes=5),
        submitted_at=timezone.now(),
        answers={str(question.id): "A reasoned response"},
    )
    client.force_login(instructor)

    response = client.post(
        reverse(
            "learning_operations:manual-quiz-grade",
            kwargs={"attempt_id": attempt.id},
        ),
        data={"questionId": question.id, "pointsAwarded": "8.00", "feedback": "Good"},
        content_type="application/json",
    )

    assert response.status_code == 200
    attempt.refresh_from_db()
    assert attempt.points_earned == Decimal("8.00")
    assert attempt.score == Decimal("80.00")
    assert attempt.passed is True
    assert ManualQuizGrade.objects.get(attempt=attempt).feedback == "Good"

