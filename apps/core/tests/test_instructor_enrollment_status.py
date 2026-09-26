from unittest.mock import patch

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse

from apps.core.tests.factories import UserFactory
from apps.learning_operations.models import LearnerManagementAudit
from apps.progression.models import InstructorAssignment
from apps.progression.tests.factories import EnrollmentFactory, ProgramFactory


@pytest.fixture
def instructor(db):
    user = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


@pytest.fixture
def program(db):
    return ProgramFactory()


@pytest.fixture
def assignment(instructor, program):
    return InstructorAssignment.objects.create(instructor=instructor, program=program)


@pytest.fixture
def enrollment(program):
    return EnrollmentFactory(program=program, status="active")


def _status_url(enrollment):
    return reverse(
        "core:instructor.enrollment_status",
        kwargs={"enrollment_id": enrollment.id},
    )


def _student_url(enrollment):
    return reverse("core:instructor.student", kwargs={"pk": enrollment.user_id})


@pytest.mark.django_db
def test_student_detail_exposes_allowed_statuses(
    client, instructor, assignment, program, enrollment
):
    completed = EnrollmentFactory(
        user=enrollment.user,
        program=ProgramFactory(),
        status="completed",
    )
    InstructorAssignment.objects.create(instructor=instructor, program=completed.program)
    client.force_login(instructor)

    page = client.get(_student_url(enrollment), HTTP_X_INERTIA="true").json()

    assert page["component"] == "Instructor/Students/Detail"
    allowed = {row["id"]: row["allowedStatuses"] for row in page["props"]["enrollments"]}
    assert allowed == {
        enrollment.id: ["suspended", "withdrawn"],
        completed.id: [],
    }
    assert page["props"]["errors"] == {}


@pytest.mark.django_db
@pytest.mark.parametrize("requested_status", ["completed", "active", "bogus"])
def test_illegal_status_change_redirects_back_with_error(
    client, instructor, assignment, enrollment, requested_status
):
    client.force_login(instructor)

    with patch(
        "apps.notifications.services.NotificationService.notify_enrollment_status_changed"
    ) as notify:
        response = client.post(_status_url(enrollment), {"status": requested_status})

    assert response.status_code == 302
    assert response["Location"] == _student_url(enrollment)
    enrollment.refresh_from_db()
    assert enrollment.status == "active"
    assert not LearnerManagementAudit.objects.filter(enrollment=enrollment).exists()
    notify.assert_not_called()

    page = client.get(response["Location"], HTTP_X_INERTIA="true").json()
    error = page["props"]["errors"]["status"]
    assert error
    assert page["props"]["flash"] == [{"type": "error", "message": error}]


@pytest.mark.django_db
def test_legal_status_change_updates_audits_and_returns_to_student(
    client, instructor, assignment, enrollment, django_capture_on_commit_callbacks
):
    client.force_login(instructor)

    with patch(
        "apps.notifications.services.NotificationService.notify_enrollment_status_changed"
    ) as notify:
        with django_capture_on_commit_callbacks(execute=True):
            response = client.post(
                _status_url(enrollment),
                {"status": "suspended", "reason": "Missed payments"},
            )

    assert response.status_code == 302
    assert response["Location"] == _student_url(enrollment)
    enrollment.refresh_from_db()
    assert enrollment.status == "suspended"
    audit = LearnerManagementAudit.objects.get(enrollment=enrollment)
    assert audit.action == "status_change"
    assert audit.actor == instructor
    assert audit.reason == "Missed payments"
    assert audit.previous_state["status"] == "active"
    assert audit.resulting_state["status"] == "suspended"
    notify.assert_called_once_with(enrollment, "suspended")

    page = client.get(response["Location"], HTTP_X_INERTIA="true").json()
    assert page["props"]["errors"] == {}
    assert page["props"]["flash"] == [
        {"type": "success", "message": "Enrollment status updated to suspended"}
    ]
    assert page["props"]["enrollments"][0]["allowedStatuses"] == [
        "active",
        "withdrawn",
    ]
