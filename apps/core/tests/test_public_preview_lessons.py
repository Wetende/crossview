"""Visitors can open free preview lessons without exposing enrolled-only content."""

import json
from types import SimpleNamespace

import pytest
from django.urls import reverse

from apps.content.models import ContentBlock
from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment

SENTINEL = "ENROLLED-ONLY-SENTINEL-7f3a"
ENROL_CTA_LABELS = {
    "free": "Enroll now",
    "approval": "Request enrollment",
    "paid": "Get course",
}


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


def _preview_url(program, node):
    return reverse(
        "core:program_preview_lesson",
        kwargs={"slug": program.slug, "node_id": node.id},
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
    welcome = _node(
        program,
        "Welcome",
        parent=basics,
        position=0,
        is_preview=True,
        properties={
            "lesson_type": "text",
            "content": "<p>Welcome to the course</p>",
            "duration": "10m",
            "is_preview": True,
        },
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
        data={"questions": [{"text": "Enrolled-only check"}]},
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
    tour = _node(
        program,
        "Course tour",
        parent=basics,
        position=2,
        is_preview=True,
        properties={
            "lesson_type": "video",
            "video_url": "https://www.youtube.com/watch?v=preview123",
            "is_preview": True,
        },
    )
    checks = _node(program, "Checks", position=1)
    quiz = _node(
        program,
        "Knowledge check",
        parent=checks,
        position=0,
        is_preview=True,
        properties={
            "lesson_type": "quiz",
            "is_preview": True,
            "questions": [{"text": SENTINEL}],
        },
    )
    code_lab = _node(
        program,
        "Code lab",
        parent=checks,
        position=1,
        is_preview=True,
        properties={
            "lesson_type": "code",
            "is_preview": True,
            "starter_code": SENTINEL,
        },
    )
    live = _node(
        program,
        "Live kickoff",
        parent=checks,
        position=2,
        is_preview=True,
        properties={"lesson_type": "live_meeting", "is_preview": True},
    )
    draft_lesson = _node(
        program,
        "Draft preview",
        parent=checks,
        position=3,
        is_published=False,
        is_preview=True,
        properties={"lesson_type": "text", "is_preview": True, "content": SENTINEL},
    )
    hidden_section = _node(program, "Hidden section", position=2, is_published=False)
    hidden_lesson = _node(
        program,
        "Hidden lesson",
        parent=hidden_section,
        position=0,
        is_preview=True,
        properties={"lesson_type": "text", "is_preview": True, "content": SENTINEL},
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
        draft_lesson=draft_lesson,
        hidden_section=hidden_section,
        hidden_lesson=hidden_lesson,
    )


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
        assert node["activityProgress"] is None
        assert node["scheduledSession"] is None
        # Interactive supplements need an enrollment, so they never reach visitors.
        assert [block["type"] for block in node["blocks"]] == ["RICHTEXT"]
        assert [block["type"] for block in node["supplements"]] == ["RICHTEXT"]

        program_url = f"/programs/{course.program.slug}/"
        assert props["preview"]["programUrl"] == program_url
        assert props["preview"]["enrolCta"]["href"] == program_url
        assert props["preview"]["enrolCta"]["label"] in ENROL_CTA_LABELS.values()

    def test_enrol_cta_follows_the_program_page_enrolment_decision(
        self, client, course
    ):
        detail = _inertia_get(
            client,
            reverse("core:program_detail", kwargs={"slug": course.program.slug}),
        ).json()["props"]
        preview = _inertia_get(
            client, _preview_url(course.program, course.welcome)
        ).json()["props"]["preview"]

        assert preview["enrolCta"]["label"] == ENROL_CTA_LABELS[detail["enrollmentMode"]]

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

        for locked_node in (course.basics, course.locked, course.checks, course.quiz, course.code_lab, course.live):
            item = _find(curriculum, locked_node.id)
            assert item is not None, locked_node.title
            assert item["isLocked"] is True, locked_node.title
            assert item["lockReason"] == "enrollment_required"
            assert item["lockReasonText"] == "Enrol to unlock"
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
        ],
    )
    def test_nodes_that_are_not_public_previews_return_404(
        self, client, course, node_name
    ):
        node = getattr(course, node_name)
        if node_name == "basics":
            node.is_preview = True
            node.properties = {"is_preview": True}
            node.save()

        response = _inertia_get(client, _preview_url(course.program, node))

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

    def test_enrolled_learner_is_redirected_to_the_real_session(self, client, course):
        learner = UserFactory()
        enrollment = Enrollment.objects.create(
            user=learner, program=course.program, status="active"
        )
        client.force_login(learner)

        response = client.get(_preview_url(course.program, course.welcome))

        assert response.status_code == 302
        assert response["Location"] == reverse(
            "progression:student.session",
            kwargs={"pk": enrollment.id, "node_id": course.welcome.id},
        )

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

        for flagged_but_blocked in (course.quiz, course.code_lab, course.live):
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
