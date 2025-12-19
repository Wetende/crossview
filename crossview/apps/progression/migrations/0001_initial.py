# Generated migration for Enrollment model
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0002_program'),
    ]

    operations = [
        migrations.CreateModel(
            name='Enrollment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('enrolled_at', models.DateTimeField(auto_now_add=True)),
                ('status', models.CharField(choices=[('active', 'Active'), ('completed', 'Completed'), ('withdrawn', 'Withdrawn'), ('suspended', 'Suspended')], default='active', max_length=20)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('program', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to='core.program')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='enrollments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'enrollments',
            },
        ),
        migrations.AddConstraint(
            model_name='enrollment',
            constraint=models.UniqueConstraint(fields=('user', 'program'), name='unique_user_program_enrollment'),
        ),
        migrations.AddIndex(
            model_name='enrollment',
            index=models.Index(fields=['user', 'status'], name='enrollments_user_id_status_idx'),
        ),
        migrations.AddIndex(
            model_name='enrollment',
            index=models.Index(fields=['program', 'status'], name='enrollments_program_status_idx'),
        ),
    ]
