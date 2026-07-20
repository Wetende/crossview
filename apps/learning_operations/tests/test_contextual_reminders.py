from datetime import timedelta

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone

from apps.assessments.models import Assignment, AssignmentSubmission
from apps.core.tests.factories import UserFactory
from apps.learning_operations.models import (
    EnrollmentLearningActivity,
    LearnerReminderEvent,
)
from apps.notifications.models import (
    Notification,
    NotificationEmailOutbox,
    NotificationPreference,
)
from apps.progression.models import Enrollment, InstructorAssignment
from apps.progression.tests.factories import ProgramFactory


@pytest.fixture
def reminder_course():
    instructor = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    instructor.groups.add(group)
    program = ProgramFactory()
    InstructorAssignment.objects.create(instructor=instructor, program=program)
    return instructor, program


def _preview(client, program, enrollment_ids):
    return client.post(
        reverse(
            "learning_operations:learner-reminder-preview",
            kwargs={"program_id": program.id},
        ),
        data={"enrollmentIds": enrollment_ids},
        content_type="application/json",
    )


@pytest.mark.django_db
def test_reminder_preview_prioritizes_overdue_work_and_skips_recent_activity(
    client, reminder_course
):
    instructor, program = reminder_course
    now = timezone.now()
    overdue = Enrollment.objects.create(user=UserFactory(), program=program)
    Enrollment.objects.filter(pk=overdue.pk).update(
        enrolled_at=now - timedelta(days=4)
    )
    recent = Enrollment.objects.create(user=UserFactory(), program=program)
    EnrollmentLearningActivity.objects.create(
        enrollment=recent,
        started_at=now - timedelta(days=2),
        last_activity_at=now,
    )
    assignment = Assignment.objects.create(
        program=program,
        title="Portfolio evidence",
        description="",
        instructions="",
        weight=20,
        due_date=now - timedelta(days=1),
        is_published=True,
    )
    AssignmentSubmission.objects.create(
        enrollment=recent,
        assignment=assignment,
        status="submitted",
        submitted_at=now,
    )
    client.force_login(instructor)

    response = _preview(client, program, [overdue.id, recent.id])

    assert response.status_code == 200
    payload = response.json()
    assert payload["requested"] == 2
    assert payload["eligible"] == 1
    assert payload["skipped"] == 1
    assert payload["reminders"][0]["notificationType"] == "assignment_reminder"
    assert payload["reminders"][0]["condition"]["type"] == "overdue_assignment"
    assert payload["reminders"][0]["title"] == "Assignment overdue: Portfolio evidence"
    assert "Portfolio evidence" in payload["reminders"][0]["message"]


@pytest.mark.django_db
def test_not_started_learner_gets_dedicated_course_start_preview(
    client, reminder_course
):
    instructor, program = reminder_course
    enrollment = Enrollment.objects.create(user=UserFactory(), program=program)
    Enrollment.objects.filter(pk=enrollment.pk).update(
        enrolled_at=timezone.now() - timedelta(days=4)
    )
    client.force_login(instructor)

    response = _preview(client, program, [enrollment.id])

    assert response.status_code == 200
    reminder = response.json()["reminders"][0]
    assert reminder["notificationType"] == "course_start_reminder"
    assert reminder["condition"]["type"] == "not_started"


@pytest.mark.django_db
def test_nearest_upcoming_deadline_wins_before_inactivity(
    client, reminder_course
):
    instructor, program = reminder_course
    now = timezone.now()
    enrollment = Enrollment.objects.create(
        user=UserFactory(),
        program=program,
        expires_at=now + timedelta(days=1),
    )
    EnrollmentLearningActivity.objects.create(
        enrollment=enrollment,
        started_at=now - timedelta(days=10),
        last_activity_at=now - timedelta(days=8),
    )
    Assignment.objects.create(
        program=program,
        title="Later assignment",
        description="",
        instructions="",
        weight=20,
        due_date=now + timedelta(days=2),
        is_published=True,
    )
    client.force_login(instructor)

    reminder = _preview(client, program, [enrollment.id]).json()["reminders"][0]

    assert reminder["notificationType"] == "access_expiry_reminder"
    assert reminder["condition"]["type"] == "access_expiry"


@pytest.mark.django_db
def test_reminder_preview_rejects_an_enrollment_from_another_course(
    client, reminder_course
):
    instructor, program = reminder_course
    other_enrollment = Enrollment.objects.create(
        user=UserFactory(),
        program=ProgramFactory(),
    )
    client.force_login(instructor)

    response = _preview(client, program, [other_enrollment.id])

    assert response.status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("digest", "expected_rows", "expected_status", "expected_emails"),
    [
        ("instant", 1, "sent", 1),
        ("daily", 1, "pending", 0),
        ("weekly", 1, "pending", 0),
        ("never", 0, None, 0),
    ],
)
def test_contextual_reminder_is_idempotent_and_honors_email_preferences(
    client,
    mailoutbox,
    reminder_course,
    digest,
    expected_rows,
    expected_status,
    expected_emails,
):
    instructor, program = reminder_course
    learner = UserFactory(email=f"{digest}@example.com")
    NotificationPreference.objects.create(user=learner, email_digest=digest)
    enrollment = Enrollment.objects.create(user=learner, program=program)
    Enrollment.objects.filter(pk=enrollment.pk).update(
        enrolled_at=timezone.now() - timedelta(days=4)
    )
    client.force_login(instructor)
    preview = _preview(client, program, [enrollment.id]).json()
    request_data = {
        "enrollmentIds": [enrollment.id],
        "action": "send_reminder",
        "operationId": preview["operationId"],
    }
    url = reverse(
        "learning_operations:learner-bulk", kwargs={"program_id": program.id}
    )

    first = client.post(url, data=request_data, content_type="application/json")
    second = client.post(url, data=request_data, content_type="application/json")

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["processed"] == 1
    assert LearnerReminderEvent.objects.count() == 1
    assert Notification.objects.filter(
        notification_type="course_start_reminder"
    ).count() == 1
    assert NotificationEmailOutbox.objects.count() == expected_rows
    if expected_rows:
        assert NotificationEmailOutbox.objects.get().status == expected_status
    assert len(mailoutbox) == expected_emails


@pytest.mark.django_db
def test_reminder_event_survives_when_in_app_and_email_are_unavailable(
    client, reminder_course
):
    instructor, program = reminder_course
    learner = UserFactory(email="quiet@example.com")
    NotificationPreference.objects.create(
        user=learner,
        in_app_enabled=False,
        email_enabled=False,
    )
    enrollment = Enrollment.objects.create(user=learner, program=program)
    Enrollment.objects.filter(pk=enrollment.pk).update(
        enrolled_at=timezone.now() - timedelta(days=4)
    )
    client.force_login(instructor)
    preview = _preview(client, program, [enrollment.id]).json()

    response = client.post(
        reverse(
            "learning_operations:learner-bulk", kwargs={"program_id": program.id}
        ),
        data={
            "enrollmentIds": [enrollment.id],
            "action": "send_reminder",
            "operationId": preview["operationId"],
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["unavailableChannels"] == {"inApp": 1, "email": 1}
    event = LearnerReminderEvent.objects.get()
    assert event.action_url == f"/student/programs/{program.id}/"
    assert event.idempotency_key
    assert event.channels == {"inApp": "unavailable", "email": "unavailable"}
    assert not Notification.objects.exists()
    assert not NotificationEmailOutbox.objects.exists()
