from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_classroom_credentials(apps, schema_editor):
    Old = apps.get_model("google_classroom", "ClassroomOAuthCredential")
    New = apps.get_model("google_workspace", "GoogleWorkspaceCredential")
    rows = []
    for old in Old.objects.all().iterator():
        rows.append(New(id=old.id, created_at=old.created_at, updated_at=old.updated_at, user_id=old.user_id, google_user_id=old.google_user_id, google_email=old.google_email, refresh_token_ciphertext=old.refresh_token_ciphertext, granted_scopes=old.granted_scopes, status=old.status, last_error=old.last_error, revoked_at=old.revoked_at))
    New.objects.bulk_create(rows, ignore_conflicts=True)


class Migration(migrations.Migration):
    initial = True
    dependencies = [("google_classroom", "0001_initial"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(name="GoogleWorkspaceCredential", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("google_user_id", models.CharField(blank=True, default="", max_length=255)), ("google_email", models.EmailField(blank=True, default="", max_length=254)),
            ("refresh_token_ciphertext", models.TextField(blank=True, default="")), ("granted_scopes", models.JSONField(blank=True, default=list)),
            ("status", models.CharField(choices=[("connected", "Connected"), ("invalid", "Invalid"), ("revoked", "Revoked")], default="connected", max_length=16)),
            ("last_error", models.TextField(blank=True, default="")), ("revoked_at", models.DateTimeField(blank=True, null=True)),
            ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="google_workspace_credential", to=settings.AUTH_USER_MODEL)),
        ], options={"db_table": "google_workspace_oauth_credentials"}),
        migrations.CreateModel(name="GoogleMeetSettings", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("default_timezone", models.CharField(default="Africa/Nairobi", max_length=64)), ("default_reminder_minutes", models.PositiveSmallIntegerField(default=10)),
            ("default_calendar_visibility", models.CharField(choices=[("private", "Private"), ("default", "Calendar default")], default="private", max_length=16)), ("default_invite_learners", models.BooleanField(default=False)),
            ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="google_meet_settings", to=settings.AUTH_USER_MODEL)),
        ], options={"db_table": "google_workspace_meet_settings"}),
        migrations.CreateModel(name="GoogleParticipantIdentity", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("google_user_id", models.CharField(max_length=255, unique=True)), ("verified_email", models.EmailField(blank=True, default="", max_length=254)), ("source", models.CharField(default="manual_mapping", max_length=32)),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="google_participant_identities", to=settings.AUTH_USER_MODEL)),
            ("verified_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="verified_google_participant_identities", to=settings.AUTH_USER_MODEL)),
        ], options={"db_table": "google_workspace_participant_identities"}),
        migrations.RunPython(migrate_classroom_credentials, migrations.RunPython.noop),
    ]
