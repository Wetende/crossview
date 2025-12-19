"""
Initial migration for content app - ContentVersion and ParsedImage models.
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('curriculum', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContentVersion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('version', models.PositiveIntegerField(default=1)),
                ('source_file_path', models.CharField(max_length=500)),
                ('source_file_name', models.CharField(max_length=255)),
                ('page_count', models.PositiveIntegerField()),
                ('is_published', models.BooleanField(default=False)),
                ('is_manually_edited', models.BooleanField(default=False)),
                ('parsed_at', models.DateTimeField(blank=True, null=True)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('node', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='content_versions',
                    to='curriculum.curriculumnode'
                )),
            ],
            options={
                'db_table': 'content_versions',
            },
        ),
        migrations.CreateModel(
            name='ParsedImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('original_path', models.CharField(max_length=500)),
                ('optimized_path', models.CharField(max_length=500)),
                ('page_number', models.PositiveIntegerField()),
                ('width', models.PositiveIntegerField(blank=True, null=True)),
                ('height', models.PositiveIntegerField(blank=True, null=True)),
                ('file_size', models.PositiveIntegerField(blank=True, null=True)),
                ('content_version', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='parsed_images',
                    to='content.contentversion'
                )),
            ],
            options={
                'db_table': 'parsed_images',
            },
        ),
        migrations.AddIndex(
            model_name='contentversion',
            index=models.Index(fields=['node', 'version'], name='cv_node_version_idx'),
        ),
        migrations.AddIndex(
            model_name='contentversion',
            index=models.Index(fields=['is_published'], name='cv_is_published_idx'),
        ),
    ]
