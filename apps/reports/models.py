from django.conf import settings
from django.db import models


class ReportExportLog(models.Model):
    """Audit trail for generated reports and exports."""

    FORMAT_CHOICES = [
        ("print", "Print"),
        ("csv", "CSV"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="report_export_logs",
    )
    report_id = models.CharField(max_length=120)
    scope = models.CharField(max_length=32)
    export_format = models.CharField(max_length=16, choices=FORMAT_CHOICES)
    filters = models.JSONField(default=dict, blank=True)
    selected_ids = models.JSONField(default=list, blank=True)
    row_count = models.PositiveIntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "report_export_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["report_id", "-created_at"],
                name="reports_log_report_created_idx",
            ),
            models.Index(
                fields=["user", "-created_at"],
                name="reports_log_user_created_idx",
            ),
        ]

    def __str__(self):
        return f"{self.report_id} {self.export_format} by {self.user_id}"
