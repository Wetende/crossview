"""Prepared course changes and their audit trail."""

import uuid

from django.conf import settings
from django.db import models


class CourseChange(models.Model):
    """
    A validated, previewed set of course edits requested through an AI client.

    Preparation stores the exact operations and the content versions they were
    checked against. Application accepts only this record's ID, so what is
    saved is always what was previewed. The record doubles as the audit trail.
    """

    class Status(models.TextChoices):
        PREPARED = "prepared", "Prepared"
        APPLIED = "applied", "Applied"
        STALE = "stale", "Stale"
        REJECTED = "rejected", "Rejected"
        FAILED = "failed", "Failed"
        EXPIRED = "expired", "Expired"

    # Only these fields may change after preparation.
    MUTABLE_FIELDS = frozenset(
        {"status", "result", "error", "applied_at", "applied_by_application"}
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ai_course_changes",
    )
    user_email = models.CharField(max_length=254, blank=True, default="")
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.SET_NULL,
        null=True,
        related_name="ai_course_changes",
    )
    program_code = models.CharField(max_length=50, blank=True, default="")
    application = models.ForeignKey(
        settings.OAUTH2_PROVIDER_APPLICATION_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="prepared_course_changes",
    )
    client_name = models.CharField(max_length=255, blank=True, default="")
    summary = models.CharField(max_length=500, blank=True, default="")
    operations = models.JSONField(default=list)
    preview = models.JSONField(default=dict)
    target_versions = models.JSONField(default=dict)
    affects_published_content = models.BooleanField(default=False)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PREPARED
    )
    result = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    applied_at = models.DateTimeField(null=True, blank=True)
    applied_by_application = models.ForeignKey(
        settings.OAUTH2_PROVIDER_APPLICATION_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applied_course_changes",
    )

    class Meta:
        db_table = "ai_course_changes"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["program", "-created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.program_code or 'course'}: {self.summary or self.id} ({self.status})"

    def save(self, *args, **kwargs):
        if not self._state.adding:
            update_fields = kwargs.get("update_fields")
            if update_fields is None or not set(update_fields) <= self.MUTABLE_FIELDS:
                raise ValueError("A prepared course change cannot be edited.")
        super().save(*args, **kwargs)
