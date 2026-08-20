from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("live_sessions", "0002_backfill_legacy_live_classes")]
    operations = [
        migrations.AddField(model_name="scheduledlearningsession", name="calendar_visibility", field=models.CharField(choices=[("private", "Private"), ("default", "Calendar default")], default="private", max_length=16)),
        migrations.AddField(model_name="scheduledlearningsession", name="reminder_minutes", field=models.PositiveSmallIntegerField(default=10)),
        migrations.AddField(model_name="scheduledlearningsession", name="send_updates", field=models.CharField(choices=[("all", "All invitees"), ("externalOnly", "External invitees"), ("none", "No invitations")], default="none", max_length=16)),
        migrations.AddField(model_name="scheduledlearningsession", name="invite_learners", field=models.BooleanField(default=False)),
    ]
