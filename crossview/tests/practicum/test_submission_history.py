"""
Property tests for submission history.
**Feature: practicum-system, Property 11: Submission History Ordering**
**Validates: Requirements 5.2**
"""
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from django.utils import timezone

from apps.practicum.services import PracticumService
from apps.practicum.models import PracticumSubmission


def create_mock_submission_list(count: int):
    """Create a list of mock submissions with sequential timestamps."""
    submissions = []
    base_time = timezone.now()
    
    for i in range(count):
        submission = Mock(spec=PracticumSubmission)
        submission.id = i + 1
        submission.version = i + 1
        submission.submitted_at = base_time + timedelta(hours=i)
        submission.status = 'pending' if i == count - 1 else 'revision_required'
        submissions.append(submission)
    
    return submissions


@pytest.mark.django_db
class TestSubmissionHistoryOrdering:
    """
    Property tests for submission history ordering.
    **Feature: practicum-system, Property 11: Submission History Ordering**
    **Validates: Requirements 5.2**
    """

    @given(count=st.integers(min_value=1, max_value=10))
    @settings(max_examples=50)
    def test_history_ordered_chronologically(self, count):
        """
        *For any* submission history, submissions SHALL be ordered by submitted_at.
        **Feature: practicum-system, Property 11: Submission History Ordering**
        **Validates: Requirements 5.2**
        """
        service = PracticumService()
        
        enrollment = Mock()
        node = Mock()
        
        # Create mock submissions
        submissions = create_mock_submission_list(count)
        
        with patch.object(PracticumSubmission.objects, 'filter') as mock_filter:
            mock_queryset = MagicMock()
            mock_queryset.prefetch_related.return_value = mock_queryset
            mock_queryset.order_by.return_value = submissions
            mock_filter.return_value = mock_queryset
            
            result = service.get_submission_history(enrollment, node)
            
            # Verify order_by was called with submitted_at
            mock_queryset.order_by.assert_called_with('submitted_at')

    def test_history_includes_reviews(self):
        """History should prefetch reviews for each submission."""
        service = PracticumService()
        
        enrollment = Mock()
        node = Mock()
        
        with patch.object(PracticumSubmission.objects, 'filter') as mock_filter:
            mock_queryset = MagicMock()
            mock_queryset.prefetch_related.return_value = mock_queryset
            mock_queryset.order_by.return_value = []
            mock_filter.return_value = mock_queryset
            
            service.get_submission_history(enrollment, node)
            
            # Verify prefetch_related was called with reviews
            mock_queryset.prefetch_related.assert_called_with('reviews')

    def test_history_filters_by_enrollment_and_node(self):
        """History should filter by enrollment and node."""
        service = PracticumService()
        
        enrollment = Mock()
        enrollment.id = 42
        node = Mock()
        node.id = 99
        
        with patch.object(PracticumSubmission.objects, 'filter') as mock_filter:
            mock_queryset = MagicMock()
            mock_queryset.prefetch_related.return_value = mock_queryset
            mock_queryset.order_by.return_value = []
            mock_filter.return_value = mock_queryset
            
            service.get_submission_history(enrollment, node)
            
            mock_filter.assert_called_with(enrollment=enrollment, node=node)

    def test_empty_history_returns_empty(self):
        """Empty history should return empty queryset."""
        service = PracticumService()
        
        enrollment = Mock()
        node = Mock()
        
        with patch.object(PracticumSubmission.objects, 'filter') as mock_filter:
            mock_queryset = MagicMock()
            mock_queryset.prefetch_related.return_value = mock_queryset
            mock_queryset.order_by.return_value = []
            mock_filter.return_value = mock_queryset
            
            result = service.get_submission_history(enrollment, node)
            
            assert result == []


@pytest.mark.django_db
class TestLatestSubmission:
    """Tests for getting latest submission."""

    def test_get_latest_returns_highest_version(self):
        """Get latest should return submission with highest version."""
        service = PracticumService()
        
        enrollment = Mock()
        node = Mock()
        
        latest = Mock(spec=PracticumSubmission)
        latest.version = 3
        
        with patch.object(PracticumSubmission.objects, 'filter') as mock_filter:
            mock_queryset = MagicMock()
            mock_queryset.order_by.return_value.first.return_value = latest
            mock_filter.return_value = mock_queryset
            
            result = service.get_latest_submission(enrollment, node)
            
            assert result == latest
            mock_queryset.order_by.assert_called_with('-version')

    def test_get_latest_returns_none_when_empty(self):
        """Get latest should return None when no submissions exist."""
        service = PracticumService()
        
        enrollment = Mock()
        node = Mock()
        
        with patch.object(PracticumSubmission.objects, 'filter') as mock_filter:
            mock_queryset = MagicMock()
            mock_queryset.order_by.return_value.first.return_value = None
            mock_filter.return_value = mock_queryset
            
            result = service.get_latest_submission(enrollment, node)
            
            assert result is None
