"""
Progression models - Enrollment and progress tracking.
"""
from django.db import models


class NodeCompletion(models.Model):
    """
    Tracks completion of curriculum nodes by enrolled students.
    Each record represents a student completing a specific node.
    Requirements: 3.1
    """
    COMPLETION_TYPES = [
        ('view', 'View'),
        ('quiz_pass', 'Quiz Pass'),
        ('upload', 'Upload'),
        ('manual', 'Manual'),
    ]

    enrollment = models.ForeignKey(
        'Enrollment',
        on_delete=models.CASCADE,
        related_name='completions'
    )
    node = models.ForeignKey(
        'curriculum.CurriculumNode',
        on_delete=models.CASCADE,
        related_name='completions'
    )
    completed_at = models.DateTimeField()
    completion_type = models.CharField(max_length=20, choices=COMPLETION_TYPES)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'node_completions'
        constraints = [
            models.UniqueConstraint(
                fields=['enrollment', 'node'],
                name='unique_enrollment_node_completion'
            )
        ]
        indexes = [
            models.Index(fields=['enrollment'], name='completions_enrollment_idx'),
            models.Index(fields=['node'], name='completions_node_idx'),
        ]

    def __str__(self):
        return f"{self.enrollment} - {self.node} ({self.completion_type})"


class Enrollment(models.Model):
    """
    Represents a student's enrollment in a program.
    Links user to program for tracking progress and assessments.
    """
    user = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    program = models.ForeignKey(
        'core.Program',
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('completed', 'Completed'),
            ('withdrawn', 'Withdrawn'),
            ('suspended', 'Suspended'),
        ],
        default='active'
    )
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollments'
        unique_together = ['user', 'program']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['program', 'status']),
        ]

    def __str__(self):
        return f"{self.user} - {self.program}"
