"""
Progression models - Enrollment and progress tracking.
"""

from django.db import models
from apps.core.models import TimeStampedModel


class InstructorAssignment(models.Model):
    """
    Links instructors to programs they teach.
    Requirements: Instructor Dashboard
    """

    instructor = models.ForeignKey(
        "core.User", on_delete=models.CASCADE, related_name="instructor_assignments"
    )
    program = models.ForeignKey(
        "core.Program", on_delete=models.CASCADE, related_name="instructor_assignments"
    )
    role = models.CharField(max_length=50, default="Instructor")
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = "instructor_assignments"
        unique_together = ["instructor", "program"]
        indexes = [
            models.Index(fields=["instructor"]),
            models.Index(fields=["program"]),
        ]

    def __str__(self):
        return f"{self.instructor} - {self.program}"


class NodeCompletion(models.Model):
    """
    Tracks completion of curriculum nodes by enrolled students.
    Each record represents a student completing a specific node.
    Requirements: 3.1
    """

    COMPLETION_TYPES = [
        ("view", "View"),
        ("quiz_pass", "Quiz Pass"),
        ("upload", "Upload"),
        ("manual", "Manual"),
    ]

    enrollment = models.ForeignKey(
        "Enrollment", on_delete=models.CASCADE, related_name="completions"
    )
    node = models.ForeignKey(
        "curriculum.CurriculumNode",
        on_delete=models.CASCADE,
        related_name="completions",
    )
    completed_at = models.DateTimeField()
    completion_type = models.CharField(max_length=20, choices=COMPLETION_TYPES)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "node_completions"
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "node"], name="unique_enrollment_node_completion"
            )
        ]
        indexes = [
            models.Index(fields=["enrollment"], name="completions_enrollment_idx"),
            models.Index(fields=["node"], name="completions_node_idx"),
        ]

    def __str__(self):
        return f"{self.enrollment} - {self.node} ({self.completion_type})"


class Enrollment(TimeStampedModel):
    """
    Represents a student's enrollment in a program.
    Links user to program for tracking progress and assessments.
    """

    user = models.ForeignKey(
        "core.User", on_delete=models.CASCADE, related_name="enrollments"
    )
    program = models.ForeignKey(
        "core.Program", on_delete=models.CASCADE, related_name="enrollments"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("active", "Active"),
            ("completed", "Completed"),
            ("withdrawn", "Withdrawn"),
            ("suspended", "Suspended"),
        ],
        default="active",
    )
    grades = models.JSONField(blank=True, null=True)  # Stores grade components
    grades_published = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "enrollments"
        unique_together = ["user", "program"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["program", "status"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.program}"


class Announcement(TimeStampedModel):
    """
    Instructor announcements to program students.
    """
    
    program = models.ForeignKey(
        "core.Program", on_delete=models.CASCADE, related_name="announcements"
    )
    author = models.ForeignKey(
        "core.User", on_delete=models.CASCADE, related_name="announcements"
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    
    class Meta:
        db_table = "announcements"
        ordering = ["-is_pinned", "-created_at"]
        indexes = [
            models.Index(fields=["program", "-created_at"]),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.program}"


class EnrollmentRequest(TimeStampedModel):
    """
    Represents a student's request to enroll in a program.
    Used when enrollment_mode is 'instructor_approval' or 'admin_approval'.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(
        "core.User", on_delete=models.CASCADE, related_name="enrollment_requests"
    )
    program = models.ForeignKey(
        "core.Program", on_delete=models.CASCADE, related_name="enrollment_requests"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    message = models.TextField(
        blank=True, default="",
        help_text="Optional message from student explaining why they want to enroll"
    )
    reviewed_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_enrollment_requests"
    )
    reviewer_notes = models.TextField(
        blank=True, default="",
        help_text="Notes from reviewer (visible to student if rejected)"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "enrollment_requests"
        unique_together = ["user", "program"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["program", "status"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.program} ({self.status})"


# =============================================================================
# Gamification Models (Feature 4C)
# =============================================================================


class Badge(models.Model):
    """
    Badge definition for gamification system.
    Badges can be awarded for various achievements (lesson completion, quiz scores, etc.)
    """
    
    BADGE_TRIGGERS = [
        ('lesson_complete', 'Lesson Complete'),
        ('quiz_pass', 'Quiz Pass'),
        ('quiz_perfect', 'Perfect Quiz Score'),
        ('first_try_pass', 'First Try Pass'),
        ('streak_7', '7-Day Streak'),
        ('streak_30', '30-Day Streak'),
        ('module_complete', 'Module Complete'),
        ('course_complete', 'Course Complete'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    icon = models.CharField(max_length=100, blank=True, default='', help_text='Icon name or URL')
    xp_value = models.PositiveIntegerField(default=0, help_text='XP bonus when badge is earned')
    trigger = models.CharField(max_length=50, choices=BADGE_TRIGGERS, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'badges'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class StudentBadge(models.Model):
    """
    Badge earned by a student.
    Tracks when and why each badge was awarded.
    """
    
    enrollment = models.ForeignKey(
        'Enrollment',
        on_delete=models.CASCADE,
        related_name='earned_badges'
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name='earned_by'
    )
    earned_at = models.DateTimeField(auto_now_add=True)
    trigger_node = models.ForeignKey(
        'curriculum.CurriculumNode',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='The curriculum node that triggered this badge'
    )
    
    class Meta:
        db_table = 'student_badges'
        unique_together = ['enrollment', 'badge']
        indexes = [
            models.Index(fields=['enrollment', 'earned_at']),
        ]
    
    def __str__(self):
        return f"{self.enrollment.user} earned {self.badge.name}"


class StudentXP(models.Model):
    """
    XP (experience points) earned by a student.
    Tracks individual XP gains for leaderboards and progress display.
    """
    
    XP_REASONS = [
        ('lesson_complete', 'Lesson Complete'),
        ('quiz_pass', 'Quiz Pass'),
        ('quiz_perfect', 'Perfect Quiz Score'),
        ('assignment_submit', 'Assignment Submitted'),
        ('first_try', 'First Try Bonus'),
        ('streak_bonus', 'Streak Bonus'),
        ('badge_earned', 'Badge Earned'),
        ('manual', 'Manual Award'),
    ]
    
    enrollment = models.ForeignKey(
        'Enrollment',
        on_delete=models.CASCADE,
        related_name='xp_logs'
    )
    source_node = models.ForeignKey(
        'curriculum.CurriculumNode',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='The curriculum node that generated this XP'
    )
    xp_amount = models.PositiveIntegerField()
    reason = models.CharField(max_length=50, choices=XP_REASONS)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'student_xp'
        indexes = [
            models.Index(fields=['enrollment', 'earned_at']),
            models.Index(fields=['source_node']),
        ]
    
    def __str__(self):
        return f"{self.enrollment.user}: +{self.xp_amount} XP ({self.reason})"


class StudentNote(TimeStampedModel):
    """
    Notes taken by students while viewing course content.
    Can optionally include a video timestamp for easy navigation.
    """

    enrollment = models.ForeignKey(
        'Enrollment',
        on_delete=models.CASCADE,
        related_name='notes'
    )
    node = models.ForeignKey(
        'curriculum.CurriculumNode',
        on_delete=models.CASCADE,
        related_name='student_notes'
    )
    content = models.TextField()
    video_timestamp = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Video position in seconds when note was taken'
    )

    class Meta:
        db_table = 'student_notes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['enrollment', 'node']),
            models.Index(fields=['enrollment', '-created_at']),
        ]

    def __str__(self):
        return f"Note by {self.enrollment.user} on {self.node.title}"

