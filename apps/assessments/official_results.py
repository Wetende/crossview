"""Official assessment result helpers.

These helpers centralize attempt-selection rules used by runtime APIs,
completion checks, gradebook aggregation, and certification eligibility.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Tuple

from apps.assessments.models import AssignmentSubmission, QuizAttempt


FINALIZED_ASSIGNMENT_STATUSES = {"graded", "returned"}


@dataclass(frozen=True)
class QuizAttemptEligibility:
    """Attempt quota and policy decision for a learner's quiz."""

    allowed: bool
    attempts_used: int
    attempts_remaining: int
    lock_reason: Optional[str] = None


def _safe_float(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def get_official_quiz_attempt(enrollment, quiz) -> Optional[QuizAttempt]:
    """Return the best finalized quiz attempt for this enrollment and quiz."""
    return (
        QuizAttempt.objects.filter(
            enrollment=enrollment,
            quiz=quiz,
            submitted_at__isnull=False,
            score__isnull=False,
        )
        .order_by("-score", "-attempt_number")
        .first()
    )


def can_start_quiz_attempt(quiz, enrollment) -> QuizAttemptEligibility:
    """Return numeric quota separately from any policy that blocks another attempt."""
    attempts_used = QuizAttempt.objects.filter(
        enrollment=enrollment,
        quiz=quiz,
        submitted_at__isnull=False,
    ).count()
    from apps.learning_operations.models import AssessmentAttemptGrant

    granted_attempts = sum(
        AssessmentAttemptGrant.objects.filter(
            enrollment=enrollment,
            assessment_type=AssessmentAttemptGrant.QUIZ,
            quiz=quiz,
        ).values_list("extra_attempts", flat=True)
    )
    allowed_attempts = quiz.max_attempts + granted_attempts
    attempts_remaining = max(0, allowed_attempts - attempts_used)

    if attempts_remaining == 0:
        return QuizAttemptEligibility(
            allowed=False,
            attempts_used=attempts_used,
            attempts_remaining=0,
            lock_reason="max_attempts_reached",
        )

    if not quiz.allow_retake_after_pass and granted_attempts == 0:
        has_passed = QuizAttempt.objects.filter(
            enrollment=enrollment,
            quiz=quiz,
            submitted_at__isnull=False,
            passed=True,
        ).exists()
        if has_passed:
            return QuizAttemptEligibility(
                allowed=False,
                attempts_used=attempts_used,
                attempts_remaining=attempts_remaining,
                lock_reason="passed_retake_disabled",
            )

    return QuizAttemptEligibility(
        allowed=True,
        attempts_used=attempts_used,
        attempts_remaining=attempts_remaining,
    )


def get_official_assignment_attempt(enrollment, assignment) -> Optional[AssignmentSubmission]:
    """Return the highest graded/finalized assignment attempt."""
    return (
        AssignmentSubmission.objects.filter(
            enrollment=enrollment,
            assignment=assignment,
            status__in=FINALIZED_ASSIGNMENT_STATUSES,
            score__isnull=False,
        )
        .order_by("-score", "-attempt_number")
        .first()
    )


def refresh_assignment_official_flags(enrollment, assignment) -> Optional[AssignmentSubmission]:
    """Mark exactly one official assignment attempt for the enrollment-assignment pair."""
    official = get_official_assignment_attempt(enrollment, assignment)
    AssignmentSubmission.objects.filter(
        enrollment=enrollment,
        assignment=assignment,
        is_official=True,
    ).exclude(pk=getattr(official, "pk", None)).update(is_official=False)

    if official and not official.is_official:
        official.is_official = True
        official.save(update_fields=["is_official"])

    return official


def parse_assignment_attempt_limit(node_properties) -> Optional[int]:
    """Return assignment attempt cap, or None when unlimited/unspecified."""
    props = node_properties if isinstance(node_properties, dict) else {}
    raw = props.get("assignment_attempts")
    if raw in (None, "", 0, "0"):
        return None
    try:
        parsed = int(raw)
    except (TypeError, ValueError):
        return None
    if parsed <= 0:
        return None
    return parsed


def get_assignment_attempts_remaining(enrollment, assignment, node_properties) -> Tuple[Optional[int], int, Optional[int]]:
    """Return (max_attempts, attempts_used, attempts_remaining)."""
    max_attempts = parse_assignment_attempt_limit(node_properties)
    attempts_used = AssignmentSubmission.objects.filter(
        enrollment=enrollment,
        assignment=assignment,
        submitted_at__isnull=False,
    ).count()
    from apps.learning_operations.models import AssessmentAttemptGrant

    granted_attempts = sum(
        AssessmentAttemptGrant.objects.filter(
            enrollment=enrollment,
            assessment_type=AssessmentAttemptGrant.ASSIGNMENT,
            assignment=assignment,
        ).values_list("extra_attempts", flat=True)
    )
    if max_attempts is None:
        return None, attempts_used, None
    effective_max = max_attempts + granted_attempts
    return effective_max, attempts_used, max(0, effective_max - attempts_used)


def assignment_attempt_passed(attempt: Optional[AssignmentSubmission], fallback_threshold: float = 50.0) -> bool:
    """Return whether an assignment attempt is passing based on scored result."""
    if not attempt:
        return False

    final_score = attempt.get_final_score()
    if final_score is None:
        return False

    threshold = _safe_float(getattr(attempt.assignment, "pass_threshold", fallback_threshold))
    return float(final_score) >= threshold
