"""
Course change operations.

``plan_operations`` validates raw operations from an AI client and produces the
canonical operations, a readable preview and the content versions they depend
on, without changing anything. ``apply_operations`` later replays exactly those
canonical operations.
"""

from django.db.models import Max

from apps.core.learning_outcomes import resolve_learning_outcomes_html
from apps.core.taxonomy import validate_builder_hierarchy
from apps.curriculum.models import CurriculumNode

from . import questions as question_rules
from .access import ConnectorError
from .content import (
    MAX_BODY_CHARS,
    Links,
    is_quiz_node,
    is_text_lesson,
    node_properties,
    node_version,
    program_version,
    quiz_for_node,
)
from .sanitize import clean_html, html_to_text, plain_text

MAX_OPERATIONS = 25
MAX_BODY_HTML = 200_000
MAX_DESCRIPTION_HTML = 50_000
MAX_OUTCOMES = 30
PREVIEW_BEFORE_CHARS = 5_000

OPERATION_TYPES = (
    "update_course",
    "update_module",
    "create_text_lesson",
    "update_text_lesson",
    "create_quiz",
    "add_questions",
    "update_question",
)


def _require_int(raw, key):
    value = raw.get(key)
    try:
        if isinstance(value, bool):
            raise ValueError
        return int(value)
    except (TypeError, ValueError):
        raise ConnectorError(f"{key} must be a whole-number ID.")


def _text(raw, key, max_length, required=False, min_length=1):
    if key not in raw or raw.get(key) is None:
        if required:
            raise ConnectorError(f"{key} is required.")
        return None
    value = plain_text(raw.get(key))
    if len(value) < min_length:
        raise ConnectorError(f"{key} must be at least {min_length} characters.")
    if len(value) > max_length:
        raise ConnectorError(f"{key} is limited to {max_length} characters.")
    return value


def _html(raw, key, max_length, required=False):
    if key not in raw or raw.get(key) is None:
        if required:
            raise ConnectorError(f"{key} is required.")
        return None
    value = clean_html(raw.get(key))
    if not html_to_text(value):
        raise ConnectorError(f"{key} must contain visible text.")
    if len(value) > max_length:
        raise ConnectorError(f"{key} is limited to {max_length} characters.")
    return value


def _duration(raw):
    if "duration" not in raw or raw.get("duration") in (None, ""):
        return None
    value = str(raw.get("duration")).strip()
    if len(value) > 50:
        raise ConnectorError("duration is limited to 50 characters, for example '45' or '1h 30m'.")
    return value


def _before(value):
    value = str(value or "")
    return value if len(value) <= PREVIEW_BEFORE_CHARS else value[:PREVIEW_BEFORE_CHARS] + "…"


class Plan:
    def __init__(self, program, links: Links):
        self.program = program
        self.links = links
        self.operations = []
        self.previews = []
        self.targets = {f"course_published:{program.id}": str(program.is_published)}
        self.affects_published = False
        self._seen = set()
        self._added_titles = {}

    def position_note(self, module, title):
        """Describe where a new item lands, counting items added earlier in this change."""
        added = self._added_titles.setdefault(module.id, [])
        previous = added[-1] if added else _last_sibling_title(module)
        added.append(title)
        return f"End of the module, after '{previous}'" if previous else "First item in the module"

    def claim(self, key, message):
        if key in self._seen:
            raise ConnectorError(message)
        self._seen.add(key)

    def depend_on_node(self, node):
        self.targets[f"node:{node.id}"] = node_version(node)

    def node(self, node_id):
        node = CurriculumNode.objects.filter(program=self.program, pk=node_id).first()
        if node is None:
            raise ConnectorError(f"Item {node_id} is not part of course {self.program.id}.")
        return node

    def module(self, module_id):
        node = self.node(module_id)
        if node.parent_id is not None:
            raise ConnectorError(f"Item {module_id} is a lesson, not a module.")
        return node

    def visible_to_learners(self, node=None):
        return self.program.is_published and (node is None or node.is_published)

    def add(self, operation, preview, published):
        preview["affects_published_content"] = bool(published)
        self.affects_published = self.affects_published or bool(published)
        self.operations.append(operation)
        self.previews.append(preview)


def _content_type_label(program):
    hierarchy = program.blueprint.hierarchy_structure if program.blueprint else None
    valid, error = validate_builder_hierarchy(hierarchy)
    if not valid:
        raise ConnectorError(
            "This course's academic blueprint does not define a module and lesson "
            f"structure ({error}). Fix the blueprint before adding lessons."
        )
    return str(hierarchy[1]).strip()


def _plan_update_course(plan, raw):
    plan.claim("course", "Combine all course field changes into one update_course operation.")
    program = plan.program
    title = _text(raw, "title", 255, min_length=3)
    description = _html(raw, "description_html", MAX_DESCRIPTION_HTML)
    outcomes = raw.get("learning_outcomes")
    outcomes_html = None
    if outcomes is not None:
        if not isinstance(outcomes, list) or not outcomes:
            raise ConnectorError("learning_outcomes must be a non-empty list of strings.")
        items = [plain_text(item) for item in outcomes]
        if any(not item or len(item) > 300 for item in items) or len(items) > MAX_OUTCOMES:
            raise ConnectorError(
                f"Provide up to {MAX_OUTCOMES} learning outcomes of 1-300 characters each."
            )
        outcomes_html = resolve_learning_outcomes_html("", items)
    if title is None and description is None and outcomes_html is None:
        raise ConnectorError(
            "update_course needs at least one of title, description_html or learning_outcomes."
        )

    operation = {"op": "update_course"}
    changes, notes = [], []
    if title is not None and title != program.name:
        operation["title"] = title
        changes.append({"field": "title", "before": program.name, "after": title})
        new_slug = program._generate_unique_slug(title)
        if new_slug != program.slug:
            notes.append(
                f"The public course address changes from /programs/{program.slug}/ "
                f"to /programs/{new_slug}/."
            )
    if description is not None and description != (program.description or ""):
        operation["description_html"] = description
        changes.append(
            {"field": "description_html", "before": _before(program.description), "after": description}
        )
    if outcomes_html is not None and outcomes_html != (program.what_you_learn_html or ""):
        operation["learning_outcomes_html"] = outcomes_html
        changes.append(
            {
                "field": "learning_outcomes",
                "before": list(program.what_you_learn_items or []),
                "after": [plain_text(item) for item in outcomes],
            }
        )
    if not changes:
        raise ConnectorError("update_course would not change anything; the values already match.")

    plan.targets[f"course:{program.id}"] = program_version(program)
    plan.add(
        operation,
        {
            "action": "change",
            "summary": f"Update course {', '.join(change['field'] for change in changes)}",
            "target": {"type": "course", "id": program.id, "title": program.name},
            "changes": changes,
            "notes": notes,
        },
        plan.visible_to_learners(),
    )


def _plan_update_module(plan, raw):
    module = plan.module(_require_int(raw, "module_id"))
    plan.claim(("module", module.id), f"Module {module.id} appears in more than one operation.")
    title = _text(raw, "title", 255, required=True)
    if title == module.title:
        raise ConnectorError(f"Module {module.id} is already titled '{title}'.")
    plan.depend_on_node(module)
    plan.add(
        {"op": "update_module", "module_id": module.id, "title": title},
        {
            "action": "change",
            "summary": f"Rename module '{module.title}' to '{title}'",
            "target": {"type": "module", "id": module.id, "title": module.title},
            "changes": [{"field": "title", "before": module.title, "after": title}],
        },
        plan.visible_to_learners(module),
    )


def _last_sibling_title(module):
    last = CurriculumNode.objects.filter(parent=module).order_by("-position", "-id").first()
    return last.title if last else None


def _plan_create_text_lesson(plan, raw):
    module = plan.module(_require_int(raw, "module_id"))
    _content_type_label(plan.program)
    operation = {
        "op": "create_text_lesson",
        "module_id": module.id,
        "title": _text(raw, "title", 255, required=True, min_length=3),
        "body_html": _html(raw, "body_html", MAX_BODY_HTML, required=True),
        "duration": _duration(raw),
        "description": _text(raw, "description", 1000) or "",
    }
    plan.depend_on_node(module)
    plan.add(
        operation,
        {
            "action": "add",
            "summary": f"Add text lesson '{operation['title']}' to module '{module.title}'",
            "target": {"type": "text_lesson", "module": {"id": module.id, "title": module.title}},
            "position": plan.position_note(module, operation["title"]),
            "values": {
                "title": operation["title"],
                "description": operation["description"],
                "duration": operation["duration"],
                "body_html": operation["body_html"],
            },
        },
        plan.visible_to_learners(),
    )


def _plan_update_text_lesson(plan, raw):
    lesson = plan.node(_require_int(raw, "lesson_id"))
    plan.claim(("lesson", lesson.id), f"Lesson {lesson.id} appears in more than one operation.")
    has_children = CurriculumNode.objects.filter(parent=lesson).exists()
    if lesson.parent_id is None or not is_text_lesson(lesson, has_children):
        raise ConnectorError(
            f"Item {lesson.id} is not a text lesson. This connector edits text lessons only."
        )
    props = node_properties(lesson)
    fields = {
        "title": _text(raw, "title", 255, min_length=3),
        "body_html": _html(raw, "body_html", MAX_BODY_HTML),
        "duration": _duration(raw),
        "description": _text(raw, "description", 1000),
    }
    current = {
        "title": lesson.title,
        "body_html": props.get("content") or props.get("content_html") or "",
        "duration": props.get("duration") or None,
        "description": lesson.description or "",
    }
    if fields["body_html"] is not None and len(current["body_html"]) > MAX_BODY_CHARS:
        raise ConnectorError(
            f"Lesson {lesson.id}'s body is too long to read in full through this connector. "
            "Edit its body in the course builder; title, duration and description changes remain available here."
        )
    operation = {"op": "update_text_lesson", "lesson_id": lesson.id}
    changes = []
    for field, value in fields.items():
        if value is not None and value != current[field]:
            operation[field] = value
            changes.append(
                {
                    "field": field,
                    "before": _before(current[field]) if field == "body_html" else current[field],
                    "after": value,
                }
            )
    if not changes:
        raise ConnectorError(
            f"update_text_lesson for lesson {lesson.id} would not change anything."
        )
    plan.depend_on_node(lesson)
    plan.add(
        operation,
        {
            "action": "change",
            "summary": f"Edit text lesson '{lesson.title}' ({', '.join(c['field'] for c in changes)})",
            "target": {"type": "text_lesson", "id": lesson.id, "title": lesson.title},
            "changes": changes,
        },
        plan.visible_to_learners(lesson),
    )


def _plan_create_quiz(plan, raw):
    module = plan.module(_require_int(raw, "module_id"))
    _content_type_label(plan.program)
    new_questions = question_rules.normalize_question_list(raw.get("questions"))
    operation = {
        "op": "create_quiz",
        "module_id": module.id,
        "title": _text(raw, "title", 100, required=True, min_length=5),
        "description": _text(raw, "description", 2000) or "",
        "questions": new_questions,
    }
    plan.depend_on_node(module)
    plan.add(
        operation,
        {
            "action": "add",
            "summary": (
                f"Add quiz '{operation['title']}' with {len(new_questions)} questions "
                f"to module '{module.title}'"
            ),
            "target": {"type": "quiz", "module": {"id": module.id, "title": module.title}},
            "position": plan.position_note(module, operation["title"]),
            "values": {
                "title": operation["title"],
                "description": operation["description"],
                "questions": [question_rules.describe(q) for q in new_questions],
            },
            "notes": [
                "Quiz settings use the builder defaults (pass mark 70%, 1 attempt, weight 0%). "
                "Set the grading weight in the course builder."
            ],
        },
        plan.visible_to_learners(),
    )


def _quiz_target(plan, raw):
    node = plan.node(_require_int(raw, "quiz_lesson_id"))
    if not is_quiz_node(node):
        raise ConnectorError(f"Item {node.id} is not a quiz.")
    quiz = quiz_for_node(node)
    if quiz is None:
        raise ConnectorError(
            f"Quiz {node.id} has no saved assessment record yet. Open and save it once "
            "in the course builder, then try again."
        )
    # The builder keeps a copy of the question list on the node. Entries that
    # were never saved as questions would be lost when that copy is rebuilt.
    stored_ids = {str(pk) for pk in quiz.questions.values_list("id", flat=True)}
    mirror = node_properties(node).get("questions") or []
    if any(not isinstance(entry, dict) or str(entry.get("db_id")) not in stored_ids for entry in mirror):
        raise ConnectorError(
            f"Quiz {node.id} has question edits that were not saved in the course builder. "
            "Open the quiz in the builder and save it, then try again."
        )
    return node, quiz


def _attempt_note(quiz):
    attempts = quiz.attempts.count()
    if not attempts:
        return []
    return [
        f"Learners have {attempts} attempt(s) on this quiz. Past attempts keep their "
        "recorded results; changes apply to future attempts."
    ]


def _plan_add_questions(plan, raw):
    node, quiz = _quiz_target(plan, raw)
    plan.claim(("add_questions", node.id), f"Combine additions to quiz {node.id} into one add_questions operation.")
    new_questions = question_rules.normalize_question_list(raw.get("questions"))
    existing_count = quiz.questions.count()
    plan.depend_on_node(node)
    plan.add(
        {"op": "add_questions", "quiz_lesson_id": node.id, "questions": new_questions},
        {
            "action": "add",
            "summary": f"Add {len(new_questions)} questions to quiz '{node.title}'",
            "target": {"type": "quiz", "id": node.id, "title": node.title},
            "position": f"After the existing {existing_count} question(s), which stay unchanged",
            "values": {"questions": [question_rules.describe(q) for q in new_questions]},
            "notes": _attempt_note(quiz),
        },
        plan.visible_to_learners(node),
    )


def _plan_update_question(plan, raw):
    node, quiz = _quiz_target(plan, raw)
    question_id = _require_int(raw, "question_id")
    plan.claim(("question", question_id), f"Question {question_id} appears in more than one operation.")
    record = quiz.questions.filter(pk=question_id).first()
    if record is None:
        raise ConnectorError(f"Question {question_id} is not part of quiz {node.id}.")
    current = question_rules.canonical_from_record(record)
    if current is None:
        raise ConnectorError(
            f"Question {question_id} is a {record.question_type} question, which this "
            "connector can read but not edit."
        )
    raw_question = raw.get("question")
    if not isinstance(raw_question, dict):
        raise ConnectorError("update_question needs the complete new question in 'question'.")
    try:
        updated = question_rules.normalize_question(raw_question, default_points=record.points)
    except ConnectorError as exc:
        raise ConnectorError(f"Question {question_id}: {exc}") from exc
    if updated == current:
        raise ConnectorError(f"Question {question_id} would not change.")
    notes = _attempt_note(quiz)
    if record.source_bank_entry_id:
        notes.append("This question was copied from a question bank; the bank entry is not changed.")
    plan.depend_on_node(node)
    plan.add(
        {"op": "update_question", "quiz_lesson_id": node.id, "question_id": question_id, "question": updated},
        {
            "action": "change",
            "summary": f"Edit question {question_id} in quiz '{node.title}'",
            "target": {"type": "question", "id": question_id, "quiz": {"id": node.id, "title": node.title}},
            "changes": [
                {
                    "field": "question",
                    "before": question_rules.describe(current),
                    "after": question_rules.describe(updated),
                }
            ],
            "notes": notes,
        },
        plan.visible_to_learners(node),
    )


PLANNERS = {
    "update_course": _plan_update_course,
    "update_module": _plan_update_module,
    "create_text_lesson": _plan_create_text_lesson,
    "update_text_lesson": _plan_update_text_lesson,
    "create_quiz": _plan_create_quiz,
    "add_questions": _plan_add_questions,
    "update_question": _plan_update_question,
}


def plan_operations(program, raw_operations, links: Links) -> Plan:
    if not isinstance(raw_operations, list) or not raw_operations:
        raise ConnectorError("Provide at least one operation.")
    if len(raw_operations) > MAX_OPERATIONS:
        raise ConnectorError(f"A single change can contain at most {MAX_OPERATIONS} operations.")
    plan = Plan(program, links)
    for index, raw in enumerate(raw_operations, start=1):
        op_name = raw.get("op") if isinstance(raw, dict) else None
        planner = PLANNERS.get(op_name)
        if planner is None:
            raise ConnectorError(
                f"Operation {index}: unsupported op {op_name!r}. "
                f"Supported: {', '.join(OPERATION_TYPES)}. Call get_authoring_schema for details."
            )
        try:
            planner(plan, raw)
        except ConnectorError as exc:
            raise ConnectorError(f"Operation {index} ({op_name}): {exc}") from exc
    return plan


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------


def _next_position(module):
    top = CurriculumNode.objects.filter(parent=module).aggregate(top=Max("position"))["top"]
    return 0 if top is None else top + 1


def _apply_update_course(program, operation, links):
    if "title" in operation:
        program.name = operation["title"]
    if "description_html" in operation:
        program.description = operation["description_html"]
    if "learning_outcomes_html" in operation:
        program.what_you_learn_html = operation["learning_outcomes_html"]
    program.save()
    return {"type": "course", "id": program.id, "title": program.name, "url": links.course_settings(program.id)}


def _apply_update_module(program, operation, links):
    module = CurriculumNode.objects.get(program=program, pk=operation["module_id"])
    module.title = operation["title"]
    module.save(update_fields=["title", "updated_at"], skip_validation=True)
    return {"type": "module", "id": module.id, "title": module.title, "url": links.builder(program.id, module.id)}


def _apply_create_text_lesson(program, operation, links):
    module = CurriculumNode.objects.get(program=program, pk=operation["module_id"])
    properties = {"lesson_type": "text", "content": operation["body_html"]}
    if operation.get("duration"):
        properties["duration"] = operation["duration"]
    lesson = CurriculumNode.objects.create(
        program=program,
        parent=module,
        title=operation["title"],
        description=operation.get("description") or "",
        node_type=_content_type_label(program),
        position=_next_position(module),
        properties=properties,
        # Same rule as the course builder: new items in a published course are live.
        is_published=program.is_published,
    )
    return {"type": "text_lesson", "id": lesson.id, "title": lesson.title, "url": links.builder(program.id, lesson.id)}


def _apply_update_text_lesson(program, operation, links):
    lesson = CurriculumNode.objects.get(program=program, pk=operation["lesson_id"])
    props = dict(node_properties(lesson))
    if "title" in operation:
        lesson.title = operation["title"]
    if "description" in operation:
        lesson.description = operation["description"]
    if "body_html" in operation:
        props["content"] = operation["body_html"]
        props.pop("content_html", None)
    if "duration" in operation:
        props["duration"] = operation["duration"]
    lesson.properties = props
    lesson.save(update_fields=["title", "description", "properties", "updated_at"], skip_validation=True)
    return {"type": "text_lesson", "id": lesson.id, "title": lesson.title, "url": links.builder(program.id, lesson.id)}


def _apply_create_quiz(program, operation, links):
    from apps.core.views import _sync_quiz_questions

    module = CurriculumNode.objects.get(program=program, pk=operation["module_id"])
    builder_questions = [question_rules.to_builder_payload(q) for q in operation["questions"]]
    properties = {"lesson_type": "quiz", "questions": builder_questions}
    if operation.get("description"):
        properties["description"] = operation["description"]
    node = CurriculumNode.objects.create(
        program=program,
        parent=module,
        title=operation["title"],
        node_type=_content_type_label(program),
        position=_next_position(module),
        properties=properties,
        is_published=program.is_published,
    )
    # A brand-new quiz has no stored questions, so the builder's full-list
    # synchronisation receives the complete list and removes nothing.
    _sync_quiz_questions(node, builder_questions)
    return {"type": "quiz", "id": node.id, "title": node.title, "url": links.builder(program.id, node.id)}


def _apply_add_questions(program, operation, links):
    node = CurriculumNode.objects.get(program=program, pk=operation["quiz_lesson_id"])
    quiz = quiz_for_node(node)
    created = question_rules.append_questions(quiz, operation["questions"])
    question_rules.refresh_quiz_properties(node, quiz)
    return {
        "type": "quiz",
        "id": node.id,
        "title": node.title,
        "added_question_ids": created,
        "url": links.builder(program.id, node.id),
    }


def _apply_update_question(program, operation, links):
    node = CurriculumNode.objects.get(program=program, pk=operation["quiz_lesson_id"])
    quiz = quiz_for_node(node)
    record = quiz.questions.get(pk=operation["question_id"])
    question_rules.update_question(record, operation["question"])
    question_rules.refresh_quiz_properties(node, quiz)
    return {
        "type": "question",
        "id": record.id,
        "quiz_id": node.id,
        "title": node.title,
        "url": links.builder(program.id, node.id),
    }


APPLIERS = {
    "update_course": _apply_update_course,
    "update_module": _apply_update_module,
    "create_text_lesson": _apply_create_text_lesson,
    "update_text_lesson": _apply_update_text_lesson,
    "create_quiz": _apply_create_quiz,
    "add_questions": _apply_add_questions,
    "update_question": _apply_update_question,
}


def apply_operations(program, operations, links: Links) -> list[dict]:
    return [APPLIERS[operation["op"]](program, operation, links) for operation in operations]
