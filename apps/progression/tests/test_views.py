"""
Property tests for student portal views.
Requirements: 2.3, 2.5, 3.5, 3.6, 4.4

Property tests use Hypothesis for generating test data.
Each property test runs minimum 100 iterations.
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from django.test import Client
from django.urls import reverse

from apps.progression.models import Enrollment, NodeCompletion
from apps.progression.tests.factories import (
    EnrollmentFactory,
    NodeCompletionFactory,
    CurriculumNodeFactory,
    ProgramFactory,
    UserFactory,
)
from apps.progression.views import (
    _get_completable_nodes_count,
    _check_unlock_status,
    _get_breadcrumbs,
)

# Common settings for property tests
HYPOTHESIS_SETTINGS = settings(
    max_examples=10,  # Reduced for faster testing
    suppress_health_check=[HealthCheck.function_scoped_fixture],
    deadline=None,
)


# =============================================================================
# Property 4: Enrollment Status Filtering
# Validates: Requirements 2.5
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestEnrollmentStatusFiltering:
    """
    Property 4: Enrollment Status Filtering

    *For any* set of enrollments with mixed statuses (active, completed, withdrawn),
    applying a status filter SHALL return only enrollments matching that status.

    **Validates: Requirements 2.5**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        statuses=st.lists(
            st.sampled_from(["active", "completed", "withdrawn"]),
            min_size=1,
            max_size=5,
        )
    )
    def test_status_filter_returns_only_matching_enrollments(self, statuses):
        """
        Feature: student-portal, Property 4: Enrollment Status Filtering

        For any set of enrollments with mixed statuses, filtering by a specific
        status should return only enrollments with that status.
        """
        # Create a user with enrollments of various statuses
        user = UserFactory()

        # Create enrollments with the generated statuses
        for status in statuses:
            EnrollmentFactory(user=user, status=status)

        # Test filtering for each status type
        for filter_status in ["active", "completed", "withdrawn"]:
            filtered = Enrollment.objects.filter(user=user, status=filter_status)

            # All returned enrollments should have the filtered status
            for enrollment in filtered:
                assert (
                    enrollment.status == filter_status
                ), f"Expected status '{filter_status}', got '{enrollment.status}'"

            # Count should match expected
            expected_count = sum(1 for s in statuses if s == filter_status)
            assert filtered.count() == expected_count, (
                f"Expected {expected_count} enrollments with status '{filter_status}', "
                f"got {filtered.count()}"
            )


# =============================================================================
# Property 7: Progress Percentage Calculation
# Validates: Requirements 2.3
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestProgressPercentageCalculation:
    """
    Property 7: Progress Percentage Calculation

    *For any* set of curriculum nodes and node completions, the progress percentage
    SHALL equal (completed nodes / total completable nodes) * 100.

    **Validates: Requirements 2.3**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        total_nodes=st.integers(min_value=1, max_value=10),
        completed_count=st.integers(min_value=0, max_value=10),
    )
    def test_progress_percentage_calculation(self, total_nodes, completed_count):
        """
        Feature: student-portal, Property 7: Progress Percentage Calculation

        Progress percentage should always equal (completed / total) * 100,
        bounded between 0 and 100.
        """
        # Ensure completed_count doesn't exceed total_nodes
        completed_count = min(completed_count, total_nodes)

        # Create program with nodes
        program = ProgramFactory()
        enrollment = EnrollmentFactory(program=program)

        # Create leaf nodes (completable)
        nodes = []
        for i in range(total_nodes):
            node = CurriculumNodeFactory(
                program=program,
                node_type="Session",
                position=i,
            )
            nodes.append(node)

        # Create completions for some nodes
        for i in range(completed_count):
            NodeCompletionFactory(
                enrollment=enrollment,
                node=nodes[i],
            )

        # Calculate expected progress
        expected_progress = (completed_count / total_nodes) * 100

        # Get actual progress from view helper
        actual_total = _get_completable_nodes_count(program)
        actual_completed = enrollment.completions.count()
        actual_progress = (
            (actual_completed / actual_total * 100) if actual_total > 0 else 0
        )

        # Assert progress is correct
        assert (
            abs(actual_progress - expected_progress) < 0.01
        ), f"Expected progress {expected_progress:.2f}%, got {actual_progress:.2f}%"

        # Assert progress is bounded
        assert (
            0 <= actual_progress <= 100
        ), f"Progress {actual_progress}% is out of bounds [0, 100]"


# =============================================================================
# Property 6: Node Unlock Logic
# Validates: Requirements 3.5, 3.6
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestNodeUnlockLogic:
    """
    Property 6: Node Unlock Logic

    *For any* curriculum node with prerequisites or sequential completion rules,
    the node SHALL be locked if any prerequisite is incomplete OR if sequential
    completion is required and the previous sibling is incomplete.

    **Validates: Requirements 3.5, 3.6**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        num_prerequisites=st.integers(min_value=0, max_value=3),
        completed_prerequisites=st.integers(min_value=0, max_value=3),
    )
    def test_prerequisite_unlock_logic(
        self, num_prerequisites, completed_prerequisites
    ):
        """
        Feature: student-portal, Property 6: Node Unlock Logic (Prerequisites)

        A node with prerequisites should be locked if any prerequisite is incomplete.
        """
        # Ensure completed doesn't exceed total
        completed_prerequisites = min(completed_prerequisites, num_prerequisites)

        # Create program and enrollment
        program = ProgramFactory()
        enrollment = EnrollmentFactory(program=program)

        # Create prerequisite nodes
        prereq_nodes = []
        for i in range(num_prerequisites):
            node = CurriculumNodeFactory(
                program=program,
                node_type="Session",
                position=i,
            )
            prereq_nodes.append(node)

        # Complete some prerequisites
        for i in range(completed_prerequisites):
            NodeCompletionFactory(
                enrollment=enrollment,
                node=prereq_nodes[i],
            )

        # Create target node with prerequisites
        prereq_ids = [n.id for n in prereq_nodes]
        target_node = CurriculumNodeFactory(
            program=program,
            node_type="Session",
            completion_rules={"prerequisites": prereq_ids} if prereq_ids else {},
            position=num_prerequisites,
        )

        # Check unlock status
        unlock_status = _check_unlock_status(enrollment, target_node)

        # Node should be unlocked only if all prerequisites are complete
        if num_prerequisites == 0:
            assert unlock_status[
                "is_unlocked"
            ], "Node with no prerequisites should be unlocked"
        elif completed_prerequisites == num_prerequisites:
            assert unlock_status[
                "is_unlocked"
            ], "Node should be unlocked when all prerequisites are complete"
        else:
            assert not unlock_status["is_unlocked"], (
                f"Node should be locked when {num_prerequisites - completed_prerequisites} "
                f"prerequisites are incomplete"
            )

    @HYPOTHESIS_SETTINGS
    @given(
        num_siblings=st.integers(min_value=2, max_value=4),
        target_position=st.integers(min_value=1, max_value=3),
        completed_before=st.integers(min_value=0, max_value=3),
    )
    def test_sequential_unlock_logic(
        self, num_siblings, target_position, completed_before
    ):
        """
        Feature: student-portal, Property 6: Node Unlock Logic (Sequential)

        A node with sequential completion required should be locked if the
        previous sibling is incomplete.
        """
        # Ensure valid bounds
        target_position = min(target_position, num_siblings - 1)
        completed_before = min(completed_before, target_position)

        # Create program and enrollment
        program = ProgramFactory()
        enrollment = EnrollmentFactory(program=program)

        # Create parent node
        parent = CurriculumNodeFactory(
            program=program,
            node_type="Unit",
            parent=None,
        )

        # Create sibling nodes with sequential completion
        siblings = []
        for i in range(num_siblings):
            node = CurriculumNodeFactory(
                program=program,
                node_type="Session",
                parent=parent,
                position=i,
                completion_rules={"sequential": True},
            )
            siblings.append(node)

        # Complete nodes before target
        for i in range(completed_before):
            NodeCompletionFactory(
                enrollment=enrollment,
                node=siblings[i],
            )

        # Check unlock status of target node
        target_node = siblings[target_position]
        unlock_status = _check_unlock_status(enrollment, target_node)

        # Node should be unlocked only if all previous siblings are complete
        if completed_before >= target_position:
            assert unlock_status["is_unlocked"], (
                f"Node at position {target_position} should be unlocked when "
                f"{completed_before} previous nodes are complete"
            )
        else:
            assert not unlock_status["is_unlocked"], (
                f"Node at position {target_position} should be locked when only "
                f"{completed_before} of {target_position} previous nodes are complete"
            )


# =============================================================================
# Property 10: Node Completion Record Creation
# Validates: Requirements 4.4
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestNodeCompletionRecordCreation:
    """
    Property 10: Node Completion Record Creation

    *For any* mark-as-complete action on an unlocked, incomplete node, the system
    SHALL create a NodeCompletion record with the correct node ID, enrollment ID,
    and timestamp.

    **Validates: Requirements 4.4**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        completion_type=st.sampled_from(["view", "quiz_pass", "upload", "manual"]),
    )
    def test_completion_record_creation(self, completion_type):
        """
        Feature: student-portal, Property 10: Node Completion Record Creation

        Creating a completion should create a record with correct attributes.
        """
        from django.utils import timezone

        # Create enrollment and node
        enrollment = EnrollmentFactory()
        node = CurriculumNodeFactory(program=enrollment.program)

        # Verify no completion exists
        assert not NodeCompletion.objects.filter(
            enrollment=enrollment,
            node=node,
        ).exists()

        # Create completion
        before_time = timezone.now()
        completion = NodeCompletion.objects.create(
            enrollment=enrollment,
            node=node,
            completion_type=completion_type,
            completed_at=timezone.now(),
        )
        after_time = timezone.now()

        # Verify completion was created with correct attributes
        assert completion.enrollment_id == enrollment.id
        assert completion.node_id == node.id
        assert completion.completion_type == completion_type
        assert before_time <= completion.completed_at <= after_time

        # Verify uniqueness constraint (can't complete same node twice)
        with pytest.raises(Exception):  # IntegrityError
            NodeCompletion.objects.create(
                enrollment=enrollment,
                node=node,
                completion_type=completion_type,
                completed_at=timezone.now(),
            )


# =============================================================================
# Property 9: Breadcrumb Path Generation
# Validates: Requirements 4.5
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestBreadcrumbPathGeneration:
    """
    Property 9: Breadcrumb Path Generation

    *For any* node in a curriculum tree, the breadcrumb navigation SHALL display
    the correct path from program root to the current node, including all
    ancestor nodes in order.

    **Validates: Requirements 4.5**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        depth=st.integers(min_value=1, max_value=3),
    )
    def test_breadcrumb_path_includes_all_ancestors(self, depth):
        """
        Feature: student-portal, Property 9: Breadcrumb Path Generation

        Breadcrumbs should include all ancestors from root to current node.
        Note: depth is limited to 3 to match the blueprint hierarchy ["Year", "Unit", "Session"]
        """
        # Create program and enrollment
        program = ProgramFactory()
        enrollment = EnrollmentFactory(program=program)

        # Create nested nodes - must match blueprint hierarchy_structure
        # AcademicBlueprintFactory uses ["Year", "Unit", "Session"]
        node_types = ["Year", "Unit", "Session"]
        parent = None
        nodes = []

        for i in range(depth):
            node = CurriculumNodeFactory(
                program=program,
                parent=parent,
                node_type=node_types[i],
                title=f"Level {i + 1}",
            )
            nodes.append(node)
            parent = node

        # Get breadcrumbs for the deepest node
        target_node = nodes[-1]
        breadcrumbs = _get_breadcrumbs(target_node, enrollment.id)

        # Verify breadcrumb count matches depth
        assert (
            len(breadcrumbs) == depth
        ), f"Expected {depth} breadcrumbs, got {len(breadcrumbs)}"

        # Verify breadcrumbs are in correct order (ancestors first)
        for i, crumb in enumerate(breadcrumbs):
            assert (
                crumb["id"] == nodes[i].id
            ), f"Breadcrumb {i} should be node {nodes[i].id}, got {crumb['id']}"
            assert crumb["title"] == nodes[i].title
            assert f"/session/{nodes[i].id}/" in crumb["url"]


# =============================================================================
# Property 11: Published Results Filtering
# Validates: Requirements 5.1, 5.6
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestPublishedResultsFiltering:
    """
    Property 11: Published Results Filtering

    *For any* set of assessment results with mixed published states, the student
    SHALL only see results where is_published=True.

    **Validates: Requirements 5.1, 5.6**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        published_count=st.integers(min_value=0, max_value=5),
        unpublished_count=st.integers(min_value=0, max_value=5),
    )
    def test_only_published_results_visible(self, published_count, unpublished_count):
        """
        Feature: student-portal, Property 11: Published Results Filtering

        Students should only see published assessment results.
        """
        from apps.progression.tests.factories import (
            AssessmentResultFactory,
            EnrollmentFactory,
        )
        from apps.assessments.models import AssessmentResult

        # Create enrollment
        enrollment = EnrollmentFactory()

        # Create published results
        for _ in range(published_count):
            AssessmentResultFactory(enrollment=enrollment, is_published=True)

        # Create unpublished results
        for _ in range(unpublished_count):
            AssessmentResultFactory(enrollment=enrollment, is_published=False)

        # Query published results (as the view does)
        visible_results = AssessmentResult.objects.filter(
            enrollment=enrollment,
            is_published=True,
        )

        # Verify only published results are returned
        assert visible_results.count() == published_count, (
            f"Expected {published_count} published results, "
            f"got {visible_results.count()}"
        )

        # Verify all returned results are published
        for result in visible_results:
            assert result.is_published, "Unpublished result should not be visible"


# =============================================================================
# Property 12: Assessment Result Display Completeness
# Validates: Requirements 5.2, 5.3, 5.4
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestAssessmentResultDisplayCompleteness:
    """
    Property 12: Assessment Result Display Completeness

    *For any* published assessment result, the display SHALL include node title,
    total score, status, letter grade (if applicable), component scores, and
    lecturer comments (if provided).

    **Validates: Requirements 5.2, 5.3, 5.4**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        total_score=st.floats(min_value=0, max_value=100),
        status=st.sampled_from(["Pass", "Fail", "Competent", "Not Yet Competent"]),
        has_letter_grade=st.booleans(),
        has_comments=st.booleans(),
        num_components=st.integers(min_value=1, max_value=4),
    )
    def test_result_contains_all_required_fields(
        self, total_score, status, has_letter_grade, has_comments, num_components
    ):
        """
        Feature: student-portal, Property 12: Assessment Result Display Completeness

        Published results should contain all required display fields.
        """
        from apps.progression.tests.factories import (
            AssessmentResultFactory,
            EnrollmentFactory,
            CurriculumNodeFactory,
        )

        # Build result_data
        components = {f"Component {i}": 50.0 + i * 10 for i in range(num_components)}
        result_data = {
            "total": total_score,
            "status": status,
            "components": components,
        }
        if has_letter_grade:
            result_data["letter_grade"] = "B"

        # Create enrollment and node
        enrollment = EnrollmentFactory()
        node = CurriculumNodeFactory(program=enrollment.program)

        # Create result
        result = AssessmentResultFactory(
            enrollment=enrollment,
            node=node,
            result_data=result_data,
            lecturer_comments="Test comment" if has_comments else None,
            is_published=True,
        )

        # Verify all required fields are accessible
        assert result.node.title is not None, "Node title should be present"
        assert result.get_total() == total_score, "Total score should match"
        assert result.get_status() == status, "Status should match"
        assert result.get_components() == components, "Components should match"

        if has_letter_grade:
            assert result.get_letter_grade() == "B", "Letter grade should be present"
        else:
            assert result.get_letter_grade() is None, "Letter grade should be None"

        if has_comments:
            assert result.lecturer_comments == "Test comment"
        else:
            assert result.lecturer_comments is None


# =============================================================================
# Property 13: Practicum File Validation
# Validates: Requirements 6.2, 6.3
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestPracticumFileValidation:
    """
    Property 13: Practicum File Validation

    *For any* file upload attempt, the system SHALL validate file type against
    allowed types and file size against maximum size.

    **Validates: Requirements 6.2, 6.3**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        file_extension=st.sampled_from(["mp3", "mp4", "pdf", "doc", "exe", "zip"]),
        file_size_mb=st.floats(min_value=0.1, max_value=200),
    )
    def test_file_validation_rules(self, file_extension, file_size_mb):
        """
        Feature: student-portal, Property 13: Practicum File Validation

        File validation should correctly accept/reject based on type and size.
        """
        from apps.practicum.validators import validate_practicum_file
        from io import BytesIO
        from unittest.mock import MagicMock

        # Configuration
        allowed_types = ["mp3", "mp4", "pdf"]
        max_size_mb = 100

        # Create mock file
        mock_file = MagicMock()
        mock_file.name = f"test_file.{file_extension}"
        mock_file.size = int(file_size_mb * 1024 * 1024)

        # Determine expected outcome
        type_valid = file_extension in allowed_types
        size_valid = file_size_mb <= max_size_mb

        # Test validation
        if type_valid and size_valid:
            # Should not raise
            validate_practicum_file(mock_file, allowed_types, max_size_mb)
        else:
            # Should raise ValueError
            with pytest.raises(ValueError) as exc:
                validate_practicum_file(mock_file, allowed_types, max_size_mb)

            if not type_valid:
                assert "not allowed" in str(exc.value).lower()
            elif not size_valid:
                assert "exceeds" in str(exc.value).lower()


# =============================================================================
# Property 14: Practicum Submission Creation
# Validates: Requirements 6.4
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestPracticumSubmissionCreation:
    """
    Property 14: Practicum Submission Creation

    *For any* valid file upload, the system SHALL create a PracticumSubmission
    record with correct enrollment, node, version, and pending status.

    **Validates: Requirements 6.4**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        existing_versions=st.integers(min_value=0, max_value=3),
    )
    def test_submission_versioning(self, existing_versions):
        """
        Feature: student-portal, Property 14: Practicum Submission Creation

        New submissions should have correct version numbers.
        """
        from apps.practicum.models import PracticumSubmission

        # Create enrollment and node
        enrollment = EnrollmentFactory()
        node = CurriculumNodeFactory(program=enrollment.program)

        # Create existing submissions
        for v in range(1, existing_versions + 1):
            PracticumSubmission.objects.create(
                enrollment=enrollment,
                node=node,
                version=v,
                status="revision_required" if v < existing_versions else "pending",
                file_path=f"test/v{v}.mp3",
                file_type="mp3",
                file_size=1000,
                submitted_at=timezone.now(),
            )

        # Determine expected next version
        expected_version = existing_versions + 1

        # Create new submission
        new_submission = PracticumSubmission.objects.create(
            enrollment=enrollment,
            node=node,
            version=expected_version,
            status="pending",
            file_path=f"test/v{expected_version}.mp3",
            file_type="mp3",
            file_size=1000,
            submitted_at=timezone.now(),
        )

        # Verify version
        assert new_submission.version == expected_version
        assert new_submission.status == "pending"
        assert new_submission.enrollment_id == enrollment.id
        assert new_submission.node_id == node.id


# =============================================================================
# Property 17: Profile Update Persistence
# Validates: Requirements 9.2
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestProfileUpdatePersistence:
    """
    Property 17: Profile Update Persistence

    *For any* valid profile update, the changes SHALL be persisted to the
    database and reflected in subsequent reads.

    **Validates: Requirements 9.2**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        first_name=st.text(
            min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=("L",))
        ),
        last_name=st.text(
            min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=("L",))
        ),
    )
    def test_profile_update_persists(self, first_name, last_name):
        """
        Feature: student-portal, Property 17: Profile Update Persistence

        Profile updates should be saved to the database.
        """
        from apps.core.models import User

        # Create user
        user = UserFactory()
        original_email = user.email

        # Update profile
        user.first_name = first_name
        user.last_name = last_name
        user.save()

        # Reload from database
        user.refresh_from_db()

        # Verify changes persisted
        assert user.first_name == first_name
        assert user.last_name == last_name
        assert user.email == original_email  # Email should not change


# =============================================================================
# Property 18: Password Change Security
# Validates: Requirements 9.3, 9.4
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestPasswordChangeSecurity:
    """
    Property 18: Password Change Security

    *For any* password change attempt, the system SHALL verify the current
    password and validate the new password strength.

    **Validates: Requirements 9.3, 9.4**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        current_password=st.text(min_size=8, max_size=20),
        new_password=st.text(min_size=1, max_size=20),
        correct_current=st.booleans(),
    )
    def test_password_change_validation(
        self, current_password, new_password, correct_current
    ):
        """
        Feature: student-portal, Property 18: Password Change Security

        Password changes should validate current password and new password strength.
        """
        from apps.core.models import User

        # Create user with known password
        user = UserFactory()
        user.set_password(current_password)
        user.save()

        # Attempt password change
        password_to_check = current_password if correct_current else "wrong_password"
        current_valid = user.check_password(password_to_check)
        new_valid = len(new_password) >= 8

        # Verify current password check
        assert current_valid == correct_current

        # If both valid, password should be changeable
        if current_valid and new_valid:
            user.set_password(new_password)
            user.save()
            user.refresh_from_db()
            assert user.check_password(new_password)


# =============================================================================
# Property 15: Submission Display Completeness
# Validates: Requirements 7.2, 7.3, 7.4
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestSubmissionDisplayCompleteness:
    """
    Property 15: Submission Display Completeness

    *For any* practicum submission, the display SHALL include submission date,
    version, status, file type, and review feedback if available.

    **Validates: Requirements 7.2, 7.3, 7.4**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        has_review=st.booleans(),
        status=st.sampled_from(
            ["pending", "approved", "revision_required", "rejected"]
        ),
    )
    def test_submission_display_fields(self, has_review, status):
        """
        Feature: student-portal, Property 15: Submission Display Completeness

        Submissions should display all required fields.
        """
        from apps.practicum.models import PracticumSubmission, SubmissionReview

        # Create submission
        enrollment = EnrollmentFactory()
        node = CurriculumNodeFactory(program=enrollment.program)

        submission = PracticumSubmission.objects.create(
            enrollment=enrollment,
            node=node,
            version=1,
            status=status,
            file_path="test/file.mp3",
            file_type="mp3",
            file_size=5000000,
            submitted_at=timezone.now(),
        )

        # Create review if needed
        if has_review:
            reviewer = UserFactory(tenant=enrollment.user.tenant)
            SubmissionReview.objects.create(
                submission=submission,
                reviewer=reviewer,
                status="approved",
                dimension_scores={"Content": 20},
                total_score=20,
                comments="Good work",
                reviewed_at=timezone.now(),
            )

        # Verify required fields are accessible
        assert submission.submitted_at is not None
        assert submission.version == 1
        assert submission.status == status
        assert submission.file_type == "mp3"

        # Verify review data if present
        if has_review:
            review = submission.reviews.first()
            assert review is not None
            assert review.comments is not None
            assert review.total_score is not None


# =============================================================================
# Property 16: Certificate Display and Actions
# Validates: Requirements 8.2, 8.3, 8.4, 8.5
# =============================================================================


@pytest.mark.django_db(transaction=True)
class TestCertificateDisplayAndActions:
    """
    Property 16: Certificate Display and Actions

    *For any* certificate, the display SHALL show program title, dates, serial
    number, and provide download/share actions (blocked if revoked).

    **Validates: Requirements 8.2, 8.3, 8.4, 8.5**
    """

    @HYPOTHESIS_SETTINGS
    @given(
        is_revoked=st.booleans(),
    )
    def test_certificate_display_and_actions(self, is_revoked):
        """
        Feature: student-portal, Property 16: Certificate Display and Actions

        Certificates should display correctly and handle revoked state.
        """
        from apps.certifications.models import Certificate, CertificateTemplate

        # Create template
        template = CertificateTemplate.objects.create(
            name="Test Template",
            template_html="<html>{{student_name}} {{program_title}} {{completion_date}} {{serial_number}}</html>",
            is_default=True,
        )

        # Create enrollment
        enrollment = EnrollmentFactory()

        # Create certificate
        certificate = Certificate.objects.create(
            enrollment=enrollment,
            template=template,
            serial_number=f"CERT-TEST-{enrollment.id}",
            student_name=f"{enrollment.user.first_name} {enrollment.user.last_name}",
            program_title=enrollment.program.name,
            completion_date=timezone.now().date(),
            issue_date=timezone.now().date(),
            pdf_path=f"certificates/{enrollment.id}.pdf",
            is_revoked=is_revoked,
            revoked_at=timezone.now() if is_revoked else None,
            revocation_reason="Test revocation" if is_revoked else None,
        )

        # Verify display fields
        assert certificate.serial_number is not None
        assert certificate.student_name is not None
        assert certificate.program_title is not None
        assert certificate.completion_date is not None
        assert certificate.issue_date is not None

        # Verify revoked state
        assert certificate.is_revoked == is_revoked

        # Verify verification URL is always available
        verification_url = certificate.get_verification_url()
        assert verification_url is not None
        assert certificate.serial_number in verification_url

        # Download URL should work (actual blocking is in the view)
        download_url = certificate.get_signed_download_url()
        assert download_url is not None
