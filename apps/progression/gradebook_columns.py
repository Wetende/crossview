"""Which quizzes and assignments a course's gradebook shows.

Shared by the gradebook views, the printable gradebook report and the
instructor course analytics page so all three agree on the same set.
"""

from apps.curriculum.models import CurriculumNode
from apps.progression.services import (
    _assignment_requires_questions,
    _assignment_requires_submission,
    _safe_int,
)


def resolve_gradebook_columns(program) -> tuple[list[dict], list[dict]]:
    from apps.assessments.models import Assignment, Quiz

    quiz_ids: list[int] = []
    assignment_ids: list[int] = []

    assessment_nodes = CurriculumNode.objects.filter(
        program=program,
        is_published=True,
    ).only("id", "title", "node_type", "properties")

    for node in assessment_nodes:
        props = node.properties if isinstance(node.properties, dict) else {}
        node_type = str(node.node_type or "").lower()
        lesson_type = str(props.get("lesson_type") or "").lower()
        is_assignment = node_type == "assignment" or lesson_type == "assignment"
        is_quiz = node_type == "quiz" or lesson_type == "quiz"

        quiz_id = _safe_int(props.get("quiz_id"))
        assignment_id = _safe_int(props.get("assignment_id"))

        if (
            is_quiz or (is_assignment and _assignment_requires_questions(props))
        ) and quiz_id:
            if quiz_id not in quiz_ids:
                quiz_ids.append(quiz_id)

        if is_assignment and _assignment_requires_submission(props) and assignment_id:
            if assignment_id not in assignment_ids:
                assignment_ids.append(assignment_id)

    quizzes_by_id = {
        quiz.id: quiz
        for quiz in Quiz.objects.filter(id__in=quiz_ids).only(
            "id",
            "title",
            "weight",
            "pass_threshold",
            "max_attempts",
            "allow_retake_after_pass",
        )
    }
    assignments_by_id = {
        assignment.id: assignment
        for assignment in Assignment.objects.filter(id__in=assignment_ids).only(
            "id",
            "title",
            "weight",
            "pass_threshold",
        )
    }

    quizzes = []
    for quiz_id in quiz_ids:
        quiz = quizzes_by_id.get(quiz_id)
        if not quiz:
            continue
        quizzes.append(
            {
                "id": quiz.id,
                "title": quiz.title,
                "weight": quiz.weight,
                "passThreshold": quiz.pass_threshold,
                "maxAttempts": quiz.max_attempts,
                "allowRetakeAfterPass": bool(quiz.allow_retake_after_pass),
            }
        )

    assignments = []
    for assignment_id in assignment_ids:
        assignment = assignments_by_id.get(assignment_id)
        if not assignment:
            continue
        assignments.append(
            {
                "id": assignment.id,
                "title": assignment.title,
                "weight": assignment.weight,
                "passThreshold": assignment.pass_threshold,
            }
        )

    return quizzes, assignments
