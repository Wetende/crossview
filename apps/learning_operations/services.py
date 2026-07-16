from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.platform.models import PlatformSettings
from apps.platform.policy import get_platform_policy

from .models import (
    CourseDeliveryProfile,
    EnrollmentLearningActivity,
    LearningActivityDay,
    ManualQuizGrade,
)


ONLINE_DELIVERY_MODES = {
    CourseDeliveryProfile.SELF_PACED,
    CourseDeliveryProfile.LIVE_ONLINE,
    CourseDeliveryProfile.BLENDED,
}


def default_delivery_mode() -> str:
    policy_mode = str(get_platform_policy().get("course_delivery_mode") or "").strip()
    valid_modes = {choice[0] for choice in CourseDeliveryProfile.DELIVERY_MODE_CHOICES}
    if policy_mode in valid_modes:
        return policy_mode

    platform_mode = PlatformSettings.get_settings().deployment_mode
    if platform_mode == PlatformSettings.DeploymentMode.ONLINE:
        return CourseDeliveryProfile.SELF_PACED
    return CourseDeliveryProfile.IN_PERSON


def delivery_mode_locked() -> bool:
    return bool(get_platform_policy().get("course_delivery_mode"))


def get_course_delivery_profile(program) -> CourseDeliveryProfile:
    profile, _ = CourseDeliveryProfile.objects.get_or_create(
        program=program,
        defaults={"delivery_mode": default_delivery_mode()},
    )
    return profile


def update_course_delivery_profile(program, delivery_mode: str) -> CourseDeliveryProfile:
    profile = get_course_delivery_profile(program)
    if delivery_mode_locked() and delivery_mode != profile.delivery_mode:
        raise ValidationError("Course delivery mode is controlled by platform policy.")

    valid_modes = {choice[0] for choice in CourseDeliveryProfile.DELIVERY_MODE_CHOICES}
    if delivery_mode not in valid_modes:
        raise ValidationError("Select a valid course delivery mode.")

    if profile.delivery_mode != delivery_mode:
        profile.delivery_mode = delivery_mode
        profile.save(update_fields=["delivery_mode", "updated_at"])
    return profile


@transaction.atomic
def record_learning_activity(enrollment, source: str, occurred_at=None):
    occurred_at = occurred_at or timezone.now()
    source = str(source or "learning").strip()[:64]
    activity, _ = EnrollmentLearningActivity.objects.select_for_update().get_or_create(
        enrollment=enrollment
    )

    update_fields = []
    if activity.started_at is None or occurred_at < activity.started_at:
        activity.started_at = occurred_at
        update_fields.append("started_at")
    if activity.last_activity_at is None or occurred_at > activity.last_activity_at:
        activity.last_activity_at = occurred_at
        activity.last_source = source
        update_fields.extend(["last_activity_at", "last_source"])
    if update_fields:
        activity.save(update_fields=[*dict.fromkeys(update_fields), "updated_at"])

    activity_date = timezone.localdate(occurred_at)
    day, created = LearningActivityDay.objects.get_or_create(
        enrollment=enrollment,
        activity_date=activity_date,
        defaults={
            "first_activity_at": occurred_at,
            "last_activity_at": occurred_at,
            "sources": [source] if source else [],
        },
    )
    if created:
        return activity

    sources = list(day.sources or [])
    if source and source not in sources:
        sources.append(source)
    LearningActivityDay.objects.filter(pk=day.pk).update(
        first_activity_at=min(day.first_activity_at, occurred_at),
        last_activity_at=max(day.last_activity_at, occurred_at),
        event_count=F("event_count") + 1,
        sources=sources,
        updated_at=timezone.now(),
    )
    return activity


def classify_enrollment(enrollment, now=None) -> str:
    now = now or timezone.now()
    if enrollment.status != "active":
        return enrollment.status
    if enrollment.expires_at and enrollment.expires_at <= now:
        return "expired"

    try:
        activity = enrollment.learning_activity
    except EnrollmentLearningActivity.DoesNotExist:
        activity = None

    if not activity or not activity.started_at:
        age = now - enrollment.enrolled_at
        return "not_started" if age >= timedelta(days=3) else "new"

    last_activity = activity.last_activity_at or activity.started_at
    inactive_for = now - last_activity
    if inactive_for >= timedelta(days=30):
        return "inactive"
    if inactive_for >= timedelta(days=7):
        return "stalled"
    return "active"


@transaction.atomic
def grade_manual_quiz_response(*, attempt, question, points_awarded, feedback, grader):
    from apps.assessments.models import Question

    if question.quiz_id != attempt.quiz_id:
        raise ValidationError("Question does not belong to this quiz attempt.")
    if question.question_type != "short_answer" or not question.answer_data.get(
        "manual_grading", True
    ):
        raise ValidationError("This question does not require manual grading.")
    if str(question.id) not in (attempt.answers or {}):
        raise ValidationError("The learner did not answer this question.")

    points = Decimal(str(points_awarded))
    if points < 0 or points > Decimal(question.points):
        raise ValidationError(
            f"Points must be between 0 and {question.points}."
        )

    grade, _ = ManualQuizGrade.objects.update_or_create(
        attempt=attempt,
        question=question,
        defaults={
            "points_awarded": points,
            "feedback": str(feedback or "").strip(),
            "graded_by": grader,
            "graded_at": timezone.now(),
        },
    )

    manual_question_ids = set(
        Question.objects.filter(
            quiz=attempt.quiz,
            question_type="short_answer",
        )
        .filter(answer_data__manual_grading=True)
        .values_list("id", flat=True)
    )
    answered_manual_ids = {
        question_id
        for question_id in manual_question_ids
        if str(question_id) in (attempt.answers or {})
    }
    graded_ids = set(
        ManualQuizGrade.objects.filter(
            attempt=attempt,
            question_id__in=answered_manual_ids,
        ).values_list("question_id", flat=True)
    )

    points_earned, points_possible, percentage, passed = attempt.calculate_score()
    attempt.points_earned = points_earned
    attempt.points_possible = points_possible
    attempt.score = Decimal(str(percentage))
    attempt.passed = passed if answered_manual_ids <= graded_ids else None
    attempt.save(
        update_fields=["points_earned", "points_possible", "score", "passed"]
    )
    return grade, attempt

