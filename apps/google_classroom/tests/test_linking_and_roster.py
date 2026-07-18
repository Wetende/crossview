from unittest.mock import Mock

import pytest
from django.core.exceptions import ValidationError

from apps.core.tests.factories import UserFactory
from apps.google_classroom.models import (
    ClassroomResourceMapping,
    ClassroomRosterMapping,
    ClassroomSyncAudit,
    ClassroomSyncJob,
)
from apps.google_classroom.roster import apply_roster_preview, create_roster_preview
from apps.google_classroom.services import (
    link_classroom_course,
    serialize_student_companion,
    unlink_classroom_course,
)
from apps.learning_operations.models import CourseInvitation
from apps.progression.models import Enrollment


def remote_course(course_id):
    return {
        "id": course_id,
        "name": f"Class {course_id}",
        "section": "Online",
        "enrollmentCode": "CODE42",
        "alternateLink": f"https://classroom.google.com/c/{course_id}",
        "courseState": "ACTIVE",
    }


@pytest.mark.django_db
def test_link_requires_remote_teacher_and_relink_retires_stale_state(
    program, instructor, credential, course_link
):
    mapping = ClassroomResourceMapping.objects.create(
        course_link=course_link,
        local_type="lesson",
        local_id="9",
        google_resource_type="material",
        google_resource_id="old-material",
        remote_snapshot={"title": "Old"},
    )
    roster = ClassroomRosterMapping.objects.create(
        course_link=course_link,
        google_user_id="old-student",
        verified_email="old@example.test",
    )
    job = ClassroomSyncJob.objects.create(
        course_link=course_link,
        job_type="content_upsert",
        idempotency_key="old-job",
        available_at=course_link.created_at,
    )
    adapter = Mock()
    adapter.get_course.return_value = remote_course("remote-course-2")

    result = link_classroom_course(
        program=program,
        actor=instructor,
        classroom_course_id="remote-course-2",
        adapter=adapter,
    )

    adapter.ensure_teacher.assert_called_once_with("remote-course-2")
    mapping.refresh_from_db()
    roster.refresh_from_db()
    job.refresh_from_db()
    assert result.classroom_course_id == "remote-course-2"
    assert mapping.google_resource_id == ""
    assert mapping.status == ClassroomResourceMapping.Status.UNLINKED
    assert roster.status == ClassroomRosterMapping.Status.REMOVED
    assert job.status == ClassroomSyncJob.Status.DEAD
    assert job.error_category == "course_relinked"


@pytest.mark.django_db
def test_unlink_preserves_both_courses_and_records_audit(course_link, instructor):
    unlink_classroom_course(course_link, instructor)

    course_link.refresh_from_db()
    assert course_link.enabled is False
    assert course_link.sync_paused is True
    assert course_link.program_id
    assert ClassroomSyncAudit.objects.filter(
        course_link=course_link, action="course_unlinked"
    ).exists()


@pytest.mark.django_db
def test_bidirectional_roster_preview_is_deduplicated_and_preview_first(
    course_link, instructor, mailoutbox
):
    matched_user = UserFactory(email="matched@example.test")
    matched_enrollment = Enrollment.objects.create(
        user=matched_user, program=course_link.program
    )
    existing_user = UserFactory(email="existing@example.test")
    local_only = UserFactory(email="local-only@example.test")
    Enrollment.objects.create(user=local_only, program=course_link.program)
    adapter = Mock()
    adapter.list_students.return_value = [
        {
            "userId": "google-matched",
            "profile": {
                "id": "google-matched",
                "emailAddress": "MATCHED@example.test",
                "name": {"fullName": "Matched Learner"},
            },
        },
        {
            "userId": "google-existing",
            "profile": {
                "id": "google-existing",
                "emailAddress": "existing@example.test",
                "name": {"fullName": "Existing Learner"},
            },
        },
        {
            "userId": "google-unknown",
            "profile": {
                "id": "google-unknown",
                "emailAddress": "unknown@example.test",
                "name": {"fullName": "Unknown Learner"},
            },
        },
    ]

    preview, token, summary = create_roster_preview(
        course_link, instructor, adapter, "both"
    )

    assert summary == {"matched": 1, "missing": 3}
    matched_rows = [row for row in preview.rows if row["email"] == "matched@example.test"]
    assert len(matched_rows) == 1
    assert matched_rows[0]["direction"] == "both"
    assert not ClassroomRosterMapping.objects.exists()

    results = apply_roster_preview(
        course_link=course_link,
        actor=instructor,
        raw_token=token,
    )

    assert results == {
        "enrolled": 1,
        "lmsInvited": 1,
        "classroomInvited": 1,
        "matched": 1,
        "conflicts": 0,
    }
    assert Enrollment.objects.filter(
        user=existing_user, program=course_link.program, status="active"
    ).exists()
    assert CourseInvitation.objects.filter(
        program=course_link.program, email="unknown@example.test"
    ).exists()
    assert ClassroomRosterMapping.objects.filter(
        course_link=course_link,
        enrollment=matched_enrollment,
        google_user_id="google-matched",
    ).exists()
    assert not ClassroomRosterMapping.objects.filter(
        google_user_id="google-unknown"
    ).exists()
    assert ClassroomSyncJob.objects.filter(
        course_link=course_link,
        job_type="roster_invite",
        payload={"email": "local-only@example.test"},
    ).exists()
    with pytest.raises(ValidationError):
        apply_roster_preview(
            course_link=course_link,
            actor=instructor,
            raw_token=token,
        )


@pytest.mark.django_db
def test_roster_identity_conflict_is_never_applied(course_link, instructor):
    user = UserFactory(email="learner@example.test")
    enrollment = Enrollment.objects.create(user=user, program=course_link.program)
    ClassroomRosterMapping.objects.create(
        course_link=course_link,
        enrollment=enrollment,
        lms_user=user,
        google_user_id="google-original",
        verified_email=user.email,
    )
    adapter = Mock()
    adapter.list_students.return_value = [
        {
            "profile": {
                "id": "google-different",
                "emailAddress": user.email,
                "name": {"fullName": "Learner"},
            }
        }
    ]

    preview, token, summary = create_roster_preview(
        course_link, instructor, adapter, "google_to_lms"
    )
    result = apply_roster_preview(
        course_link=course_link,
        actor=instructor,
        raw_token=token,
    )

    assert summary == {"conflict": 1}
    assert result["conflicts"] == 1
    assert not ClassroomRosterMapping.objects.filter(
        course_link=course_link, google_user_id="google-different"
    ).exists()


@pytest.mark.django_db
def test_student_companion_does_not_block_unmapped_lms_enrollment(course_link):
    enrollment = Enrollment.objects.create(
        user=UserFactory(), program=course_link.program
    )

    payload = serialize_student_companion(course_link.program, enrollment)

    assert payload == {
        "available": True,
        "connected": True,
        "membershipStatus": "not_joined",
        "classCode": "JOIN42",
        "alternateLink": "https://classroom.google.com/c/remote-course-1",
        "courseName": "Remote Portable Course",
    }


@pytest.mark.django_db
def test_preview_reports_prior_removed_and_pending_invited_learners(
    course_link, instructor
):
    removed_user = UserFactory(email="removed@example.test")
    removed_enrollment = Enrollment.objects.create(
        user=removed_user, program=course_link.program, status="withdrawn"
    )
    ClassroomRosterMapping.objects.create(
        course_link=course_link,
        enrollment=removed_enrollment,
        lms_user=removed_user,
        google_user_id="google-removed",
        verified_email=removed_user.email,
    )
    invited_user = UserFactory(email="invited@example.test")
    Enrollment.objects.create(user=invited_user, program=course_link.program)
    ClassroomSyncJob.objects.create(
        course_link=course_link,
        actor=instructor,
        job_type="roster_invite",
        payload={"email": invited_user.email},
        idempotency_key="pending-roster-invitation",
        available_at=course_link.created_at,
    )
    adapter = Mock()
    adapter.list_students.return_value = [
        {
            "profile": {
                "id": "google-removed",
                "emailAddress": removed_user.email,
                "name": {"fullName": "Removed Learner"},
            }
        }
    ]

    preview, _, summary = create_roster_preview(
        course_link, instructor, adapter, "both"
    )

    statuses = {row["email"]: row["status"] for row in preview.rows}
    assert statuses == {
        "removed@example.test": "removed",
        "invited@example.test": "invited",
    }
    assert summary == {"removed": 1, "invited": 1}
    assert all(row["action"] is None for row in preview.rows)
