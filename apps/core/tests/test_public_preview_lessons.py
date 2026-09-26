"""Visitors can open free preview lessons without exposing enrolled-only content."""

import json
from datetime import timedelta
from types import SimpleNamespace

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone

from apps.content.models import ContentBlock
from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment

SENTINEL = "ENROLLED-ONLY-SENTINEL-7f3a"
PREVIEW_TEXT_PROPERTY_KEYS = {"lesson_type", "duration", "content", "content_html"}


def _node(program, title, *, parent=None, position=0, is_published=True, **kwargs):
    return CurriculumNode.objects.create(
        program=program,
        parent=parent,
        title=title,
        node_type=kwargs.pop("node_type", "Lesson" if parent else "Module"),
        position=position,
        is_published=is_published,
        **kwargs,
    )


def _flagged(program, title, lesson_type, *, parent, position, **extra):
    properties = {"is_preview": True, **extra}
    if lesson_type:
        properties["lesson_type"] = lesson_type
    return _node(
        program, title, parent=parent, position=position, properties=properties
    )


def _preview_url(program, node_or_id):
    node_id = getattr(node_or_id, "id", node_or_id)
    return reverse(
        "core:program_preview_lesson",
        kwargs={"slug": program.slug, "node_id": node_id},
    )


def _inertia_get(client, url):
    return client.get(url, HTTP_X_INERTIA="true")


def _find(nodes, node_id):
    for item in nodes:
        if item["id"] == node_id:
            return item
        found = _find(item.get("children") or [], node_id)
        if found:
            return found
    return None


@pytest.fixture
def course(db):
    program = Program.objects.create(
        name="Preview Course",
        code="PREVIEW-101",
        is_published=True,
    )
    basics = _node(program, "Getting started", position=0)
    welcome = _flagged(
        program,
        "Welcome",
        "text",
        parent=basics,
        position=0,
        content="<p>Welcome to the course</p>",
        duration="10m",
        answer_key=SENTINEL,
        internal_notes=SENTINEL,
    )
    ContentBlock.objects.create(
        node=welcome,
        block_type="RICHTEXT",
        position=0,
        data={"html": "<p>Public supplement</p>"},
    )
    ContentBlock.objects.create(
        node=welcome,
        block_type="QUIZ",
        position=1,
        data={"questions": [{"text": SENTINEL, "answer_data": SENTINEL}]},
    )
    locked = _node(
        program,
        "Deep dive",
        parent=basics,
        position=1,
        description=SENTINEL,
        properties={
            "lesson_type": "video",
            "video_url": f"https://example.test/{SENTINEL}.mp4",
            "content": f"<p>{SENTINEL}</p>",
        },
    )
    ContentBlock.objects.create(
        node=locked,
        block_type="RICHTEXT",
        position=0,
        data={"html": SENTINEL},
    )
    tour = _flagged(
        program,
        "Course tour",
        "video",
        parent=basics,
        position=2,
        video_url="https://www.youtube.com/watch?v=preview123",
    )
    checks = _node(program, "Checks", position=1)
    quiz = _flagged(
        program, "Knowledge check", "quiz", parent=checks, position=0,
        questions=[{"text": SENTINEL}],
    )
    code_lab = _flagged(
        program, "Code lab", "code", parent=checks, position=1, starter_code=SENTINEL
    )
    live = _flagged(program, "Live kickoff", "live_meeting", parent=checks, position=2)
    assignment = _flagged(program, "Assignment", "assignment", parent=checks, position=3)
    practicum = _flagged(program, "Practicum", "practicum", parent=checks, position=4)
    peer_review = _flagged(program, "Peer review", "peer_review", parent=checks, position=5)
    google_meet = _flagged(program, "Meet", "google_meet", parent=checks, position=6)
    legacy_code = _flagged(program, "Legacy lab", None, parent=checks, position=7)
    ContentBlock.objects.create(
        node=legacy_code,
        block_type="CODE",
        position=0,
        data={"starter_code": SENTINEL},
    )
    draft_lesson = _node(
        program,
        "Draft preview",
        parent=checks,
        position=8,
        is_published=False,
        properties={"lesson_type": "text", "is_preview": True, "content": SENTINEL},
    )
    hidden_section = _node(program, "Hidden section", position=2, is_published=False)
    hidden_lesson = _flagged(
        program, "Hidden lesson", "text", parent=hidden_section, position=0,
        content=SENTINEL,
    )
    return SimpleNamespace(
        program=program,
        basics=basics,
        welcome=welcome,
        locked=locked,
        tour=tour,
        checks=checks,
        quiz=quiz,
        code_lab=code_lab,
        live=live,
        assignment=assignment,
        practicum=practicum,
        peer_review=peer_review,
        google_meet=google_meet,
        legacy_code=legacy_code,
        draft_lesson=draft_lesson,
        hidden_section=hidden_section,
        hidden_lesson=hidden_lesson,
    )


def _grow_curriculum(program, *, sections=4, lessons=6):
    """Add sections full of locked and preview lessons to a course."""
    for section_index in range(sections):
        section = _node(program, f"Bulk section {section_index}", position=10 + section_index)
        for lesson_index in range(lessons):
            if lesson_index % 3 == 0:
                _flagged(
                    program,
                    f"Bulk preview {section_index}.{lesson_index}",
                    "text",
                    parent=section,
                    position=lesson_index,
                    content="<p>Free</p>",
                )
            else:
                _node(
                    program,
                    f"Bulk lesson {section_index}.{lesson_index}",
                    parent=section,
                    position=lesson_index,
                    properties={"lesson_type": "video"},
                )


def _warm_caches(client, url):
    # Platform settings are cached per process after the first reads.
    for _ in range(2):
        _inertia_get(client, url)


def _count_queries(client, url):
    with CaptureQueriesContext(connection) as queries:
        response = _inertia_get(client, url)
    return response, len(queries.captured_queries)


@pytest.mark.django_db
class TestPublicPreviewLesson:
    def test_anonymous_visitor_opens_a_published_preview_lesson(self, client, course):
        response = _inertia_get(client, _preview_url(course.program, course.welcome))

        assert response.status_code == 200
        payload = response.json()
        assert payload["component"] == "Student/CoursePlayer"
        props = payload["props"]
        assert props["activeView"] == "preview"
        assert props["enrollment"] is None
        assert props["instructor"] is None
        assert props["discussions"] == []
        assert props["notes"] == []
        assert props["isCompleted"] is False
        assert props["program"]["name"] == "Preview Course"

        node = props["node"]
        assert node["id"] == course.welcome.id
        assert node["title"] == "Welcome"
        assert node["activityType"] == "text"
        assert node["properties"]["content"] == "<p>Welcome to the course</p>"
        assert set(node["properties"]) <= PREVIEW_TEXT_PROPERTY_KEYS
        assert node["primaryActivity"]["properties"] == node["properties"]
        assert node["activityProgress"] is None
        assert node["scheduledSession"] is None
        # Interactive supplements need an enrollment, so they never reach visitors.
        assert [block["type"] for block in node["blocks"]] == ["RICHTEXT"]
        assert [block["type"] for block in node["supplements"]] == ["RICHTEXT"]

        program_url = f"/programs/{course.program.slug}/"
        assert props["preview"]["programUrl"] == program_url
        assert props["preview"]["enrollCta"]["href"] == program_url

    def test_enroll_cta_uses_the_program_page_enrollment_decision(
        self, client, course
    ):
        detail = _inertia_get(
            client,
            reverse("core:program_detail", kwargs={"slug": course.program.slug}),
        ).json()["props"]
        cta = _inertia_get(
            client, _preview_url(course.program, course.welcome)
        ).json()["props"]["preview"]["enrollCta"]

        assert cta["enrollmentMode"] == detail["enrollmentMode"]
        assert cta["ctaState"] == detail["ctaState"]
        assert cta["priceDisplay"] == detail["program"]["priceDisplay"]

    def test_signed_in_visitor_without_enrollment_sees_the_preview(self, client, course):
        client.force_login(UserFactory())

        response = _inertia_get(client, _preview_url(course.program, course.welcome))

        assert response.status_code == 200
        assert response.json()["props"]["activeView"] == "preview"

    def test_curriculum_locks_every_non_preview_node(self, client, course):
        props = _inertia_get(
            client, _preview_url(course.program, course.welcome)
        ).json()["props"]
        curriculum = props["curriculum"]

        for locked_node in (
            course.basics,
            course.locked,
            course.checks,
            course.quiz,
            course.code_lab,
            course.live,
            course.assignment,
            course.practicum,
            course.peer_review,
            course.google_meet,
            course.legacy_code,
        ):
            item = _find(curriculum, locked_node.id)
            assert item is not None, locked_node.title
            assert item["isLocked"] is True, locked_node.title
            assert item["lockReason"] == "enrollment_required"
            assert item["lockReasonText"] == "Enroll to unlock"
            assert item["url"] is None

        for preview_node in (course.welcome, course.tour):
            item = _find(curriculum, preview_node.id)
            assert item["isLocked"] is False
            assert item["isPreview"] is True
            assert item["lockReason"] is None
            assert item["url"] == _preview_url(course.program, preview_node)

        # Unpublished nodes and nodes under unpublished sections are not listed.
        assert _find(curriculum, course.draft_lesson.id) is None
        assert _find(curriculum, course.hidden_section.id) is None
        assert _find(curriculum, course.hidden_lesson.id) is None

    def test_curriculum_rows_carry_no_lesson_properties(self, client, course):
        props = _inertia_get(
            client, _preview_url(course.program, course.welcome)
        ).json()["props"]

        locked_row = _find(props["curriculum"], course.locked.id)
        assert "properties" not in locked_row
        assert locked_row["activityType"] == "video"

    def test_previous_and_next_only_link_preview_lessons(self, client, course):
        first = _inertia_get(
            client, _preview_url(course.program, course.welcome)
        ).json()["props"]
        assert first["prevNode"] is None
        assert first["nextNode"] == {
            "id": course.tour.id,
            "title": "Course tour",
            "url": _preview_url(course.program, course.tour),
        }

        last = _inertia_get(
            client, _preview_url(course.program, course.tour)
        ).json()["props"]
        assert last["prevNode"]["id"] == course.welcome.id
        assert last["nextNode"] is None

    def test_props_never_contain_enrolled_only_content(self, client, course):
        response = _inertia_get(client, _preview_url(course.program, course.welcome))

        assert response.status_code == 200
        # Covers the non-preview lessons, the excluded QUIZ block on the preview
        # lesson, and its answer_key / non-allowlisted properties.
        assert SENTINEL not in json.dumps(response.json()["props"])

    @pytest.mark.parametrize(
        "node_name",
        [
            "locked",
            "draft_lesson",
            "hidden_lesson",
            "basics",
            "quiz",
            "code_lab",
            "live",
            "assignment",
            "practicum",
            "peer_review",
            "google_meet",
            "legacy_code",
        ],
    )
    def test_nodes_that_are_not_public_previews_return_404(
        self, client, course, node_name
    ):
        node = getattr(course, node_name)
        if node_name == "basics":
            node.properties = {"is_preview": True}
            node.save()
            assert node.is_preview is True

        response = _inertia_get(client, _preview_url(course.program, node))

        assert response.status_code == 404

    def test_unknown_node_id_returns_404(self, client, course):
        response = _inertia_get(client, _preview_url(course.program, 999_999))

        assert response.status_code == 404

    def test_draft_program_returns_404(self, client, course):
        course.program.is_published = False
        course.program.save(update_fields=["is_published"])

        response = _inertia_get(client, _preview_url(course.program, course.welcome))

        assert response.status_code == 404

    def test_node_from_another_program_returns_404(self, client, course):
        other = Program.objects.create(
            name="Other Course", code="OTHER-101", is_published=True
        )

        response = _inertia_get(
            client,
            reverse(
                "core:program_preview_lesson",
                kwargs={"slug": other.slug, "node_id": course.welcome.id},
            ),
        )

        assert response.status_code == 404

    def test_only_safe_methods_are_allowed(self, client, course):
        response = client.post(_preview_url(course.program, course.welcome))

        assert response.status_code == 405

    @pytest.mark.parametrize("status", ["active", "completed"])
    def test_enrolled_learner_is_redirected_to_the_real_session(
        self, client, course, status
    ):
        learner = UserFactory()
        enrollment = Enrollment.objects.create(
            user=learner, program=course.program, status="active"
        )
        # Set the status directly so completion side effects do not run.
        Enrollment.objects.filter(pk=enrollment.pk).update(status=status)
        client.force_login(learner)

        response = client.get(_preview_url(course.program, course.welcome))

        assert response.status_code == 302
        assert response["Location"] == reverse(
            "progression:student.session",
            kwargs={"pk": enrollment.id, "node_id": course.welcome.id},
        )

    def test_enrolled_learner_with_a_locked_lesson_keeps_the_preview(
        self, client, course
    ):
        learner = UserFactory()
        Enrollment.objects.create(
            user=learner,
            program=course.program,
            status="active",
            expires_at=timezone.now() - timedelta(days=1),
        )
        client.force_login(learner)

        response = _inertia_get(client, _preview_url(course.program, course.welcome))

        assert response.status_code == 200
        assert response.json()["props"]["activeView"] == "preview"

    def test_withdrawn_learner_still_sees_the_preview(self, client, course):
        learner = UserFactory()
        Enrollment.objects.create(
            user=learner, program=course.program, status="withdrawn"
        )
        client.force_login(learner)

        response = _inertia_get(client, _preview_url(course.program, course.welcome))

        assert response.status_code == 200
        assert response.json()["props"]["activeView"] == "preview"


@pytest.mark.django_db
class TestPublicPreviewQueryCounts:
    """Neither path may issue per-node queries."""

    def test_404_is_decided_with_a_few_queries(self, client, course):
        url = _preview_url(course.program, course.locked)
        _warm_caches(client, url)

        response, small = _count_queries(client, url)
        _grow_curriculum(course.program)
        grown_response, grown = _count_queries(client, url)

        assert response.status_code == grown_response.status_code == 404
        assert grown == small
        assert small <= 4

    def test_preview_page_query_count_does_not_grow_with_the_curriculum(
        self, client, course
    ):
        url = _preview_url(course.program, course.welcome)
        _warm_caches(client, url)

        response, small = _count_queries(client, url)
        _grow_curriculum(course.program)
        grown_response, grown = _count_queries(client, url)

        assert response.status_code == grown_response.status_code == 200
        assert len(grown_response.json()["props"]["curriculum"]) > len(
            response.json()["props"]["curriculum"]
        )
        assert grown == small


@pytest.mark.django_db
class TestPublicProgramPreviewLinks:
    def test_curriculum_reads_the_column_and_links_preview_lessons(self, client, course):
        # properties alone no longer make a lesson public
        CurriculumNode.objects.filter(pk=course.tour.pk).update(is_preview=False)

        props = _inertia_get(
            client,
            reverse("core:program_detail", kwargs={"slug": course.program.slug}),
        ).json()["props"]
        curriculum = props["curriculum"]

        welcome = _find(curriculum, course.welcome.id)
        assert welcome["isPreview"] is True
        assert welcome["previewUrl"] == _preview_url(course.program, course.welcome)

        tour = _find(curriculum, course.tour.id)
        assert tour["isPreview"] is False
        assert tour["previewUrl"] is None

        for flagged_but_blocked in (
            course.quiz,
            course.code_lab,
            course.live,
            course.assignment,
            course.google_meet,
            course.legacy_code,
        ):
            item = _find(curriculum, flagged_but_blocked.id)
            assert item["isPreview"] is False
            assert item["previewUrl"] is None

        assert _find(curriculum, course.basics.id)["previewUrl"] is None

    def test_instructor_draft_preview_does_not_link_preview_lessons(
        self, client, course
    ):
        course.program.is_published = False
        course.program.save(update_fields=["is_published"])
        client.force_login(UserFactory(is_staff=True))

        props = _inertia_get(
            client,
            reverse("core:instructor.program_preview", kwargs={"pk": course.program.id}),
        ).json()["props"]

        welcome = _find(props["curriculum"], course.welcome.id)
        assert welcome["isPreview"] is True
        assert welcome["previewUrl"] is None
