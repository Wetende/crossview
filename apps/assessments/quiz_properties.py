"""Mirror stored quiz questions into the curriculum node's builder properties."""

from apps.assessments.text_normalization import true_false_choice_to_index


def build_quiz_question_properties(quiz, metadata_by_id=None) -> list[dict]:
    """
    Return the builder's ``properties["questions"]`` list rebuilt from the
    database, which is the source of truth for quiz questions.

    ``metadata_by_id`` carries per-question builder flags (for example
    ``generated_from_assessment_prompt``) that are not stored on the question.
    """
    metadata_by_id = metadata_by_id or {}
    questions = (
        quiz.questions.all()
        .prefetch_related("options", "matching_pairs", "gap_answers", "image_matching_pairs")
        .order_by("position", "id")
    )
    rebuilt = []
    for question in questions:
        entry = {
            "id": f"q_{question.id}",
            "db_id": question.id,
            "type": question.question_type,
            "text": question.text,
            "points": question.points,
            "explanation": question.explanation,
            "hint": question.hint,
        }
        if question.source_bank_entry_id:
            entry["libraryEntryId"] = question.source_bank_entry_id
            entry["libraryEntryVersion"] = question.source_bank_entry_version
            entry["fromLibrary"] = True
        entry.update(metadata_by_id.get(question.id, {}))

        answer_data = question.answer_data if isinstance(question.answer_data, dict) else {}
        if question.question_type in ("mcq", "mcq_multi"):
            options = list(question.options.all().order_by("position"))
            entry["options"] = [option.text for option in options]
            if question.question_type == "mcq":
                correct = next((option for option in options if option.is_correct), None)
                entry["correct"] = correct.position if correct else 0
            else:
                entry["correct_indices"] = [
                    option.position for option in options if option.is_correct
                ]
        elif question.question_type == "true_false":
            entry["correct"] = true_false_choice_to_index(answer_data.get("correct"), default=0)
            options = list(question.options.all().order_by("position"))
            if options:
                entry["options"] = [option.text for option in options]
        elif question.question_type == "short_answer":
            entry["keywords"] = answer_data.get("keywords", [])
            entry["manual_grading"] = answer_data.get("manual_grading", True)
        elif question.question_type == "matching":
            entry["pairs"] = [
                {
                    "left_text": pair.left_text,
                    "right_text": pair.right_text,
                    "explanation": pair.explanation,
                    "position": pair.position,
                }
                for pair in question.matching_pairs.all().order_by("position")
            ]
        elif question.question_type == "fill_blank":
            entry["gaps"] = [
                {
                    "gap_index": gap.gap_index,
                    "accepted_answers": gap.accepted_answers,
                    "explanation": gap.explanation,
                }
                for gap in question.gap_answers.all().order_by("gap_index")
            ]
        elif question.question_type == "ordering":
            entry["items"] = answer_data.get("items", [])
            entry["explanations"] = answer_data.get("explanations", {})
        elif question.question_type == "image_matching":
            entry["image_pairs"] = [
                {
                    "question_text": pair.question_text,
                    "question_image": pair.question_image,
                    "answer_text": pair.answer_text,
                    "answer_image": pair.answer_image,
                    "explanation": pair.explanation,
                    "position": pair.position,
                }
                for pair in question.image_matching_pairs.all().order_by("position")
            ]
        rebuilt.append(entry)
    return rebuilt
