import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning_operations", "0003_courseengagementpolicy"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LearnerReminderEvent",
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
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("operation_id", models.UUIDField(db_index=True)),
                ("notification_type", models.CharField(max_length=50)),
                ("title", models.CharField(max_length=255)),
                ("message", models.TextField()),
                ("action_url", models.CharField(max_length=500)),
                ("condition", models.JSONField(blank=True, default=dict)),
                ("channels", models.JSONField(blank=True, default=dict)),
                ("idempotency_key", models.CharField(max_length=255, unique=True)),
                (
                    "actor",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sent_learner_reminders",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "enrollment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reminder_events",
                        to="progression.enrollment",
                    ),
                ),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="learner_reminder_events",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "learning_learner_reminder_events",
                "indexes": [
                    models.Index(
                        fields=["enrollment", "-created_at"],
                        name="learning_le_enrollm_9c12ed_idx",
                    ),
                    models.Index(
                        fields=["recipient", "-created_at"],
                        name="learning_le_recipie_a6090e_idx",
                    ),
                ],
            },
        ),
    ]
