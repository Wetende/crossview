from datetime import date, timedelta

import pytest
from django.utils import timezone

from apps.assessments.models import Assignment, AssignmentSubmission, Quiz, QuizAttempt
from apps.curriculum.models import CurriculumNode
from apps.learning_operations.models import CourseDeliveryProfile
from apps.learning_operations.services import get_course_delivery_profile
from apps.platform.models import PlatformSettings
from apps.progression.gamification import serialize_gamification, update_learning_streak
from apps.progression.models import Enrollment, NodeCompletion, StudentXP
from apps.progression.tests.factories import ProgramFactory
from apps.core.tests.factories import UserFactory


@pytest.fixture
def gamified_enrollment():
    settings = PlatformSettings.get_settings()
    settings.features = {**(settings.features or {}), "gamification": True}
    settings.save(update_fields=["features", "updated_at"])
    program = ProgramFactory()
    profile = get_course_delivery_profile(program)
    profile.delivery_mode = CourseDeliveryProfile.SELF_PACED
    profile.save(update_fields=["delivery_mode", "updated_at"])
    return Enrollment.objects.create(user=UserFactory(), program=program, access_source="free")


@pytest.mark.django_db(transaction=True)
def test_lesson_uses_configured_baseline_and_additive_bonus(gamified_enrollment):
    node = CurriculumNode.objects.create(
        program=gamified_enrollment.program,
        node_type="Session",
        title="Lesson",
        properties={"gamification": {"xp_reward": 15, "bonus_xp_condition": "streak", "bonus_xp_amount": 5}},
        is_published=True,
    )
    NodeCompletion.objects.create(
        enrollment=gamified_enrollment,
        node=node,
        completed_at=timezone.now(),
        completion_type="view",
    )
    reasons = list(StudentXP.objects.filter(enrollment=gamified_enrollment).values_list("reason", "xp_amount"))
    assert ("lesson_complete", 15) in reasons
    assert ("manual", 5) in reasons
    assert ("course_complete", 100) in reasons


@pytest.mark.django_db(transaction=True)
def test_quiz_first_perfect_pass_awards_exactly_forty(gamified_enrollment):
    node = CurriculumNode.objects.create(
        program=gamified_enrollment.program,
        node_type="Session",
        title="Quiz",
        properties={},
        is_published=True,
    )
    quiz = Quiz.objects.create(node=node, title="Quiz", is_published=True)
    QuizAttempt.objects.create(
        enrollment=gamified_enrollment,
        quiz=quiz,
        attempt_number=1,
        started_at=timezone.now() - timedelta(minutes=2),
        submitted_at=timezone.now(),
        score=100,
        passed=True,
    )
    assert sum(StudentXP.objects.filter(enrollment=gamified_enrollment).values_list("xp_amount", flat=True)) == 40


@pytest.mark.django_db(transaction=True)
def test_assignment_submission_awards_twenty_once(gamified_enrollment):
    assignment = Assignment.objects.create(
        program=gamified_enrollment.program,
        title="Assignment",
        description="",
        instructions="",
        weight=20,
        is_published=True,
    )
    submission = AssignmentSubmission.objects.create(
        enrollment=gamified_enrollment,
        assignment=assignment,
        submitted_at=timezone.now(),
        status="submitted",
    )
    submission.status = "graded"
    submission.save(update_fields=["status"])
    rows = StudentXP.objects.filter(enrollment=gamified_enrollment, reason="assignment_submit")
    assert rows.count() == 1
    assert rows.get().xp_amount == 20


@pytest.mark.django_db(transaction=True)
def test_streak_milestones_are_idempotent(gamified_enrollment):
    start = date(2026, 1, 1)
    for index in range(30):
        update_learning_streak(gamified_enrollment, start + timedelta(days=index))
    update_learning_streak(gamified_enrollment, start + timedelta(days=29))
    awards = StudentXP.objects.filter(enrollment=gamified_enrollment, reason="streak_bonus")
    assert sorted(awards.values_list("xp_amount", flat=True)) == [25, 100]


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize("mode,opt_in,enabled", [
    (CourseDeliveryProfile.BLENDED, False, False),
    (CourseDeliveryProfile.BLENDED, True, True),
    (CourseDeliveryProfile.IN_PERSON, False, False),
    (CourseDeliveryProfile.IN_PERSON, True, True),
])
def test_blended_and_in_person_require_course_opt_in(gamified_enrollment, mode, opt_in, enabled):
    profile = get_course_delivery_profile(gamified_enrollment.program)
    profile.delivery_mode = mode
    profile.gamification_opt_in = opt_in
    profile.save()
    assert serialize_gamification(gamified_enrollment)["enabled"] is enabled


@pytest.mark.django_db(transaction=True)
def test_free_enrollment_receives_gamification_summary(gamified_enrollment):
    assert gamified_enrollment.access_source == "free"
    summary = serialize_gamification(gamified_enrollment)
    assert summary == {
        "enabled": True,
        "xp": 0,
        "streak": {"currentDays": 0, "longestDays": 0, "lastActivityDate": None},
        "badges": [],
    }
