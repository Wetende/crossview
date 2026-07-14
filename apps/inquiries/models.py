from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel


class Inquiry(TimeStampedModel):
    class Kind(models.TextChoices):
        GENERAL = "general", "General"
        PROGRAM = "program", "Program"
        PARTNERSHIP = "partnership", "Partnership"
        SUPPORT = "support", "Support"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        NEW = "new", "New"
        IN_PROGRESS = "in_progress", "In progress"
        RESOLVED = "resolved", "Resolved"
        SPAM = "spam", "Spam"

    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, default="")
    subject = models.CharField(max_length=255, blank=True, default="")
    message = models.TextField(blank=True, default="")
    kind = models.CharField(
        max_length=20,
        choices=Kind.choices,
        default=Kind.GENERAL,
    )
    source = models.CharField(max_length=80, blank=True, default="website")
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inquiries",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_inquiries",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )
    internal_notes = models.TextField(blank=True, default="")
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_inquiries",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    notification_sent_at = models.DateTimeField(null=True, blank=True)
    notification_error = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        db_table = "inquiries"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["status", "-created_at"],
                name="inquiry_status_created_idx",
            ),
            models.Index(
                fields=["kind", "-created_at"],
                name="inquiry_kind_created_idx",
            ),
            models.Index(
                fields=["program", "-created_at"],
                name="inquiry_program_created_idx",
            ),
        ]

    def __str__(self):
        return f"{self.name} — {self.get_kind_display()}"

    def mark_resolved(self, *, user=None):
        self.status = self.Status.RESOLVED
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.save(update_fields=["status", "resolved_by", "resolved_at", "updated_at"])
