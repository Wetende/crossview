"""
Validation and non-destructive saving of connector-authored quiz questions.

The course builder saves quizzes by sending the complete question list, and
questions missing from that list are deleted. The connector never uses that
path for existing quizzes: it appends or edits individual questions and leaves
every other question, option ID, setting and attempt untouched.
"""

from django.db.models import Max

from apps.assessments.models import Question, QuestionOption
from apps.assessments.quiz_properties import build_quiz_question_properties
from apps.assessments.text_normalization import (
    normalize_question_answer_data,
    normalize_true_false_choice,
)

from .access import ConnectorError
from .sanitize import plain_text

MAX_QUESTIONS = 50
MAX_OPTIONS = 10
MAX_TEXT = 2000
MAX_OPTION_TEXT = 500

TYPE_ALIASES = {
    "single_choice": "mcq",
    "mcq": "mcq",
    "multiple_choice": "mcq_multi",
    "mcq_multi": "mcq_multi",
    "true_false": "true_false",
}
LABELS = {"mcq": "single_choice", "mcq_multi": "multiple_choice", "true_false": "true_false"}


def _as_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str) and value.strip().lower() in {"true", "false"}:
        return value.strip().lower() == "true"
    raise ConnectorError("true_false questions need correct set to true or false.")


def _as_index(value, option_count, label):
    try:
        index = int(value)
    except (TypeError, ValueError):
        raise ConnectorError(f"{label} must be an option index starting at 0.")
    if isinstance(value, bool) or not 0 <= index < option_count:
        raise ConnectorError(f"{label} {value!r} is outside the {option_count} options.")
    return index


def normalize_question(raw, default_points=1) -> dict:
    """Validate one question spec and return its canonical stored form."""
    if not isinstance(raw, dict):
        raise ConnectorError("Each question must be an object.")
    question_type = TYPE_ALIASES.get(str(raw.get("type") or "").strip().lower())
    if question_type is None:
        raise ConnectorError(
            "Question type must be single_choice, multiple_choice or true_false. "
            "Other question types can be read but not written by this connector."
        )

    text = plain_text(raw.get("text"))
    if not text:
        raise ConnectorError("Question text is required.")
    if len(text) > MAX_TEXT:
        raise ConnectorError(f"Question text is limited to {MAX_TEXT} characters.")

    points = raw.get("points", default_points)
    try:
        points = int(points)
    except (TypeError, ValueError):
        raise ConnectorError("points must be a whole number.")
    if not 1 <= points <= 100:
        raise ConnectorError("points must be between 1 and 100.")

    question = {"type": question_type, "text": text, "points": points}
    if question_type == "true_false":
        question["correct"] = _as_bool(raw.get("correct"))
        return question

    raw_options = raw.get("options")
    if not isinstance(raw_options, list):
        raise ConnectorError("Choice questions need an options list.")
    options = [plain_text(option) for option in raw_options]
    if any(not option for option in options):
        raise ConnectorError("Options cannot be empty.")
    if not 2 <= len(options) <= MAX_OPTIONS:
        raise ConnectorError(f"Choice questions need between 2 and {MAX_OPTIONS} options.")
    if any(len(option) > MAX_OPTION_TEXT for option in options):
        raise ConnectorError(f"Options are limited to {MAX_OPTION_TEXT} characters.")
    if len({option.lower() for option in options}) != len(options):
        raise ConnectorError("Options within a question must be different.")
    question["options"] = options

    correct = raw.get("correct")
    if question_type == "mcq":
        question["correct"] = _as_index(correct, len(options), "correct")
    else:
        if not isinstance(correct, list) or not correct:
            raise ConnectorError("multiple_choice questions need correct as a list of option indexes.")
        indexes = sorted({_as_index(value, len(options), "correct") for value in correct})
        question["correct"] = indexes
    return question


def normalize_question_list(raw_questions) -> list[dict]:
    if not isinstance(raw_questions, list) or not raw_questions:
        raise ConnectorError("Provide at least one question.")
    if len(raw_questions) > MAX_QUESTIONS:
        raise ConnectorError(f"A single change can add at most {MAX_QUESTIONS} questions.")
    normalized = []
    for index, raw in enumerate(raw_questions, start=1):
        try:
            normalized.append(normalize_question(raw))
        except ConnectorError as exc:
            raise ConnectorError(f"Question {index}: {exc}") from exc
    return normalized


def describe(question: dict) -> dict:
    """Readable form of a canonical question for previews."""
    described = {
        "type": LABELS[question["type"]],
        "text": question["text"],
        "points": question["points"],
    }
    if question["type"] == "true_false":
        described["correct_answer"] = "True" if question["correct"] else "False"
        return described
    correct = question["correct"] if isinstance(question["correct"], list) else [question["correct"]]
    described["options"] = [
        {"text": option, "correct": index in correct}
        for index, option in enumerate(question["options"])
    ]
    return described


def to_builder_payload(question: dict) -> dict:
    """Convert a canonical question into the course builder's question format."""
    payload = {"type": question["type"], "text": question["text"], "points": question["points"]}
    if question["type"] == "mcq":
        payload.update(options=question["options"], correct=question["correct"])
    elif question["type"] == "mcq_multi":
        payload.update(options=question["options"], correct_indices=question["correct"])
    else:
        payload["correct"] = question["correct"]
    return payload


def _answer_data(question: dict) -> dict:
    if question["type"] == "mcq":
        data = {"options": question["options"], "correct": question["correct"]}
    elif question["type"] == "mcq_multi":
        data = {"options": question["options"], "correct_indices": question["correct"]}
    else:
        data = {"correct": question["correct"]}
    return normalize_question_answer_data(question["type"], data)


def _write_options(question_record, question: dict) -> None:
    """Update options in place so existing option IDs survive the edit."""
    existing = list(question_record.options.order_by("position", "id"))
    wanted = question.get("options", []) if question["type"] != "true_false" else []
    correct = question["correct"] if isinstance(question.get("correct"), list) else [question.get("correct")]
    for index, text in enumerate(wanted):
        is_correct = index in correct
        if index < len(existing):
            option = existing[index]
            option.text, option.is_correct, option.position = text, is_correct, index
            option.save(update_fields=["text", "is_correct", "position"])
        else:
            QuestionOption.objects.create(
                question=question_record, text=text, is_correct=is_correct, position=index
            )
    for option in existing[len(wanted):]:
        option.delete()


def append_questions(quiz, questions: list[dict]) -> list[int]:
    top = quiz.questions.aggregate(top=Max("position"))["top"]
    next_position = 0 if top is None else top + 1
    created_ids = []
    for offset, question in enumerate(questions):
        record = Question.objects.create(
            quiz=quiz,
            question_type=question["type"],
            text=question["text"],
            points=question["points"],
            position=next_position + offset,
            answer_data=_answer_data(question),
        )
        _write_options(record, question)
        created_ids.append(record.id)
    return created_ids


def update_question(record, question: dict) -> None:
    record.question_type = question["type"]
    record.text = question["text"]
    record.points = question["points"]
    record.answer_data = _answer_data(question)
    record.save(update_fields=["question_type", "text", "points", "answer_data", "updated_at"])
    _write_options(record, question)


def canonical_from_record(record) -> dict | None:
    """Return the canonical form of a stored writable question, or None."""
    if record.question_type not in LABELS:
        return None
    options = list(record.options.order_by("position", "id"))
    question = {"type": record.question_type, "text": record.text, "points": record.points}
    if record.question_type == "true_false":
        answer_data = record.answer_data if isinstance(record.answer_data, dict) else {}
        question["correct"] = bool(normalize_true_false_choice(answer_data.get("correct"), default=True))
        return question
    question["options"] = [option.text for option in options]
    correct = [index for index, option in enumerate(options) if option.is_correct]
    question["correct"] = correct if record.question_type == "mcq_multi" else (correct[0] if correct else 0)
    return question


def refresh_quiz_properties(node, quiz) -> None:
    """Rebuild the node's question mirror from the database, keeping builder flags."""
    props = dict(node.properties) if isinstance(node.properties, dict) else {}
    metadata_by_id = {}
    for entry in props.get("questions", []) or []:
        if isinstance(entry, dict) and entry.get("db_id") and entry.get("generated_from_assessment_prompt") is True:
            metadata_by_id[entry["db_id"]] = {"generated_from_assessment_prompt": True}
    props["questions"] = build_quiz_question_properties(quiz, metadata_by_id)
    props["quiz_id"] = quiz.id
    node.properties = props
    node.save(update_fields=["properties", "updated_at"], skip_validation=True)
