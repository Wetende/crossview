from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class ClassroomOAuthCredential(TimeStampedModel):
    class Status(models.TextChoices):
        CONNECTED = "connected", "Connected"
        INVALID = "invalid", "Invalid"
        REVOKED = "revoked", "Revoked"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="google_classroom_credential",
    )
    google_user_id = models.CharField(max_length=255, blank=True, default="")
    google_email = models.EmailField(blank=True, default="")
    refresh_token_ciphertext = models.TextField(blank=True, default="")
    granted_scopes = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.CONNECTED
    )
    last_error = models.TextField(blank=True, default="")
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "google_classroom_oauth_credentials"


class ClassroomCourseLink(TimeStampedModel):
    program = models.OneToOneField(
        "core.Program",
        on_delete=models.CASCADE,
        related_name="google_classroom_link",
    )
    credential = models.ForeignKey(
        ClassroomOAuthCredential,
        on_delete=models.SET_NULL,
        null=True,
        related_name="course_links",
    )
    classroom_course_id = models.CharField(max_length=255, unique=True)
    classroom_name = models.CharField(max_length=255)
    classroom_section = models.CharField(max_length=255, blank=True, default="")
    enrollment_code = models.CharField(max_length=64, blank=True, default="")
    alternate_link = models.URLField(max_length=1000, blank=True, default="")
    course_state = models.CharField(max_length=32, blank=True, default="")
    enabled = models.BooleanField(default=True)
    sync_paused = models.BooleanField(default=False)
    last_attempted_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_error_category = models.CharField(max_length=64, blank=True, default="")
    last_error = models.TextField(blank=True, default="")

    class Meta:
        db_table = "google_classroom_course_links"


class ClassroomRosterMapping(TimeStampedModel):
    class Status(models.TextChoices):
        MATCHED = "matched", "Matched"
        INVITED = "invited", "Invited"
        CONFLICT = "conflict", "Conflict"
        REMOVED = "removed", "Removed"

    course_link = models.ForeignKey(
        ClassroomCourseLink, on_delete=models.CASCADE, related_name="roster_mappings"
    )
    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="google_classroom_mappings",
    )
    lms_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="google_classroom_roster_mappings",
    )
    google_user_id = models.CharField(max_length=255)
    verified_email = models.EmailField()
    role = models.CharField(max_length=16, default="student")
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.MATCHED
    )

    class Meta:
        db_table = "google_classroom_roster_mappings"
        constraints = [
            models.UniqueConstraint(
                fields=["course_link", "google_user_id"],
                name="google_classroom_unique_remote_roster_user",
            )
        ]
        indexes = [models.Index(fields=["course_link", "status"])]


class ClassroomResourceMapping(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        DRIFT = "drift", "Remote drift"
        REMOTE_DELETED = "remote_deleted", "Remote deleted"
        UNLINKED = "unlinked", "Unlinked"

    course_link = models.ForeignKey(
        ClassroomCourseLink, on_delete=models.CASCADE, related_name="resource_mappings"
    )
    local_type = models.CharField(max_length=32)
    local_id = models.CharField(max_length=255)
    google_resource_type = models.CharField(max_length=32)
    google_resource_id = models.CharField(max_length=255, blank=True, default="")
    created_by_integration = models.BooleanField(default=True)
    status = models.CharField(
        max_length=24, choices=Status.choices, default=Status.ACTIVE
    )
    payload_hash = models.CharField(max_length=64, blank=True, default="")
    remote_snapshot = models.JSONField(default=dict, blank=True)
    remote_update_time = models.CharField(max_length=64, blank=True, default="")
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "google_classroom_resource_mappings"
        constraints = [
            models.UniqueConstraint(
                fields=["course_link", "local_type", "local_id"],
                name="google_classroom_unique_local_resource",
            )
        ]
        indexes = [
            models.Index(fields=["course_link", "google_resource_type", "status"])
        ]


class ClassroomSyncJob(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        DEAD = "dead", "Dead"

    course_link = models.ForeignKey(
        ClassroomCourseLink, on_delete=models.CASCADE, related_name="sync_jobs"
    )
    resource_mapping = models.ForeignKey(
        ClassroomResourceMapping,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sync_jobs",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="google_classroom_sync_jobs",
    )
    job_type = models.CharField(max_length=32)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
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
        db_table = "google_classroom_sync_jobs"
        ordering = ["available_at", "id"]
        indexes = [
            models.Index(fields=["status", "available_at"]),
            models.Index(fields=["course_link", "job_type", "status"]),
        ]


class ClassroomGradeSync(TimeStampedModel):
    resource_mapping = models.ForeignKey(
        ClassroomResourceMapping,
        on_delete=models.CASCADE,
        related_name="grade_syncs",
    )
    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="google_classroom_grade_syncs",
    )
    local_source_type = models.CharField(max_length=32)
    local_source_id = models.CharField(max_length=255)
    google_submission_id = models.CharField(max_length=255, blank=True, default="")
    grade = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=16, default="pending")
    idempotency_key = models.CharField(max_length=255, unique=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    error_category = models.CharField(max_length=64, blank=True, default="")
    last_error = models.TextField(blank=True, default="")

    class Meta:
        db_table = "google_classroom_grade_syncs"
        indexes = [models.Index(fields=["resource_mapping", "status"])]


class ClassroomRosterPreview(TimeStampedModel):
    course_link = models.ForeignKey(
        ClassroomCourseLink, on_delete=models.CASCADE, related_name="roster_previews"
    )
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    direction = models.CharField(max_length=32)
    rows = models.JSONField(default=list)
    token_digest = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    applied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "google_classroom_roster_previews"
        indexes = [models.Index(fields=["course_link", "expires_at"])]


class ClassroomSyncAudit(TimeStampedModel):
    course_link = models.ForeignKey(
        ClassroomCourseLink, on_delete=models.CASCADE, related_name="sync_audits"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    action = models.CharField(max_length=64)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "google_classroom_sync_audits"
        ordering = ["-created_at"]
