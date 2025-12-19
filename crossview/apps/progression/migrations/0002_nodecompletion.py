"""
Migration to add NodeCompletion model for tracking student progress.
Requirements: 3.1, 3.5
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('progression', '0001_initial'),
        ('curriculum', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='NodeCompletion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('completed_at', models.DateTimeField()),
                ('completion_type', models.CharField(
                    choices=[
                        ('view', 'View'),
                        ('quiz_pass', 'Quiz Pass'),
                        ('upload', 'Upload'),
                        ('manual', 'Manual'),
                    ],
                    max_length=20
                )),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('enrollment', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='completions',
                    to='progression.enrollment'
                )),
                ('node', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='completions',
                    to='curriculum.curriculumnode'
                )),
            ],
            options={
                'db_table': 'node_completions',
            },
        ),
        migrations.AddConstraint(
            model_name='nodecompletion',
            constraint=models.UniqueConstraint(
                fields=('enrollment', 'node'),
                name='unique_enrollment_node_completion'
            ),
        ),
        migrations.AddIndex(
            model_name='nodecompletion',
            index=models.Index(fields=['enrollment'], name='completions_enrollment_idx'),
        ),
        migrations.AddIndex(
            model_name='nodecompletion',
            index=models.Index(fields=['node'], name='completions_node_idx'),
        ),
    ]
