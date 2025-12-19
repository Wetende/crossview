"""
Initial migration for certification models.
Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 3.2, 4.4, 5.1, 5.2, 5.3
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('blueprints', '0001_initial'),
        ('progression', '0001_initial'),
    ]

    operations = [
        # CertificateTemplate table
        migrations.CreateModel(
            name='CertificateTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('template_html', models.TextField()),
                ('is_default', models.BooleanField(default=False)),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('blueprint', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='certificate_templates',
                    to='blueprints.academicblueprint'
                )),
            ],
            options={
                'db_table': 'certificate_templates',
            },
        ),
        migrations.AddIndex(
            model_name='certificatetemplate',
            index=models.Index(fields=['blueprint'], name='cert_tmpl_blueprint_idx'),
        ),
        migrations.AddIndex(
            model_name='certificatetemplate',
            index=models.Index(fields=['is_default'], name='cert_tmpl_is_default_idx'),
        ),

        # Certificate table
        migrations.CreateModel(
            name='Certificate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('serial_number', models.CharField(max_length=50, unique=True)),
                ('student_name', models.CharField(max_length=255)),
                ('program_title', models.CharField(max_length=255)),
                ('completion_date', models.DateField()),
                ('issue_date', models.DateField()),
                ('pdf_path', models.CharField(max_length=500)),
                ('is_revoked', models.BooleanField(default=False)),
                ('revoked_at', models.DateTimeField(blank=True, null=True)),
                ('revocation_reason', models.TextField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('enrollment', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='certificates',
                    to='progression.enrollment'
                )),
                ('template', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='certificates',
                    to='certifications.certificatetemplate'
                )),
            ],
            options={
                'db_table': 'certificates',
            },
        ),
        migrations.AddIndex(
            model_name='certificate',
            index=models.Index(fields=['serial_number'], name='cert_serial_number_idx'),
        ),
        migrations.AddIndex(
            model_name='certificate',
            index=models.Index(fields=['enrollment'], name='cert_enrollment_idx'),
        ),
        migrations.AddIndex(
            model_name='certificate',
            index=models.Index(fields=['is_revoked'], name='cert_is_revoked_idx'),
        ),

        # VerificationLog table
        migrations.CreateModel(
            name='VerificationLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('serial_number_queried', models.CharField(max_length=50)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('result', models.CharField(
                    choices=[('valid', 'Valid'), ('revoked', 'Revoked'), ('not_found', 'Not Found')],
                    max_length=20
                )),
                ('verified_at', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('certificate', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='verification_logs',
                    to='certifications.certificate'
                )),
            ],
            options={
                'db_table': 'verification_logs',
            },
        ),
        migrations.AddIndex(
            model_name='verificationlog',
            index=models.Index(fields=['serial_number_queried'], name='verif_serial_queried_idx'),
        ),
        migrations.AddIndex(
            model_name='verificationlog',
            index=models.Index(fields=['verified_at'], name='verif_verified_at_idx'),
        ),
    ]
