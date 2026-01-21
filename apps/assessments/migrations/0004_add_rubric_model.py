# Generated migration for rubric system

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0001_initial'),
        ('assessments', '0003_assignment_assignmentsubmission_quiz_question_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Rubric',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('dimensions', models.JSONField(help_text='List of dimension objects with name, weight, max_score')),
                ('max_score', models.PositiveIntegerField()),
                ('scope', models.CharField(choices=[('global', 'Global'), ('program', 'Program'), ('course', 'Course')], default='course', max_length=20)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rubrics', to=settings.AUTH_USER_MODEL)),
                ('program', models.ForeignKey(blank=True, help_text='Required for program-scoped rubrics', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='rubrics', to='core.program')),
            ],
            options={
                'db_table': 'assessments_rubrics',
                'indexes': [
                    models.Index(fields=['scope', 'owner'], name='assessments_rubrics_scope_owner_idx'),
                    models.Index(fields=['program'], name='assessments_rubrics_program_idx'),
                ],
            },
        ),
        migrations.AddField(
            model_name='assignment',
            name='rubric',
            field=models.ForeignKey(blank=True, help_text='Optional rubric for grading', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assignments', to='assessments.rubric'),
        ),
        migrations.AddField(
            model_name='assignmentsubmission',
            name='dimension_scores',
            field=models.JSONField(blank=True, help_text='Rubric dimension scores', null=True),
        ),
    ]
