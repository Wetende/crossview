from pathlib import Path

import pytest
from django.test import override_settings

from apps.blueprints.models import AcademicBlueprint
from apps.certifications.assignments import (
    resolve_certificate_template,
    set_category_assignment,
    set_course_assignment,
    set_default_assignment,
)
from apps.certifications.models import Certificate, CertificateTemplate
from apps.certifications.services import CertificationEngine
from apps.core.models import Program, User
from apps.core.views import serialize_program_data
from apps.progression.models import Enrollment


pytestmark = pytest.mark.django_db


@pytest.fixture
def staff_user():
    return User.objects.create_user(
        username="certificate-lifecycle-admin",
        email="certificate-lifecycle-admin@example.com",
        password="test-password",
        is_staff=True,
    )


@pytest.fixture
def learner():
    return User.objects.create_user(
        username="certificate-learner",
        email="certificate-learner@example.com",
        password="test-password",
        first_name="Alex",
        last_name="Morgan",
    )


@pytest.fixture
def blueprint():
    return AcademicBlueprint.objects.create(
        name="Certificate-enabled blueprint",
        hierarchy_structure=["Module", "Lesson"],
        grading_logic={"type": "weighted", "components": []},
        certificate_enabled=True,
    )


@pytest.fixture
def program(blueprint):
    return Program.objects.create(
        blueprint=blueprint,
        name="Professional Practice",
        code="CERT-LIFECYCLE",
        category="Business",
    )


def published_version(name):
    return CertificateTemplate.objects.get(
        name=name,
        is_starter=True,
    ).current_version


def test_assignment_precedence_is_course_then_category_then_default(
    staff_user,
    program,
):
    default = published_version("Classic Formal")
    category = published_version("Elegant Teal")
    course = published_version("Modern Blue")

    set_default_assignment(version=default, user=staff_user)
    assert resolve_certificate_template(program).version == default
    assert resolve_certificate_template(program).source == "default"

    set_category_assignment(
        category=program.category,
        version=category,
        user=staff_user,
    )
    assert resolve_certificate_template(program).version == category
    assert resolve_certificate_template(program).source == "category"

    set_course_assignment(
        program=program,
        version=course,
        issue_enabled=True,
        user=staff_user,
    )
    assert resolve_certificate_template(program).version == course
    assert resolve_certificate_template(program).source == "course"


def test_course_builder_exposes_the_effective_inherited_template(
    staff_user,
    program,
):
    category = published_version("Elegant Teal")
    course = published_version("Modern Blue")
    set_category_assignment(
        category=program.category,
        version=category,
        user=staff_user,
    )
    set_course_assignment(
        program=program,
        version=course,
        issue_enabled=True,
        user=staff_user,
    )

    certificate_data = serialize_program_data(program)["program"][
        "courseCertificate"
    ]

    assert certificate_data["templateVersionId"] == course.id
    assert certificate_data["templateName"] == "Modern Blue"
    assert certificate_data["source"] == "course"
    assert certificate_data["inheritedTemplateVersionId"] == category.id
    assert certificate_data["inheritedTemplateName"] == "Elegant Teal"
    assert certificate_data["inheritedSource"] == "category"


def test_course_can_disable_inherited_certificate(staff_user, program):
    set_default_assignment(
        version=published_version("Classic Formal"),
        user=staff_user,
    )
    set_course_assignment(
        program=program,
        version=None,
        issue_enabled=False,
        user=staff_user,
    )

    resolved = resolve_certificate_template(program)

    assert resolved.enabled is False
    assert resolved.version is None
    assert resolved.source == "course-disabled"


def test_issued_pdf_uses_published_version_and_keeps_layout_snapshot(
    tmp_path,
    staff_user,
    learner,
    program,
):
    version = published_version("Geometric Navy")
    set_default_assignment(version=version, user=staff_user)
    enrollment = Enrollment.objects.create(
        user=learner,
        program=program,
        status="completed",
    )

    with override_settings(MEDIA_ROOT=tmp_path, SITE_URL="https://lms.example"):
        certificate = CertificationEngine().generate_certificate(enrollment)

    assert certificate.template_version == version
    assert certificate.layout_snapshot == version.layout
    assert certificate.metadata["assignmentSource"] == "default"
    pdf = tmp_path / certificate.pdf_path
    assert pdf.is_file()
    assert pdf.read_bytes().startswith(b"%PDF")
    assert pdf.stat().st_size > 5_000

    version.layout = {
        **version.layout,
        "background": {"color": "#000000", "image": None},
    }
    version.save(update_fields=["layout", "updated_at"])
    certificate.refresh_from_db()
    assert certificate.layout_snapshot["background"]["color"] != "#000000"


def test_signed_download_is_restricted_to_certificate_owner(
    tmp_path,
    client,
    learner,
    program,
):
    enrollment = Enrollment.objects.create(user=learner, program=program)
    template = CertificateTemplate.objects.get(
        name="Classic Formal",
        is_starter=True,
    )
    pdf_path = Path("certificates") / "LMS-2026-ABC123.pdf"
    (tmp_path / pdf_path).parent.mkdir(parents=True)
    (tmp_path / pdf_path).write_bytes(b"%PDF-1.7 test")
    certificate = Certificate.objects.create(
        enrollment=enrollment,
        template=template,
        template_version=template.current_version,
        serial_number="LMS-2026-ABC123",
        student_name="Alex Morgan",
        program_title=program.name,
        completion_date="2026-07-30",
        issue_date="2026-07-30",
        pdf_path=str(pdf_path),
        layout_snapshot=template.current_version.layout,
    )

    client.force_login(learner)
    with override_settings(MEDIA_ROOT=tmp_path):
        response = client.get(certificate.get_signed_download_url(), secure=True)
    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"

    stranger = User.objects.create_user(
        username="certificate-stranger",
        email="certificate-stranger@example.com",
        password="test-password",
    )
    client.force_login(stranger)
    with override_settings(MEDIA_ROOT=tmp_path):
        response = client.get(certificate.get_signed_download_url(), secure=True)
    assert response.status_code == 404
