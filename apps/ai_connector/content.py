"""Shared helpers for course structure, links and content-version fingerprints."""

import hashlib
import json
from collections import defaultdict

from django.conf import settings
from django.db.models import Prefetch

from apps.assessments.models import Question, Quiz
from apps.curriculum.activity_types import QUIZ, TEXT, normalize_activity_type
from apps.curriculum.models import CurriculumNode

WRITABLE_QUESTION_TYPES = {"mcq", "mcq_multi", "true_false"}
MAX_BODY_CHARS = 100_000


def base_url(request=None) -> str:
    configured = getattr(settings, "AI_CONNECTOR_BASE_URL", "")
    if configured:
        return configured
    if request is not None and hasattr(request, "build_absolute_uri"):
        return request.build_absolute_uri("/").rstrip("/")
    return getattr(settings, "PLATFORM_PUBLIC_BASE_URL", "").rstrip("/")


class Links:
    """Absolute links to the places a person would open to check a change."""

    def __init__(self, base: str):
        self.base = base.rstrip("/")

    def builder(self, program_id, node_id=None) -> str:
        url = f"{self.base}/instructor/programs/{program_id}/manage/?tab=curriculum"
        if node_id:
            url += f"&node={node_id}"
        return url

    def course_settings(self, program_id) -> str:
        return f"{self.base}/instructor/programs/{program_id}/manage/?tab=settings&section=main"

    def preview(self, program_id) -> str:
        return f"{self.base}/instructor/programs/{program_id}/preview/"

    def public(self, program) -> str:
        return f"{self.base}/programs/{program.slug}/"


def node_properties(node) -> dict:
    return node.properties if isinstance(node.properties, dict) else {}


def activity_type(node) -> str:
    return normalize_activity_type(node.node_type, node_properties(node))


def is_quiz_node(node) -> bool:
    props = node_properties(node)
    lesson_type = str(props.get("lesson_type") or "").strip().lower()
    return lesson_type == QUIZ or (not lesson_type and str(node.node_type).lower() == QUIZ)


def is_text_lesson(node, has_children: bool) -> bool:
    # normalize_activity_type() falls back to "text" for unknown types, so also
    # require the stored type to be text (or absent on legacy lessons).
    raw_type = str(node_properties(node).get("lesson_type") or "").strip().lower()
    return (
        not has_children
        and raw_type in {"", TEXT}
        and activity_type(node) == TEXT
        and not is_quiz_node(node)
    )


def quiz_for_node(node):
    quiz_id = node_properties(node).get("quiz_id")
    quiz = None
    if quiz_id:
        quiz = Quiz.objects.filter(pk=quiz_id, node=node).first()
    return quiz or Quiz.objects.filter(node=node).order_by("id").first()


def _digest(payload) -> str:
    encoded = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()[:16]


def program_version(program) -> str:
    return _digest(
        {
            "name": program.name,
            "description": program.description or "",
            "preview_description": program.preview_description or "",
            "what_you_learn_html": program.what_you_learn_html or "",
            "is_published": program.is_published,
        }
    )


def _question_rows(questions) -> list:
    return [
        {
            "id": question.id,
            "type": question.question_type,
            "text": question.text,
            "points": question.points,
            "position": question.position,
            "answer_data": question.answer_data,
            "options": [
                (option.id, option.text, option.is_correct, option.position)
                for option in sorted(question.options.all(), key=lambda o: (o.position, o.id))
            ],
        }
        for question in questions
    ]


def _question_state(quiz) -> list:
    if quiz is None:
        return []
    return _question_rows(quiz.questions.prefetch_related("options").order_by("position", "id"))


def _node_digest(node, child_ids, questions) -> str:
    state = {
        "title": node.title,
        "description": node.description or "",
        "node_type": node.node_type,
        "parent_id": node.parent_id,
        "position": node.position,
        "is_published": node.is_published,
        "properties": node_properties(node),
        "children": child_ids,
    }
    if is_quiz_node(node):
        state["questions"] = questions
    return _digest(state)


def node_version(node) -> str:
    """
    Fingerprint of everything a connector edit could depend on for this node.

    Includes the ordered child IDs (so a module changes when lessons are added
    to it) and, for quizzes, the stored questions and answers.
    """
    child_ids = list(
        CurriculumNode.objects.filter(parent=node).order_by("position", "id").values_list("id", flat=True)
    )
    questions = _question_state(quiz_for_node(node)) if is_quiz_node(node) else None
    return _node_digest(node, child_ids, questions)


def node_versions(nodes) -> dict:
    """
    ``node_version`` for every node of one course in a fixed number of queries.

    ``nodes`` must be all of the course's nodes so child lists are complete.
    """
    children = defaultdict(list)
    for node in sorted(nodes, key=lambda item: (item.position, item.id)):
        if node.parent_id:
            children[node.parent_id].append(node.id)

    quiz_nodes = [node for node in nodes if is_quiz_node(node)]
    quizzes_by_node = defaultdict(list)
    for quiz in (
        Quiz.objects.filter(node__in=quiz_nodes)
        .order_by("id")
        .prefetch_related(
            Prefetch(
                "questions",
                queryset=Question.objects.order_by("position", "id").prefetch_related("options"),
            )
        )
    ):
        quizzes_by_node[quiz.node_id].append(quiz)

    versions = {}
    for node in nodes:
        questions = None
        if is_quiz_node(node):
            candidates = quizzes_by_node.get(node.id, [])
            linked_id = str(node_properties(node).get("quiz_id") or "")
            quiz = next((item for item in candidates if str(item.id) == linked_id), None)
            quiz = quiz or (candidates[0] if candidates else None)
            questions = _question_rows(quiz.questions.all()) if quiz else []
        versions[node.id] = _node_digest(node, children.get(node.id, []), questions)
    return versions
