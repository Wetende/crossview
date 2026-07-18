from datetime import datetime, timezone as datetime_timezone
from decimal import Decimal
from unittest.mock import Mock, patch

import pytest
from django.utils import timezone

from apps.assessments.models import (
    Assignment,
    AssignmentSubmission,
    Question,
    Quiz,
)
from apps.google_classroom.adapter import ClassroomAPIError, GoogleClassroomAdapter
from apps.google_classroom.jobs import (
    process_classroom_jobs,
    queue_grade_passback,
    queue_resource_publish,
)
from apps.google_classroom.models import (
    ClassroomGradeSync,
    ClassroomResourceMapping,
    ClassroomRosterMapping,
    ClassroomSyncJob,
)
from apps.google_classroom.publishing import (
    build_resource_payload,
    canonical_payload_hash,
    sync_resource,
    unlink_resource_mapping,
)
from apps.progression.models import Enrollment
from apps.progression.tests.factories import CurriculumNodeFactory
from apps.core.tests.factories import UserFactory


class RecordingAdapter:
    def __init__(self):
        self.created = []
        self.updated = []
        self.graded = []
        self.returned = []
        self.remote = {}

    def ensure_teacher(self, course_id):
        return {"courseId": course_id}

    def create_resource(self, course_id, resource_type, body):
        self.created.append((course_id, resource_type, body))
        value = {"id": f"remote-{len(self.created)}", **body, "updateTime": "t1"}
        self.remote[value["id"]] = value
        return value

    def get_resource(self, course_id, resource_type, resource_id):
        return self.remote[resource_id]

    def update_resource(self, course_id, resource_type, resource_id, body, update_mask):
        self.updated.append((resource_id, update_mask, body))
        value = {"id": resource_id, **body, "updateTime": "t2"}
        self.remote[resource_id] = value
        return value

    def list_student_submissions(self, course_id, coursework_id, user_id):
        return [
            {
                "id": "submission-1",
                "state": "TURNED_IN",
                "associatedWithDeveloper": True,
            }
        ]

    def set_submission_grade(self, course_id, coursework_id, submission_id, grade):
        self.graded.append((coursework_id, submission_id, grade))
        return {"assignedGrade": float(grade), "draftGrade": float(grade)}

    def return_submission(self, course_id, coursework_id, submission_id):
        self.returned.append(submission_id)
        return {"id": submission_id, "state": "RETURNED"}


@pytest.mark.django_db
def test_quiz_publication_uses_secure_lms_link_without_answers(
    classroom_settings, program
):
    node = CurriculumNodeFactory(program=program, title="Knowledge check")
    quiz = Quiz.objects.create(node=node, title="Safety quiz", is_published=True)
    Question.objects.create(
        quiz=quiz,
        question_type="mcq",
        text="Private question",
        points=7,
        answer_data={"options": ["A", "B"], "correct": 1},
    )

    resource_type, body = build_resource_payload(program, "quiz", quiz.id)

    assert resource_type == "coursework"
    assert body["maxPoints"] == 7
    assert body["materials"][0]["link"]["url"].startswith(
        "https://courses.example.test/student/programs/"
    )
    serialized = str(body).lower()
    assert "private question" not in serialized
    assert "correct" not in serialized
    assert "answer_data" not in serialized


@pytest.mark.django_db
def test_assignment_due_date_is_sent_to_google_in_utc(classroom_settings, program):
    due_at = datetime(2026, 7, 18, 9, 30, tzinfo=datetime_timezone.utc)
    assignment = Assignment.objects.create(
        program=program,
        title="Project",
        description="Submit the project.",
        instructions="Attach evidence.",
        weight=30,
        due_date=due_at,
        is_published=True,
    )

    _, body = build_resource_payload(program, "assignment", assignment.id)

    assert body["dueDate"] == {"year": 2026, "month": 7, "day": 18}
    assert body["dueTime"] == {"hours": 9, "minutes": 30, "seconds": 0}


@pytest.mark.django_db
def test_content_jobs_are_idempotent_and_detect_remote_drift(
    classroom_settings, course_link, instructor
):
    node = CurriculumNodeFactory(program=course_link.program, title="Portable lesson")
    adapter = RecordingAdapter()

    first = queue_resource_publish(
        course_link=course_link,
        actor=instructor,
        local_type="lesson",
        local_id=node.id,
    )
    repeated = queue_resource_publish(
        course_link=course_link,
        actor=instructor,
        local_type="lesson",
        local_id=node.id,
    )
    with patch(
        "apps.google_classroom.jobs.GoogleClassroomAdapter", return_value=adapter
    ):
        outcome = process_classroom_jobs(job_ids=[first.id])

    assert first.id == repeated.id
    assert outcome == {"claimed": 1, "succeeded": 1, "failed": 0}
    assert len(adapter.created) == 1
    mapping = ClassroomResourceMapping.objects.get(pk=first.resource_mapping_id)
    adapter.remote[mapping.google_resource_id]["title"] = "Changed directly in Classroom"
    resource_type, body = build_resource_payload(
        course_link.program, "lesson", node.id
    )

    with pytest.raises(ClassroomAPIError) as exc_info:
        sync_resource(
            mapping,
            adapter,
            body=body,
            payload_hash=canonical_payload_hash(resource_type, body),
        )

    mapping.refresh_from_db()
    assert exc_info.value.category == "remote_drift"
    assert mapping.status == ClassroomResourceMapping.Status.DRIFT
    assert adapter.updated == []


@pytest.mark.django_db
def test_grade_passback_sets_both_grades_returns_submission_and_stays_idempotent(
    course_link, instructor
):
    learner = UserFactory(email="graded@example.test")
    enrollment = Enrollment.objects.create(user=learner, program=course_link.program)
    mapping = ClassroomResourceMapping.objects.create(
        course_link=course_link,
        local_type="assignment",
        local_id="44",
        google_resource_type="coursework",
        google_resource_id="coursework-44",
    )
    ClassroomRosterMapping.objects.create(
        course_link=course_link,
        enrollment=enrollment,
        lms_user=learner,
        google_user_id="google-learner",
        verified_email=learner.email,
    )
    adapter = RecordingAdapter()
    job = queue_grade_passback(
        mapping=mapping,
        enrollment=enrollment,
        source_type="assignment_submission",
        source_id=91,
        grade=Decimal("84.50"),
        actor=instructor,
    )

    with patch(
        "apps.google_classroom.jobs.GoogleClassroomAdapter", return_value=adapter
    ):
        outcome = process_classroom_jobs(job_ids=[job.id])

    assert outcome == {"claimed": 1, "succeeded": 1, "failed": 0}
    assert adapter.graded == [("coursework-44", "submission-1", Decimal("84.50"))]
    assert adapter.returned == ["submission-1"]
    grade_sync = ClassroomGradeSync.objects.get()
    assert grade_sync.status == "synced"
    assert grade_sync.google_submission_id == "submission-1"

    repeated = queue_grade_passback(
        mapping=mapping,
        enrollment=enrollment,
        source_type="assignment_submission",
        source_id=91,
        grade=Decimal("84.50"),
        actor=instructor,
    )
    grade_sync.refresh_from_db()
    assert repeated.id == job.id
    assert repeated.status == ClassroomSyncJob.Status.SUCCEEDED
    assert grade_sync.status == "synced"


@pytest.mark.django_db
def test_worker_recovers_unexpected_failures_without_leaving_processing_job(
    course_link, instructor
):
    job = ClassroomSyncJob.objects.create(
        course_link=course_link,
        actor=instructor,
        job_type="course_sync",
        idempotency_key="unexpected-failure",
        available_at=timezone.now(),
    )
    adapter = Mock()
    adapter.ensure_teacher.side_effect = TypeError("SDK response changed")

    with patch(
        "apps.google_classroom.jobs.GoogleClassroomAdapter", return_value=adapter
    ):
        outcome = process_classroom_jobs(job_ids=[job.id])

    job.refresh_from_db()
    assert outcome == {"claimed": 1, "succeeded": 0, "failed": 1}
    assert job.status == ClassroomSyncJob.Status.FAILED
    assert job.error_category == "remote_error"
    assert job.locked_at is None
    assert "SDK response changed" not in job.last_error


@pytest.mark.django_db
def test_google_adapter_sets_draft_and_assigned_grade_then_returns(credential):
    endpoint = Mock()
    endpoint.patch.return_value.execute.return_value = {"assignedGrade": 91.0}
    endpoint.return_.return_value.execute.return_value = {"state": "RETURNED"}
    service = Mock()
    service.courses.return_value.courseWork.return_value.studentSubmissions.return_value = endpoint
    adapter = GoogleClassroomAdapter(credential, service=service)

    adapter.set_submission_grade("course", "work", "submission", Decimal("91.00"))
    adapter.return_submission("course", "work", "submission")

    assert endpoint.patch.call_args.kwargs == {
        "courseId": "course",
        "courseWorkId": "work",
        "id": "submission",
        "updateMask": "draftGrade,assignedGrade",
        "body": {"draftGrade": 91.0, "assignedGrade": 91.0},
    }
    endpoint.return_.assert_called_once_with(
        courseId="course",
        courseWorkId="work",
        id="submission",
        body={},
    )


@pytest.mark.django_db
def test_explicit_resource_unlink_preserves_remote_post_and_stops_pending_jobs(
    course_link, instructor
):
    mapping = ClassroomResourceMapping.objects.create(
        course_link=course_link,
        local_type="lesson",
        local_id="77",
        google_resource_type="material",
        google_resource_id="remote-material-77",
        status=ClassroomResourceMapping.Status.REMOTE_DELETED,
    )
    job = ClassroomSyncJob.objects.create(
        course_link=course_link,
        resource_mapping=mapping,
        actor=instructor,
        job_type="content_upsert",
        idempotency_key="pending-resource-update",
        available_at=timezone.now(),
    )

    unlink_resource_mapping(mapping, instructor)

    mapping.refresh_from_db()
    job.refresh_from_db()
    assert mapping.google_resource_id == ""
    assert mapping.status == ClassroomResourceMapping.Status.UNLINKED
    assert job.status == ClassroomSyncJob.Status.DEAD
    assert job.error_category == "resource_unlinked"
    audit = course_link.sync_audits.get(action="resource_unlinked")
    assert audit.details["googleResourceId"] == "remote-material-77"
