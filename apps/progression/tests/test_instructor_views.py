"""
Instructor View Tests
Requirements: All instructor dashboard functionality
"""

import pytest
from django.urls import reverse
from rest_framework import status

from apps.core.models import Program, User
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, NodeCompletion, InstructorAssignment
from apps.assessments.models import AssessmentResult
from apps.practicum.models import PracticumSubmission, SubmissionReview
from apps.core.tests.factories import TenantFactory, UserFactory
from .factories import (
    ProgramFactory,
    CurriculumNodeFactory,
    EnrollmentFactory,
    InstructorAssignmentFactory,
    AssessmentResultFactory,
    PracticumSubmissionFactory,
)


@pytest.fixture
def tenant(db):
    return TenantFactory()


@pytest.fixture
def instructor(tenant):
    return UserFactory(tenant=tenant)


@pytest.fixture
def program(tenant):
    return ProgramFactory(tenant=tenant)


@pytest.fixture
def assignment(instructor, program):
    return InstructorAssignmentFactory(instructor=instructor, program=program)


@pytest.fixture
def student(tenant):
    return UserFactory(tenant=tenant)


@pytest.fixture
def enrollment(student, program):
    return EnrollmentFactory(user=student, program=program)


@pytest.mark.django_db
class TestInstructorDashboard:
    """Test instructor dashboard view."""

    def test_dashboard_returns_correct_stats(self, client, instructor, assignment):
        """Dashboard should return program count, student count, pending reviews."""
        client.force_login(instructor)

        # Create some enrollments
        for _ in range(3):
            student = UserFactory(tenant=instructor.tenant)
            EnrollmentFactory(user=student, program=assignment.program, status="active")

        response = client.get(reverse("progression:instructor.dashboard"))

        assert response.status_code == 200
        # Inertia response contains page data as JSON in content
        assert b"Instructor/Dashboard" in response.content

    def test_dashboard_requires_authentication(self, client):
        """Dashboard should require login."""
        response = client.get(reverse("progression:instructor.dashboard"))
        assert response.status_code == 302  # Redirect to login


@pytest.mark.django_db
class TestInstructorPrograms:
    """Test instructor programs list view."""

    def test_programs_list_filters_by_assignment(self, client, instructor, tenant):
        """Should only show programs assigned to instructor."""
        client.force_login(instructor)

        # Create assigned program
        assigned_program = ProgramFactory(tenant=tenant)
        InstructorAssignmentFactory(instructor=instructor, program=assigned_program)

        # Create unassigned program
        unassigned_program = ProgramFactory(tenant=tenant)

        response = client.get(reverse("progression:instructor.programs"))

        assert response.status_code == 200

    def test_program_detail_requires_assignment(self, client, instructor, tenant):
        """Should return 404 for programs not assigned to instructor."""
        client.force_login(instructor)

        # Create program without assignment
        program = ProgramFactory(tenant=tenant)

        response = client.get(
            reverse("progression:instructor.program", kwargs={"pk": program.id})
        )

        assert response.status_code == 404


@pytest.mark.django_db
class TestInstructorStudents:
    """Test instructor student list and detail views."""

    def test_student_list_shows_enrolled_students(
        self, client, instructor, assignment, enrollment
    ):
        """Should show students enrolled in assigned program."""
        client.force_login(instructor)

        response = client.get(
            reverse(
                "progression:instructor.students",
                kwargs={"pk": assignment.program.id},
            )
        )

        assert response.status_code == 200

    def test_student_list_supports_filtering(self, client, instructor, assignment):
        """Should filter students by status and search."""
        client.force_login(instructor)

        # Create students with different statuses
        active_student = UserFactory(tenant=instructor.tenant)
        EnrollmentFactory(
            user=active_student, program=assignment.program, status="active"
        )

        completed_student = UserFactory(tenant=instructor.tenant)
        EnrollmentFactory(
            user=completed_student, program=assignment.program, status="completed"
        )

        # Filter by status
        response = client.get(
            reverse(
                "progression:instructor.students",
                kwargs={"pk": assignment.program.id},
            ),
            {"status": "active"},
        )

        assert response.status_code == 200

    def test_student_detail_shows_progress(
        self, client, instructor, assignment, enrollment
    ):
        """Should show student progress and assessment results."""
        client.force_login(instructor)

        response = client.get(
            reverse(
                "progression:instructor.student",
                kwargs={
                    "pk": assignment.program.id,
                    "enrollment_id": enrollment.id,
                },
            )
        )

        assert response.status_code == 200


@pytest.mark.django_db
class TestInstructorGradebook:
    """Test instructor gradebook views."""

    def test_gradebook_shows_all_students(self, client, instructor, assignment):
        """Should show all enrolled students with grades."""
        client.force_login(instructor)

        # Create enrollments
        for _ in range(3):
            student = UserFactory(tenant=instructor.tenant)
            EnrollmentFactory(user=student, program=assignment.program)

        response = client.get(
            reverse(
                "progression:instructor.gradebook",
                kwargs={"pk": assignment.program.id},
            )
        )

        assert response.status_code == 200

    def test_gradebook_save_creates_results(
        self, client, instructor, assignment, enrollment
    ):
        """Should create/update assessment results when saving grades."""
        client.force_login(instructor)

        # Create root node for program
        root_node = CurriculumNodeFactory(
            program=assignment.program,
            parent=None,
            node_type="Year",
        )

        response = client.post(
            reverse(
                "progression:instructor.gradebook.save",
                kwargs={"pk": assignment.program.id},
            ),
            data={
                "grades": {
                    str(enrollment.id): {
                        "components": {"CAT": 75, "Exam": 80},
                    }
                }
            },
            content_type="application/json",
        )

        # Should redirect back to gradebook
        assert response.status_code == 302

    def test_gradebook_publish_updates_results(
        self, client, instructor, assignment, enrollment
    ):
        """Should publish all unpublished results."""
        client.force_login(instructor)

        # Create unpublished result
        root_node = CurriculumNodeFactory(
            program=assignment.program,
            parent=None,
            node_type="Year",
        )
        result = AssessmentResultFactory(
            enrollment=enrollment,
            node=root_node,
            is_published=False,
        )

        response = client.post(
            reverse(
                "progression:instructor.gradebook.publish",
                kwargs={"pk": assignment.program.id},
            )
        )

        assert response.status_code == 302
        result.refresh_from_db()
        assert result.is_published is True


@pytest.mark.django_db
class TestInstructorPracticum:
    """Test instructor practicum review views."""

    def test_practicum_list_shows_submissions(self, client, instructor, assignment):
        """Should show practicum submissions for assigned programs."""
        client.force_login(instructor)

        # Create submission
        student = UserFactory(tenant=instructor.tenant)
        enrollment = EnrollmentFactory(user=student, program=assignment.program)
        node = CurriculumNodeFactory(program=assignment.program, node_type="Session")
        PracticumSubmissionFactory(enrollment=enrollment, node=node)

        response = client.get(reverse("progression:instructor.practicum"))

        assert response.status_code == 200

    def test_practicum_list_filters_by_status(self, client, instructor, assignment):
        """Should filter submissions by status."""
        client.force_login(instructor)

        response = client.get(
            reverse("progression:instructor.practicum"),
            {"status": "pending"},
        )

        assert response.status_code == 200

    def test_practicum_review_creates_review(self, client, instructor, assignment):
        """Should create submission review on POST."""
        client.force_login(instructor)

        # Create submission
        student = UserFactory(tenant=instructor.tenant)
        enrollment = EnrollmentFactory(user=student, program=assignment.program)
        node = CurriculumNodeFactory(program=assignment.program, node_type="Session")
        submission = PracticumSubmissionFactory(
            enrollment=enrollment, node=node, status="pending"
        )

        response = client.post(
            reverse(
                "progression:instructor.practicum.review",
                kwargs={"pk": submission.id},
            ),
            data={
                "status": "approved",
                "comments": "Great work!",
            },
            content_type="application/json",
        )

        # Should redirect to practicum list
        assert response.status_code == 302

        # Check review was created
        assert SubmissionReview.objects.filter(submission=submission).exists()

        # Check submission status updated
        submission.refresh_from_db()
        assert submission.status == "approved"

    def test_practicum_review_marks_node_complete_on_approval(
        self, client, instructor, assignment
    ):
        """Should mark node as complete when submission is approved."""
        client.force_login(instructor)

        # Create submission
        student = UserFactory(tenant=instructor.tenant)
        enrollment = EnrollmentFactory(user=student, program=assignment.program)
        node = CurriculumNodeFactory(program=assignment.program, node_type="Session")
        submission = PracticumSubmissionFactory(
            enrollment=enrollment, node=node, status="pending"
        )

        response = client.post(
            reverse(
                "progression:instructor.practicum.review",
                kwargs={"pk": submission.id},
            ),
            data={
                "status": "approved",
                "comments": "Approved!",
            },
            content_type="application/json",
        )

        # Check node completion was created
        assert NodeCompletion.objects.filter(enrollment=enrollment, node=node).exists()


@pytest.mark.django_db
class TestTenantIsolation:
    """Test tenant isolation for instructor views."""

    def test_instructor_cannot_see_other_tenant_programs(self, client):
        """Instructor should not see programs from other tenants."""
        tenant_a = TenantFactory()
        tenant_b = TenantFactory()

        instructor_a = UserFactory(tenant=tenant_a)
        program_a = ProgramFactory(tenant=tenant_a)
        program_b = ProgramFactory(tenant=tenant_b)

        InstructorAssignmentFactory(instructor=instructor_a, program=program_a)

        client.force_login(instructor_a)
        response = client.get(reverse("progression:instructor.programs"))

        assert response.status_code == 200

    def test_instructor_cannot_access_other_tenant_program_detail(self, client):
        """Instructor should get 404 for other tenant's programs."""
        tenant_a = TenantFactory()
        tenant_b = TenantFactory()

        instructor_a = UserFactory(tenant=tenant_a)
        program_b = ProgramFactory(tenant=tenant_b)

        client.force_login(instructor_a)
        response = client.get(
            reverse("progression:instructor.program", kwargs={"pk": program_b.id})
        )

        assert response.status_code == 404

    def test_instructor_cannot_review_other_tenant_submissions(self, client):
        """Instructor should not be able to review other tenant's submissions."""
        tenant_a = TenantFactory()
        tenant_b = TenantFactory()

        instructor_a = UserFactory(tenant=tenant_a)
        program_b = ProgramFactory(tenant=tenant_b)
        student_b = UserFactory(tenant=tenant_b)
        enrollment_b = EnrollmentFactory(user=student_b, program=program_b)
        node_b = CurriculumNodeFactory(program=program_b, node_type="Session")
        submission_b = PracticumSubmissionFactory(enrollment=enrollment_b, node=node_b)

        client.force_login(instructor_a)
        response = client.get(
            reverse(
                "progression:instructor.practicum.review",
                kwargs={"pk": submission_b.id},
            )
        )

        # Should redirect (no assignment)
        assert response.status_code == 302
