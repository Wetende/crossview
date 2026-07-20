from decimal import Decimal

import pytest
from django.contrib.auth.models import Group
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils import timezone

from apps.assessments.models import Assignment, AssignmentSubmission, Quiz, QuizAttempt
from apps.assessments.official_results import (
    can_start_quiz_attempt,
    get_assignment_attempts_remaining,
)
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, InstructorAssignment, NodeCompletion
from apps.progression.tests.factories import ProgramFactory

from apps.learning_operations.learner_management import (
    accept_course_invitation,
    create_course_invitation,
)
from apps.learning_operations.models import (
    AssessmentAttemptGrant,
    CourseInvitation,
    LearnerManagementAudit,
)


@pytest.fixture
def instructor():
    user = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


@pytest.fixture
def program(instructor):
    value = ProgramFactory()
    InstructorAssignment.objects.create(instructor=instructor, program=value)
    return value


@pytest.fixture
def learner(program):
    user = UserFactory(email="learner@example.com")
    enrollment = Enrollment.objects.create(user=user, program=program)
    return user, enrollment


@pytest.mark.django_db
def test_existing_account_is_enrolled_immediately_and_audited(
    client, instructor, program
):
    user = UserFactory(email="existing@example.com")
    client.force_login(instructor)

    response = client.post(
        reverse(
            "learning_operations:course-invitations",
            kwargs={"program_id": program.id},
        ),
        data={"email": "Existing@Example.com"},
        content_type="application/json",
    )

    assert response.status_code == 201
    enrollment = Enrollment.objects.get(user=user, program=program)
    assert response.json() == {
        "status": "enrolled",
        "enrollmentId": enrollment.id,
        "created": True,
    }
    assert LearnerManagementAudit.objects.filter(
        enrollment=enrollment, action="enroll_existing_user"
    ).exists()


@pytest.mark.django_db
def test_unknown_account_invitation_stores_only_hash(client, mailoutbox, instructor, program):
    client.force_login(instructor)

    response = client.post(
        reverse(
            "learning_operations:course-invitations",
            kwargs={"program_id": program.id},
        ),
        data={"email": "newlearner@example.com"},
        content_type="application/json",
    )

    assert response.status_code == 201
    payload = response.json()
    invitation = CourseInvitation.objects.get(pk=payload["invitationId"])
    assert invitation.token_digest not in mailoutbox[0].body
    assert "rawToken" not in payload
    assert invitation.email == "newlearner@example.com"
    assert invitation.expires_at > timezone.now()


@pytest.mark.django_db
def test_invitation_creates_account_even_without_public_registration(program, instructor):
    invitation, raw_token = create_course_invitation(
        program=program,
        email="invited@example.com",
        invited_by=instructor,
    )

    user, enrollment = accept_course_invitation(
        raw_token=raw_token,
        first_name="Invited",
        last_name="Learner",
        password="SecureInvitePass123!",
    )

    invitation.refresh_from_db()
    assert user.email == "invited@example.com"
    assert user.check_password("SecureInvitePass123!")
    assert enrollment.program == program
    assert invitation.accepted_at is not None
    with pytest.raises(ValidationError):
        accept_course_invitation(raw_token=raw_token, password="AnotherSecurePass123!")


@pytest.mark.django_db
def test_csv_requires_preview_token_and_imports_reviewed_rows(
    client, mailoutbox, instructor, program
):
    existing = UserFactory(email="existing@example.com")
    content = (
        b"email,first_name,last_name\n"
        b"existing@example.com,Existing,User\n"
        b"unknown@example.com,Unknown,User\n"
        b"unknown@example.com,Duplicate,User\n"
        b"invalid-email,Bad,Row\n"
    )
    client.force_login(instructor)
    preview_url = reverse(
        "learning_operations:roster-preview", kwargs={"program_id": program.id}
    )
    import_url = reverse(
        "learning_operations:roster-import", kwargs={"program_id": program.id}
    )

    rejected = client.post(
        import_url,
        {"file": SimpleUploadedFile("learners.csv", content, content_type="text/csv")},
    )
    assert rejected.status_code == 400

    preview = client.post(
        preview_url,
        {"file": SimpleUploadedFile("learners.csv", content, content_type="text/csv")},
    )
    assert preview.status_code == 200
    assert [row["status"] for row in preview.json()["results"]] == [
        "ready_to_enroll",
        "ready_to_invite",
        "duplicate",
        "rejected",
    ]

    imported = client.post(
        import_url,
        {
            "file": SimpleUploadedFile("learners.csv", content, content_type="text/csv"),
            "confirmationToken": preview.json()["confirmationToken"],
        },
    )
    assert imported.status_code == 201
    assert imported.json()["imported"] == 1
    assert imported.json()["invited"] == 1
    assert Enrollment.objects.filter(user=existing, program=program).exists()
    assert CourseInvitation.objects.filter(
        program=program, email="unknown@example.com"
    ).exists()
    assert len(mailoutbox) == 1


@pytest.mark.django_db
def test_csv_headers_are_case_insensitive_and_roster_export_can_be_reimported(
    client, instructor, program, learner
):
    client.force_login(instructor)
    preview_url = reverse(
        "learning_operations:roster-preview", kwargs={"program_id": program.id}
    )
    mixed_case = b"Email,First Name,Last Name\nNEW@EXAMPLE.COM,New,Learner\n"

    preview = client.post(
        preview_url,
        {"file": SimpleUploadedFile("mixed.csv", mixed_case, content_type="text/csv")},
    )

    assert preview.status_code == 200
    assert preview.json()["results"][0]["email"] == "new@example.com"
    assert preview.json()["results"][0]["status"] == "ready_to_invite"

    exported = client.get(
        reverse("learning_operations:roster-export", kwargs={"program_id": program.id})
    )
    round_trip = client.post(
        preview_url,
        {
            "file": SimpleUploadedFile(
                "exported.csv", exported.content, content_type="text/csv"
            )
        },
    )

    assert exported.status_code == 200
    assert round_trip.status_code == 200
    assert round_trip.json()["results"][0]["status"] == "already_enrolled"


@pytest.mark.django_db
def test_bulk_status_change_is_scoped_and_audited(client, instructor, program, learner):
    _, enrollment = learner
    client.force_login(instructor)

    response = client.post(
        reverse(
            "learning_operations:learner-bulk", kwargs={"program_id": program.id}
        ),
        data={
            "enrollmentIds": [enrollment.id],
            "action": "withdraw",
            "reason": "Learner requested withdrawal",
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    enrollment.refresh_from_db()
    assert enrollment.status == "withdrawn"
    audit = LearnerManagementAudit.objects.get(enrollment=enrollment)
    assert audit.action == "status_change"
    assert audit.previous_state["status"] == "active"


@pytest.mark.django_db
def test_bulk_status_actions_skip_ineligible_learners_and_preserve_completion(
    client, instructor, program, learner
):
    _, active = learner
    completed = Enrollment.objects.create(
        user=UserFactory(),
        program=program,
        status="completed",
        completed_at=timezone.now(),
    )
    original_completed_at = completed.completed_at
    client.force_login(instructor)

    preview = client.post(
        reverse(
            "learning_operations:learner-bulk", kwargs={"program_id": program.id}
        ),
        data={
            "enrollmentIds": [active.id, completed.id],
            "action": "suspend",
            "preview": True,
        },
        content_type="application/json",
    )

    assert preview.status_code == 200
    assert preview.json()["eligible"] == 1
    assert preview.json()["ineligible"] == 1
    active.refresh_from_db()
    assert active.status == "active"

    response = client.post(
        reverse(
            "learning_operations:learner-bulk", kwargs={"program_id": program.id}
        ),
        data={"enrollmentIds": [active.id, completed.id], "action": "suspend"},
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["requested"] == 2
    assert response.json()["processed"] == 1
    assert response.json()["skipped"] == 1
    completed.refresh_from_db()
    assert completed.status == "completed"
    assert completed.completed_at == original_completed_at


@pytest.mark.django_db
def test_withdraw_requires_a_reason(client, instructor, program, learner):
    _, enrollment = learner
    client.force_login(instructor)

    response = client.post(
        reverse(
            "learning_operations:learner-bulk", kwargs={"program_id": program.id}
        ),
        data={"enrollmentIds": [enrollment.id], "action": "withdraw"},
        content_type="application/json",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_completion_reset_preserves_audit_and_reopens_completed_enrollment(
    client, instructor, program, learner
):
    _, enrollment = learner
    Enrollment.objects.filter(pk=enrollment.pk).update(
        status="completed", completed_at=timezone.now()
    )
    enrollment.refresh_from_db()
    node = CurriculumNode.objects.create(
        program=program,
        node_type="Session",
        title="Resettable lesson",
        properties={},
        position=1,
        is_published=True,
    )
    NodeCompletion.objects.create(
        enrollment=enrollment,
        node=node,
        completed_at=timezone.now(),
        completion_type="view",
    )
    client.force_login(instructor)

    response = client.post(
        reverse(
            "learning_operations:lesson-completion-reset",
            kwargs={
                "program_id": program.id,
                "enrollment_id": enrollment.id,
                "node_id": node.id,
            },
        ),
        data={"reason": "Incorrect completion"},
        content_type="application/json",
    )

    assert response.status_code == 200
    enrollment.refresh_from_db()
    assert enrollment.status == "active"
    assert not NodeCompletion.objects.filter(enrollment=enrollment, node=node).exists()
    assert LearnerManagementAudit.objects.filter(
        enrollment=enrollment, action="reset_lesson_completion"
    ).exists()


@pytest.mark.django_db
def test_quiz_attempt_grant_adds_one_attempt(client, instructor, program, learner):
    _, enrollment = learner
    node = CurriculumNode.objects.create(
        program=program,
        node_type="Session",
        title="Quiz lesson",
        properties={},
        position=1,
        is_published=True,
    )
    quiz = Quiz.objects.create(
        node=node,
        title="Final quiz",
        max_attempts=1,
        allow_retake_after_pass=False,
    )
    QuizAttempt.objects.create(
        enrollment=enrollment,
        quiz=quiz,
        attempt_number=1,
        started_at=timezone.now(),
        submitted_at=timezone.now(),
        score=Decimal("80"),
        passed=True,
    )
    assert can_start_quiz_attempt(quiz, enrollment).allowed is False
    client.force_login(instructor)

    response = client.post(
        reverse(
            "learning_operations:quiz-attempt-grant",
            kwargs={
                "program_id": program.id,
                "enrollment_id": enrollment.id,
                "quiz_id": quiz.id,
            },
        ),
        data={"reason": "Technical interruption"},
        content_type="application/json",
    )

    assert response.status_code == 201
    eligibility = can_start_quiz_attempt(quiz, enrollment)
    assert eligibility.allowed is True
    assert eligibility.attempts_remaining == 1


@pytest.mark.django_db
def test_assignment_return_preserves_grade_and_adds_allowance(
    client, instructor, program, learner
):
    _, enrollment = learner
    assignment = Assignment.objects.create(
        program=program,
        title="Portfolio",
        description="Submit portfolio",
        instructions="Upload it",
        weight=30,
        is_published=True,
    )
    submission = AssignmentSubmission.objects.create(
        enrollment=enrollment,
        assignment=assignment,
        attempt_number=1,
        status="graded",
        submitted_at=timezone.now(),
        score=Decimal("65"),
        passed=True,
    )
    client.force_login(instructor)

    response = client.post(
        reverse(
            "learning_operations:assignment-return",
            kwargs={"program_id": program.id, "submission_id": submission.id},
        ),
        data={"feedback": "Please revise the evidence."},
        content_type="application/json",
    )

    assert response.status_code == 200
    submission.refresh_from_db()
    assert submission.status == "returned"
    assert submission.score == Decimal("65")
    maximum, used, remaining = get_assignment_attempts_remaining(
        enrollment, assignment, {"assignment_attempts": 1}
    )
    assert (maximum, used, remaining) == (2, 1, 1)


@pytest.mark.django_db
def test_attempt_grant_requires_matching_target(program, learner, instructor):
    _, enrollment = learner
    with pytest.raises(IntegrityError), transaction.atomic():
        AssessmentAttemptGrant.objects.create(
            enrollment=enrollment,
            assessment_type="quiz",
            granted_by=instructor,
        )
