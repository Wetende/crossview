import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("curriculum", "0005_delete_course_change_request"),
        ("learning_operations", "0004_learnerreminderevent"),
        ("progression", "0008_gamification_idempotency_and_streaks"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearnerNodeProgress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("activity_type", models.CharField(max_length=32)),
                ("active_seconds", models.FloatField(default=0)),
                ("duration_seconds", models.PositiveIntegerField(blank=True, null=True)),
                ("resume_position_seconds", models.FloatField(default=0)),
                ("pages_viewed", models.JSONField(blank=True, default=list)),
                ("total_pages", models.PositiveIntegerField(blank=True, null=True)),
                ("last_evidence_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("enrollment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="node_activity_progress", to="progression.enrollment")),
                ("node", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="learner_activity_progress", to="curriculum.curriculumnode")),
            ],
            options={
                "db_table": "learning_learner_node_progress",
                "indexes": [
                    models.Index(fields=["enrollment", "-last_evidence_at"], name="learning_le_enrollm_bf2eef_idx"),
                    models.Index(fields=["node", "activity_type"], name="learning_le_node_id_211664_idx"),
                ],
                "constraints": [models.UniqueConstraint(fields=("enrollment", "node"), name="learning_unique_enrollment_node_progress")],
            },
        ),
        migrations.CreateModel(
            name="LearnerContentSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("session_key", models.CharField(max_length=64)),
                ("last_sequence", models.PositiveBigIntegerField(default=0)),
                ("last_position_seconds", models.FloatField(default=0)),
                ("active_seconds", models.FloatField(default=0)),
                ("last_event_at", models.DateTimeField(blank=True, null=True)),
                ("progress", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="content_sessions", to="learning_operations.learnernodeprogress")),
            ],
            options={
                "db_table": "learning_learner_content_sessions",
                "indexes": [models.Index(fields=["progress", "-last_event_at"], name="learning_le_progres_5bc633_idx")],
                "constraints": [models.UniqueConstraint(fields=("progress", "session_key"), name="learning_unique_progress_content_session")],
            },
        ),
        migrations.CreateModel(
            name="CodeLabWork",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("language", models.CharField(max_length=32)),
                ("draft_code", models.TextField(blank=True, default="")),
                ("submitted_code", models.TextField(blank=True, default="")),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("revision", models.PositiveIntegerField(default=1)),
                ("enrollment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="code_lab_work", to="progression.enrollment")),
                ("node", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="code_lab_work", to="curriculum.curriculumnode")),
            ],
            options={
                "db_table": "learning_code_lab_work",
                "indexes": [models.Index(fields=["enrollment", "-updated_at"], name="learning_co_enrollm_9260cb_idx")],
                "constraints": [models.UniqueConstraint(fields=("enrollment", "node"), name="learning_unique_enrollment_code_work")],
            },
        ),
    ]
