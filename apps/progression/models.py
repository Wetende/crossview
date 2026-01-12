"""
Progression models - Enrollment and progress tracking.
"""

from django.db import models


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


class Enrollment(models.Model):
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "enrollments"
        unique_together = ["user", "program"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["program", "status"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.program}"


class Announcement(models.Model):
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "announcements"
        ordering = ["-is_pinned", "-created_at"]
        indexes = [
            models.Index(fields=["program", "-created_at"]),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.program}"


class EnrollmentRequest(models.Model):
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
