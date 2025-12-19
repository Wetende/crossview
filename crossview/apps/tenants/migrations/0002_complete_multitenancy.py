"""
Complete multi-tenancy migration - adds all tenant-related tables.
Requirements: 1.1, 4.1, 5.1, 6.1
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
    ]

    operations = [
        # SubscriptionTier model
        migrations.CreateModel(
            name='SubscriptionTier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('max_students', models.IntegerField(default=100)),
                ('max_storage_mb', models.IntegerField(default=5000)),
                ('max_programs', models.IntegerField(default=10)),
                ('price_monthly', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('features', models.JSONField(blank=True, default=dict)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'subscription_tiers',
            },
        ),
        
        # Add subscription_tier FK to Tenant
        migrations.AddField(
            model_name='tenant',
            name='subscription_tier',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='tenants',
                to='tenants.subscriptiontier'
            ),
        ),
        
        # TenantBranding model
        migrations.CreateModel(
            name='TenantBranding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('logo_path', models.CharField(blank=True, max_length=500, null=True)),
                ('favicon_path', models.CharField(blank=True, max_length=500, null=True)),
                ('primary_color', models.CharField(default='#3B82F6', max_length=7)),
                ('secondary_color', models.CharField(default='#1E40AF', max_length=7)),
                ('institution_name', models.CharField(blank=True, max_length=255, null=True)),
                ('tagline', models.CharField(blank=True, max_length=255, null=True)),
                ('custom_css', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='branding',
                    to='tenants.tenant'
                )),
            ],
            options={
                'db_table': 'tenant_brandings',
            },
        ),
        
        # TenantLimits model
        migrations.CreateModel(
            name='TenantLimits',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('max_students', models.IntegerField(default=100)),
                ('max_storage_mb', models.IntegerField(default=5000)),
                ('max_programs', models.IntegerField(default=10)),
                ('current_students', models.IntegerField(default=0)),
                ('current_storage_mb', models.IntegerField(default=0)),
                ('current_programs', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='limits',
                    to='tenants.tenant'
                )),
            ],
            options={
                'db_table': 'tenant_limits',
            },
        ),
        
        # PresetBlueprint model
        migrations.CreateModel(
            name='PresetBlueprint',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('regulatory_body', models.CharField(blank=True, max_length=255, null=True)),
                ('hierarchy_labels', models.JSONField()),
                ('grading_config', models.JSONField()),
                ('structure_rules', models.JSONField(blank=True, default=dict)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'preset_blueprints',
            },
        ),
        migrations.AddIndex(
            model_name='presetblueprint',
            index=models.Index(fields=['code'], name='preset_blue_code_idx'),
        ),
        migrations.AddIndex(
            model_name='presetblueprint',
            index=models.Index(fields=['is_active'], name='preset_blue_is_acti_idx'),
        ),
    ]
