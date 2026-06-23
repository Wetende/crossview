from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0018_remove_approval_bureaucracy_fields"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="program",
            name="programs_submiss_4be627_idx",
        ),
        migrations.RemoveField(
            model_name="program",
            name="submission_status",
        ),
        migrations.RemoveField(
            model_name="program",
            name="submitted_at",
        ),
        migrations.RemoveField(
            model_name="program",
            name="submitted_by",
        ),
    ]
