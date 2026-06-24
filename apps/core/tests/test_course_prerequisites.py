import json

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.assessments.models import AssessmentResult
from apps.core.services.course_prerequisites import CoursePrerequisiteService
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment
from apps.progression.tests.factories import ProgramFactory


pytestmark = pytest.mark.django_db


def _make_prerequisite_chain(required_percent=75, advanced_price=0):
    beginner = ProgramFactory(
        name="Beginner AI",
        code="BEGINNER-AI",
        is_published=True,
    )
    advanced = ProgramFactory(
        name="Advanced AI",
        code="ADVANCED-AI",
        is_published=True,
        custom_pricing={"price": advanced_price, "currency": "KES"},
        prerequisite_passing_percent=required_percent,
    )
    advanced.prerequisite_programs.add(beginner)
    return beginner, advanced


def _publish_course_score(enrollment, score):
    root = CurriculumNode.objects.create(
        program=enrollment.program,
        title=f"{enrollment.program.name} grade",
        node_type="Unit",
        position=0,
        is_published=True,
    )
    return AssessmentResult.objects.create(
        enrollment=enrollment,
        node=root,
        result_data={
            "total": score,
            "status": "Pass" if score >= 50 else "Fail",
            "components": {},
        },
        is_published=True,
        published_at=timezone.now(),
    )


def test_prerequisite_service_requires_completed_course_and_published_score():
    student = UserFactory()
    beginner, advanced = _make_prerequisite_chain(required_percent=75)
    enrollment = Enrollment.objects.create(
        user=student,
        program=beginner,
        status="completed",
        completed_at=timezone.now(),
    )
    _publish_course_score(enrollment, 74)

    evaluation = CoursePrerequisiteService.evaluate(student, advanced)

    assert evaluation.required is True
    assert evaluation.eligible is False
    assert evaluation.requirements[0].reason == "score_too_low"
    assert "75%" in evaluation.blocking_message

    AssessmentResult.objects.filter(enrollment=enrollment).delete()
    _publish_course_score(enrollment, 80)

    evaluation = CoursePrerequisiteService.evaluate(student, advanced)

    assert evaluation.eligible is True
    assert evaluation.requirements[0].score == 80


def test_public_course_detail_locks_cta_when_prerequisites_are_unmet(client):
    student = UserFactory()
    _, advanced = _make_prerequisite_chain(required_percent=75)
    client.force_login(student)

    response = client.get(
        reverse("core:program_detail", kwargs={"slug": advanced.slug}),
        HTTP_X_INERTIA="true",
    )

    assert response.status_code == 200
    props = response.json()["props"]
    assert props["ctaState"] == "prerequisites_required"
    assert props["prerequisiteStatus"]["eligible"] is False
    assert props["prerequisiteStatus"]["requirements"][0]["reason"] == "not_enrolled"


def test_self_enrollment_blocks_until_prerequisites_are_met(client):
    student = UserFactory()
    _, advanced = _make_prerequisite_chain(required_percent=75)
    client.force_login(student)

    response = client.post(reverse("progression:enroll_request", kwargs={"pk": advanced.id}))

    assert response.status_code == 302
    assert response["Location"] == reverse(
        "core:program_detail",
        kwargs={"slug": advanced.slug},
    )
    assert not Enrollment.objects.filter(user=student, program=advanced).exists()


def test_paid_cart_blocks_program_when_prerequisites_are_unmet(client):
    student = UserFactory()
    _, advanced = _make_prerequisite_chain(required_percent=75, advanced_price=1200)
    client.force_login(student)

    response = client.post(
        reverse("commerce:cart_add_item"),
        data=json.dumps({"programId": advanced.id}),
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["error"] == "prerequisites_required"
