from __future__ import annotations

import copy
import random
from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from django.utils.crypto import salted_hmac

from apps.assessments.text_normalization import (
    normalize_assessment_text,
    normalize_assessment_text_list,
    normalize_question_answer_data,
    normalize_true_false_choice,
)

from .models import (
    Question,
    QuestionBankEntry,
    QuestionBankUsage,
    QuizAttemptQuestionSnapshot,
    QuizQuestionPool,
)


SNAPSHOT_VERSION = 1


def _round2(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _positive_int(value, default=1):
    try:
        return max(1, int(value))
    except (TypeError, ValueError):
        return default


def _option_key(option, position):
    value = option.get("key", option.get("id", position)) if isinstance(option, dict) else position
    try:
        return int(value)
    except (TypeError, ValueError):
        return position


def normalize_question_snapshot(value: dict) -> dict:
    """Return a complete, portable, versioned question snapshot."""
    raw = copy.deepcopy(value or {})
    if isinstance(raw.get("question_data"), dict):
        raw = raw["question_data"]
    question_type = str(raw.get("question_type") or raw.get("type") or "mcq")
    valid_types = {choice for choice, _ in Question.QUESTION_TYPE_CHOICES}
    if question_type not in valid_types:
        raise ValidationError("Select a supported question type.")

    text = normalize_assessment_text(raw.get("text", ""))
    if not text:
        raise ValidationError("Question text is required.")
    points = _positive_int(raw.get("points"), default=1)
    answer_data = normalize_question_answer_data(
        question_type,
        raw.get("answer_data") if isinstance(raw.get("answer_data"), dict) else {},
    )

    raw_options = raw.get("options") if isinstance(raw.get("options"), list) else []
    options = []
    for position, option in enumerate(raw_options):
        item = option if isinstance(option, dict) else {"text": option}
        options.append(
            {
                "key": _option_key(item, position),
                "text": normalize_assessment_text(item.get("text", "")),
                "is_correct": bool(item.get("is_correct", False)),
                "position": int(item.get("position", position)),
            }
        )
    if question_type == "mcq" and options and not any(item["is_correct"] for item in options):
        try:
            correct_position = int(answer_data.get("correct", 0))
        except (TypeError, ValueError):
            correct_position = 0
        for option in options:
            option["is_correct"] = option["position"] == correct_position
    if question_type == "mcq_multi" and options and not any(item["is_correct"] for item in options):
        correct_positions = {
            int(value)
            for value in answer_data.get("correct_indices", [])
            if str(value).lstrip("-").isdigit()
        }
        for option in options:
            option["is_correct"] = option["position"] in correct_positions

    matching_pairs = []
    for position, pair in enumerate(raw.get("matching_pairs") or raw.get("pairs") or []):
        if not isinstance(pair, dict):
            continue
        matching_pairs.append(
            {
                "key": _option_key(pair, position),
                "left_text": normalize_assessment_text(pair.get("left_text", "")),
                "right_text": normalize_assessment_text(pair.get("right_text", "")),
                "explanation": normalize_assessment_text(pair.get("explanation", "")),
                "position": int(pair.get("position", position)),
            }
        )

    gap_answers = []
    for position, gap in enumerate(raw.get("gap_answers") or raw.get("gaps") or []):
        if not isinstance(gap, dict):
            continue
        gap_answers.append(
            {
                "key": _option_key(gap, position),
                "gap_index": int(gap.get("gap_index", position)),
                "accepted_answers": normalize_assessment_text_list(
                    gap.get("accepted_answers", [])
                ),
                "explanation": normalize_assessment_text(gap.get("explanation", "")),
            }
        )

    image_matching_pairs = []
    for position, pair in enumerate(
        raw.get("image_matching_pairs") or raw.get("image_pairs") or []
    ):
        if not isinstance(pair, dict):
            continue
        image_matching_pairs.append(
            {
                "key": _option_key(pair, position),
                "question_text": normalize_assessment_text(pair.get("question_text", "")),
                "question_image": str(pair.get("question_image") or "").strip(),
                "answer_text": normalize_assessment_text(pair.get("answer_text", "")),
                "answer_image": str(pair.get("answer_image") or "").strip(),
                "explanation": normalize_assessment_text(pair.get("explanation", "")),
                "position": int(pair.get("position", position)),
            }
        )

    return {
        "version": SNAPSHOT_VERSION,
        "question_type": question_type,
        "text": text,
        "points": points,
        "answer_data": answer_data,
        "options": options,
        "matching_pairs": matching_pairs,
        "gap_answers": gap_answers,
        "image_matching_pairs": image_matching_pairs,
    }


def build_question_snapshot(question: Question) -> dict:
    return normalize_question_snapshot(
        {
            "question_type": question.question_type,
            "text": question.text,
            "points": question.points,
            "answer_data": copy.deepcopy(question.answer_data or {}),
            "options": [
                {
                    "id": option.id,
                    "text": option.text,
                    "is_correct": option.is_correct,
                    "position": option.position,
                }
                for option in question.options.all().order_by("position")
            ],
            "matching_pairs": [
                {
                    "id": pair.id,
                    "left_text": pair.left_text,
                    "right_text": pair.right_text,
                    "explanation": pair.explanation,
                    "position": pair.position,
                }
                for pair in question.matching_pairs.all().order_by("position")
            ],
            "gap_answers": [
                {
                    "id": gap.id,
                    "gap_index": gap.gap_index,
                    "accepted_answers": copy.deepcopy(gap.accepted_answers or []),
                    "explanation": gap.explanation,
                }
                for gap in question.gap_answers.all().order_by("gap_index")
            ],
            "image_matching_pairs": [
                {
                    "id": pair.id,
                    "question_text": pair.question_text,
                    "question_image": pair.question_image,
                    "answer_text": pair.answer_text,
                    "answer_image": pair.answer_image,
                    "explanation": pair.explanation,
                    "position": pair.position,
                }
                for pair in question.image_matching_pairs.all().order_by("position")
            ],
        }
    )


def snapshot_as_question_data(snapshot: dict) -> dict:
    data = normalize_question_snapshot(snapshot)
    return {
        "id": None,
        "quiz": None,
        "question_type": data["question_type"],
        "text": data["text"],
        "points": data["points"],
        "position": 0,
        "answer_data": data["answer_data"],
        "options": [
            {
                "id": item["key"],
                "text": item["text"],
                "is_correct": item["is_correct"],
                "position": item["position"],
            }
            for item in data["options"]
        ],
        "matching_pairs": data["matching_pairs"],
        "gap_answers": data["gap_answers"],
        "image_matching_pairs": data["image_matching_pairs"],
    }


def eligible_entries_for_pool(pool, *, exclude_ids=None):
    entries = list(
        QuestionBankEntry.objects.filter(bank=pool.bank)
        .select_related("bank")
        .order_by("id")
    )
    excluded = set(exclude_ids or [])
    required_tags = {str(tag).strip().lower() for tag in (pool.tags or []) if str(tag).strip()}
    eligible = []
    for entry in entries:
        if entry.id in excluded or not entry.question_snapshot:
            continue
        snapshot = entry.question_snapshot
        if pool.category and pool.category.lower() not in {
            str(entry.category or "").lower(),
            str(entry.bank.category or "").lower(),
        }:
            continue
        if pool.difficulty and entry.difficulty != pool.difficulty:
            continue
        if pool.question_type and snapshot.get("question_type") != pool.question_type:
            continue
        entry_tags = {str(tag).strip().lower() for tag in (entry.tags or []) if str(tag).strip()}
        if required_tags and not required_tags.issubset(entry_tags):
            continue
        eligible.append(entry)
    return eligible


def pool_supply(pool) -> int:
    return len(eligible_entries_for_pool(pool))


def validate_quiz_question_pools(quiz) -> list[dict]:
    issues = []
    reserved_entry_ids = set(
        quiz.questions.exclude(source_bank_entry_id__isnull=True).values_list(
            "source_bank_entry_id", flat=True
        )
    )
    for pool in quiz.question_pools.filter(is_active=True).select_related("bank"):
        eligible = eligible_entries_for_pool(pool, exclude_ids=reserved_entry_ids)
        if len(eligible) < pool.question_count:
            issues.append(
                {
                    "poolId": pool.id,
                    "bankId": pool.bank_id,
                    "bankName": pool.bank.name,
                    "required": pool.question_count,
                    "available": len(eligible),
                }
            )
        reserved_entry_ids.update(entry.id for entry in eligible[: pool.question_count])
    return issues


@transaction.atomic
def sync_quiz_pools_from_properties(quiz, raw_pools, *, actor=None) -> list[dict]:
    """Persist builder pool JSON and return the canonical builder representation."""
    raw_pools = raw_pools if isinstance(raw_pools, list) else []
    existing = {pool.id: pool for pool in quiz.question_pools.select_related("bank")}
    retained_ids = set()
    canonical = []
    for position, raw in enumerate(raw_pools):
        if not isinstance(raw, dict):
            continue
        bank_id = raw.get("bankId", raw.get("bank"))
        try:
            bank_id = int(bank_id)
        except (TypeError, ValueError):
            continue
        bank = quiz.node.program.question_banks.filter(pk=bank_id).first()
        if bank is None:
            continue
        pool_id = raw.get("poolId", raw.get("id"))
        try:
            pool_id = int(pool_id)
        except (TypeError, ValueError):
            pool_id = None
        pool = existing.get(pool_id) if pool_id else None
        if pool is None:
            pool = QuizQuestionPool(quiz=quiz, created_by=actor)
        pool.bank = bank
        pool.question_count = min(
            500,
            _positive_int(raw.get("questionCount", raw.get("question_count")), 1),
        )
        pool.category = str(raw.get("category") or "").strip()
        pool.tags = [
            str(tag).strip() for tag in (raw.get("tags") or []) if str(tag).strip()
        ]
        pool.difficulty = str(raw.get("difficulty") or "").strip()
        pool.question_type = str(
            raw.get("questionType", raw.get("question_type")) or ""
        ).strip()
        pool.position = position
        pool.is_active = bool(raw.get("isActive", raw.get("is_active", True)))
        pool.full_clean()
        pool.save()
        retained_ids.add(pool.id)

        QuestionBankUsage.objects.filter(
            usage_type=QuestionBankUsage.POOL_LINK,
            pool=pool,
        ).delete()
        QuestionBankUsage.objects.bulk_create(
            [
                QuestionBankUsage(
                    usage_type=QuestionBankUsage.POOL_LINK,
                    entry=entry,
                    quiz=quiz,
                    pool=pool,
                )
                for entry in eligible_entries_for_pool(pool)
            ],
            ignore_conflicts=True,
        )
        canonical.append(
            {
                "poolId": pool.id,
                "bankId": bank.id,
                "name": bank.name,
                "questionCount": pool.question_count,
                "category": pool.category,
                "tags": pool.tags,
                "difficulty": pool.difficulty,
                "questionType": pool.question_type,
                "isActive": pool.is_active,
                "availableQuestions": pool_supply(pool),
            }
        )
    quiz.question_pools.exclude(id__in=retained_ids).delete()
    return canonical


@transaction.atomic
def ensure_attempt_question_snapshots(quiz, attempt):
    attempt = attempt.__class__.objects.select_for_update().get(pk=attempt.pk)
    existing = list(attempt.question_snapshots.all())
    if existing:
        return existing

    rows = []
    position = 0
    used_entry_ids = set()
    static_questions = list(
        quiz.questions.all().prefetch_related(
            "options", "matching_pairs", "gap_answers", "image_matching_pairs"
        ).order_by("position", "id")
    )
    for question in static_questions:
        rows.append(
            QuizAttemptQuestionSnapshot(
                attempt=attempt,
                question_key=question.id,
                position=position,
                snapshot=build_question_snapshot(question),
                source_question=question,
                source_bank_entry=question.source_bank_entry,
            )
        )
        if question.source_bank_entry_id:
            used_entry_ids.add(question.source_bank_entry_id)
        position += 1

    selected_usage = []
    for pool in quiz.question_pools.filter(is_active=True).select_related("bank"):
        eligible = eligible_entries_for_pool(pool, exclude_ids=used_entry_ids)
        if len(eligible) < pool.question_count:
            raise ValidationError(
                f'Question pool "{pool.bank.name}" requires {pool.question_count} '
                f"questions but only {len(eligible)} are available."
            )
        selected = random.SystemRandom().sample(eligible, pool.question_count)
        for entry in selected:
            rows.append(
                QuizAttemptQuestionSnapshot(
                    attempt=attempt,
                    question_key=-entry.id,
                    position=position,
                    snapshot=copy.deepcopy(entry.question_snapshot),
                    source_bank_entry=entry,
                    source_pool=pool,
                )
            )
            selected_usage.append((entry, pool))
            used_entry_ids.add(entry.id)
            position += 1

    QuizAttemptQuestionSnapshot.objects.bulk_create(rows)
    for entry, pool in selected_usage:
        _, created = QuestionBankUsage.objects.get_or_create(
            usage_type=QuestionBankUsage.ATTEMPT_SELECTION,
            entry=entry,
            quiz=quiz,
            pool=pool,
            attempt=attempt,
        )
        if created:
            QuestionBankEntry.objects.filter(pk=entry.pk).update(
                usage_count=F("usage_count") + 1,
                last_used_at=timezone.now(),
            )
    return list(attempt.question_snapshots.all())


def image_item_id(attempt_id, question_key, pair_key, side):
    token = salted_hmac(
        "assessments.snapshot_image_matching_item",
        f"{attempt_id}:{question_key}:{pair_key}:{side}",
    ).hexdigest()
    return f"{side}_{token}"


def _normalize_key_order(values, valid_keys):
    valid = set(valid_keys)
    normalized = []
    for value in values if isinstance(values, list) else []:
        try:
            key = int(value)
        except (TypeError, ValueError):
            continue
        if key in valid and key not in normalized:
            normalized.append(key)
    normalized.extend(key for key in valid_keys if key not in normalized)
    return normalized


def _normalize_text_order(values, expected):
    expected = [str(value) for value in expected]
    values = [str(value) for value in values] if isinstance(values, list) else []
    return values if sorted(values) == sorted(expected) else expected


def _shuffled(values):
    original = list(values)
    result = list(values)
    random.shuffle(result)
    if len(result) > 1 and result == original:
        result = result[1:] + result[:1]
    return result


def ensure_attempt_runtime_state(quiz, attempt) -> dict:
    rows = ensure_attempt_question_snapshots(quiz, attempt)
    state = attempt.runtime_state.copy() if isinstance(attempt.runtime_state, dict) else {}
    changed = not isinstance(attempt.runtime_state, dict)
    keys = [row.question_key for row in rows]

    order = _normalize_key_order(state.get("question_order"), keys)
    if not state.get("question_order") and quiz.randomize_questions:
        random.shuffle(order)
    if state.get("question_order") != order:
        state["question_order"] = order
        changed = True

    existing_options = state.get("option_order") if isinstance(state.get("option_order"), dict) else {}
    option_order = {}
    existing_ordering = state.get("ordering_item_order") if isinstance(state.get("ordering_item_order"), dict) else {}
    ordering_order = {}
    existing_matching = state.get("matching_right_order") if isinstance(state.get("matching_right_order"), dict) else {}
    matching_order = {}
    existing_images = state.get("image_right_order") if isinstance(state.get("image_right_order"), dict) else {}
    image_order = {}

    for row in rows:
        snapshot = row.snapshot or {}
        key = str(row.question_key)
        question_type = snapshot.get("question_type")
        if question_type in {"mcq", "mcq_multi"}:
            option_keys = [int(option["key"]) for option in snapshot.get("options", [])]
            ordered = _normalize_key_order(existing_options.get(key), option_keys)
            if quiz.shuffle_options and not existing_options.get(key):
                random.shuffle(ordered)
            option_order[key] = ordered
        if question_type == "ordering":
            items = (snapshot.get("answer_data") or {}).get("items", [])
            ordered = _normalize_text_order(existing_ordering.get(key), items)
            ordering_order[key] = ordered if existing_ordering.get(key) else _shuffled(ordered)
        if question_type == "matching":
            rights = [pair["right_text"] for pair in snapshot.get("matching_pairs", [])]
            ordered = _normalize_text_order(existing_matching.get(key), rights)
            matching_order[key] = ordered if existing_matching.get(key) else _shuffled(ordered)
        if question_type == "image_matching":
            pair_keys = [int(pair["key"]) for pair in snapshot.get("image_matching_pairs", [])]
            ordered = _normalize_key_order(existing_images.get(key), pair_keys)
            image_order[key] = ordered if existing_images.get(key) else _shuffled(ordered)

    for field, value in {
        "option_order": option_order,
        "ordering_item_order": ordering_order,
        "matching_right_order": matching_order,
        "image_right_order": image_order,
    }.items():
        if state.get(field) != value:
            state[field] = value
            changed = True

    current = state.get("current_question_index")
    try:
        current = int(current)
    except (TypeError, ValueError):
        current = 0
    current = max(0, min(current, max(0, len(keys) - 1)))
    if state.get("current_question_index") != current:
        state["current_question_index"] = current
        changed = True
    if changed:
        attempt.runtime_state = state
        attempt.save(update_fields=["runtime_state"])
    return state


def serialize_attempt_questions(quiz, attempt, runtime_state=None) -> list[dict]:
    state = runtime_state if isinstance(runtime_state, dict) else ensure_attempt_runtime_state(quiz, attempt)
    rows = list(attempt.question_snapshots.all())
    by_key = {row.question_key: row for row in rows}
    ordered_keys = _normalize_key_order(state.get("question_order"), list(by_key))
    payload = []
    for question_key in ordered_keys:
        row = by_key[question_key]
        snapshot = row.snapshot or {}
        question_type = snapshot.get("question_type")
        data = {
            "id": question_key,
            "type": question_type,
            "text": snapshot.get("text", ""),
            "points": snapshot.get("points", 1),
        }
        if question_type in {"mcq", "mcq_multi"}:
            options = {int(item["key"]): item for item in snapshot.get("options", [])}
            order = _normalize_key_order(
                (state.get("option_order") or {}).get(str(question_key)),
                list(options),
            )
            data["options"] = [
                {
                    "id": options[key]["key"],
                    "text": options[key]["text"],
                    "position": options[key]["position"],
                }
                for key in order
            ]
        elif question_type == "matching":
            pairs = snapshot.get("matching_pairs", [])
            rights = _normalize_text_order(
                (state.get("matching_right_order") or {}).get(str(question_key)),
                [pair["right_text"] for pair in pairs],
            )
            data["pairs"] = [
                {"left_text": pair["left_text"], "right_text": rights[index]}
                for index, pair in enumerate(pairs)
            ]
        elif question_type == "ordering":
            data["items"] = _normalize_text_order(
                (state.get("ordering_item_order") or {}).get(str(question_key)),
                (snapshot.get("answer_data") or {}).get("items", []),
            )
        elif question_type == "image_matching":
            pairs = snapshot.get("image_matching_pairs", [])
            pair_map = {int(pair["key"]): pair for pair in pairs}
            right_order = _normalize_key_order(
                (state.get("image_right_order") or {}).get(str(question_key)),
                list(pair_map),
            )
            data["left_items"] = [
                {
                    "id": image_item_id(attempt.id, question_key, pair["key"], "left"),
                    "text": pair["question_text"],
                    "image": pair["question_image"],
                }
                for pair in pairs
            ]
            data["right_items"] = [
                {
                    "id": image_item_id(attempt.id, question_key, pair_map[key]["key"], "right"),
                    "text": pair_map[key]["answer_text"],
                    "image": pair_map[key]["answer_image"],
                }
                for key in right_order
            ]
        payload.append(data)
    return payload


def score_snapshot_answer(row, student_answer):
    snapshot = row.snapshot or {}
    question_type = snapshot.get("question_type")
    points = Decimal(str(snapshot.get("points") or 0))
    answer_data = snapshot.get("answer_data") or {}

    if question_type == "matching":
        pairs = snapshot.get("matching_pairs") or []
        if not pairs or not isinstance(student_answer, dict):
            return False, Decimal(0)
        correct = sum(
            student_answer.get(pair["left_text"]) == pair["right_text"]
            for pair in pairs
        )
        return correct == len(pairs), _round2(points * correct / len(pairs))

    if question_type == "image_matching":
        pairs = snapshot.get("image_matching_pairs") or []
        if not pairs or not isinstance(student_answer, dict):
            return False, Decimal(0)
        correct = 0
        for pair in pairs:
            left = image_item_id(row.attempt_id, row.question_key, pair["key"], "left")
            right = image_item_id(row.attempt_id, row.question_key, pair["key"], "right")
            if str(student_answer.get(left)) == right:
                correct += 1
        return correct == len(pairs), _round2(points * correct / len(pairs))

    if question_type == "fill_blank":
        gaps = snapshot.get("gap_answers") or []
        if not gaps or not isinstance(student_answer, dict):
            return False, Decimal(0)
        normalize = lambda value: " ".join(str(value or "").lower().strip().split())
        correct = sum(
            normalize(student_answer.get(str(gap["gap_index"]), ""))
            in {normalize(value) for value in gap.get("accepted_answers", [])}
            for gap in gaps
        )
        return correct == len(gaps), _round2(points * correct / len(gaps))

    if question_type == "ordering":
        expected = answer_data.get("items") or answer_data.get("correct_order") or []
        if not expected or not isinstance(student_answer, list):
            return False, Decimal(0)
        correct = sum(
            index < len(student_answer) and student_answer[index] == item
            for index, item in enumerate(expected)
        )
        return student_answer == expected, _round2(points * correct / len(expected))

    options = snapshot.get("options") or []
    if question_type in {"mcq", "mcq_multi"}:
        def position_for(value):
            token = str(value).strip()
            for option in options:
                if token in {str(option["key"]), str(option["position"])}:
                    return option["position"]
            return None

        correct_positions = {option["position"] for option in options if option["is_correct"]}
        if question_type == "mcq":
            correct = position_for(student_answer) in correct_positions
            return correct, points if correct else Decimal(0)
        submitted = {
            position_for(value)
            for value in student_answer if position_for(value) is not None
        } if isinstance(student_answer, list) else set()
        if submitted == correct_positions:
            return True, points
        if not correct_positions:
            return False, Decimal(0)
        ratio = max(
            Decimal(0),
            Decimal(len(submitted & correct_positions) - len(submitted - correct_positions))
            / len(correct_positions),
        )
        return False, _round2(points * min(ratio, Decimal(1)))

    if question_type == "true_false":
        correct = normalize_true_false_choice(answer_data.get("correct"))
        submitted = normalize_true_false_choice(student_answer)
        if submitted is None:
            token = str(student_answer).strip()
            option = next(
                (
                    item
                    for item in options
                    if token in {str(item["key"]), str(item["position"])}
                ),
                None,
            )
            if option:
                submitted = normalize_true_false_choice(option["text"])
        is_correct = submitted is not None and submitted == correct
        return is_correct, points if is_correct else Decimal(0)

    if question_type == "short_answer":
        if answer_data.get("manual_grading", True):
            if row.manual_points_awarded is None:
                return None, None
            awarded = max(Decimal(0), min(points, row.manual_points_awarded))
            return awarded == points, awarded
        answer = str(student_answer or "").lower()
        correct = any(str(keyword).lower() in answer for keyword in answer_data.get("keywords", []))
        return correct, points if correct else Decimal(0)

    return False, Decimal(0)


def score_attempt_snapshots(attempt):
    rows = list(attempt.question_snapshots.all())
    answers = attempt.answers if isinstance(attempt.answers, dict) else {}
    points_earned = Decimal(0)
    points_possible = 0
    needs_manual = False
    for row in rows:
        points_possible += int((row.snapshot or {}).get("points") or 0)
        answer = answers.get(str(row.question_key))
        if answer is None:
            continue
        is_correct, earned = score_snapshot_answer(row, answer)
        if is_correct is None:
            needs_manual = True
        elif earned is not None:
            points_earned += Decimal(str(earned))
    points_earned = _round2(points_earned)
    percentage = round(
        float(points_earned) / points_possible * 100 if points_possible else 0,
        2,
    )
    passed = None if needs_manual else percentage >= attempt.quiz.pass_threshold
    return points_earned, points_possible, percentage, passed


def _snapshot_option_label(snapshot, raw_value):
    token = str(raw_value).strip()
    for option in snapshot.get("options", []):
        if token in {str(option["key"]), str(option["position"])}:
            return option["text"]
    return token


def format_snapshot_student_answer(row, answer):
    if answer is None:
        return "Not answered"
    snapshot = row.snapshot or {}
    question_type = snapshot.get("question_type")
    if question_type in {"mcq", "true_false"}:
        label = _snapshot_option_label(snapshot, answer)
        if question_type == "true_false" and label == str(answer).strip():
            value = normalize_true_false_choice(answer)
            if value is not None:
                return "True" if value else "False"
        return label
    if question_type == "mcq_multi" and isinstance(answer, list):
        return ", ".join(_snapshot_option_label(snapshot, value) for value in answer)
    if question_type == "matching" and isinstance(answer, dict):
        return "; ".join(f"{left} -> {right}" for left, right in answer.items())
    if question_type == "ordering" and isinstance(answer, list):
        return " -> ".join(str(value) for value in answer)
    if question_type == "fill_blank" and isinstance(answer, dict):
        return "; ".join(
            f"Blank {key}: {value}"
            for key, value in sorted(answer.items(), key=lambda item: str(item[0]))
        )
    if question_type == "image_matching" and isinstance(answer, dict):
        pairs = snapshot.get("image_matching_pairs", [])
        labels = {
            image_item_id(row.attempt_id, row.question_key, pair["key"], "right"): pair["answer_text"]
            for pair in pairs
        }
        return "; ".join(
            f'{pair["question_text"]} -> '
            f'{labels.get(str(answer.get(image_item_id(row.attempt_id, row.question_key, pair["key"], "left"))), "Unmatched")}'
            for pair in pairs
        )
    return str(answer).strip() or "Not answered"


def format_snapshot_correct_answer(snapshot):
    question_type = snapshot.get("question_type")
    answer_data = snapshot.get("answer_data") or {}
    options = snapshot.get("options") or []
    if question_type == "mcq":
        option = next((item for item in options if item["is_correct"]), None)
        return option["text"] if option else "N/A"
    if question_type == "mcq_multi":
        values = [item["text"] for item in options if item["is_correct"]]
        return ", ".join(values) if values else "N/A"
    if question_type == "true_false":
        value = normalize_true_false_choice(answer_data.get("correct"))
        return "N/A" if value is None else "True" if value else "False"
    if question_type == "short_answer":
        keywords = answer_data.get("keywords") or []
        return ", ".join(str(value) for value in keywords) if keywords else "Manual review"
    if question_type == "matching":
        return "; ".join(
            f'{pair["left_text"]} -> {pair["right_text"]}'
            for pair in snapshot.get("matching_pairs", [])
        ) or "N/A"
    if question_type == "ordering":
        return " -> ".join(str(value) for value in answer_data.get("items", [])) or "N/A"
    if question_type == "fill_blank":
        return "; ".join(
            f'Blank {gap["gap_index"]}: {" / ".join(gap.get("accepted_answers", []))}'
            for gap in snapshot.get("gap_answers", [])
        ) or "N/A"
    if question_type == "image_matching":
        return "; ".join(
            f'{pair["question_text"]} -> {pair["answer_text"]}'
            for pair in snapshot.get("image_matching_pairs", [])
        ) or "N/A"
    return "N/A"


def build_snapshot_question_review(attempt, *, correct_answers_released):
    ensure_attempt_question_snapshots(attempt.quiz, attempt)
    answers = attempt.answers if isinstance(attempt.answers, dict) else {}
    review = []
    for row in attempt.question_snapshots.all():
        answer = answers.get(str(row.question_key))
        is_correct, earned = (
            score_snapshot_answer(row, answer)
            if answer is not None
            else (False, Decimal(0))
        )
        snapshot = row.snapshot or {}
        review.append(
            {
                "questionId": row.question_key,
                "questionType": snapshot.get("question_type"),
                "questionText": snapshot.get("text", ""),
                "studentAnswer": format_snapshot_student_answer(row, answer),
                "correctAnswer": (
                    format_snapshot_correct_answer(snapshot)
                    if correct_answers_released
                    else None
                ),
                "isCorrect": is_correct,
                "pointsEarned": float(earned) if earned is not None else None,
                "pointsPossible": snapshot.get("points", 0),
                "feedback": row.manual_feedback or None,
            }
        )
    return review


@transaction.atomic
def grade_attempt_question_snapshot(
    *, attempt, question_key, points_awarded, feedback, grader
):
    row = attempt.question_snapshots.select_for_update().filter(
        question_key=question_key
    ).first()
    if row is None:
        raise ValidationError("Question was not selected for this attempt.")
    snapshot = row.snapshot or {}
    if snapshot.get("question_type") != "short_answer" or not (
        snapshot.get("answer_data") or {}
    ).get("manual_grading", True):
        raise ValidationError("This question is not manually graded.")
    maximum = Decimal(str(snapshot.get("points") or 0))
    awarded = Decimal(str(points_awarded))
    if awarded < 0 or awarded > maximum:
        raise ValidationError(f"Points must be between 0 and {maximum}.")
    row.manual_points_awarded = awarded
    row.manual_feedback = str(feedback or "").strip()
    row.graded_by = grader
    row.graded_at = timezone.now()
    row.save(
        update_fields=[
            "manual_points_awarded",
            "manual_feedback",
            "graded_by",
            "graded_at",
        ]
    )
    earned, possible, percentage, passed = score_attempt_snapshots(attempt)
    attempt.points_earned = earned
    attempt.points_possible = possible
    attempt.score = percentage
    attempt.passed = passed
    attempt.save(update_fields=["points_earned", "points_possible", "score", "passed"])
    return row, attempt
