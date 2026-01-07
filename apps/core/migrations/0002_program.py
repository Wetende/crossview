"""
Migration to add Program model.
Requirements: 4.1
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('platform', '0001_initial'),
        ('blueprints', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Program',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('code', models.CharField(blank=True, max_length=50, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('is_published', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='programs', to='platform.tenant')),
                ('blueprint', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='programs', to='blueprints.academicblueprint')),
            ],
            options={
                'db_table': 'programs',
            },
        ),
        migrations.AddIndex(
            model_name='program',
            index=models.Index(fields=['name'], name='programs_name_idx'),
        ),
        migrations.AddIndex(
            model_name='program',
            index=models.Index(fields=['is_published'], name='programs_is_publ_idx'),
        ),
    ]
