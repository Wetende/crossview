"""
Property tests for secure media storage.
**Feature: practicum-system, Property 12: Secure Media Storage**
**Validates: Requirements 6.1, 6.2, 6.3**
"""
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import Mock, MagicMock
from io import BytesIO

from apps.practicum.storage import MediaStorageService


# Strategies for storage testing
path_segment_strategy = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N'), whitelist_characters='_-'),
    min_size=1,
    max_size=20
)
file_path_strategy = st.builds(
    lambda *parts: '/'.join(parts) + '/',
    path_segment_strategy,
    path_segment_strategy,
)
filename_strategy = st.builds(
    lambda name, ext: f"{name}.{ext}",
    st.text(alphabet='abcdefghijklmnopqrstuvwxyz0123456789', min_size=1, max_size=20),
    st.sampled_from(['mp3', 'mp4', 'jpg', 'pdf', 'wav'])
)


class TestSecureMediaStorage:
    """
    Property tests for secure media storage.
    **Feature: practicum-system, Property 12: Secure Media Storage**
    **Validates: Requirements 6.1, 6.2, 6.3**
    """

    @given(path=file_path_strategy)
    @settings(max_examples=100)
    def test_signed_url_round_trip(self, path):
        """
        *For any* file path, signing and verifying SHALL return the original path.
        **Feature: practicum-system, Property 12: Secure Media Storage**
        **Validates: Requirements 6.3**
        """
        service = MediaStorageService()
        
        signed = service.get_signed_url(path)
        verified = service.verify_signed_url(signed)
        
        assert verified == path, f"Round trip failed: {path} -> {signed} -> {verified}"

    @given(path=file_path_strategy)
    @settings(max_examples=100)
    def test_signed_url_is_different_from_path(self, path):
        """
        *For any* file path, the signed URL SHALL be different from the original path.
        **Feature: practicum-system, Property 12: Secure Media Storage**
        **Validates: Requirements 6.3**
        """
        service = MediaStorageService()
        
        signed = service.get_signed_url(path)
        
        assert signed != path, "Signed URL should be different from original path"
        assert ':' in signed, "Signed URL should contain signature separator"

    def test_invalid_signature_rejected(self):
        """Invalid signatures should be rejected."""
        service = MediaStorageService()
        
        result = service.verify_signed_url("invalid:signature:here")
        
        assert result is None, "Invalid signature should return None"

    def test_tampered_signature_rejected(self):
        """Tampered signatures should be rejected."""
        service = MediaStorageService()
        
        signed = service.get_signed_url("test/path/file.mp3")
        # Tamper with the signature
        tampered = signed[:-5] + "XXXXX"
        
        result = service.verify_signed_url(tampered)
        
        assert result is None, "Tampered signature should return None"

    def test_store_generates_unique_path(self):
        """Store should generate unique filenames to prevent collisions."""
        mock_storage = Mock()
        mock_storage.save = Mock(side_effect=lambda path, file: path)
        
        service = MediaStorageService(storage=mock_storage)
        
        # Create mock file
        mock_file = Mock()
        mock_file.name = "test.mp3"
        
        path1 = service.store(mock_file, "practicum/1/")
        path2 = service.store(mock_file, "practicum/1/")
        
        # Paths should be different due to UUID
        assert path1 != path2, "Store should generate unique paths"

    def test_store_preserves_extension(self):
        """Store should preserve the original file extension."""
        mock_storage = Mock()
        mock_storage.save = Mock(side_effect=lambda path, file: path)
        
        service = MediaStorageService(storage=mock_storage)
        
        mock_file = Mock()
        mock_file.name = "recording.mp4"
        
        path = service.store(mock_file, "practicum/1/")
        
        assert path.endswith('.mp4'), "Store should preserve file extension"

    def test_validate_access_owner_allowed(self):
        """File owner should have access to their submission."""
        service = MediaStorageService()
        
        # Mock user and submission
        user = Mock()
        user.id = 1
        user.is_staff = False
        
        enrollment = Mock()
        enrollment.user_id = 1
        
        submission = Mock()
        submission.enrollment = enrollment
        submission.reviews = Mock()
        submission.reviews.filter = Mock(return_value=Mock(exists=Mock(return_value=False)))
        
        assert service.validate_access(user, submission) is True

    def test_validate_access_non_owner_denied(self):
        """Non-owner without review access should be denied."""
        service = MediaStorageService()
        
        user = Mock()
        user.id = 2
        user.is_staff = False
        
        enrollment = Mock()
        enrollment.user_id = 1  # Different user
        
        submission = Mock()
        submission.enrollment = enrollment
        submission.reviews = Mock()
        submission.reviews.filter = Mock(return_value=Mock(exists=Mock(return_value=False)))
        
        assert service.validate_access(user, submission) is False

    def test_validate_access_staff_allowed(self):
        """Staff users should have access to all submissions."""
        service = MediaStorageService()
        
        user = Mock()
        user.id = 999
        user.is_staff = True
        
        enrollment = Mock()
        enrollment.user_id = 1
        
        submission = Mock()
        submission.enrollment = enrollment
        submission.reviews = Mock()
        submission.reviews.filter = Mock(return_value=Mock(exists=Mock(return_value=False)))
        
        assert service.validate_access(user, submission) is True
