from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ReportExportLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("report_id", models.CharField(max_length=120)),
                ("scope", models.CharField(max_length=32)),
                (
                    "export_format",
                    models.CharField(
                        choices=[("print", "Print"), ("csv", "CSV")],
                        max_length=16,
                    ),
                ),
                ("filters", models.JSONField(blank=True, default=dict)),
                ("selected_ids", models.JSONField(blank=True, default=list)),
                ("row_count", models.PositiveIntegerField(default=0)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="report_export_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "report_export_logs",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="reportexportlog",
            index=models.Index(
                fields=["report_id", "-created_at"],
                name="reports_log_report_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="reportexportlog",
            index=models.Index(
                fields=["user", "-created_at"],
                name="reports_log_user_created_idx",
            ),
        ),
    ]
