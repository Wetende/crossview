"""
Initial migration for AcademicBlueprint model.

Creates academic_blueprints table with:
- name, description fields
- hierarchy_structure (JSONField) - defines curriculum levels like ["Year", "Unit", "Session"]
- grading_logic (JSONField) - defines grading strategy
- progression_rules (JSONField) - defines progression requirements
- gamification_enabled, certificate_enabled flags
- tenant foreign key for multi-tenancy
- Index on name column for search performance

Requirements: 1.1, 1.2
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('tenants', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AcademicBlueprint',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True, null=True)),
                ('hierarchy_structure', models.JSONField(help_text='List of hierarchy level labels, e.g. ["Year", "Unit", "Session"]')),
                ('grading_logic', models.JSONField(help_text='Grading configuration, e.g. {"type": "weighted", "components": [...]}')),
                ('progression_rules', models.JSONField(blank=True, null=True, help_text='Progression requirements configuration')),
                ('gamification_enabled', models.BooleanField(default=False)),
                ('certificate_enabled', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('tenant', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='blueprints',
                    to='tenants.tenant'
                )),
            ],
            options={
                'db_table': 'academic_blueprints',
            },
        ),
        migrations.AddIndex(
            model_name='academicblueprint',
            index=models.Index(fields=['name'], name='academic_bl_name_idx'),
        ),
    ]
