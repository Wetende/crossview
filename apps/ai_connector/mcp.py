"""
MCP tools for AI course authoring.

django-mcp-server autodiscovers this module and publishes each public method of
``CourseAuthoringTools`` as a tool. ``self.request`` is the authenticated DRF
request, so ``request.user`` is the LMS account and ``request.auth`` the
OAuth access token the AI client presented.
"""

import logging
from typing import Annotated, Any

from mcp.types import ToolAnnotations
from mcp_server import MCPToolset
from mcp_server.djangomcp import global_mcp_server
from pydantic import Field

from . import changes, creation, diagnostics, messaging, reading
from .access import LEARNERS_SCOPE, READ_SCOPE, ConnectorError, require_scope, require_v2_enabled
from .content import Links, base_url
from .operations import MAX_OPERATIONS
from .questions import MAX_QUESTIONS

CourseId = Annotated[int, Field(description="Numeric course ID from search_courses.")]
ChangeId = Annotated[str, Field(description="change_id returned by prepare_course_change.")]


class CourseAuthoringTools(MCPToolset):
    def _context(self, scope=READ_SCOPE):
        user = getattr(self.request, "user", None)
        token = getattr(self.request, "auth", None)
        require_scope(token, scope)
        return user, token, Links(base_url(self.request))

    def search_courses(
        self,
        query: Annotated[str, Field(description="Words from the course title or code. Leave empty to list all.")] = "",
        page: int = 1,
        page_size: Annotated[int, Field(description="Results per page, up to 50.")] = 20,
    ) -> dict[str, Any]:
        """Find courses the signed-in user can manage, by title or course code.

        Returns course IDs, codes, titles, publication status and course-builder
        links, with pagination.
        """
        user, _, links = self._context()
        return reading.search_courses(user, links, query=query, page=page, page_size=page_size)

    def get_course(
        self,
        course_id: CourseId,
        page: Annotated[int, Field(description="Page of modules, starting at 1.")] = 1,
        page_size: Annotated[int, Field(description="Modules per page, up to 50.")] = 20,
    ) -> dict[str, Any]:
        """Get a course's current details and curriculum outline.

        Returns title, description, learning outcomes, publication status and
        the course's modules (paged; see has_more_modules) with their lessons,
        quizzes and assignments in order. Each item has a stable ID, activity
        type, publication flag, content version and course-builder link. Use
        get_lesson for an item's full content.
        """
        user, _, links = self._context()
        return reading.get_course(user, links, course_id, page=page, page_size=page_size)

    def get_lesson(
        self,
        lesson_id: Annotated[int, Field(description="Item ID from get_course (lesson, quiz or assignment).")],
    ) -> dict[str, Any]:
        """Get the stored content of one course item on demand.

        Text lessons include body HTML up to 100,000 characters and a
        body_truncated flag; a truncated body cannot be replaced through this
        connector. Quizzes include settings and every
        question with its options and correct answers. Assignments include
        their instructions. Video, audio and document items include stored
        metadata and any stored transcript text only.
        """
        user, _, links = self._context()
        return reading.get_lesson(user, links, lesson_id)

    def check_course_readiness(self, course_id: CourseId) -> dict[str, Any]:
        """Run the platform's publish-readiness checks for a course.

        Returns factual findings (blocking problems and warnings such as empty
        quizzes, missing descriptions or assessment weights that do not add up
        to 100%), each linked to the affected item. Present these as facts and
        keep your own teaching-quality suggestions separate and clearly
        labelled as suggestions.
        """
        user, _, links = self._context()
        return reading.check_course_readiness(user, links, course_id)

    def inspect_course_health(self, course_id: CourseId) -> dict[str, Any]:
        """Find factual course readiness and engagement signals for diagnosis.

        Reports platform publish checks and aggregate learner states from
        recorded activity. It does not inspect server logs, video contents,
        payments or email delivery. Explain those limits when diagnosing.
        """
        require_v2_enabled()
        user, token, links = self._context()
        require_scope(token, LEARNERS_SCOPE)
        return diagnostics.course_health(user, links, course_id)

    def inspect_lms_configuration(self) -> dict[str, Any]:
        """Read non-secret LMS configuration and course counts for admin diagnosis.

        This does not inspect runtime logs, payment gateways or external
        services. Only an LMS administrator may call it.
        """
        require_v2_enabled()
        user, _, _ = self._context()
        return diagnostics.lms_configuration(user)

    def list_course_learners(
        self,
        course_id: CourseId,
        state: Annotated[str, Field(description="Optional learner state: new, not_started, active, stalled, inactive, expired or completed.")] = "",
        page: int = 1,
        page_size: Annotated[int, Field(description="Learners per page, up to 50.")] = 20,
    ) -> dict[str, Any]:
        """Read paginated activity and progress for learners in an authorized course.

        The LMS records learning events, not every page visit. Treat a missing
        activity record as 'no recorded learning activity', not proof that a
        learner never opened the LMS.
        """
        require_v2_enabled()
        user, token, links = self._context()
        require_scope(token, LEARNERS_SCOPE)
        return diagnostics.course_learners(user, links, course_id, state=state, page=page, page_size=page_size)

    def get_course_learner(
        self,
        course_id: CourseId,
        enrollment_id: Annotated[int, Field(description="Enrollment ID from list_course_learners.")],
        curriculum_offset: int = 0,
        curriculum_limit: Annotated[int, Field(description="Published curriculum items per page, up to 50.")] = 25,
    ) -> dict[str, Any]:
        """Inspect one authorized learner's recorded progress, activity and feedback."""
        require_v2_enabled()
        user, token, links = self._context()
        require_scope(token, LEARNERS_SCOPE)
        return diagnostics.learner_detail(
            user, links, course_id, enrollment_id,
            curriculum_offset=curriculum_offset, curriculum_limit=curriculum_limit,
        )

    def get_course_engagement_matrix(
        self,
        course_id: CourseId,
        enrollment_offset: int = 0,
        node_offset: int = 0,
        limit: Annotated[int, Field(description="Learners and items per page, up to 25.")] = 25,
    ) -> dict[str, Any]:
        """Compare recorded learner completions and quiz outcomes by course item."""
        require_v2_enabled()
        user, token, links = self._context()
        require_scope(token, LEARNERS_SCOPE)
        return diagnostics.engagement_matrix(
            user, links, course_id,
            enrollment_offset=enrollment_offset, node_offset=node_offset, limit=limit,
        )

    def get_authoring_schema(self) -> dict[str, Any]:
        """Describe the change operations, fields and question types this connector supports.

        Call this before preparing a change if you are unsure of an operation's
        fields.
        """
        self._context()
        from django.conf import settings
        return {**AUTHORING_SCHEMA, "v2_enabled": bool(getattr(settings, "AI_CONNECTOR_V2_ENABLED", False))}

    def get_course_creation_options(self) -> dict[str, Any]:
        """Get permitted category, level and curriculum labels for a new draft course."""
        require_v2_enabled()
        user, _, _ = self._context()
        return creation.creation_options(user)

    def prepare_new_course(
        self,
        course: Annotated[dict, Field(description="New course with title, code, category, level, description_html, learning_outcomes and modules; see get_authoring_schema.")],
    ) -> dict[str, Any]:
        """Validate and preview a complete new unpublished course without saving it.

        Show the exact preview and ask the user to confirm in a later chat turn.
        """
        require_v2_enabled()
        user, token, links = self._context()
        return creation.prepare_course(user=user, token=token, links=links, course=course)

    def apply_new_course(self, change_id: ChangeId) -> dict[str, Any]:
        """Create exactly the previously previewed draft course after chat approval.

        Requires a separate explicit confirmation of the preview. Never
        publishes the course; repeated calls do not create duplicates.
        """
        require_v2_enabled()
        user, token, links = self._context()
        return creation.apply_course(user=user, token=token, links=links, change_id=change_id)

    def prepare_learner_message(
        self,
        course_id: CourseId,
        content: Annotated[str, Field(description="Plain-text private message to each selected learner, up to 5000 characters.")],
        enrollment_ids: Annotated[list[int] | None, Field(description="Explicit enrollment IDs from list_course_learners; omit to select by inactivity_days.")] = None,
        inactivity_days: Annotated[int | None, Field(description="Optional 1-365 day inactivity threshold based on recorded learning activity or enrollment date.")] = None,
    ) -> dict[str, Any]:
        """Preview exact recipients and text for private LMS learner messages.

        Nothing is sent. Show the full preview and get a separate explicit
        confirmation in chat before calling apply_learner_message.
        """
        require_v2_enabled()
        user, token, links = self._context()
        return messaging.prepare_message(
            user=user, token=token, links=links, course_id=course_id,
            content=content, enrollment_ids=enrollment_ids, inactivity_days=inactivity_days,
        )

    def apply_learner_message(self, change_id: ChangeId) -> dict[str, Any]:
        """Send only the exact previously previewed private messages after confirmation.

        Rechecks course access, recipients and activity; stale previews send
        nothing. Repeated calls return the first send result.
        """
        require_v2_enabled()
        user, token, links = self._context()
        return messaging.apply_message(user=user, token=token, links=links, change_id=change_id)

    def prepare_course_change(
        self,
        course_id: CourseId,
        operations: Annotated[
            list[dict],
            Field(
                description=(
                    "Ordered list of operations. Each has an 'op' of update_course, "
                    "create_module, update_module, set_item_visibility, create_text_lesson, update_text_lesson, create_quiz, "
                    "add_questions or update_question, plus that operation's fields "
                    "(see get_authoring_schema)."
                )
            ),
        ],
        summary: Annotated[str, Field(description="One-line description of the change for the audit trail.")] = "",
    ) -> dict[str, Any]:
        """Validate proposed course edits and return a preview WITHOUT saving anything.

        The preview lists exactly what will be added or changed, where, and
        whether published learner content is affected. Show the preview and
        publication notice to the user and ask them to confirm. Only after the
        user explicitly confirms in the chat, call apply_course_change with the
        returned change_id. Nothing is ever deleted: existing questions stay
        unless an update_question operation names them.
        """
        user, token, links = self._context()
        return changes.prepare_change(
            user=user,
            token=token,
            links=links,
            course_id=course_id,
            operations=operations,
            summary=summary,
        )

    def apply_course_change(self, change_id: ChangeId) -> dict[str, Any]:
        """Save a previously prepared change, exactly as previewed.

        Call only after the user has explicitly confirmed the preview in this
        conversation. The change is saved completely or not at all. If the
        course changed since the preview, nothing is saved and you must prepare
        a fresh change. Calling this again for a saved change returns the
        original result without saving twice. Returns links to the updated items.
        """
        user, token, links = self._context()
        return changes.apply_change(user=user, token=token, links=links, change_id=change_id)

    def get_change_status(self, change_id: ChangeId) -> dict[str, Any]:
        """Report whether a prepared change is still pending, saved, stale, expired or failed."""
        user, token, _ = self._context()
        return changes.change_status(user=user, token=token, change_id=change_id)


QUESTION_SCHEMA = {
    "type": "single_choice | multiple_choice | true_false",
    "text": "Plain-text question, up to 2000 characters.",
    "options": "2-10 distinct plain-text options (choice questions only).",
    "correct": (
        "single_choice: index of the correct option (0-based); "
        "multiple_choice: list of correct option indexes; true_false: true or false."
    ),
    "points": "Whole number 1-100, default 1.",
}

AUTHORING_SCHEMA = {
    "workflow": [
        "Read the course with get_course / get_lesson.",
        "Call prepare_course_change with the operations; nothing is saved.",
        "Show the preview to the user and wait for explicit confirmation.",
        "Call apply_course_change with the change_id.",
    ],
    "limits": {"operations_per_change": MAX_OPERATIONS, "questions_per_operation": MAX_QUESTIONS},
    "new_course": {
        "workflow": "get_course_creation_options → prepare_new_course → show preview and get separate chat confirmation → apply_new_course",
        "fields": {
            "title": "Required course title, 3-255 characters",
            "code": "Required unique code, up to 50 characters",
            "category": "Use get_course_creation_options for configured categories",
            "level": "Optional course level",
            "description_html": "Optional sanitized rich-text description",
            "learning_outcomes": "Optional list of up to 30 plain-text outcomes",
            "modules": "Up to 20 modules, each with title, optional description and items. Up to 100 total items and 2 MB total payload.",
            "items": "Each item is type text_lesson (title, body_html, optional duration/description) or quiz (title, optional description, 1-50 questions).",
        },
        "publication": "Always starts unpublished.",
    },
    "operations": {
        "update_course": {
            "fields": {
                "title": "Optional course title (3-255 characters). Changing it changes the public course address.",
                "description_html": "Optional public course description as HTML.",
                "preview_description": "Optional short plain-text public summary.",
                "category": "Optional configured category from get_course_creation_options.",
                "level": "Optional course level.",
                "learning_outcomes": "Optional list of plain-text outcomes; replaces the current list.",
            },
        },
        "update_module": {"fields": {"module_id": "Module ID", "title": "Optional new module title", "description": "Optional short plain-text summary"}},
        "create_module": {"fields": {"title": "New module title", "description": "Optional short plain-text summary"}},
        "set_item_visibility": {
            "fields": {"item_id": "Existing module or item ID", "visible": "true to show; false to hide without deleting"},
            "note": "Does not publish or unpublish the whole course. Hiding a module may hide its child items from learners.",
        },
        "create_text_lesson": {
            "fields": {
                "module_id": "Module that receives the lesson (added at the end)",
                "title": "Lesson title (3-255 characters)",
                "body_html": "Lesson body as HTML (headings, paragraphs, lists, links, tables)",
                "duration": "Optional, e.g. '30' (minutes) or '1h 15m'",
                "description": "Optional short plain-text summary",
            },
        },
        "update_text_lesson": {
            "fields": {
                "lesson_id": "Existing text lesson ID",
                "title": "Optional",
                "body_html": "Optional; replaces the whole body",
                "duration": "Optional",
                "description": "Optional",
            },
            "note": "Fields you omit are kept unchanged.",
        },
        "create_quiz": {
            "fields": {
                "module_id": "Module that receives the quiz (added at the end)",
                "title": "Quiz title (5-100 characters)",
                "description": "Optional plain-text instructions",
                "questions": "1-50 questions (see question format)",
            },
            "note": "Uses builder default settings; grading weight is set in the course builder.",
        },
        "add_questions": {
            "fields": {
                "quiz_lesson_id": "Quiz item ID from get_course",
                "questions": "1-50 questions appended after the existing ones",
            },
        },
        "update_question": {
            "fields": {
                "quiz_lesson_id": "Quiz item ID",
                "question_id": "question_id from get_lesson",
                "question": "The complete new question (see question format)",
            },
        },
    },
    "question_format": QUESTION_SCHEMA,
    "readable_only_question_types": [
        "short_answer", "matching", "image_matching", "fill_blank", "ordering",
    ],
    "not_supported": [
        "deleting content", "publishing or unpublishing",
        "moving or reordering modules and lessons", "media uploads",
        "question banks", "grading policy and weights", "changing learner records", "payments",
    ],
}

TOOL_HINTS = {
    "search_courses": ("Search courses", True, True),
    "get_course": ("Get course outline", True, True),
    "get_lesson": ("Get lesson content", True, True),
    "check_course_readiness": ("Check course readiness", True, True),
    "inspect_course_health": ("Inspect course health", True, True),
    "inspect_lms_configuration": ("Inspect LMS configuration", True, True),
    "list_course_learners": ("List course learners", True, True),
    "get_course_learner": ("Get learner progress", True, True),
    "get_course_engagement_matrix": ("Get engagement matrix", True, True),
    "get_authoring_schema": ("Get authoring schema", True, True),
    "get_course_creation_options": ("Get new-course options", True, True),
    "prepare_new_course": ("Preview new course", True, False),
    "apply_new_course": ("Create confirmed draft course", False, True),
    "prepare_learner_message": ("Preview learner message", True, False),
    "apply_learner_message": ("Send confirmed learner message", False, True),
    # Preparing stores a draft preview only; course content is untouched, so
    # clients should reserve their approval prompt for apply_course_change.
    "prepare_course_change": ("Preview course change", True, False),
    "apply_course_change": ("Save confirmed course change", False, True),
    "get_change_status": ("Get change status", True, True),
}


def annotate_registered_tools(server=global_mcp_server):
    """Attach titles and read/write hints so AI clients can ask before writes."""
    tools = server._tool_manager._tools
    for name, (title, read_only, idempotent) in TOOL_HINTS.items():
        tool = tools.get(name)
        if tool is None:
            continue
        tool.title = title
        tool.annotations = ToolAnnotations(
            title=title,
            readOnlyHint=read_only,
            destructiveHint=name in {"apply_course_change", "apply_learner_message"},
            idempotentHint=idempotent,
            openWorldHint=False,
        )


class _ExpectedToolErrorFilter(logging.Filter):
    """Keep permission and validation errors out of the error log; they are normal use."""

    def filter(self, record):
        exc = record.exc_info[1] if record.exc_info else None
        return not isinstance(exc, ConnectorError)


logging.getLogger("mcp_server.djangomcp").addFilter(_ExpectedToolErrorFilter())
