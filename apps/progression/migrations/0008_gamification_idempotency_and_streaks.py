import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('progression', '0007_enrollment_access_fields')]

    operations = [
        migrations.AddField(
            model_name='studentxp',
            name='idempotency_key',
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='studentxp',
            name='metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='studentxp',
            name='reason',
            field=models.CharField(choices=[
                ('lesson_complete', 'Lesson Complete'),
                ('quiz_pass', 'Quiz Pass'),
                ('quiz_perfect', 'Perfect Quiz Score'),
                ('assignment_submit', 'Assignment Submitted'),
                ('first_try', 'First Try Bonus'),
                ('streak_bonus', 'Streak Bonus'),
                ('badge_earned', 'Badge Earned'),
                ('course_complete', 'Course Complete'),
                ('manual', 'Manual Award'),
            ], max_length=50),
        ),
        migrations.CreateModel(
            name='LearningStreak',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('current_days', models.PositiveIntegerField(default=0)),
                ('longest_days', models.PositiveIntegerField(default=0)),
                ('last_activity_date', models.DateField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('enrollment', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='learning_streak', to='progression.enrollment')),
            ],
            options={'db_table': 'learning_streaks'},
        ),
    ]
