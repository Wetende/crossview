from datetime import timedelta

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone

from apps.assessments.models import Assignment, AssignmentSubmission
from apps.core.tests.factories import UserFactory
from apps.learning_operations.engagement import (
    generate_engagement_reminders,
    get_course_engagement_policy,
)
from apps.learning_operations.models import EnrollmentLearningActivity
from apps.notifications.models import Notification, NotificationPreference
from apps.progression.models import Enrollment, InstructorAssignment
from apps.progression.tests.factories import ProgramFactory


@pytest.fixture
def engagement_course():
    instructor = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    instructor.groups.add(group)
    program = ProgramFactory()
    InstructorAssignment.objects.create(instructor=instructor, program=program)
    learner = UserFactory(email="reminder@example.com")
    NotificationPreference.objects.create(user=learner, email_digest="never")
    enrollment = Enrollment.objects.create(user=learner, program=program)
    return instructor, program, enrollment


@pytest.mark.django_db
def test_assignment_reminder_is_idempotent(engagement_course):
    _, program, enrollment = engagement_course
    now = timezone.now()
    assignment = Assignment.objects.create(
        program=program,
        title="Project",
        description="",
        instructions="",
        weight=20,
        due_date=now + timedelta(days=1),
        is_published=True,
    )
    policy = get_course_engagement_policy(program)
    policy.assignment_offsets = [1]
    policy.expiry_reminders_enabled = False
    policy.inactivity_reminders_enabled = False
    policy.save()

    generate_engagement_reminders(now=now + timedelta(seconds=1))
    generate_engagement_reminders(now=now + timedelta(seconds=1))

    rows = Notification.objects.filter(notification_type="assignment_reminder")
    assert rows.count() == 1
    assert rows.get().related_assessment_id == assignment.id
    assert rows.get().related_enrollment_id == enrollment.id


@pytest.mark.django_db
def test_resolved_assignment_is_skipped(engagement_course):
    _, program, enrollment = engagement_course
    now = timezone.now()
    assignment = Assignment.objects.create(
        program=program,
        title="Resolved",
        description="",
        instructions="",
        weight=20,
        due_date=now + timedelta(days=1),
        is_published=True,
    )
    AssignmentSubmission.objects.create(
        enrollment=enrollment,
        assignment=assignment,
        status="submitted",
        submitted_at=now,
    )
    policy = get_course_engagement_policy(program)
    policy.assignment_offsets = [1]
    policy.expiry_reminders_enabled = False
    policy.inactivity_reminders_enabled = False
    policy.save()

    generate_engagement_reminders(now=now + timedelta(seconds=1))
    assert not Notification.objects.filter(notification_type="assignment_reminder").exists()


@pytest.mark.django_db
def test_expiry_and_inactivity_reminders_use_condition_anchors(engagement_course):
    _, program, enrollment = engagement_course
    now = timezone.now()
    Enrollment.objects.filter(pk=enrollment.pk).update(expires_at=now + timedelta(days=1))
    EnrollmentLearningActivity.objects.create(
        enrollment=enrollment,
        started_at=now - timedelta(days=7),
        last_activity_at=now - timedelta(days=7),
    )
    policy = get_course_engagement_policy(program)
    policy.assignment_reminders_enabled = False
    policy.expiry_offsets = [1]
    policy.inactivity_offsets = [7]
    policy.save()

    result = generate_engagement_reminders(now=now + timedelta(seconds=1))
    assert result["expiry"] == 1
    assert result["inactivity"] == 1


@pytest.mark.django_db
def test_instructor_can_update_engagement_policy(client, engagement_course):
    instructor, program, _ = engagement_course
    client.force_login(instructor)
    response = client.patch(
        reverse("learning_operations:engagement-policy", kwargs={"program_id": program.id}),
        data={"assignmentOffsets": [14, 2, -2], "inactivityRemindersEnabled": False},
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json()["assignmentOffsets"] == [14, 2, -2]
    assert response.json()["inactivityRemindersEnabled"] is False
