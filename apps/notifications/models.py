"""
Notification models for in-app notifications.
"""

from django.db import models


class Notification(models.Model):
    """Individual notification record for a user."""
    
    NOTIFICATION_TYPES = [
        ('enrollment_approved', 'Enrollment Approved'),
        ('enrollment_rejected', 'Enrollment Rejected'),
        ('grade_published', 'Grade Published'),
        ('assignment_graded', 'Assignment Graded'),
        ('quiz_graded', 'Quiz Graded'),
        ('announcement', 'New Announcement'),
        ('instructor_approved', 'Instructor Approved'),
        ('instructor_rejected', 'Instructor Rejected'),
        ('program_approved', 'Program Approved'),
        ('program_changes_requested', 'Program Changes Requested'),
        ('system', 'System Notification'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
    ]
    
    recipient = models.ForeignKey(
        'core.User',
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='normal')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Optional link for navigation when notification is clicked
    action_url = models.CharField(max_length=500, blank=True, null=True)
    
    # Related object IDs (for filtering and grouping)
    related_program_id = models.IntegerField(null=True, blank=True)
    related_enrollment_id = models.IntegerField(null=True, blank=True)
    related_assessment_id = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
            models.Index(fields=['recipient', '-created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type}: {self.title} → {self.recipient}"


class NotificationPreference(models.Model):
    """User notification preferences and settings."""
    
    EMAIL_DIGEST_CHOICES = [
        ('instant', 'Instant'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
        ('never', 'Never'),
    ]
    
    user = models.OneToOneField(
        'core.User',
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # In-app notifications
    in_app_enabled = models.BooleanField(default=True)
    
    # Email notifications (for future implementation)
    email_enabled = models.BooleanField(default=True)
    email_digest = models.CharField(
        max_length=20,
        choices=EMAIL_DIGEST_CHOICES,
        default='instant'
    )
    
    # Per-type preferences stored as JSON for flexibility
    # Example: {"announcement": {"in_app": true, "email": false}}
    type_preferences = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'

    def __str__(self):
        return f"NotificationPreference: {self.user}"
