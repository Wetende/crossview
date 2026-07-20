from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone

from apps.assessments.models import AssessmentResult, Assignment, Question, Quiz, QuizAttempt
from apps.commerce.models import Order, ProgramRevenueShare, SettlementParty
from apps.commerce.services import CheckoutService
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.platform.models import PlatformSettings
from apps.progression.models import Enrollment, InstructorAssignment, NodeCompletion
from apps.progression.tests.factories import ProgramFactory

from apps.learning_operations.models import (
    CourseDeliveryProfile,
    EnrollmentLearningActivity,
    LearningActivityDay,
    ManualQuizGrade,
)
from apps.learning_operations.services import classify_enrollment
from apps.learning_operations.selectors import get_program_learner_summary


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
        data={"deliveryMode": "self_paced", "gamificationOptIn": True},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["deliveryMode"] == "self_paced"
    assert CourseDeliveryProfile.objects.get(program=program).delivery_mode == "self_paced"
    assert response.json()["gamificationOptIn"] is True
    assert CourseDeliveryProfile.objects.get(program=program).gamification_opt_in is True


@pytest.mark.django_db
def test_unassigned_instructor_cannot_read_program_operations(client, instructor):
    unassigned = ProgramFactory()
    client.force_login(instructor)

    response = client.get(
        reverse("learning_operations:summary", kwargs={"program_id": unassigned.id})
    )

    assert response.status_code == 404


@pytest.mark.django_db
def test_program_learner_summary_counts_attention_without_loading_a_roster(
    program,
):
    now = timezone.now()
    completed = Enrollment.objects.create(
        user=UserFactory(),
        program=program,
        status="completed",
        completed_at=now,
    )
    not_started = Enrollment.objects.create(user=UserFactory(), program=program)
    Enrollment.objects.filter(pk=not_started.pk).update(
        enrolled_at=now - timedelta(days=4)
    )
    active = Enrollment.objects.create(user=UserFactory(), program=program)
    EnrollmentLearningActivity.objects.create(
        enrollment=active,
        started_at=now - timedelta(days=2),
        last_activity_at=now,
    )

    assert get_program_learner_summary(program) == {
        "total": 3,
        "needsAttention": 1,
        "completed": 1,
    }


@pytest.mark.django_db
def test_learner_detail_returns_operational_context_and_paginated_curriculum(
    client, instructor, program, enrollment
):
    nodes = [
        CurriculumNode.objects.create(
            program=program,
            node_type="Session",
            title=f"Lesson {index}",
            position=index,
            is_published=True,
        )
        for index in range(1, 28)
    ]
    completed_at = timezone.now() - timedelta(hours=2)
    NodeCompletion.objects.create(
        enrollment=enrollment,
        node=nodes[0],
        completed_at=completed_at,
        completion_type="view",
    )
    Assignment.objects.create(
        program=program,
        title="Project",
        description="Project description",
        instructions="Submit your work",
        weight=25,
        due_date=timezone.now() + timedelta(days=2),
        is_published=True,
    )
    AssessmentResult.objects.create(
        enrollment=enrollment,
        node=nodes[0],
        result_data={"total": 82, "status": "Pass"},
        lecturer_comments="Strong work.",
        is_published=True,
        published_at=timezone.now(),
        graded_by=instructor,
    )
    client.force_login(instructor)

    response = client.get(
        reverse(
            "learning_operations:learner-detail",
            kwargs={"program_id": program.id, "enrollment_id": enrollment.id},
        )
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["currentPosition"]["title"] == "Lesson 2"
    assert payload["attention"] is None
    assert payload["upcomingDeadlines"][0]["title"] == "Project"
    assert payload["recentActivity"][0]["title"] == "Lesson 1"
    assert payload["publishedGrades"][0]["title"] == "Lesson 1"
    assert payload["feedback"][0]["message"] == "Strong work."
    assert len(payload["curriculumProgress"]["results"]) == 25
    assert payload["curriculumProgress"]["pagination"] == {
        "offset": 0,
        "limit": 25,
        "total": 27,
        "hasMore": True,
    }


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


@pytest.mark.django_db
def test_instructor_revenue_drilldown_is_currency_separated_and_share_aware(
    client, instructor, program
):
    platform = PlatformSettings.get_settings()
    platform.features = {**(platform.features or {}), "payments": True}
    platform.save(update_fields=["features", "updated_at"])
    program.is_published = True
    program.custom_pricing = {
        "price": 1000,
        "currency": "KES",
        "payment_collection": "online",
        "card_display": "price",
    }
    program.save(update_fields=["is_published", "custom_pricing", "updated_at"])
    settlement_party = SettlementParty.objects.create(
        party_type=SettlementParty.TYPE_INSTRUCTOR,
        display_name="Course instructor",
        user=instructor,
        payout_method=SettlementParty.PAYOUT_METHOD_KEPSS,
    )
    ProgramRevenueShare.objects.create(
        program=program,
        settlement_party=settlement_party,
        share_bps=3000,
    )
    student = UserFactory()
    order = CheckoutService.create_order_from_programs(
        student, [program], Order.PROVIDER_PAYSTACK
    )
    CheckoutService.mark_order_paid(
        order,
        actor=student,
        provider_reference=order.reference,
    )
    client.force_login(instructor)

    response = client.get(reverse("learning_operations:instructor-revenue"))

    assert response.status_code == 200
    payload = response.json()
    assert payload["currencies"] == [
        {
            "currency": "KES",
            "grossMinor": 100000,
            "refundMinor": 0,
            "netMinor": 100000,
            "orders": 1,
        }
    ]
    course = payload["courses"][0]
    assert course["programId"] == program.id
    assert course["instructorShares"][0]["shareBps"] == 3000
    assert course["instructorShares"][0]["estimatedByCurrency"][0]["netMinor"] == 30000
