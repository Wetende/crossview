"""Permission-scoped, on-demand views of course content for AI clients."""

from django.db.models import Q
from django.utils.html import strip_tags

from apps.assessments.text_normalization import true_false_choice_to_index
from apps.core.learning_outcomes import resolve_learning_outcomes_html
from apps.curriculum.activity_types import ASSIGNMENT, DOCUMENT, QUIZ, TEXT, VIDEO, AUDIO
from apps.curriculum.models import CurriculumNode
from apps.curriculum.services import CoursePublishValidationService

from .access import AccessDenied, accessible_programs, get_program_for_user
from .content import (
    MAX_BODY_CHARS,
    WRITABLE_QUESTION_TYPES,
    Links,
    activity_type,
    is_quiz_node,
    node_properties,
    node_version,
    node_versions,
    program_version,
    quiz_for_node,
)

MAX_PAGE_SIZE = 50

QUESTION_TYPE_LABELS = {
    "mcq": "single_choice",
    "mcq_multi": "multiple_choice",
    "true_false": "true_false",
    "short_answer": "short_answer",
    "matching": "matching",
    "image_matching": "image_matching",
    "fill_blank": "fill_blank",
    "ordering": "ordering",
}


def _page_bounds(page, page_size):
    try:
        page = max(int(page), 1)
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = min(max(int(page_size), 1), MAX_PAGE_SIZE)
    except (TypeError, ValueError):
        page_size = 20
    return page, page_size


def search_courses(user, links: Links, query: str = "", page: int = 1, page_size: int = 20) -> dict:
    page, page_size = _page_bounds(page, page_size)
    programs = accessible_programs(user)
    query = str(query or "").strip()
    if query:
        programs = programs.filter(Q(name__icontains=query) | Q(code__icontains=query))
    programs = programs.order_by("name", "id")
    total = programs.count()
    start = (page - 1) * page_size
    items = [
        {
            "course_id": program.id,
            "code": program.code,
            "title": program.name,
            "is_published": program.is_published,
            "level": program.level or "",
            "category": program.category or "",
            "builder_url": links.builder(program.id),
        }
        for program in programs[start : start + page_size]
    ]
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "has_more": start + page_size < total,
    }


def _question_counts(nodes) -> dict:
    from apps.assessments.models import Question

    quiz_ids = {}
    for node in nodes:
        if is_quiz_node(node):
            quiz_id = node_properties(node).get("quiz_id")
            if quiz_id:
                quiz_ids[quiz_id] = node.id
    counts = {}
    for quiz_id in Question.objects.filter(quiz_id__in=quiz_ids).values_list("quiz_id", flat=True):
        node_id = quiz_ids[quiz_id]
        counts[node_id] = counts.get(node_id, 0) + 1
    return counts


def _outline_item(node, context):
    props = node_properties(node)
    children = context["children"].get(node.id, [])
    item = {
        "id": node.id,
        "title": node.title,
        "kind": "module" if children or node.parent_id is None else "item",
        "activity_type": activity_type(node),
        "position": node.position,
        "is_published": node.is_published,
        "duration": props.get("duration") or None,
        "version": context["versions"][node.id],
        "builder_url": context["links"].builder(node.program_id, node.id),
    }
    if is_quiz_node(node):
        item["question_count"] = context["question_counts"].get(node.id, 0)
    if children:
        item["items"] = [_outline_item(child, context) for child in children]
    return item


def get_course(user, links: Links, course_id, page: int = 1, page_size: int = 20) -> dict:
    program = get_program_for_user(user, course_id)
    page, page_size = _page_bounds(page, page_size)
    nodes = list(
        CurriculumNode.objects.filter(program=program).order_by("position", "id")
    )
    children_map = {}
    for node in nodes:
        children_map.setdefault(node.parent_id, []).append(node)
    modules = children_map.get(None, [])
    start = (page - 1) * page_size
    context = {
        "children": children_map,
        "versions": node_versions(nodes),
        "question_counts": _question_counts(nodes),
        "links": links,
    }
    instructors = [
        assignment.instructor.get_full_name() or assignment.instructor.username
        for assignment in program.instructor_assignments.select_related("instructor").order_by(
            "-is_primary", "assigned_at"
        )
    ]
    return {
        "course_id": program.id,
        "code": program.code,
        "title": program.name,
        "is_published": program.is_published,
        "level": program.level or "",
        "category": program.category or "",
        "description_html": program.description or "",
        "preview_description": program.preview_description or "",
        "learning_outcomes": list(program.what_you_learn_items or []),
        "learning_outcomes_html": resolve_learning_outcomes_html(
            program.what_you_learn_html, program.what_you_learn_items
        ),
        "has_thumbnail": bool(program.thumbnail),
        "instructors": instructors,
        "structure_labels": list((program.blueprint.hierarchy_structure or []) if program.blueprint else []),
        "version": program_version(program),
        "modules": [_outline_item(node, context) for node in modules[start : start + page_size]],
        "module_count": len(modules),
        "page": page,
        "page_size": page_size,
        "has_more_modules": start + page_size < len(modules),
        "links": {
            "builder": links.builder(program.id),
            "settings": links.course_settings(program.id),
            "preview": links.preview(program.id),
            "public_page": links.public(program),
        },
    }


def _serialize_question(question) -> dict:
    options = sorted(question.options.all(), key=lambda option: (option.position, option.id))
    answer_data = question.answer_data if isinstance(question.answer_data, dict) else {}
    payload = {
        "question_id": question.id,
        "type": QUESTION_TYPE_LABELS.get(question.question_type, question.question_type),
        "text": question.text,
        "points": question.points,
        "position": question.position,
        "editable": question.question_type in WRITABLE_QUESTION_TYPES,
        "from_question_bank": bool(question.source_bank_entry_id),
    }
    if question.question_type == "mcq":
        payload["options"] = [option.text for option in options]
        correct = next((index for index, option in enumerate(options) if option.is_correct), None)
        payload["correct"] = correct
    elif question.question_type == "mcq_multi":
        payload["options"] = [option.text for option in options]
        payload["correct"] = [index for index, option in enumerate(options) if option.is_correct]
    elif question.question_type == "true_false":
        payload["correct"] = true_false_choice_to_index(answer_data.get("correct"), default=0) == 0
    elif question.question_type == "short_answer":
        payload["keywords"] = answer_data.get("keywords", [])
        payload["manual_grading"] = answer_data.get("manual_grading", True)
    elif question.question_type == "ordering":
        payload["items"] = answer_data.get("items", [])
    elif question.question_type == "matching":
        payload["pairs"] = [
            {"left": pair.left_text, "right": pair.right_text}
            for pair in question.matching_pairs.all().order_by("position")
        ]
    elif question.question_type == "fill_blank":
        payload["gaps"] = [
            {"gap_index": gap.gap_index, "accepted_answers": gap.accepted_answers}
            for gap in question.gap_answers.all().order_by("gap_index")
        ]
    return payload


def _quiz_details(node) -> dict:
    quiz = quiz_for_node(node)
    props = node_properties(node)
    if quiz is None:
        return {"settings": None, "questions": [], "question_bank_pools": []}
    questions = quiz.questions.prefetch_related(
        "options", "matching_pairs", "gap_answers"
    ).order_by("position", "id")
    return {
        "settings": {
            "pass_threshold_percent": quiz.pass_threshold,
            "weight_percent": quiz.weight,
            "max_attempts": quiz.max_attempts,
            "time_limit_minutes": quiz.time_limit_minutes,
            "randomize_questions": quiz.randomize_questions,
            "shuffle_options": quiz.shuffle_options,
            "answer_release_policy": quiz.answer_release_policy,
        },
        "questions": [_serialize_question(question) for question in questions],
        "question_bank_pools": [
            {
                "bank_id": pool.get("bankId", pool.get("bank")),
                "question_count": pool.get("questionCount", pool.get("question_count")),
            }
            for pool in props.get("question_banks", [])
            if isinstance(pool, dict)
        ],
        "submitted_attempt_count": quiz.attempts.filter(submitted_at__isnull=False).count(),
    }


def _truncate(value: str) -> tuple[str, bool]:
    value = str(value or "")
    if len(value) > MAX_BODY_CHARS:
        return value[:MAX_BODY_CHARS], True
    return value, False


def get_lesson(user, links: Links, lesson_id) -> dict:
    try:
        lesson_id = int(lesson_id)
    except (TypeError, ValueError):
        raise AccessDenied("Lesson IDs are whole numbers. Use get_course to list them.")
    node = (
        CurriculumNode.objects.select_related("program", "parent")
        .filter(pk=lesson_id, program__in=accessible_programs(user))
        .first()
    )
    if node is None:
        raise AccessDenied(f"Lesson {lesson_id} was not found in the courses you can manage.")

    props = node_properties(node)
    kind = activity_type(node)
    has_children = CurriculumNode.objects.filter(parent=node).exists()
    payload = {
        "lesson_id": node.id,
        "course_id": node.program_id,
        "course_title": node.program.name,
        "module": (
            {"id": node.parent_id, "title": node.parent.title} if node.parent_id else None
        ),
        "title": node.title,
        "description": node.description or "",
        "activity_type": QUIZ if is_quiz_node(node) else kind,
        "is_container": has_children or node.parent_id is None,
        "is_published": node.is_published,
        "course_is_published": node.program.is_published,
        "position": node.position,
        "duration": props.get("duration") or None,
        "is_preview": bool(props.get("is_preview")),
        "version": node_version(node),
        "builder_url": links.builder(node.program_id, node.id),
        "stored_fields": sorted(props.keys()),
    }

    if is_quiz_node(node):
        payload["quiz"] = _quiz_details(node)
    elif kind == TEXT:
        body, truncated = _truncate(props.get("content") or props.get("content_html") or "")
        payload["body_html"] = body
        payload["body_truncated"] = truncated
        payload["body_word_count"] = len(strip_tags(body).split())
    elif kind in {VIDEO, AUDIO}:
        payload["media"] = {
            "source": props.get("video_source") or props.get("audio_source") or "",
            "url": props.get("video_url") or props.get("audio_url") or "",
            "transcript": props.get("transcript") or props.get("captions") or None,
            "note": "Only stored metadata and text are available; media itself is not analysed.",
        }
        body, _ = _truncate(props.get("content") or "")
        payload["notes_html"] = body
    elif kind == DOCUMENT:
        document = props.get("document") if isinstance(props.get("document"), dict) else {}
        payload["document"] = {
            "file_name": document.get("original_name") or document.get("file_name") or "",
            "page_count": document.get("page_count"),
            "conversion_status": document.get("conversion_status") or "",
            "note": "Document text is not extracted; only stored metadata is available.",
        }
    elif kind == ASSIGNMENT:
        instructions, _ = _truncate(props.get("instructions") or "")
        payload["assignment"] = {
            "instructions_html": instructions,
            "assessment_prompt": props.get("assessment_prompt") or "",
            "assignment_mode": props.get("assignment_mode") or "",
            "submission_type": props.get("submission_type") or "",
            "weight_percent": props.get("weight"),
            "question_count": len(props.get("questions") or []),
        }
    return payload


def check_course_readiness(user, links: Links, course_id) -> dict:
    program = get_program_for_user(user, course_id)
    result = CoursePublishValidationService().validate_for_publish(program)

    def finding(issue, severity):
        node_id = issue.get("node_id")
        return {
            "code": issue.get("type"),
            "severity": severity,
            "message": issue.get("message"),
            "item": (
                {
                    "id": node_id,
                    "title": issue.get("node_title"),
                    "builder_url": links.builder(program.id, node_id),
                }
                if node_id
                else None
            ),
            "course_link": None if node_id else links.course_settings(program.id),
        }

    details = result.get("details", {})
    return {
        "course_id": program.id,
        "title": program.name,
        "is_published": program.is_published,
        "ready_to_publish": result.get("is_valid", False),
        "kind": "factual_findings",
        "note": (
            "These findings come from the platform's publish-readiness rules. "
            "Present any teaching-quality suggestions of your own separately "
            "and label them as suggestions."
        ),
        "findings": [finding(issue, "blocking") for issue in result.get("errors", [])]
        + [finding(issue, "warning") for issue in result.get("warnings", [])],
        "summary": {
            "lessons": details.get("lesson_count", 0),
            "quizzes": details.get("quiz_count", 0),
            "assignments": details.get("assignment_count", 0),
            "total_assessment_weight_percent": details.get("total_assessment_weight", 0),
        },
    }
