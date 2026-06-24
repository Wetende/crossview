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
    Stores instructor application/vetting data separately from User model.
    Lifecycle: DRAFT → PENDING_REVIEW → APPROVED/REJECTED
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
    Uploaded certification documents for instructor applications.
    Auto-deleted when application is rejected.
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


class Campus(TimeStampedModel):
    """AIRADS physical or virtual campus used for admissions routing."""

    CAMPUS_TYPE_PHYSICAL = "physical"
    CAMPUS_TYPE_VIRTUAL = "virtual"

    CAMPUS_TYPE_CHOICES = [
        (CAMPUS_TYPE_PHYSICAL, "Physical"),
        (CAMPUS_TYPE_VIRTUAL, "Virtual"),
    ]

    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    campus_type = models.CharField(
        max_length=20,
        choices=CAMPUS_TYPE_CHOICES,
        default=CAMPUS_TYPE_PHYSICAL,
    )
    contact_email = models.EmailField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "campuses"
        ordering = ["campus_type", "name"]
        indexes = [
            models.Index(fields=["campus_type", "is_active"]),
        ]

    def __str__(self):
        return self.name


class AdmissionApplication(TimeStampedModel):
    """Public student admissions application submitted from the AIRADS site."""

    STUDY_MODE_ON_CAMPUS = "on_campus"
    STUDY_MODE_VIRTUAL = "virtual"

    STUDY_MODE_CHOICES = [
        (STUDY_MODE_ON_CAMPUS, "On Campus"),
        (STUDY_MODE_VIRTUAL, "Virtual"),
    ]

    STATUS_NEW = "new"
    STATUS_CONTACTED = "contacted"
    STATUS_ACCEPTED = "accepted"
    STATUS_DECLINED = "declined"

    STATUS_CHOICES = [
        (STATUS_NEW, "New"),
        (STATUS_CONTACTED, "Contacted"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_DECLINED, "Declined"),
    ]

    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32)
    whatsapp = models.CharField(max_length=32, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    study_mode = models.CharField(
        max_length=20,
        choices=STUDY_MODE_CHOICES,
        default=STUDY_MODE_ON_CAMPUS,
    )
    campus = models.ForeignKey(
        "Campus",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admission_applications",
    )
    program = models.ForeignKey(
        "Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admission_applications",
    )
    preferred_campus = models.CharField(max_length=120)
    preferred_programme = models.CharField(max_length=255)
    intake = models.CharField(max_length=120, blank=True, default="")
    education_level = models.CharField(max_length=120, blank=True, default="")
    message = models.TextField(blank=True, default="")
    source = models.CharField(max_length=80, blank=True, default="website")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW
    )
    internal_notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "admission_applications"
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["study_mode", "-created_at"]),
            models.Index(fields=["campus", "-created_at"]),
            models.Index(fields=["preferred_campus"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} - {self.preferred_programme}"


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
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)

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

    def _generate_unique_slug(self):
        base_slug = slugify(self.slug or self.name or self.code) or "course"
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
        self.slug = self._generate_unique_slug()
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
