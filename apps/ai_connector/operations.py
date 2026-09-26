"""
Course change operations.

``plan_operations`` validates raw operations from an AI client and produces the
canonical operations, a readable preview and the content versions they depend
on, without changing anything. ``apply_operations`` later replays exactly those
canonical operations.
"""

from django.conf import settings
from django.db.models import Max

from apps.core.learning_outcomes import resolve_learning_outcomes_html
from apps.core.taxonomy import validate_builder_hierarchy
from apps.curriculum.models import CurriculumNode
from apps.platform.models import PlatformSettings

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
    root_layout_version,
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
    "create_module",
    "update_module",
    "set_item_visibility",
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
        self._added_modules = []

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
    preview_description = _text(raw, "preview_description", 1000)
    category = _text(raw, "category", 100)
    level = _text(raw, "level", 100)
    if category is not None and category != (program.category or ""):
        configured = PlatformSettings.get_settings().get_program_categories()
        if configured and category not in configured:
            raise ConnectorError("Select a configured course category from get_course_creation_options.")
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
    if all(value is None for value in (title, description, preview_description, category, level, outcomes_html)):
        raise ConnectorError(
            "update_course needs at least one supported field."
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
    for field, value, current in (
        ("preview_description", preview_description, program.preview_description or ""),
        ("category", category, program.category or ""),
        ("level", level, program.level or ""),
    ):
        if value is not None and value != current:
            operation[field] = value
            changes.append({"field": field, "before": current, "after": value})
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
    title = _text(raw, "title", 255)
    description = _text(raw, "description", 1000)
    changes = []
    operation = {"op": "update_module", "module_id": module.id}
    if title is not None and title != module.title:
        operation["title"] = title
        changes.append({"field": "title", "before": module.title, "after": title})
    if description is not None and description != (module.description or ""):
        operation["description"] = description
        changes.append({"field": "description", "before": module.description or "", "after": description})
    if not changes:
        raise ConnectorError(f"Module {module.id} would not change.")
    plan.depend_on_node(module)
    plan.add(
        operation,
        {
            "action": "change",
            "summary": f"Edit module '{module.title}' ({', '.join(change['field'] for change in changes)})",
            "target": {"type": "module", "id": module.id, "title": module.title},
            "changes": changes,
        },
        plan.visible_to_learners(module),
    )


def _plan_create_module(plan, raw):
    _content_type_label(plan.program)
    title = _text(raw, "title", 255, required=True, min_length=3)
    description = _text(raw, "description", 1000) or ""
    last = (
        CurriculumNode.objects.filter(program=plan.program, parent__isnull=True)
        .order_by("-position", "-id").first()
    )
    previous = plan._added_modules[-1] if plan._added_modules else (last.title if last else None)
    plan._added_modules.append(title)
    plan.targets[f"root_layout:{plan.program.id}"] = root_layout_version(plan.program)
    plan.add(
        {"op": "create_module", "title": title, "description": description},
        {
            "action": "add",
            "summary": f"Add module '{title}'",
            "target": {"type": "module", "course_id": plan.program.id},
            "position": f"After '{previous}'" if previous else "First module",
            "values": {"title": title, "description": description},
        },
        plan.visible_to_learners(),
    )


def _plan_set_item_visibility(plan, raw):
    node = plan.node(_require_int(raw, "item_id"))
    plan.claim(("visibility", node.id), f"Item {node.id} appears in more than one visibility operation.")
    visible = raw.get("visible")
    if not isinstance(visible, bool):
        raise ConnectorError("visible must be true or false.")
    if visible == node.is_published:
        raise ConnectorError(f"Item {node.id} already has that visibility.")
    plan.depend_on_node(node)
    plan.add(
        {"op": "set_item_visibility", "item_id": node.id, "visible": visible},
        {
            "action": "change",
            "summary": f"{'Show' if visible else 'Hide'} item '{node.title}' for learners",
            "target": {"type": "module" if node.parent_id is None else "item", "id": node.id, "title": node.title},
            "changes": [{"field": "is_published", "before": node.is_published, "after": visible}],
            "notes": ["This does not delete the item or its historical learner records."],
        },
        plan.program.is_published and (node.is_published or visible),
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
    "create_module": _plan_create_module,
    "update_module": _plan_update_module,
    "set_item_visibility": _plan_set_item_visibility,
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
        if op_name in {"create_module", "set_item_visibility"} and not getattr(settings, "AI_CONNECTOR_V2_ENABLED", False):
            raise ConnectorError("Expanded course changes are not enabled on this deployment yet.")
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
    for field in ("preview_description", "category", "level"):
        if field in operation:
            setattr(program, field, operation[field])
    if "learning_outcomes_html" in operation:
        program.what_you_learn_html = operation["learning_outcomes_html"]
    program.save()
    return {"type": "course", "id": program.id, "title": program.name, "url": links.course_settings(program.id)}


def _apply_update_module(program, operation, links):
    module = CurriculumNode.objects.get(program=program, pk=operation["module_id"])
    fields = ["updated_at"]
    for field in ("title", "description"):
        if field in operation:
            setattr(module, field, operation[field])
            fields.append(field)
    module.save(update_fields=fields, skip_validation=True)
    return {"type": "module", "id": module.id, "title": module.title, "url": links.builder(program.id, module.id)}


def _apply_create_module(program, operation, links):
    top = CurriculumNode.objects.filter(program=program, parent__isnull=True).aggregate(top=Max("position"))["top"]
    module = CurriculumNode.objects.create(
        program=program,
        title=operation["title"],
        description=operation["description"],
        node_type=str(program.blueprint.hierarchy_structure[0]).strip(),
        position=0 if top is None else top + 1,
        is_published=program.is_published,
    )
    return {"type": "module", "id": module.id, "title": module.title, "url": links.builder(program.id, module.id)}


def _apply_set_item_visibility(program, operation, links):
    node = CurriculumNode.objects.get(program=program, pk=operation["item_id"])
    node.is_published = operation["visible"]
    node.save(update_fields=["is_published", "updated_at"], skip_validation=True)
    return {
        "type": "module" if node.parent_id is None else "item",
        "id": node.id, "title": node.title, "is_published": node.is_published,
        "url": links.builder(program.id, node.id),
    }


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
    "create_module": _apply_create_module,
    "update_module": _apply_update_module,
    "set_item_visibility": _apply_set_item_visibility,
    "create_text_lesson": _apply_create_text_lesson,
    "update_text_lesson": _apply_update_text_lesson,
    "create_quiz": _apply_create_quiz,
    "add_questions": _apply_add_questions,
    "update_question": _apply_update_question,
}


def apply_operations(program, operations, links: Links) -> list[dict]:
    return [APPLIERS[operation["op"]](program, operation, links) for operation in operations]
