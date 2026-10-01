"""The course-player node payload is shared by the session and public preview."""

import pytest
from django.test import RequestFactory
from django.urls import reverse

from apps.content.models import ContentBlock
from apps.progression.tests.factories import (
    CurriculumNodeFactory,
    EnrollmentFactory,
    ProgramFactory,
)
from apps.progression.views import _build_player_node_payload


@pytest.fixture
def lesson(db):
    program = ProgramFactory()
    unit = CurriculumNodeFactory(program=program, node_type="Unit")
    node = CurriculumNodeFactory(
        program=program,
        parent=unit,
        properties={
            "lesson_type": "video",
            "video_url": "https://www.youtube.com/watch?v=abc123",
            "solution_code": "author only",
        },
    )
    for position, block_type in enumerate(["RICHTEXT", "QUIZ", "ASSIGNMENT", "VIDEO"]):
        ContentBlock.objects.create(
            node=node,
            block_type=block_type,
            position=position,
            data={"html": block_type.lower()},
        )
    return node


@pytest.mark.django_db
def test_payload_without_enrollment_omits_learner_state_and_interactive_blocks(lesson):
    request = RequestFactory().get("/")

    payload = _build_player_node_payload(request, lesson, None)

    assert payload["id"] == lesson.id
    assert payload["activityType"] == "video"
    assert payload["properties"]["video_url"] == "https://www.youtube.com/watch?v=abc123"
    assert "solution_code" not in payload["properties"]
    assert set(payload["properties"]) <= {"lesson_type", "duration", "video_url"}
    assert payload["activityProgress"] is None
    assert payload["scheduledSession"] is None
    assert [block["type"] for block in payload["blocks"]] == ["RICHTEXT", "VIDEO"]
    assert payload["supplements"] == payload["blocks"]
    assert payload["completionPolicy"]["kind"] == "active_time_percentage"


@pytest.mark.django_db
def test_payload_with_enrollment_keeps_progress_and_every_block(lesson):
    enrollment = EnrollmentFactory(program=lesson.program)
    request = RequestFactory().get("/")

    payload = _build_player_node_payload(request, lesson, enrollment)

    assert payload["activityProgress"]["activityType"] == "video"
    assert payload["activityProgress"]["isCompleted"] is False
    assert [block["type"] for block in payload["blocks"]] == [
        "RICHTEXT",
        "QUIZ",
        "ASSIGNMENT",
        "VIDEO",
    ]


SESSION_NODE_KEYS = [
    "activityProgress",
    "activityType",
    "blocks",
    "completionPolicy",
    "contentHtml",
    "description",
    "id",
    "primaryActivity",
    "properties",
    "scheduledSession",
    "supplements",
    "title",
    "type",
]
SHARED_INERTIA_KEYS = ["auth", "csrfToken", "errors", "flash", "platform"]
SESSION_VIEW_KEYS = [
    "activeView",
    "courseCompleteUrl",
    "curriculum",
    "discussions",
    "enrollment",
    "instructor",
    "isCompleted",
    "isLocked",
    "lockReason",
    "lockReasonText",
    "nextNode",
    "node",
    "notes",
    "prevNode",
    "program",
    "progress",
    "status",
    "unlocksAt",
]


@pytest.mark.django_db
def test_enrolled_session_viewer_props_are_unchanged(client, lesson):
    enrollment = EnrollmentFactory(program=lesson.program)
    client.force_login(enrollment.user)

    response = client.get(
        reverse(
            "progression:student.session",
            kwargs={"pk": enrollment.id, "node_id": lesson.id},
        ),
        HTTP_X_INERTIA="true",
    )

    assert response.status_code == 200
    props = response.json()["props"]
    assert sorted(props["node"]) == SESSION_NODE_KEYS
    assert sorted(props) == sorted([*SESSION_VIEW_KEYS, *SHARED_INERTIA_KEYS])
    assert props["node"]["properties"]["video_url"] == (
        "https://www.youtube.com/watch?v=abc123"
    )
    assert [block["type"] for block in props["node"]["blocks"]] == [
        "RICHTEXT",
        "QUIZ",
        "ASSIGNMENT",
        "VIDEO",
    ]
