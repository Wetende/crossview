import django.db.models.deletion
from django.db import migrations, models

import apps.learning_operations.models


def create_default_policies(apps, schema_editor):
    Program = apps.get_model('core', 'Program')
    CourseEngagementPolicy = apps.get_model(
        'learning_operations', 'CourseEngagementPolicy'
    )
    CourseEngagementPolicy.objects.bulk_create(
        [CourseEngagementPolicy(program_id=program_id) for program_id in Program.objects.values_list('id', flat=True)],
        ignore_conflicts=True,
    )


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0022_masterstudy_settings_fields'),
        ('learning_operations', '0002_assessmentattemptgrant_courseinvitation_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CourseEngagementPolicy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assignment_reminders_enabled', models.BooleanField(default=True)),
                ('assignment_offsets', models.JSONField(default=apps.learning_operations.models.default_assignment_reminder_offsets)),
                ('expiry_reminders_enabled', models.BooleanField(default=True)),
                ('expiry_offsets', models.JSONField(default=apps.learning_operations.models.default_expiry_reminder_offsets)),
                ('inactivity_reminders_enabled', models.BooleanField(default=True)),
                ('inactivity_offsets', models.JSONField(default=apps.learning_operations.models.default_inactivity_reminder_offsets)),
                ('program', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='engagement_policy', to='core.program')),
            ],
            options={'db_table': 'learning_course_engagement_policies'},
        ),
        migrations.RunPython(create_default_policies, migrations.RunPython.noop),
    ]
