from unittest.mock import Mock, patch

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse

from apps.core.tests.factories import UserFactory
from apps.progression.models import InstructorAssignment
from apps.progression.tests.factories import ProgramFactory


@pytest.mark.django_db
def test_student_cannot_access_classroom_teacher_api(client, program):
    student = UserFactory()
    client.force_login(student)

    response = client.get(
        reverse("google_classroom:course-link", kwargs={"program_id": program.id})
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_instructor_cannot_access_another_instructors_course(client, instructor):
    other_program = ProgramFactory()
    client.force_login(instructor)

    response = client.get(
        reverse(
            "google_classroom:course-link",
            kwargs={"program_id": other_program.id},
        )
    )

    assert response.status_code == 404


@pytest.mark.django_db
def test_assigned_teacher_can_discover_and_link_only_after_teacher_verification(
    client, classroom_settings, instructor, program, credential
):
    client.force_login(instructor)
    adapter = Mock()
    adapter.list_courses.return_value = [
        {
            "id": "course-88",
            "name": "Classroom Companion",
            "courseState": "ACTIVE",
            "enrollmentCode": "ABC123",
        }
    ]
    adapter.get_course.return_value = {
        "id": "course-88",
        "name": "Classroom Companion",
        "courseState": "ACTIVE",
        "enrollmentCode": "ABC123",
        "alternateLink": "https://classroom.google.com/c/course-88",
    }

    with patch(
        "apps.google_classroom.views.GoogleClassroomAdapter", return_value=adapter
    ), patch(
        "apps.google_classroom.services.GoogleClassroomAdapter", return_value=adapter
    ):
        courses = client.get(reverse("google_classroom:courses"))
        linked = client.post(
            reverse(
                "google_classroom:course-link", kwargs={"program_id": program.id}
            ),
            data={"courseId": "course-88"},
            content_type="application/json",
        )

    assert courses.status_code == 200
    assert courses.json()["results"][0]["id"] == "course-88"
    assert linked.status_code == 200
    assert linked.json()["connected"] is True
    adapter.ensure_teacher.assert_called_with("course-88")


@pytest.mark.django_db
def test_roster_api_requires_incremental_roster_authorization(
    client, instructor, course_link, credential
):
    credential.granted_scopes = [
        "https://www.googleapis.com/auth/classroom.courses.readonly"
    ]
    credential.save(update_fields=["granted_scopes", "updated_at"])
    client.force_login(instructor)

    response = client.post(
        reverse(
            "google_classroom:roster-preview",
            kwargs={"program_id": course_link.program_id},
        ),
        data={"direction": "both"},
        content_type="application/json",
    )

    assert response.status_code == 400
    assert "roster read" in response.json()["detail"]
