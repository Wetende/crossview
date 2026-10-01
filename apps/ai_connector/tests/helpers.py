import json
import secrets
from datetime import timedelta

from django.contrib.auth.models import Group
from django.utils import timezone
from oauth2_provider.models import get_access_token_model, get_application_model, set_token_value

from apps.assessments.models import Question, QuestionOption, Quiz
from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program, User
from apps.core.views import _sync_quiz_questions
from apps.curriculum.models import CurriculumNode
from apps.progression.models import InstructorAssignment

from ..content import Links

LINKS = Links("https://lms.test")


class FakeToken:
    """Stand-in for an OAuth access token in service-level tests."""

    def __init__(self, scope="courses:read courses:write", application=None):
        self.scope = scope
        self.application = application


def make_user(username, *, instructor=False, staff=False, active=True):
    user = User.objects.create_user(
        username=username, email=f"{username}@example.com", password="Pass12345!", is_staff=staff
    )
    user.is_active = active
    user.save(update_fields=["is_active"])
    if instructor:
        group, _ = Group.objects.get_or_create(name="Instructors")
        user.groups.add(group)
    return user


def make_course(code="AI101", *, published=False, instructor=None):
    blueprint = AcademicBlueprint.objects.create(
        name=f"{code} blueprint",
        hierarchy_structure=["Module", "Lesson"],
        grading_logic={"type": "weighted", "components": []},
    )
    program = Program.objects.create(
        blueprint=blueprint,
        name=f"{code} Introduction to AI",
        code=code,
        description="<p>An introduction.</p>",
        is_published=published,
    )
    if instructor is not None:
        InstructorAssignment.objects.create(instructor=instructor, program=program, is_primary=True)

    module1 = CurriculumNode.objects.create(
        program=program, title="Module 1: Foundations", node_type="Module", position=0, is_published=published
    )
    module2 = CurriculumNode.objects.create(
        program=program, title="Module 2: Models", node_type="Module", position=1, is_published=published
    )
    lesson = CurriculumNode.objects.create(
        program=program,
        parent=module1,
        title="What is AI?",
        node_type="Lesson",
        position=0,
        is_published=published,
        properties={"lesson_type": "text", "content": "<p>AI is...</p>", "duration": "20", "is_preview": True},
    )
    quiz_node = CurriculumNode.objects.create(
        program=program,
        parent=module2,
        title="Module 2 quiz",
        node_type="Lesson",
        position=0,
        is_published=published,
        properties={"lesson_type": "quiz", "passing_grade": 60, "weight": 40, "max_attempts": 3},
    )
    _sync_quiz_questions(
        quiz_node,
        [
            {"type": "mcq", "text": "Which is a model?", "options": ["Tree", "Rock"], "correct": 0, "points": 2},
            {"type": "true_false", "text": "Data matters.", "correct": True},
        ],
    )
    quiz_node.refresh_from_db()
    return {
        "program": program,
        "module1": module1,
        "module2": module2,
        "lesson": lesson,
        "quiz_node": quiz_node,
        "quiz": Quiz.objects.get(node=quiz_node),
    }


def question_snapshot(quiz):
    """Everything that must survive a non-destructive quiz edit."""
    return [
        (
            question.id,
            question.question_type,
            question.text,
            question.points,
            question.position,
            json.dumps(question.answer_data, sort_keys=True),
            tuple(
                (option.id, option.text, option.is_correct, option.position)
                for option in QuestionOption.objects.filter(question=question).order_by("position")
            ),
        )
        for question in Question.objects.filter(quiz=quiz).order_by("position", "id")
    ]


def make_oauth_token(
    user,
    scope="courses:read courses:write",
    *,
    expired=False,
    name="Test AI app",
    resource=("http://testserver/mcp",),
):
    Application = get_application_model()
    AccessToken = get_access_token_model()
    application = Application.objects.create(
        name=name,
        client_type=Application.CLIENT_PUBLIC,
        authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
        redirect_uris="https://claude.ai/api/mcp/auth_callback",
    )
    raw = secrets.token_urlsafe(24)
    token = AccessToken(
        user=user,
        application=application,
        scope=scope,
        expires=timezone.now() + (timedelta(hours=-1) if expired else timedelta(hours=1)),
        resource=list(resource),
    )
    set_token_value(token, raw)
    token.save()
    return raw, application
