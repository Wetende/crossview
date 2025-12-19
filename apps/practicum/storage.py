"""
Media storage service for practicum submissions.
Requirements: 6.1, 6.2, 6.3
"""
from typing import Optional
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.conf import settings
import os
import uuid


class MediaStorageService:
    """
    Service for secure media file storage and retrieval.
    Requirements: 6.1, 6.2, 6.3
    """
    
    def __init__(self, storage=None):
        """
        Initialize with optional custom storage backend.
        
        Args:
            storage: Django storage backend (defaults to default_storage)
        """
        self.storage = storage or default_storage
        self.signer = TimestampSigner()
    
    def store(self, file: UploadedFile, path: str) -> str:
        """
        Store a file securely.
        Requirements: 6.1
        
        Args:
            file: Uploaded file object
            path: Base path for storage (e.g., "practicum/1/2/")
            
        Returns:
            Full path where file was stored
        """
        # Generate unique filename to prevent collisions
        ext = os.path.splitext(file.name)[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        full_path = os.path.join(path, unique_name)
        
        # Store the file
        saved_path = self.storage.save(full_path, file)
        return saved_path
    
    def get_signed_url(self, path: str, expires_in_minutes: int = 60) -> str:
        """
        Generate a signed URL for secure file access.
        Requirements: 6.3
        
        Args:
            path: File path to sign
            expires_in_minutes: URL expiration time (used for documentation)
            
        Returns:
            Signed URL string
        """
        return self.signer.sign(path)
    
    def verify_signed_url(self, signed_value: str, max_age_seconds: int = 3600) -> Optional[str]:
        """
        Verify a signed URL and return the original path.
        Requirements: 6.3
        
        Args:
            signed_value: The signed URL to verify
            max_age_seconds: Maximum age of signature
            
        Returns:
            Original path if valid, None if invalid/expired
        """
        try:
            return self.signer.unsign(signed_value, max_age=max_age_seconds)
        except (BadSignature, SignatureExpired):
            return None
    
    def delete(self, path: str) -> bool:
        """
        Delete a file from storage.
        
        Args:
            path: Path to file to delete
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            self.storage.delete(path)
            return True
        except Exception:
            return False
    
    def validate_access(self, user, submission) -> bool:
        """
        Validate that a user has permission to access a submission's file.
        Requirements: 6.2
        
        Args:
            user: User requesting access
            submission: PracticumSubmission object
            
        Returns:
            True if user has access, False otherwise
        """
        # Owner can always access their own submissions
        if submission.enrollment.user_id == user.id:
            return True
        
        # Reviewers (lecturers) can access submissions they need to review
        # This would typically check if user is a lecturer for the program
        # For now, check if user has reviewed this submission
        if submission.reviews.filter(reviewer=user).exists():
            return True
        
        # Staff/admin can access all
        if hasattr(user, 'is_staff') and user.is_staff:
            return True
        
        return False
    
    def exists(self, path: str) -> bool:
        """Check if a file exists at the given path."""
        return self.storage.exists(path)
    
    def get_file(self, path: str):
        """Get a file object from storage."""
        return self.storage.open(path)
