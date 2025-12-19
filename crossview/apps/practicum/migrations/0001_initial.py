"""
Initial migration for Practicum System.
Creates rubrics, practicum_submissions, and submission_reviews tables.
Requirements: 1.4, 2.5, 3.1, 3.3, 4.1
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('curriculum', '0001_initial'),
        ('progression', '0002_nodecompletion'),
    ]

    operations = [
        # Task 1.1: Create rubrics table
        migrations.CreateModel(
            name='Rubric',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('dimensions', models.JSONField(help_text='List of dimension objects with name, weight, max_score')),
                ('max_score', models.PositiveIntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'rubrics',
            },
        ),
        # Task 1.2: Create practicum_submissions table
        migrations.CreateModel(
            name='PracticumSubmission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('version', models.PositiveIntegerField(default=1)),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('approved', 'Approved'),
                        ('revision_required', 'Revision Required'),
                        ('rejected', 'Rejected'),
                    ],
                    default='pending',
                    max_length=20
                )),
                ('file_path', models.CharField(max_length=500)),
                ('file_type', models.CharField(max_length=50)),
                ('file_size', models.BigIntegerField()),
                ('duration_seconds', models.PositiveIntegerField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('submitted_at', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('enrollment', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='practicum_submissions',
                    to='progression.enrollment'
                )),
                ('node', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='practicum_submissions',
                    to='curriculum.curriculumnode'
                )),
            ],
            options={
                'db_table': 'practicum_submissions',
            },
        ),
        # Task 1.3: Create submission_reviews table
        migrations.CreateModel(
            name='SubmissionReview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[
                        ('approved', 'Approved'),
                        ('revision_required', 'Revision Required'),
                        ('rejected', 'Rejected'),
                    ],
                    max_length=20
                )),
                ('dimension_scores', models.JSONField(blank=True, null=True)),
                ('total_score', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('comments', models.TextField(blank=True, null=True)),
                ('reviewed_at', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('reviewer', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='submission_reviews',
                    to=settings.AUTH_USER_MODEL
                )),
                ('submission', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='reviews',
                    to='practicum.practicumsubmission'
                )),
            ],
            options={
                'db_table': 'submission_reviews',
            },
        ),
        # Add indexes for practicum_submissions
        migrations.AddIndex(
            model_name='practicumsubmission',
            index=models.Index(fields=['enrollment', 'node'], name='practicum_enroll_node_idx'),
        ),
        migrations.AddIndex(
            model_name='practicumsubmission',
            index=models.Index(fields=['status'], name='practicum_status_idx'),
        ),
        # Add index for submission_reviews
        migrations.AddIndex(
            model_name='submissionreview',
            index=models.Index(fields=['submission'], name='review_submission_idx'),
        ),
    ]
