from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.db.models import Sum

from apps.learning_operations.models import CourseDeliveryProfile
from apps.learning_operations.services import get_course_delivery_profile
from apps.notifications.services import NotificationService
from apps.platform.models import PlatformSettings

from .models import Badge, LearningStreak, NodeCompletion, StudentBadge, StudentXP


DEFAULT_BADGES = {
    "lesson_complete": ("first-lesson", "First lesson", "Completed a lesson."),
    "quiz_pass": ("quiz-passed", "Quiz passed", "Passed a quiz."),
    "quiz_perfect": ("perfect-quiz", "Perfect quiz", "Earned a perfect quiz score."),
    "first_try_pass": ("first-try", "First try", "Passed a quiz on the first attempt."),
    "streak_7": ("seven-day-streak", "7-day streak", "Learned for seven consecutive days."),
    "streak_30": ("thirty-day-streak", "30-day streak", "Learned for thirty consecutive days."),
    "course_complete": ("course-complete", "Course complete", "Completed a course."),
}


def gamification_is_enabled(enrollment):
    settings = PlatformSettings.get_settings()
    if not settings.is_feature_enabled("gamification"):
        return False
    profile = get_course_delivery_profile(enrollment.program)
    if profile.delivery_mode in {
        CourseDeliveryProfile.SELF_PACED,
        CourseDeliveryProfile.LIVE_ONLINE,
    }:
        return True
    return profile.gamification_opt_in


def award_xp(
    *, enrollment, amount, reason, idempotency_key, source_node=None, metadata=None
):
    if amount <= 0 or not gamification_is_enabled(enrollment):
        return None
    award, _ = StudentXP.objects.get_or_create(
        idempotency_key=idempotency_key,
        defaults={
            "enrollment": enrollment,
            "source_node": source_node,
            "xp_amount": int(amount),
            "reason": reason,
            "metadata": metadata or {},
        },
    )
    return award


def _badge_definitions(trigger):
    default = DEFAULT_BADGES.get(trigger)
    if default:
        Badge.objects.get_or_create(
            code=default[0],
            defaults={
                "name": default[1],
                "description": default[2],
                "trigger": trigger,
                "is_active": True,
            },
        )
    return Badge.objects.filter(trigger=trigger, is_active=True)


def award_badges_for_trigger(enrollment, trigger, *, node=None):
    if not gamification_is_enabled(enrollment):
        return []
    awarded = []
    for badge in _badge_definitions(trigger):
        student_badge, created = StudentBadge.objects.get_or_create(
            enrollment=enrollment,
            badge=badge,
            defaults={"trigger_node": node},
        )
        if not created:
            continue
        awarded.append(student_badge)
        award_xp(
            enrollment=enrollment,
            amount=badge.xp_value,
            reason="badge_earned",
            source_node=node,
            idempotency_key=f"badge-xp:{student_badge.id}",
            metadata={"badgeCode": badge.code},
        )
        NotificationService.notify_with_email(
            recipient=enrollment.user,
            notification_type="badge_earned",
            title=f"Badge earned: {badge.name}",
            message=badge.description or f"You earned the {badge.name} badge.",
            action_url=f"/student/programs/{enrollment.program_id}/",
            related_program_id=enrollment.program_id,
            related_enrollment_id=enrollment.id,
            idempotency_key=f"badge:{student_badge.id}",
        )
    return awarded


def _configured_node_xp(node, default):
    settings = (node.properties or {}).get("gamification", {})
    if "xp_reward" in settings:
        try:
            return max(int(settings["xp_reward"]), 0)
        except (TypeError, ValueError):
            return default
    return default


def _configured_bonus(node, condition, enrollment):
    settings = (node.properties or {}).get("gamification", {})
    if settings.get("bonus_xp_condition") != condition:
        return 0
    try:
        return max(int(settings.get("bonus_xp_amount") or 0), 0)
    except (TypeError, ValueError):
        return 0


def _award_configured_bonus(enrollment, node, condition, source_key):
    amount = _configured_bonus(node, condition, enrollment)
    return award_xp(
        enrollment=enrollment,
        amount=amount,
        reason="manual",
        source_node=node,
        idempotency_key=f"configured-bonus:{source_key}:{condition}",
        metadata={"condition": condition},
    )


def award_course_completion(enrollment):
    published_leaves = enrollment.program.curriculum_nodes.filter(
        is_published=True, children__isnull=True
    )
    total = published_leaves.count()
    if not total:
        return None
    completed = NodeCompletion.objects.filter(
        enrollment=enrollment, node__in=published_leaves
    ).count()
    if completed < total:
        return None
    award = award_xp(
        enrollment=enrollment,
        amount=100,
        reason="course_complete",
        idempotency_key=f"course-complete:{enrollment.id}",
        metadata={"programId": enrollment.program_id},
    )
    award_badges_for_trigger(enrollment, "course_complete")
    return award


def handle_node_completion(completion):
    enrollment = completion.enrollment
    node = completion.node
    if not gamification_is_enabled(enrollment):
        return
    award_xp(
        enrollment=enrollment,
        amount=_configured_node_xp(node, 10),
        reason="lesson_complete",
        source_node=node,
        idempotency_key=f"lesson:{completion.id}",
    )
    award_badges_for_trigger(enrollment, "lesson_complete", node=node)
    _award_configured_bonus(enrollment, node, "streak", f"completion:{completion.id}")
    award_course_completion(enrollment)


def handle_quiz_attempt(attempt):
    if not attempt.submitted_at or attempt.passed is not True:
        return
    enrollment = attempt.enrollment
    node = attempt.quiz.node
    if not gamification_is_enabled(enrollment):
        return
    award_xp(
        enrollment=enrollment,
        amount=20,
        reason="quiz_pass",
        source_node=node,
        idempotency_key=f"quiz-pass:{enrollment.id}:{attempt.quiz_id}",
    )
    award_badges_for_trigger(enrollment, "quiz_pass", node=node)
    if attempt.score is not None and float(attempt.score) >= 100:
        award_xp(
            enrollment=enrollment,
            amount=10,
            reason="quiz_perfect",
            source_node=node,
            idempotency_key=f"quiz-perfect:{enrollment.id}:{attempt.quiz_id}",
        )
        award_badges_for_trigger(enrollment, "quiz_perfect", node=node)
    if attempt.attempt_number == 1:
        award_xp(
            enrollment=enrollment,
            amount=10,
            reason="first_try",
            source_node=node,
            idempotency_key=f"quiz-first:{enrollment.id}:{attempt.quiz_id}",
        )
        award_badges_for_trigger(enrollment, "first_try_pass", node=node)
        _award_configured_bonus(
            enrollment, node, "first_try_pass", f"quiz:{attempt.quiz_id}"
        )
    if attempt.quiz.time_limit_minutes and attempt.started_at:
        elapsed = attempt.submitted_at - attempt.started_at
        if elapsed <= timedelta(minutes=attempt.quiz.time_limit_minutes):
            _award_configured_bonus(
                enrollment, node, "under_time", f"quiz:{attempt.quiz_id}"
            )


def handle_assignment_submission(submission):
    if submission.status not in {"submitted", "graded"}:
        return
    enrollment = submission.enrollment
    award_xp(
        enrollment=enrollment,
        amount=20,
        reason="assignment_submit",
        idempotency_key=f"assignment:{enrollment.id}:{submission.assignment_id}",
        metadata={"assignmentId": submission.assignment_id},
    )


@transaction.atomic
def update_learning_streak(enrollment, activity_date):
    streak, _ = LearningStreak.objects.select_for_update().get_or_create(
        enrollment=enrollment
    )
    previous = streak.last_activity_date
    if previous and activity_date <= previous:
        return streak
    if previous and activity_date == previous + timedelta(days=1):
        streak.current_days += 1
    else:
        streak.current_days = 1
    streak.longest_days = max(streak.longest_days, streak.current_days)
    streak.last_activity_date = activity_date
    streak.save(
        update_fields=["current_days", "longest_days", "last_activity_date", "updated_at"]
    )
    for days, amount, trigger in [(7, 25, "streak_7"), (30, 100, "streak_30")]:
        if streak.current_days >= days:
            award_xp(
                enrollment=enrollment,
                amount=amount,
                reason="streak_bonus",
                idempotency_key=f"streak:{enrollment.id}:{days}",
                metadata={"days": days},
            )
            award_badges_for_trigger(enrollment, trigger)
    return streak


def serialize_gamification(enrollment):
    enabled = gamification_is_enabled(enrollment)
    total_xp = enrollment.xp_logs.aggregate(total=Sum("xp_amount"))["total"] or 0
    try:
        streak = enrollment.learning_streak
    except LearningStreak.DoesNotExist:
        streak = None
    badges = enrollment.earned_badges.select_related("badge").order_by("-earned_at")
    return {
        "enabled": enabled,
        "xp": total_xp,
        "streak": {
            "currentDays": streak.current_days if streak else 0,
            "longestDays": streak.longest_days if streak else 0,
            "lastActivityDate": (
                streak.last_activity_date.isoformat()
                if streak and streak.last_activity_date
                else None
            ),
        },
        "badges": [
            {
                "code": item.badge.code,
                "name": item.badge.name,
                "description": item.badge.description,
                "icon": item.badge.icon,
                "earnedAt": item.earned_at.isoformat(),
            }
            for item in badges
        ],
    }
