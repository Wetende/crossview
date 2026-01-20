"""
Practicum models - Media submissions and rubric grading.
Requirements: 1.4, 2.5, 3.2, 3.3
"""
from django.db import models
from django.core.signing import TimestampSigner
from decimal import Decimal
from apps.core.models import TimeStampedModel


class Rubric(TimeStampedModel):
    """
    Rubric model for grading practicum submissions.
    Dimensions are stored as JSON with name, weight, and max_score.
    Requirements: 1.4, 3.2
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    dimensions = models.JSONField(
        help_text='List of dimension objects with name, weight, max_score'
    )
    max_score = models.PositiveIntegerField()

    class Meta:
        db_table = 'rubrics'

    def __str__(self):
        return self.name

    def calculate_score(self, dimension_scores: dict) -> Decimal:
        """
        Calculate total score from dimension scores using weights.
        Requirements: 3.2, 3.4
        
        Args:
            dimension_scores: Dict mapping dimension name to score
            
        Returns:
            Weighted total score as Decimal
        """
        total = Decimal('0')
        for dim in self.dimensions:
            dim_name = dim['name']
            weight = Decimal(str(dim.get('weight', 1)))
            score = Decimal(str(dimension_scores.get(dim_name, 0)))
            total += score * weight
        return total


class PracticumSubmission(TimeStampedModel):
    """
    Practicum submission model for student media uploads.
    Requirements: 2.5, 4.1
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('revision_required', 'Revision Required'),
        ('rejected', 'Rejected'),
    ]

    enrollment = models.ForeignKey(
        'progression.Enrollment',
        on_delete=models.CASCADE,
        related_name='practicum_submissions'
    )
    node = models.ForeignKey(
        'curriculum.CurriculumNode',
        on_delete=models.CASCADE,
        related_name='practicum_submissions'
    )
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    file_path = models.CharField(max_length=500)
    file_type = models.CharField(max_length=50)
    file_size = models.BigIntegerField()
    duration_seconds = models.PositiveIntegerField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    submitted_at = models.DateTimeField()

    class Meta:
        db_table = 'practicum_submissions'
        indexes = [
            models.Index(fields=['enrollment', 'node'], name='practicum_enroll_node_idx'),
            models.Index(fields=['status'], name='practicum_status_idx'),
        ]

    def __str__(self):
        return f"Submission {self.id} v{self.version} ({self.status})"

    def get_signed_url(self, expires_in_minutes: int = 60) -> str:
        """
        Generate a signed URL for secure file access.
        Requirements: 6.3
        
        Args:
            expires_in_minutes: URL expiration time
            
        Returns:
            Signed URL string
        """
        signer = TimestampSigner()
        return signer.sign(self.file_path)


class SubmissionReview(TimeStampedModel):
    """
    Submission review model for lecturer feedback.
    Requirements: 3.3
    """
    STATUS_CHOICES = [
        ('approved', 'Approved'),
        ('revision_required', 'Revision Required'),
        ('rejected', 'Rejected'),
    ]

    submission = models.ForeignKey(
        'PracticumSubmission',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    reviewer = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='submission_reviews'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    dimension_scores = models.JSONField(blank=True, null=True)
    total_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True
    )
    comments = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField()

    class Meta:
        db_table = 'submission_reviews'
        indexes = [
            models.Index(fields=['submission'], name='review_submission_idx'),
        ]

    def __str__(self):
        return f"Review for Submission {self.submission_id} ({self.status})"
