"""
Property tests for submission creation.
**Feature: practicum-system, Property 4: Submission Record Creation**
**Feature: practicum-system, Property 7: Default Pending Status**
**Feature: practicum-system, Property 10: Resubmission Creates New Version**
**Validates: Requirements 2.5, 4.1, 4.5**
"""
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import Mock, MagicMock, patch
from io import BytesIO
from decimal import Decimal

from apps.practicum.services import PracticumService, RubricService
from apps.practicum.models import PracticumSubmission
from apps.practicum.exceptions import InvalidFileException


# Strategies for submission testing
file_size_strategy = st.integers(min_value=1024, max_value=10 * 1024 * 1024)  # 1KB to 10MB
duration_strategy = st.integers(min_value=1, max_value=600)  # Up to 10 minutes


def create_mock_file(content_type='audio/mp3', size=1024, name='test.mp3'):
    """Create a mock uploaded file."""
    mock_file = Mock()
    mock_file.content_type = content_type
    mock_file.size = size
    mock_file.name = name
    return mock_file


def create_mock_enrollment(user_id=1):
    """Create a mock enrollment."""
    enrollment = Mock()
    enrollment.id = 1
    enrollment.user_id = user_id
    return enrollment


def create_mock_node(completion_rules=None):
    """Create a mock curriculum node."""
    node = Mock()
    node.id = 1
    node.completion_rules = completion_rules or {
        'type': 'practicum',
        'evidence_types': ['audio', 'video'],
        'max_file_size_mb': 50,
        'max_duration_seconds': 600,
    }
    return node


@pytest.mark.django_db
class TestSubmissionRecordCreation:
    """
    Property tests for submission record creation.
    **Feature: practicum-system, Property 4: Submission Record Creation**
    **Validates: Requirements 2.5**
    """

    @given(
        file_size=file_size_strategy,
        duration=duration_strategy,
    )
    @settings(max_examples=50)
    def test_submission_stores_file_metadata(self, file_size, duration):
        """
        *For any* valid file upload, the submission SHALL store file metadata correctly.
        **Feature: practicum-system, Property 4: Submission Record Creation**
        **Validates: Requirements 2.5**
        """
        # Mock storage to avoid actual file operations
        mock_storage = Mock()
        mock_storage.store = Mock(return_value=f"practicum/1/1/test_{file_size}.mp3")
        
        service = PracticumService(storage_service=mock_storage)
        
        mock_file = create_mock_file(size=file_size)
        enrollment = create_mock_enrollment()
        node = create_mock_node()
        
        with patch.object(PracticumSubmission.objects, 'create') as mock_create:
            mock_submission = Mock()
            mock_submission.file_size = file_size
            mock_submission.file_type = 'audio/mp3'
            mock_submission.duration_seconds = duration
            mock_create.return_value = mock_submission
            
            submission = service.create_submission(
                enrollment=enrollment,
                node=node,
                file=mock_file,
                duration_seconds=duration
            )
            
            # Verify create was called with correct metadata
            call_kwargs = mock_create.call_args[1]
            assert call_kwargs['file_size'] == file_size
            assert call_kwargs['file_type'] == 'audio/mp3'
            assert call_kwargs['duration_seconds'] == duration

    def test_submission_stores_enrollment_and_node(self):
        """Submission should store enrollment and node references."""
        mock_storage = Mock()
        mock_storage.store = Mock(return_value="practicum/1/1/test.mp3")
        
        service = PracticumService(storage_service=mock_storage)
        
        mock_file = create_mock_file()
        enrollment = create_mock_enrollment()
        node = create_mock_node()
        
        with patch.object(PracticumSubmission.objects, 'create') as mock_create:
            mock_create.return_value = Mock()
            
            service.create_submission(
                enrollment=enrollment,
                node=node,
                file=mock_file
            )
            
            call_kwargs = mock_create.call_args[1]
            assert call_kwargs['enrollment'] == enrollment
            assert call_kwargs['node'] == node


@pytest.mark.django_db
class TestDefaultPendingStatus:
    """
    Property tests for default pending status.
    **Feature: practicum-system, Property 7: Default Pending Status**
    **Validates: Requirements 4.1**
    """

    @given(file_size=file_size_strategy)
    @settings(max_examples=50)
    def test_new_submission_has_pending_status(self, file_size):
        """
        *For any* new submission, the status SHALL be set to "pending".
        **Feature: practicum-system, Property 7: Default Pending Status**
        **Validates: Requirements 4.1**
        """
        mock_storage = Mock()
        mock_storage.store = Mock(return_value="practicum/1/1/test.mp3")
        
        service = PracticumService(storage_service=mock_storage)
        
        mock_file = create_mock_file(size=file_size)
        enrollment = create_mock_enrollment()
        node = create_mock_node()
        
        with patch.object(PracticumSubmission.objects, 'create') as mock_create:
            mock_create.return_value = Mock(status='pending')
            
            service.create_submission(
                enrollment=enrollment,
                node=node,
                file=mock_file
            )
            
            call_kwargs = mock_create.call_args[1]
            assert call_kwargs['status'] == 'pending'


@pytest.mark.django_db
class TestResubmissionVersioning:
    """
    Property tests for resubmission versioning.
    **Feature: practicum-system, Property 10: Resubmission Creates New Version**
    **Validates: Requirements 4.5**
    """

    @given(previous_version=st.integers(min_value=1, max_value=100))
    @settings(max_examples=50)
    def test_resubmission_increments_version(self, previous_version):
        """
        *For any* resubmission, the version SHALL be incremented by 1.
        **Feature: practicum-system, Property 10: Resubmission Creates New Version**
        **Validates: Requirements 4.5**
        """
        mock_storage = Mock()
        mock_storage.store = Mock(return_value="practicum/1/1/test.mp3")
        
        service = PracticumService(storage_service=mock_storage)
        
        # Create mock previous submission
        previous = Mock()
        previous.version = previous_version
        previous.enrollment = create_mock_enrollment()
        previous.node = create_mock_node()
        
        mock_file = create_mock_file()
        
        with patch.object(PracticumSubmission.objects, 'create') as mock_create:
            new_submission = Mock()
            new_submission.version = 1  # Initial version from create
            new_submission.save = Mock()
            mock_create.return_value = new_submission
            
            result = service.resubmit(previous=previous, file=mock_file)
            
            # Version should be incremented
            assert result.version == previous_version + 1
            result.save.assert_called_once()

    def test_resubmission_resets_status_to_pending(self):
        """Resubmission should reset status to pending."""
        mock_storage = Mock()
        mock_storage.store = Mock(return_value="practicum/1/1/test.mp3")
        
        service = PracticumService(storage_service=mock_storage)
        
        previous = Mock()
        previous.version = 1
        previous.status = 'revision_required'
        previous.enrollment = create_mock_enrollment()
        previous.node = create_mock_node()
        
        mock_file = create_mock_file()
        
        with patch.object(PracticumSubmission.objects, 'create') as mock_create:
            new_submission = Mock()
            new_submission.version = 1
            new_submission.save = Mock()
            mock_create.return_value = new_submission
            
            service.resubmit(previous=previous, file=mock_file)
            
            # Status should be pending
            call_kwargs = mock_create.call_args[1]
            assert call_kwargs['status'] == 'pending'


class TestInvalidFileRejection:
    """Tests for invalid file rejection."""

    def test_oversized_file_rejected(self):
        """Files exceeding size limit should be rejected."""
        mock_storage = Mock()
        service = PracticumService(storage_service=mock_storage)
        
        # File larger than limit
        mock_file = create_mock_file(size=100 * 1024 * 1024)  # 100MB
        enrollment = create_mock_enrollment()
        node = create_mock_node({
            'type': 'practicum',
            'max_file_size_mb': 50,
        })
        
        with pytest.raises(InvalidFileException) as exc_info:
            service.create_submission(
                enrollment=enrollment,
                node=node,
                file=mock_file
            )
        
        assert 'size' in str(exc_info.value).lower()

    def test_wrong_file_type_rejected(self):
        """Files with wrong type should be rejected."""
        mock_storage = Mock()
        service = PracticumService(storage_service=mock_storage)
        
        mock_file = create_mock_file(content_type='application/pdf', name='doc.pdf')
        enrollment = create_mock_enrollment()
        node = create_mock_node({
            'type': 'practicum',
            'evidence_types': ['audio', 'video'],
            'max_file_size_mb': 50,
        })
        
        with pytest.raises(InvalidFileException) as exc_info:
            service.create_submission(
                enrollment=enrollment,
                node=node,
                file=mock_file
            )
        
        assert 'type' in str(exc_info.value).lower() or 'allowed' in str(exc_info.value).lower()
