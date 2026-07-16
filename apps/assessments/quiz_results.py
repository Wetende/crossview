"""Shared learner-facing quiz results payload construction."""

from __future__ import annotations

from typing import Optional

from apps.assessments.models import Quiz, QuizAttempt
from apps.assessments.official_results import (
    can_start_quiz_attempt,
    get_official_quiz_attempt,
)
from apps.assessments.text_normalization import (
    normalize_assessment_text,
    normalize_true_false_choice,
)


def _coerce_bool(value, default=False) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off", ""}:
            return False
    return bool(value)


def _serialize_attempt(attempt: Optional[QuizAttempt]) -> Optional[dict]:
    if not attempt:
        return None
    return {
        "id": attempt.id,
        "attemptNumber": attempt.attempt_number,
        "score": float(attempt.score) if attempt.score is not None else None,
        "pointsEarned": (
            float(attempt.points_earned)
            if attempt.points_earned is not None
            else None
        ),
        "pointsPossible": attempt.points_possible,
        "passed": attempt.passed,
        "submittedAt": (
            attempt.submitted_at.isoformat() if attempt.submitted_at else None
        ),
    }


def _normalize_option_label(question, raw_value):
    token = str(raw_value).strip()
    for option in question.options.all():
        if str(option.id) == token or str(option.position) == token:
            return option.text
    return token


def _format_student_answer(question, answer, attempt_id):
    if answer is None:
        return "Not answered"

    question_type = question.question_type
    if question_type in {"mcq", "true_false"}:
        option_label = _normalize_option_label(question, answer)
        if option_label != str(answer).strip():
            return option_label
        if question_type == "true_false":
            normalized = normalize_true_false_choice(answer)
            if normalized is not None:
                return "True" if normalized else "False"
        return option_label

    if question_type == "mcq_multi":
        if not isinstance(answer, list):
            return str(answer)
        labels = [_normalize_option_label(question, value) for value in answer]
        return ", ".join(labels) if labels else "Not answered"

    if question_type == "short_answer":
        return str(answer).strip() or "Not answered"

    if question_type == "matching":
        if not isinstance(answer, dict):
            return str(answer)
        entries = [
            f"{str(left).strip()} -> {str(right).strip()}"
            for left, right in answer.items()
        ]
        return "; ".join(entries) if entries else "Not answered"

    if question_type == "ordering":
        if not isinstance(answer, list):
            return str(answer)
        return " -> ".join(str(item).strip() for item in answer if str(item).strip())

    if question_type == "fill_blank":
        if not isinstance(answer, dict):
            return str(answer)
        entries = [
            f"Blank {str(index)}: {str(value).strip()}"
            for index, value in sorted(answer.items(), key=lambda item: str(item[0]))
        ]
        return "; ".join(entries) if entries else "Not answered"

    if question_type == "image_matching":
        if not isinstance(answer, dict):
            return str(answer)
        pairs = list(question.image_matching_pairs.all().order_by("position"))
        right_labels = {
            question.get_image_matching_item_id(pair.id, attempt_id, "right"): pair.answer_text
            for pair in pairs
        }
        entries = []
        for pair in pairs:
            left_token = question.get_image_matching_item_id(
                pair.id, attempt_id, "left"
            )
            submitted = answer.get(left_token)
            label = (
                right_labels.get(str(submitted), "Unmatched")
                if submitted is not None
                else "Unmatched"
            )
            entries.append(f"{pair.question_text} -> {label}")
        return "; ".join(entries) if entries else "Not answered"

    return str(answer)


def _format_correct_answer(question):
    question_type = question.question_type
    if question_type == "mcq":
        option = question.options.filter(is_correct=True).order_by("position").first()
        return option.text if option else "N/A"

    if question_type == "true_false":
        correct_bool = normalize_true_false_choice(
            (question.answer_data or {}).get("correct")
        )
        if correct_bool is None:
            return "N/A"
        return "True" if correct_bool else "False"

    if question_type == "mcq_multi":
        labels = list(
            question.options.filter(is_correct=True)
            .order_by("position")
            .values_list("text", flat=True)
        )
        return ", ".join(labels) if labels else "N/A"

    if question_type == "short_answer":
        keywords = (question.answer_data or {}).get("keywords", [])
        if not keywords:
            return "Manual review"
        return ", ".join(
            str(keyword).strip() for keyword in keywords if str(keyword).strip()
        )

    if question_type == "matching":
        entries = [
            f"{pair.left_text} -> {pair.right_text}"
            for pair in question.matching_pairs.all().order_by("position")
        ]
        return "; ".join(entries) if entries else "N/A"

    if question_type == "ordering":
        items = (question.answer_data or {}).get("items", [])
        if not isinstance(items, list):
            return "N/A"
        return " -> ".join(str(item).strip() for item in items if str(item).strip())

    if question_type == "fill_blank":
        entries = [
            f"Blank {gap.gap_index}: {' / '.join(gap.accepted_answers)}"
            for gap in question.gap_answers.all().order_by("gap_index")
        ]
        return "; ".join(entries) if entries else "N/A"

    if question_type == "image_matching":
        entries = [
            f"{pair.question_text} -> {pair.answer_text}"
            for pair in question.image_matching_pairs.all().order_by("position")
        ]
        return "; ".join(entries) if entries else "N/A"

    return "N/A"


def _correct_answers_released(quiz, attempt, eligibility, has_passed_quiz) -> bool:
    policy = quiz.answer_release_policy
    no_more_attempts_available = not eligibility.allowed

    if policy == Quiz.AnswerReleasePolicy.AFTER_EACH_ATTEMPT:
        return True
    if policy == Quiz.AnswerReleasePolicy.AFTER_PASS_OR_FINAL:
        return has_passed_quiz or attempt.passed is True or no_more_attempts_available
    if policy == Quiz.AnswerReleasePolicy.AFTER_FINAL_ATTEMPT:
        return no_more_attempts_available
    return False


def build_quiz_results_payload(
    *,
    quiz: Quiz,
    enrollment,
    selected_attempt_id=None,
    retry_url: Optional[str] = None,
    review_url: Optional[str] = None,
) -> Optional[dict]:
    """Build one results contract for course-player and standalone rendering."""
    attempts = list(
        QuizAttempt.objects.filter(
            enrollment=enrollment,
            quiz=quiz,
            submitted_at__isnull=False,
        ).order_by("-attempt_number")
    )
    if not attempts:
        return None

    selected_id = None
    try:
        selected_id = int(selected_attempt_id)
    except (TypeError, ValueError):
        pass

    reviewed_attempt = next(
        (attempt for attempt in attempts if attempt.id == selected_id),
        attempts[0],
    )
    official_attempt = get_official_quiz_attempt(enrollment, quiz)
    eligibility = can_start_quiz_attempt(quiz, enrollment)
    correct_answers_released = _correct_answers_released(
        quiz,
        reviewed_attempt,
        eligibility,
        has_passed_quiz=any(attempt.passed is True for attempt in attempts),
    )

    node_properties = (
        quiz.node.properties if isinstance(quiz.node.properties, dict) else {}
    )
    show_attempt_history = _coerce_bool(
        node_properties.get("quiz_attempt_history"),
        default="quiz_attempt_history" not in node_properties,
    )

    from apps.assessments.question_snapshots import build_snapshot_question_review

    question_review = build_snapshot_question_review(
        reviewed_attempt,
        correct_answers_released=correct_answers_released,
    )

    serialized_attempts = [_serialize_attempt(attempt) for attempt in attempts]
    return {
        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
            "passThreshold": quiz.pass_threshold,
            "maxAttempts": quiz.max_attempts,
            "nodeTitle": quiz.node.title,
            "answerReleasePolicy": quiz.answer_release_policy,
            "showCorrectAnswer": correct_answers_released,
            "showAttemptHistory": show_attempt_history,
            "retryUrl": retry_url or f"/student/quiz/{quiz.id}/",
            "reviewUrl": review_url or f"/student/quiz/{quiz.id}/results/",
        },
        "attempts": serialized_attempts,
        "officialAttempt": _serialize_attempt(official_attempt),
        "reviewedAttempt": _serialize_attempt(reviewed_attempt),
        "questionReview": question_review,
        "correctAnswersReleased": correct_answers_released,
        "attemptsRemaining": eligibility.attempts_remaining,
        "canRetry": eligibility.allowed,
        "retryLockReason": eligibility.lock_reason,
    }
