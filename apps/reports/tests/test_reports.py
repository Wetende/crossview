import csv
from io import StringIO

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse

from apps.certifications.models import CertificateEligibility
from apps.core.tests.factories import UserFactory
from apps.progression.tests.factories import (
    CertificateFactory,
    EnrollmentFactory,
    InstructorAssignmentFactory,
    ProgramFactory,
)
from apps.reports.models import ReportExportLog


pytestmark = pytest.mark.django_db


def _as_instructor(user):
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


def test_admin_users_report_csv_filters_by_role(client):
    admin = UserFactory(admin=True)
    instructor = _as_instructor(UserFactory(username="teacher"))
    student = UserFactory(username="learner")

    client.force_login(admin)
    response = client.get(
        reverse("reports:admin.print", kwargs={"report_id": "admin.users"}),
        {"format": "csv", "role": "instructor"},
    )

    body = response.content.decode()
    assert response.status_code == 200
    assert instructor.email in body
    assert student.email not in body
    assert ReportExportLog.objects.filter(
        report_id="admin.users",
        export_format="csv",
        user=admin,
    ).exists()


def test_admin_users_report_csv_escapes_formula_cells(client):
    admin = UserFactory(admin=True)
    risky_user = UserFactory(
        username="formula-user",
        first_name="=IMPORTXML",
        last_name="Payload",
        email="formula@example.com",
    )

    client.force_login(admin)
    response = client.get(
        reverse("reports:admin.print", kwargs={"report_id": "admin.users"}),
        {"format": "csv", "search": risky_user.email},
    )

    rows = list(csv.reader(StringIO(response.content.decode())))
    data_row = next(row for row in rows if risky_user.email in row)
    assert response.status_code == 200
    assert data_row[1] == "'=IMPORTXML Payload"


def test_admin_enrollments_report_filters_completed_status(client):
    admin = UserFactory(admin=True)
    program = ProgramFactory()
    active = EnrollmentFactory(program=program, user=UserFactory(username="active"))
    completed = EnrollmentFactory(
        program=program,
        user=UserFactory(username="complete"),
        status="completed",
    )

    client.force_login(admin)
    response = client.get(
        reverse("reports:admin.print", kwargs={"report_id": "admin.enrollments"}),
        {"format": "csv", "status": "completed"},
    )

    body = response.content.decode()
    assert response.status_code == 200
    assert completed.user.email in body
    assert active.user.email not in body


def test_admin_enrollments_report_rejects_invalid_program_filter(client):
    admin = UserFactory(admin=True)

    client.force_login(admin)
    response = client.get(
        reverse("reports:admin.print", kwargs={"report_id": "admin.enrollments"}),
        {"format": "csv", "program": "not-a-number"},
    )

    assert response.status_code == 400
    assert b"Invalid program filter." in response.content


def test_admin_certificates_selected_ids_do_not_include_unselected_queue(client):
    admin = UserFactory(admin=True)
    issued_certificate = CertificateFactory()
    queued_enrollment = EnrollmentFactory(
        user=UserFactory(username="queued-student"),
        program=ProgramFactory(name="Queued Certificate Program"),
    )
    queued_record = CertificateEligibility.objects.create(
        enrollment=queued_enrollment,
        status="pending",
    )

    client.force_login(admin)
    response = client.get(
        reverse("reports:admin.print", kwargs={"report_id": "admin.certificates"}),
        {"format": "csv", "ids": str(issued_certificate.id)},
    )

    body = response.content.decode()
    assert response.status_code == 200
    assert issued_certificate.serial_number in body
    assert f"QUEUE-{queued_record.enrollment_id}" not in body
    assert queued_enrollment.user.email not in body


def test_admin_programs_report_filters_by_status_and_level(client):
    admin = UserFactory(admin=True)
    visible = ProgramFactory(
        name="Published Diploma Program",
        level="Diploma",
        is_published=True,
    )
    hidden_draft = ProgramFactory(
        name="Draft Diploma Program",
        level="Diploma",
        is_published=False,
    )
    hidden_level = ProgramFactory(
        name="Published Certificate Program",
        level="Certificate",
        is_published=True,
    )

    client.force_login(admin)
    response = client.get(
        reverse("reports:admin.print", kwargs={"report_id": "admin.programs"}),
        {"format": "csv", "status": "published", "level": "Diploma"},
    )

    body = response.content.decode()
    assert response.status_code == 200
    assert visible.name in body
    assert hidden_draft.name not in body
    assert hidden_level.name not in body


def test_instructor_roster_report_rejects_unassigned_program(client):
    instructor = _as_instructor(UserFactory(username="restricted-teacher"))
    assigned_program = ProgramFactory()
    unassigned_program = ProgramFactory()
    InstructorAssignmentFactory(instructor=instructor, program=assigned_program)

    client.force_login(instructor)
    response = client.get(
        reverse("reports:instructor.print", kwargs={"report_id": "instructor.roster"}),
        {"program": unassigned_program.id},
    )

    assert response.status_code == 403


def test_student_progress_report_never_exposes_other_student_selected_ids(client):
    owner = UserFactory(username="owner")
    other = UserFactory(username="other")
    owner_enrollment = EnrollmentFactory(user=owner, program=ProgramFactory())
    other_enrollment = EnrollmentFactory(user=other, program=ProgramFactory())

    client.force_login(owner)
    response = client.get(
        reverse("reports:student.print", kwargs={"report_id": "student.progress"}),
        {"format": "csv", "ids": str(other_enrollment.id)},
    )

    body = response.content.decode()
    assert response.status_code == 200
    assert other_enrollment.program.name not in body
    assert owner_enrollment.program.name not in body


def test_student_cannot_access_admin_report(client):
    student = UserFactory(username="no-admin")

    client.force_login(student)
    response = client.get(
        reverse("reports:admin.print", kwargs={"report_id": "admin.users"}),
    )

    assert response.status_code == 403
