"""
Property tests for review workflow.
**Feature: practicum-system, Property 6: Review Persistence**
**Feature: practicum-system, Property 8: Review Status Transitions**
**Feature: practicum-system, Property 9: Approval Triggers Completion**
**Feature: practicum-system, Property 1: Practicum Blocks Completion Without Submission**
**Validates: Requirements 1.1, 3.3, 4.2, 4.3, 4.4**
"""
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal

from apps.practicum.services import PracticumService, RubricService
from apps.practicum.models import PracticumSubmission, SubmissionReview
from apps.assessments.models import Rubric
from apps.practicum.exceptions import InvalidReviewException


# Strategies for review testing
status_strategy = st.sampled_from(['approved', 'revision_required', 'rejected'])
score_strategy = st.integers(min_value=0, max_value=10)
comments_strategy = st.text(min_size=1, max_size=500)


def create_mock_submission(status='pending', node_completion_rules=None):
    """Create a mock submission."""
    submission = Mock(spec=PracticumSubmission)
    submission.id = 1
    submission.status = status
    submission.save = Mock()
    
    node = Mock()
    node.completion_rules = node_completion_rules or {'type': 'practicum'}
    submission.node = node
    
    enrollment = Mock()
    enrollment.id = 1
    submission.enrollment = enrollment
    
    return submission


def create_mock_reviewer():
    """Create a mock reviewer."""
    reviewer = Mock()
    reviewer.id = 1
    return reviewer


@pytest.mark.django_db
class TestReviewPersistence:
    """
    Property tests for review persistence.
    **Feature: practicum-system, Property 6: Review Persistence**
    **Validates: Requirements 3.3**
    """

    @given(
        status=status_strategy,
        comments=comments_strategy,
    )
    @settings(max_examples=50)
    def test_review_stores_status_and_comments(self, status, comments):
        """
        *For any* review, the status and comments SHALL be persisted.
        **Feature: practicum-system, Property 6: Review Persistence**
        **Validates: Requirements 3.3**
        """
        service = PracticumService()
        submission = create_mock_submission()
        reviewer = create_mock_reviewer()
        
        with patch.object(SubmissionReview.objects, 'create') as mock_create:
            mock_review = Mock()
            mock_review.status = status
            mock_review.comments = comments
            mock_create.return_value = mock_review
            
            # For rejected status, comments are required
            review = service.review_submission(
                submission=submission,
                reviewer=reviewer,
                status=status,
                comments=comments
            )
            
            call_kwargs = mock_create.call_args[1]
            assert call_kwargs['status'] == status
            assert call_kwargs['comments'] == comments

    @given(
        score1=score_strategy,
        score2=score_strategy,
    )
    @settings(max_examples=50)
    def test_review_stores_dimension_scores(self, score1, score2):
        """
        *For any* review with dimension scores, scores SHALL be persisted.
        **Feature: practicum-system, Property 6: Review Persistence**
        **Validates: Requirements 3.3**
        """
        service = PracticumService()
        submission = create_mock_submission(
            node_completion_rules={'type': 'practicum', 'rubric_id': 1}
        )
        reviewer = create_mock_reviewer()
        
        dimension_scores = {
            'introduction': score1,
            'body': score2,
        }
        
        with patch.object(SubmissionReview.objects, 'create') as mock_create, \
             patch.object(Rubric.objects, 'get') as mock_rubric_get:
            
            mock_rubric = Mock(spec=Rubric)
            mock_rubric.dimensions = [
                {'name': 'introduction', 'weight': 0.5, 'max_score': 10},
                {'name': 'body', 'weight': 0.5, 'max_score': 10},
            ]
            mock_rubric.calculate_score = Rubric.calculate_score.__get__(mock_rubric, Rubric)
            mock_rubric_get.return_value = mock_rubric
            
            mock_review = Mock()
            mock_create.return_value = mock_review
            
            service.review_submission(
                submission=submission,
                reviewer=reviewer,
                status='approved',
                dimension_scores=dimension_scores,
                comments='Good work'
            )
            
            call_kwargs = mock_create.call_args[1]
            assert call_kwargs['dimension_scores'] == dimension_scores


@pytest.mark.django_db
class TestReviewStatusTransitions:
    """
    Property tests for review status transitions.
    **Feature: practicum-system, Property 8: Review Status Transitions**
    **Validates: Requirements 4.2, 4.3, 4.4**
    """

    @given(status=status_strategy)
    @settings(max_examples=30)
    def test_review_updates_submission_status(self, status):
        """
        *For any* review, the submission status SHALL be updated to match.
        **Feature: practicum-system, Property 8: Review Status Transitions**
        **Validates: Requirements 4.2, 4.3, 4.4**
        """
        service = PracticumService()
        submission = create_mock_submission()
        reviewer = create_mock_reviewer()
        
        # For rejected status, comments are required
        comments = 'Required feedback' if status == 'rejected' else None
        
        with patch.object(SubmissionReview.objects, 'create') as mock_create:
            mock_create.return_value = Mock()
            
            service.review_submission(
                submission=submission,
                reviewer=reviewer,
                status=status,
                comments=comments
            )
            
            # Submission status should be updated
            assert submission.status == status
            submission.save.assert_called()

    def test_rejection_requires_comments(self):
        """Rejection without comments should raise exception."""
        service = PracticumService()
        submission = create_mock_submission()
        reviewer = create_mock_reviewer()
        
        with pytest.raises(InvalidReviewException) as exc_info:
            service.review_submission(
                submission=submission,
                reviewer=reviewer,
                status='rejected',
                comments=None  # No comments
            )
        
        assert 'comment' in str(exc_info.value).lower()

    def test_invalid_status_raises_exception(self):
        """Invalid status should raise exception."""
        service = PracticumService()
        submission = create_mock_submission()
        reviewer = create_mock_reviewer()
        
        with pytest.raises(InvalidReviewException) as exc_info:
            service.review_submission(
                submission=submission,
                reviewer=reviewer,
                status='invalid_status'
            )
        
        assert 'status' in str(exc_info.value).lower()


@pytest.mark.django_db
class TestApprovalTriggersCompletion:
    """
    Property tests for approval triggering completion.
    **Feature: practicum-system, Property 9: Approval Triggers Completion**
    **Validates: Requirements 4.2**
    """

    def test_approval_triggers_progression_engine(self):
        """
        *For any* approved submission, the progression engine SHALL be triggered.
        **Feature: practicum-system, Property 9: Approval Triggers Completion**
        **Validates: Requirements 4.2**
        """
        mock_progression = Mock()
        mock_progression.mark_complete = Mock()
        
        service = PracticumService(progression_engine=mock_progression)
        submission = create_mock_submission()
        reviewer = create_mock_reviewer()
        
        with patch.object(SubmissionReview.objects, 'create') as mock_create:
            mock_create.return_value = Mock()
            
            service.review_submission(
                submission=submission,
                reviewer=reviewer,
                status='approved'
            )
            
            mock_progression.mark_complete.assert_called_once_with(
                submission.enrollment,
                submission.node,
                'upload'
            )

    def test_revision_required_does_not_trigger_completion(self):
        """Revision required should not trigger completion."""
        mock_progression = Mock()
        mock_progression.mark_complete = Mock()
        
        service = PracticumService(progression_engine=mock_progression)
        submission = create_mock_submission()
        reviewer = create_mock_reviewer()
        
        with patch.object(SubmissionReview.objects, 'create') as mock_create:
            mock_create.return_value = Mock()
            
            service.review_submission(
                submission=submission,
                reviewer=reviewer,
                status='revision_required'
            )
            
            mock_progression.mark_complete.assert_not_called()

    def test_rejection_does_not_trigger_completion(self):
        """Rejection should not trigger completion."""
        mock_progression = Mock()
        mock_progression.mark_complete = Mock()
        
        service = PracticumService(progression_engine=mock_progression)
        submission = create_mock_submission()
        reviewer = create_mock_reviewer()
        
        with patch.object(SubmissionReview.objects, 'create') as mock_create:
            mock_create.return_value = Mock()
            
            service.review_submission(
                submission=submission,
                reviewer=reviewer,
                status='rejected',
                comments='Not acceptable'
            )
            
            mock_progression.mark_complete.assert_not_called()


@pytest.mark.django_db
class TestPracticumBlocksCompletion:
    """
    Property tests for practicum blocking completion.
    **Feature: practicum-system, Property 1: Practicum Blocks Completion Without Submission**
    **Validates: Requirements 1.1**
    """

    def test_no_approved_submission_blocks_completion(self):
        """
        *For any* practicum node without approved submission, completion SHALL be blocked.
        **Feature: practicum-system, Property 1: Practicum Blocks Completion Without Submission**
        **Validates: Requirements 1.1**
        """
        service = PracticumService()
        
        enrollment = Mock()
        node = Mock()
        
        with patch.object(PracticumSubmission.objects, 'filter') as mock_filter:
            mock_filter.return_value.exists.return_value = False
            
            result = service.has_approved_submission(enrollment, node)
            
            assert result is False

    def test_approved_submission_allows_completion(self):
        """Approved submission should allow completion."""
        service = PracticumService()
        
        enrollment = Mock()
        node = Mock()
        
        with patch.object(PracticumSubmission.objects, 'filter') as mock_filter:
            mock_filter.return_value.exists.return_value = True
            
            result = service.has_approved_submission(enrollment, node)
            
            assert result is True
            mock_filter.assert_called_with(
                enrollment=enrollment,
                node=node,
                status='approved'
            )

    def test_pending_submission_blocks_completion(self):
        """Pending submission should not allow completion."""
        service = PracticumService()
        
        enrollment = Mock()
        node = Mock()
        
        with patch.object(PracticumSubmission.objects, 'filter') as mock_filter:
            # No approved submissions exist
            mock_filter.return_value.exists.return_value = False
            
            result = service.has_approved_submission(enrollment, node)
            
            assert result is False
