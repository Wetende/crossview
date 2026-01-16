"""
Core models - Custom User model and base classes.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model for LMS."""
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email or self.username


class InstructorProfile(models.Model):
    """
    Stores instructor application/vetting data separately from User model.
    Lifecycle: DRAFT → PENDING_REVIEW → APPROVED/REJECTED
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='instructor_profile'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Professional Identity
    bio = models.TextField(blank=True, default='')
    job_title = models.CharField(max_length=255, blank=True, default='')
    
    # Proof of Expertise
    resume_path = models.CharField(max_length=500, blank=True, null=True)
    linkedin_url = models.URLField(blank=True, default='')
    teaching_experience = models.TextField(blank=True, default='')
    why_teach_here = models.TextField(blank=True, default='')
    
    # Review Data
    rejection_reason = models.TextField(blank=True, default='')
    reviewed_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_instructor_profiles'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'instructor_profiles'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"InstructorProfile: {self.user.email} ({self.status})"


class InstructorCertification(models.Model):
    """
    Uploaded certification documents for instructor applications.
    Auto-deleted when application is rejected.
    """
    profile = models.ForeignKey(
        'InstructorProfile',
        on_delete=models.CASCADE,
        related_name='certifications'
    )
    file_path = models.CharField(max_length=500)
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'instructor_certifications'

    def __str__(self):
        return f"{self.file_name} for {self.profile.user.email}"


class Program(models.Model):
    """
    Program model - represents an academic program/course.
    Links to AcademicBlueprint for structure configuration.
    """
    SUBMISSION_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted for Review'),
        ('changes_requested', 'Changes Requested'),
        ('approved', 'Approved'),
    ]

    blueprint = models.ForeignKey(
        'blueprints.AcademicBlueprint',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='programs'
    )
    instructors = models.ManyToManyField(
        'User',
        related_name='assigned_programs',
        blank=True
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    
    # Course Vetting Workflow
    submission_status = models.CharField(
        max_length=20,
        choices=SUBMISSION_STATUS_CHOICES,
        default='draft'
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_programs'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Extended Course Manager Fields
    faq = models.JSONField(default=list, blank=True)
    notices = models.JSONField(default=list, blank=True)
    custom_pricing = models.JSONField(default=dict, blank=True)

    # Course Display Fields (for public listing/detail pages)
    thumbnail = models.ImageField(upload_to='programs/thumbnails/', blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    duration_hours = models.PositiveIntegerField(default=0, help_text="Total duration in hours")
    video_hours = models.PositiveIntegerField(default=0, help_text="Video content duration in hours")
    BADGE_CHOICES = [
        ('hot', 'Hot'),
        ('new', 'New'),
        ('special', 'Special'),
    ]
    badge_type = models.CharField(max_length=20, blank=True, null=True, choices=BADGE_CHOICES)
    what_you_learn = models.JSONField(default=list, blank=True, help_text="List of learning outcomes")

    class Meta:
        db_table = 'programs'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_published']),
            models.Index(fields=['submission_status']),
        ]

    def __str__(self):
        return self.name
