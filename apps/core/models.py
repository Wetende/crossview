"""
Core models - Custom User model and base classes.
"""

from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify

from .learning_outcomes import extract_learning_outcome_items_from_html


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    'created_at' and 'updated_at' fields.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class User(AbstractUser):
    """Custom User model for LMS."""

    phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email or self.username


class InstructorProfile(TimeStampedModel):
    """
    Legacy instructor application data retained for historical records.

    Instructor access is now controlled by the Instructors group through
    administrative user management. New application records are not created.
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("pending_review", "Pending Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    user = models.OneToOneField(
        "User", on_delete=models.CASCADE, related_name="instructor_profile"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    # Professional Identity
    bio = models.TextField(blank=True, default="")
    job_title = models.CharField(max_length=255, blank=True, default="")

    # Proof of Expertise
    resume_path = models.CharField(max_length=500, blank=True, null=True)
    linkedin_url = models.URLField(blank=True, default="")
    teaching_experience = models.TextField(blank=True, default="")
    why_teach_here = models.TextField(blank=True, default="")

    # Review Data
    rejection_reason = models.TextField(blank=True, default="")
    reviewed_by = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_instructor_profiles",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "instructor_profiles"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"InstructorProfile: {self.user.email} ({self.status})"


class InstructorCertification(models.Model):
    """
    Legacy certification documents retained with historical applications.
    """

    profile = models.ForeignKey(
        "InstructorProfile", on_delete=models.CASCADE, related_name="certifications"
    )
    file_path = models.CharField(max_length=500)
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "instructor_certifications"

    def __str__(self):
        return f"{self.file_name} for {self.profile.user.email}"


class Program(TimeStampedModel):
    """
    Program model - represents an academic program/course.
    Links to AcademicBlueprint for structure configuration.
    """

    blueprint = models.ForeignKey(
        "blueprints.AcademicBlueprint",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="programs",
    )
    instructors = models.ManyToManyField(
        "User", related_name="assigned_programs", blank=True
    )
    name = models.CharField(max_length=255)
    code = models.CharField(
        max_length=50,
        unique=True,
        error_messages={"unique": "A program with this code already exists."},
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
        db_index=True,
        help_text="Public course URL slug.",
    )
    description = models.TextField(blank=True, null=True)
    preview_description = models.TextField(blank=True, default="")
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)

    # Extended Course Manager Fields
    faq = models.JSONField(default=list, blank=True)
    notices = models.JSONField(default=list, blank=True)
    custom_pricing = models.JSONField(default=dict, blank=True)

    # Access, progression, and rating fields
    prerequisite_programs = models.ManyToManyField(
        "self",
        symmetrical=False,
        blank=True,
        related_name="unlocks_programs",
    )
    prerequisite_passing_percent = models.PositiveSmallIntegerField(
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Minimum published course score required for prerequisite courses. Use 0 for completion-only prerequisites.",
    )
    access_duration_days = models.PositiveIntegerField(null=True, blank=True)
    lock_lessons_in_order = models.BooleanField(default=True)
    drip_enabled = models.BooleanField(default=False)
    DRIP_MODE_CHOICES = [
        ("none", "None"),
        ("relative", "Relative"),
        ("absolute", "Absolute"),
        ("mixed", "Mixed"),
    ]
    drip_mode = models.CharField(
        max_length=20,
        choices=DRIP_MODE_CHOICES,
        default="none",
    )
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=4)
    rating_count = models.PositiveIntegerField(default=60)

    # Course Display Fields (for public listing/detail pages)
    thumbnail = models.ImageField(
        upload_to="programs/thumbnails/", blank=True, null=True
    )
    category = models.CharField(max_length=100, blank=True, null=True)
    level = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Student-facing course level, e.g. Beginner, Level 5, Certificate I.",
    )

    # Examining Body Metadata (TVET mode)
    # These fields enable accurate course classification per official
    # examining/awarding body requirements (KASNEB, CDACC, KNEC, NITA, ICM).
    exam_body = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="Examining/awarding body: KASNEB, CDACC, KNEC, NITA, ICM, Internal"
    )
    qualification_family = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Official category: Certificate, Diploma, Professional, Trade Test, etc."
    )
    award_type = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Award issued: Craft Certificate, Diploma, Government Trade Test Certificate"
    )
    assessment_mode = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="Assessment method: Exam, CBET, Trade Test, Assignment, Project"
    )

    duration_hours = models.PositiveIntegerField(
        default=0, help_text="Total duration in hours"
    )
    video_hours = models.PositiveIntegerField(
        default=0, help_text="Video content duration in hours"
    )
    BADGE_CHOICES = [
        ("hot", "Hot"),
        ("new", "New"),
        ("special", "Special"),
    ]
    badge_type = models.CharField(
        max_length=20, blank=True, null=True, choices=BADGE_CHOICES
    )
    what_you_learn_items = models.JSONField(
        default=list,
        blank=True,
        help_text="Derived plain-text learning outcomes",
    )
    what_you_learn_html = models.TextField(
        blank=True,
        default="",
        help_text="Rich text learning outcomes HTML",
    )

    class Meta:
        db_table = "programs"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["is_published"]),
            models.Index(fields=["is_published", "is_featured"]),
            models.Index(fields=["created_at"], name="program_created_idx"),
            models.Index(
                fields=["is_published", "created_at"],
                name="program_pub_created_idx",
            ),
            models.Index(
                fields=["is_published", "category"],
                name="program_pub_category_idx",
            ),
            models.Index(
                fields=["is_published", "level"],
                name="program_pub_level_idx",
            ),
            models.Index(
                fields=["blueprint", "created_at"],
                name="program_blueprint_created_idx",
            ),
        ]

    def __str__(self):
        return self.name

    def _generate_unique_slug(self, source: str | None = None):
        base_slug = slugify(source or self.name or self.code) or "course"
        slug = base_slug[:255]
        suffix = 2
        queryset = Program.objects.all()
        if self.pk:
            queryset = queryset.exclude(pk=self.pk)

        while queryset.filter(slug=slug).exists():
            suffix_text = f"-{suffix}"
            slug = f"{base_slug[: 255 - len(suffix_text)]}{suffix_text}"
            suffix += 1
        return slug

    def save(self, *args, **kwargs):
        previous_name = None
        if self.pk:
            previous_name = (
                Program.objects.filter(pk=self.pk)
                .values_list("name", flat=True)
                .first()
            )

        should_refresh_slug = (
            not self.pk
            or not self.slug
            or (previous_name is not None and previous_name != self.name)
        )
        if should_refresh_slug:
            self.slug = self._generate_unique_slug(self.name or self.code)
            update_fields = kwargs.get("update_fields")
            if update_fields is not None:
                kwargs["update_fields"] = set(update_fields) | {"slug"}

        self.what_you_learn_html = str(self.what_you_learn_html or "").strip()
        self.what_you_learn_items = extract_learning_outcome_items_from_html(
            self.what_you_learn_html
        )
        super().save(*args, **kwargs)


class ProgramResource(models.Model):
    """
    Downloadable resources for a program (syllabus, reading list, etc).
    """

    program = models.ForeignKey(
        "Program", on_delete=models.CASCADE, related_name="resources"
    )
    file = models.FileField(upload_to="programs/resources/")
    title = models.CharField(max_length=255, blank=True)
    resource_type = models.CharField(
        max_length=50, default="material"
    )  # material, outline, etc.
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "program_resources"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title or self.file.name
