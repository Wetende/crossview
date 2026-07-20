from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel


class ScheduledLearningSession(TimeStampedModel):
    class Kind(models.TextChoices):
        LIVE_MEETING = "live_meeting", "Live meeting"
        LIVE_STREAM = "live_stream", "Live stream"
        IN_PERSON = "in_person_session", "In-person session"

    class Provider(models.TextChoices):
        GOOGLE_MEET = "google_meet", "Google Meet"
        ZOOM = "zoom", "Zoom"
        TEAMS = "teams", "Microsoft Teams"
        YOUTUBE = "youtube", "YouTube Live"
        VIMEO = "vimeo", "Vimeo"
        CUSTOM = "custom", "Custom"
        PHYSICAL = "physical", "Physical venue"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    node = models.OneToOneField(
        "curriculum.CurriculumNode",
        on_delete=models.CASCADE,
        related_name="scheduled_session",
    )
    kind = models.CharField(max_length=24, choices=Kind.choices)
    provider = models.CharField(max_length=24, choices=Provider.choices)
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, default="")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    source_timezone = models.CharField(max_length=64)
    join_url = models.URLField(max_length=1000, blank=True, default="")
    recording_url = models.URLField(max_length=1000, blank=True, default="")
    passcode_ciphertext = models.TextField(blank=True, default="")
    join_opens_before_minutes = models.PositiveSmallIntegerField(default=15)
    join_closes_after_minutes = models.PositiveSmallIntegerField(default=0)
    venue = models.CharField(max_length=255, blank=True, default="")
    room = models.CharField(max_length=255, blank=True, default="")
    address = models.TextField(blank=True, default="")
    directions = models.TextField(blank=True, default="")
    attendance_instructions = models.TextField(blank=True, default="")
    attendance_threshold_percent = models.PositiveSmallIntegerField(
        default=50,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.SCHEDULED
    )
    provider_event_id = models.CharField(max_length=255, blank=True, default="")
    provider_conference_id = models.CharField(max_length=255, blank=True, default="")
    provider_metadata = models.JSONField(default=dict, blank=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_sync_error = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_learning_sessions",
    )

    class Meta:
        db_table = "live_scheduled_learning_sessions"
        indexes = [
            models.Index(fields=["kind", "starts_at"]),
            models.Index(fields=["status", "starts_at"]),
        ]


class SessionAttendance(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending review"
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        EXCUSED = "excused", "Excused"

    class Source(models.TextChoices):
        PROVIDER = "provider", "Provider verification"
        INSTRUCTOR = "instructor_override", "Instructor override"
        IMPORT = "import", "Imported"

    session = models.ForeignKey(
        ScheduledLearningSession,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="session_attendance",
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    source = models.CharField(max_length=24, choices=Source.choices, default=Source.PROVIDER)
    attended_seconds = models.PositiveIntegerField(default=0)
    attendance_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    external_participant_id = models.CharField(max_length=255, blank=True, default="")
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_session_attendance",
    )

    class Meta:
        db_table = "live_session_attendance"
        constraints = [
            models.UniqueConstraint(
                fields=["session", "enrollment"],
                name="live_unique_session_enrollment_attendance",
            )
        ]
        indexes = [models.Index(fields=["session", "status"])]


class SessionAttendanceAudit(TimeStampedModel):
    session = models.ForeignKey(
        ScheduledLearningSession,
        on_delete=models.CASCADE,
        related_name="attendance_audits",
    )
    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="session_attendance_audits",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="session_attendance_overrides",
    )
    previous_status = models.CharField(max_length=16, blank=True, default="")
    resulting_status = models.CharField(max_length=16)
    reason = models.TextField()

    class Meta:
        db_table = "live_session_attendance_audits"
        indexes = [models.Index(fields=["session", "-created_at"])]


class LiveSessionSyncJob(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        DEAD = "dead", "Dead"

    session = models.ForeignKey(
        ScheduledLearningSession,
        on_delete=models.CASCADE,
        related_name="sync_jobs",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="live_session_sync_jobs",
    )
    job_type = models.CharField(max_length=32)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    available_at = models.DateTimeField()
    locked_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=8)
    idempotency_key = models.CharField(max_length=255, unique=True)
    error_category = models.CharField(max_length=64, blank=True, default="")
    last_error = models.TextField(blank=True, default="")
    result = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "live_session_sync_jobs"
        ordering = ["available_at", "id"]
        indexes = [
            models.Index(fields=["status", "available_at"]),
            models.Index(fields=["session", "job_type", "status"]),
        ]
