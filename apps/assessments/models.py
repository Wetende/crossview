"""
Assessment models - Grading strategies and results.
"""
from django.db import models
from typing import Optional


class AssessmentResult(models.Model):
    """
    Stores the outcome of a student's assessment for a specific curriculum node.
    Contains component scores, calculated total, status, and letter grade in result_data JSON.
    """
    enrollment = models.ForeignKey(
        'progression.Enrollment',
        on_delete=models.CASCADE,
        related_name='assessment_results'
    )
    node = models.ForeignKey(
        'curriculum.CurriculumNode',
        on_delete=models.CASCADE,
        related_name='assessment_results'
    )
    result_data = models.JSONField()
    lecturer_comments = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    graded_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_results'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assessment_results'
        constraints = [
            models.UniqueConstraint(
                fields=['enrollment', 'node'],
                name='unique_enrollment_node_result'
            )
        ]
        indexes = [
            models.Index(fields=['node', 'is_published'], name='results_node_published_idx'),
        ]

    def __str__(self):
        return f"Result: {self.enrollment} - {self.node}"

    def get_total(self) -> Optional[float]:
        """Get the calculated total score from result_data."""
        return self.result_data.get('total') if self.result_data else None

    def get_status(self) -> Optional[str]:
        """Get the result status (Pass, Fail, Competent, etc.) from result_data."""
        return self.result_data.get('status') if self.result_data else None

    def get_letter_grade(self) -> Optional[str]:
        """Get the letter grade from result_data (if applicable)."""
        return self.result_data.get('letter_grade') if self.result_data else None

    def get_components(self) -> dict:
        """Get the component scores from result_data."""
        return self.result_data.get('components', {}) if self.result_data else {}
