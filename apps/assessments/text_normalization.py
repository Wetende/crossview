from html import unescape

from django.utils.html import strip_tags


def normalize_assessment_text(value) -> str:
    decoded = unescape(str(value or "")).replace("\xa0", " ")
    return " ".join(strip_tags(decoded).split())


def normalize_assessment_text_list(values) -> list[str]:
    if not isinstance(values, list):
        return []

    normalized = []
    for value in values:
        cleaned = normalize_assessment_text(value)
        if cleaned:
            normalized.append(cleaned)
    return normalized


def normalize_assessment_text_mapping(values) -> dict[str, str]:
    if not isinstance(values, dict):
        return {}

    normalized = {}
    for key, value in values.items():
        cleaned = normalize_assessment_text(value)
        if cleaned:
            normalized[str(key)] = cleaned
    return normalized


def normalize_true_false_choice(value, default=None):
    """
    Normalize true/false values from quiz builder and player payloads.

    The builder stores True/False selections as UI positions: 0 = True,
    1 = False. Keep that legacy contract distinct from Python truthiness.
    """
    if isinstance(value, bool):
        return value

    if value is None:
        return default

    if isinstance(value, (int, float)):
        numeric = int(value)
        if numeric == 0:
            return True
        if numeric == 1:
            return False
        return default

    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "yes", "on"}:
            return True
        if normalized in {"false", "no", "off"}:
            return False
        if normalized == "0":
            return True
        if normalized == "1":
            return False

    return default


def true_false_choice_to_index(value, default=0) -> int:
    normalized = normalize_true_false_choice(value)
    if normalized is None:
        return default
    return 0 if normalized else 1


def normalize_question_answer_data(question_type: str, answer_data):
    if not isinstance(answer_data, dict):
        return {}

    normalized = dict(answer_data)
    normalized_type = str(question_type or "").strip().lower()

    if normalized_type in {"mcq", "mcq_multi"}:
        normalized["options"] = normalize_assessment_text_list(
            normalized.get("options", [])
        )

    if normalized_type == "short_answer":
        normalized["keywords"] = normalize_assessment_text_list(
            normalized.get("keywords", [])
        )

    if normalized_type == "true_false":
        normalized["correct"] = normalize_true_false_choice(
            normalized.get("correct"),
            default=True,
        )

    if normalized_type == "ordering":
        raw_items = normalized.get("items")
        if not isinstance(raw_items, list) or len(raw_items) == 0:
            raw_items = normalized.get("correct_order", [])
        normalized["items"] = normalize_assessment_text_list(raw_items)
        normalized["explanations"] = normalize_assessment_text_mapping(
            normalized.get("explanations", {})
        )

    return normalized
