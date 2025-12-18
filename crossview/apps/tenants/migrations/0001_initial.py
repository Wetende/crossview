"""
Initial migration for Tenant model.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Tenant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('subdomain', models.CharField(max_length=100, unique=True)),
                ('admin_email', models.EmailField(max_length=254)),
                ('is_active', models.BooleanField(default=True)),
                ('settings', models.JSONField(blank=True, null=True)),
                ('activated_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'tenants',
            },
        ),
        migrations.AddIndex(
            model_name='tenant',
            index=models.Index(fields=['subdomain'], name='tenants_subdoma_idx'),
        ),
        migrations.AddIndex(
            model_name='tenant',
            index=models.Index(fields=['is_active'], name='tenants_is_acti_idx'),
        ),
    ]
