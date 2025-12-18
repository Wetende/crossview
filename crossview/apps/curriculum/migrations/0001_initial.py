"""
Initial migration for CurriculumNode model.

Creates curriculum_nodes table with:
- program_id foreign key
- parent_id self-referencing foreign key with CASCADE delete
- node_type, title, code, description fields
- properties (JSONField) for flexible data storage
- completion_rules (JSONField) for completion configuration
- position for sibling ordering
- is_published flag
- Composite index on (program_id, parent_id)
- Index on node_type

Requirements: 2.1, 2.4
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0002_program'),
    ]

    operations = [
        migrations.CreateModel(
            name='CurriculumNode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('node_type', models.CharField(max_length=50)),
                ('title', models.CharField(max_length=255)),
                ('code', models.CharField(blank=True, max_length=50, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('properties', models.JSONField(blank=True, default=dict)),
                ('completion_rules', models.JSONField(blank=True, default=dict)),
                ('position', models.PositiveIntegerField(default=0)),
                ('is_published', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('program', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='curriculum_nodes', to='core.program')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='curriculum.curriculumnode')),
            ],
            options={
                'db_table': 'curriculum_nodes',
                'ordering': ['position'],
            },
        ),
        migrations.AddIndex(
            model_name='curriculumnode',
            index=models.Index(fields=['program', 'parent'], name='curriculum__program_parent_idx'),
        ),
        migrations.AddIndex(
            model_name='curriculumnode',
            index=models.Index(fields=['node_type'], name='curriculum__node_type_idx'),
        ),
    ]
