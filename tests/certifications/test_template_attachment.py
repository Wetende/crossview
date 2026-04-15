"""Tests for certificate template selection with manual queue release."""

from uuid import uuid4
from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.assessments.models import AssessmentResult
from apps.blueprints.models import AcademicBlueprint
from apps.certifications.models import CertificateTemplate
from apps.certifications.services import CertificateEligibilityService, TemplateGenerator
from apps.core.models import Program, User
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment


def _build_program(*, certificate_enabled: bool = True):
    blueprint = AcademicBlueprint.objects.create(
        name=f"Template Blueprint {uuid4().hex[:8]}",
        hierarchy_structure=["Section", "Lesson"],
        grading_logic={
            "type": "weighted",
            "components": [{"key": "overall", "label": "Overall", "weight": 1.0}],
            "pass_mark": 50,
        },
        certificate_enabled=certificate_enabled,
    )
    return Program.objects.create(
        name=f"Template Program {uuid4().hex[:6]}",
        code=f"TMP-{uuid4().hex[:10].upper()}",
        level="beginner",
        blueprint=blueprint,
    )


def _build_enrollment_with_result(program, total: float = 85.0):
    user = User.objects.create(
        email=f"template-student-{uuid4().hex[:8]}@example.com",
        username=f"template_student_{uuid4().hex[:10]}",
        first_name="Template",
        last_name="Student",
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
        title="Root",
        position=0,
        is_published=True,
    )
    AssessmentResult.objects.create(
        enrollment=enrollment,
        node=root_node,
        result_data={
            "components": {"overall": total},
            "total": total,
            "status": "Pass",
        },
    )
    return enrollment


@pytest.mark.django_db
def test_template_generator_prefers_blueprint_template_when_available():
    program = _build_program(certificate_enabled=True)
    enrollment = _build_enrollment_with_result(program)

    default_template = CertificateTemplate.objects.create(
        name="Default Template",
        template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
        is_default=True,
    )
    blueprint_template = CertificateTemplate.objects.create(
        name="Blueprint Template",
        blueprint=program.blueprint,
        template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
    )

    selected = TemplateGenerator().get_template_for_enrollment(enrollment)

    assert selected.id == blueprint_template.id
    assert selected.id != default_template.id


@pytest.mark.django_db
def test_template_generator_falls_back_to_default_template():
    program = _build_program(certificate_enabled=True)
    enrollment = _build_enrollment_with_result(program)

    default_template = CertificateTemplate.objects.create(
        name="Default Template",
        template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
        is_default=True,
    )

    selected = TemplateGenerator().get_template_for_enrollment(enrollment)

    assert selected.id == default_template.id


@pytest.mark.django_db
@patch("apps.certifications.services.TemplateGenerator.generate")
def test_release_uses_selected_template(mock_generate):
    mock_generate.return_value = "certificates/template-selected.pdf"

    program = _build_program(certificate_enabled=True)
    enrollment = _build_enrollment_with_result(program)

    CertificateTemplate.objects.create(
        name="Default Template",
        template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
        is_default=True,
    )
    blueprint_template = CertificateTemplate.objects.create(
        name="Blueprint Template",
        blueprint=program.blueprint,
        template_html="{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}",
    )

    service = CertificateEligibilityService()
    with patch(
        "apps.progression.services.ProgressionEngine.calculate_progress",
        return_value=100.0,
    ):
        eligibility = service.refresh_enrollment(enrollment)

    admin = User.objects.create(
        email=f"template-admin-{uuid4().hex[:8]}@example.com",
        username=f"template_admin_{uuid4().hex[:10]}",
        first_name="Template",
        last_name="Admin",
        is_staff=True,
    )

    certificate = service.release(eligibility, approved_by=admin)

    assert certificate.template_id == blueprint_template.id
    assert mock_generate.called


@pytest.mark.django_db
def test_certificate_disabled_program_stays_ineligible():
    program = _build_program(certificate_enabled=False)
    enrollment = _build_enrollment_with_result(program)

    service = CertificateEligibilityService()
    with patch(
        "apps.progression.services.ProgressionEngine.calculate_progress",
        return_value=100.0,
    ):
        eligibility = service.refresh_enrollment(enrollment)

    assert eligibility.status == "ineligible"
    assert eligibility.eligibility_snapshot.get("certificateEnabled") is False
