"""Tests for certificate eligibility queue and manual release workflow."""

from uuid import uuid4
from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.assessments.models import AssessmentResult
from apps.blueprints.models import AcademicBlueprint
from apps.certifications.models import (
    Certificate,
    CertificateEligibility,
    CertificateTemplate,
)
from apps.certifications.services import CertificationEngine, CertificateEligibilityService
from apps.certifications.signals import on_enrollment_completed
from apps.core.models import Program, User
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment


def _create_blueprint(certificate_enabled: bool = True, pass_mark: int = 50):
    return AcademicBlueprint.objects.create(
        name=f"Blueprint {uuid4().hex[:8]}",
        hierarchy_structure=["Section", "Lesson"],
        grading_logic={
            "type": "weighted",
            "components": [{"key": "overall", "label": "Overall", "weight": 1.0}],
            "pass_mark": pass_mark,
        },
        certificate_enabled=certificate_enabled,
    )


def _create_program(blueprint):
    return Program.objects.create(
        name=f"Program {uuid4().hex[:6]}",
        code=f"PRG-{uuid4().hex[:10].upper()}",
        level="beginner",
        blueprint=blueprint,
    )


def _create_enrollment_with_result(
    *, certificate_enabled: bool = True, total: float = 75.0, pass_mark: int = 50
):
    blueprint = _create_blueprint(
        certificate_enabled=certificate_enabled,
        pass_mark=pass_mark,
    )
    program = _create_program(blueprint)
    user = User.objects.create(
        email=f"learner-{uuid4().hex[:8]}@example.com",
        username=f"learner_{uuid4().hex[:10]}",
        first_name="Learner",
        last_name="One",
    )
    enrollment = Enrollment.objects.create(
        user=user,
        program=program,
        status="completed",
        completed_at=timezone.now(),
    )

    root_node = CurriculumNode.objects.create(
        program=program,
        node_type="Section",
        title="Root Section",
        position=0,
        is_published=True,
    )

    AssessmentResult.objects.create(
        enrollment=enrollment,
        node=root_node,
        result_data={
            "components": {"overall": total},
            "total": total,
            "status": "Pass" if total >= pass_mark else "Fail",
        },
    )

    return enrollment


def _create_competency_enrollment_with_result(*, certificate_enabled: bool = True):
    blueprint = AcademicBlueprint.objects.create(
        name=f"Competency Blueprint {uuid4().hex[:8]}",
        hierarchy_structure=["Section", "Lesson"],
        grading_logic={
            "type": "competency",
            "levels": ["Not Yet Competent", "Competent"],
            "pass_threshold": "Competent",
        },
        certificate_enabled=certificate_enabled,
    )
    program = _create_program(blueprint)
    user = User.objects.create(
        email=f"competency-{uuid4().hex[:8]}@example.com",
        username=f"competency_{uuid4().hex[:10]}",
        first_name="Competency",
        last_name="Learner",
    )
    enrollment = Enrollment.objects.create(
        user=user,
        program=program,
        status="completed",
        completed_at=timezone.now(),
    )

    root_node = CurriculumNode.objects.create(
        program=program,
        node_type="Section",
        title="Root Section",
        position=0,
        is_published=True,
    )

    AssessmentResult.objects.create(
        enrollment=enrollment,
        node=root_node,
        result_data={
            "components": {"Skill 1": "Competent", "Skill 2": "Competent"},
            "total": None,
            "status": "Competent",
        },
    )

    return enrollment


@pytest.mark.django_db
def test_program_completion_creates_pending_eligibility_when_requirements_met():
    enrollment = _create_enrollment_with_result(
        certificate_enabled=True,
        total=82.0,
    )

    engine = CertificationEngine()
    with patch(
        "apps.progression.services.ProgressionEngine.calculate_progress",
        return_value=100.0,
    ):
        record = engine.on_program_completed(enrollment)

    assert isinstance(record, CertificateEligibility)
    assert record.status == "pending"
    assert Certificate.objects.filter(enrollment=enrollment).exists() is False


@pytest.mark.django_db
def test_program_completion_marks_ineligible_when_grade_fails():
    enrollment = _create_enrollment_with_result(
        certificate_enabled=True,
        total=30.0,
        pass_mark=50,
    )

    engine = CertificationEngine()
    with patch(
        "apps.progression.services.ProgressionEngine.calculate_progress",
        return_value=100.0,
    ):
        record = engine.on_program_completed(enrollment)

    assert isinstance(record, CertificateEligibility)
    assert record.status == "ineligible"
    assert record.eligibility_snapshot.get("gradePassed") is False


@pytest.mark.django_db
def test_program_completion_marks_ineligible_when_certificate_disabled():
    enrollment = _create_enrollment_with_result(
        certificate_enabled=False,
        total=90.0,
    )

    engine = CertificationEngine()
    with patch(
        "apps.progression.services.ProgressionEngine.calculate_progress",
        return_value=100.0,
    ):
        record = engine.on_program_completed(enrollment)

    assert isinstance(record, CertificateEligibility)
    assert record.status == "ineligible"
    assert record.eligibility_snapshot.get("certificateEnabled") is False


@pytest.mark.django_db
@patch("apps.certifications.services.TemplateGenerator.generate")
def test_admin_release_creates_certificate_once(mock_generate):
    mock_generate.return_value = "certificates/test-release.pdf"

    enrollment = _create_enrollment_with_result(
        certificate_enabled=True,
        total=88.0,
    )
    CertificateTemplate.objects.create(
        name="Default Template",
        template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
        is_default=True,
    )

    eligibility_service = CertificateEligibilityService()
    with patch(
        "apps.progression.services.ProgressionEngine.calculate_progress",
        return_value=100.0,
    ):
        eligibility = eligibility_service.refresh_enrollment(enrollment)

    admin = User.objects.create(
        email=f"admin-{uuid4().hex[:8]}@example.com",
        username=f"admin_{uuid4().hex[:10]}",
        first_name="Admin",
        last_name="User",
        is_staff=True,
    )

    certificate = eligibility_service.release(eligibility, approved_by=admin)
    eligibility.refresh_from_db()

    assert certificate is not None
    assert eligibility.status == "released"
    assert eligibility.certificate_id == certificate.id
    assert Certificate.objects.filter(enrollment=enrollment).count() == 1

    with pytest.raises(ValueError):
        eligibility_service.release(eligibility, approved_by=admin)


@pytest.mark.django_db
def test_completion_signal_refreshes_queue_without_auto_issuing_certificate():
    enrollment = _create_enrollment_with_result(
        certificate_enabled=True,
        total=79.0,
    )

    with patch(
        "apps.progression.services.ProgressionEngine.calculate_progress",
        return_value=100.0,
    ):
        on_enrollment_completed(Enrollment, enrollment)

    queue = CertificateEligibility.objects.filter(enrollment=enrollment).first()
    assert queue is not None
    assert queue.status == "pending"
    assert Certificate.objects.filter(enrollment=enrollment).exists() is False


@pytest.mark.django_db
def test_competency_results_can_make_certificate_queue_eligible():
    enrollment = _create_competency_enrollment_with_result(certificate_enabled=True)

    service = CertificateEligibilityService()
    with patch(
        "apps.progression.services.ProgressionEngine.calculate_progress",
        return_value=100.0,
    ):
        eligibility = service.refresh_enrollment(enrollment)

    assert eligibility.status == "pending"
    assert eligibility.eligibility_snapshot.get("gradePassed") is True
    assert eligibility.eligibility_snapshot.get("gradeStatus") == "Competent"


@pytest.mark.django_db
def test_non_admin_release_is_rejected():
    enrollment = _create_enrollment_with_result(
        certificate_enabled=True,
        total=88.0,
    )
    CertificateTemplate.objects.create(
        name="Default Template",
        template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
        is_default=True,
    )

    service = CertificateEligibilityService()
    with patch(
        "apps.progression.services.ProgressionEngine.calculate_progress",
        return_value=100.0,
    ):
        eligibility = service.refresh_enrollment(enrollment)

    instructor = User.objects.create(
        email=f"instructor-{uuid4().hex[:8]}@example.com",
        username=f"instructor_{uuid4().hex[:10]}",
        first_name="Instructor",
        last_name="User",
        is_staff=False,
    )

    with pytest.raises(ValueError, match="Only admins can release certificates"):
        service.release(eligibility, approved_by=instructor)
