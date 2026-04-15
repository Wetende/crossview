"""Official assessment result helpers.

These helpers centralize attempt-selection rules used by runtime APIs,
completion checks, gradebook aggregation, and certification eligibility.
"""

from __future__ import annotations

from typing import Optional, Tuple

from apps.assessments.models import AssignmentSubmission, QuizAttempt


FINALIZED_ASSIGNMENT_STATUSES = {"graded", "returned"}


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


def can_start_quiz_attempt(quiz, enrollment) -> Tuple[bool, int, int]:
    """Return (allowed, attempts_used, attempts_remaining) with retry policy enforced."""
    attempts_used = QuizAttempt.objects.filter(
        enrollment=enrollment,
        quiz=quiz,
        submitted_at__isnull=False,
    ).count()

    if attempts_used >= quiz.max_attempts:
        return False, attempts_used, 0

    if not quiz.allow_retake_after_pass:
        has_passed = QuizAttempt.objects.filter(
            enrollment=enrollment,
            quiz=quiz,
            submitted_at__isnull=False,
            passed=True,
        ).exists()
        if has_passed:
            return False, attempts_used, 0

    return True, attempts_used, max(0, quiz.max_attempts - attempts_used)


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
    if max_attempts is None:
        return None, attempts_used, None
    return max_attempts, attempts_used, max(0, max_attempts - attempts_used)


def assignment_attempt_passed(attempt: Optional[AssignmentSubmission], fallback_threshold: float = 50.0) -> bool:
    """Return whether an assignment attempt is passing based on scored result."""
    if not attempt:
        return False

    final_score = attempt.get_final_score()
    if final_score is None:
        return False

    threshold = _safe_float(getattr(attempt.assignment, "pass_threshold", fallback_threshold))
    return float(final_score) >= threshold
