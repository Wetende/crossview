# Generated migration for AssessmentResult model
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('progression', '0001_initial'),
        ('curriculum', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AssessmentResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('result_data', models.JSONField()),
                ('lecturer_comments', models.TextField(blank=True, null=True)),
                ('is_published', models.BooleanField(default=False)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('enrollment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assessment_results', to='progression.enrollment')),
                ('node', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assessment_results', to='curriculum.curriculumnode')),
                ('graded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='graded_results', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'assessment_results',
            },
        ),
        migrations.AddConstraint(
            model_name='assessmentresult',
            constraint=models.UniqueConstraint(fields=('enrollment', 'node'), name='unique_enrollment_node_result'),
        ),
        migrations.AddIndex(
            model_name='assessmentresult',
            index=models.Index(fields=['node', 'is_published'], name='results_node_published_idx'),
        ),
    ]
