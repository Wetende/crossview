import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('notifications', '0005_remove_course_approval_notifications'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='idempotency_key',
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(choices=[
                ('enrollment_confirmed', 'Enrollment Confirmed'),
                ('enrollment_approved', 'Enrollment Approved'),
                ('enrollment_rejected', 'Enrollment Rejected'),
                ('discussion_comment', 'Lesson Discussion Comment'),
                ('discussion_reply', 'Lesson Discussion Reply'),
                ('grade_published', 'Grade Published'),
                ('assignment_graded', 'Assignment Graded'),
                ('quiz_graded', 'Quiz Graded'),
                ('announcement', 'New Announcement'),
                ('direct_message', 'Direct Message'),
                ('instructor_approved', 'Instructor Approved'),
                ('instructor_rejected', 'Instructor Rejected'),
                ('assignment_reminder', 'Assignment Reminder'),
                ('access_expiry_reminder', 'Access Expiry Reminder'),
                ('inactivity_reminder', 'Inactivity Reminder'),
                ('badge_earned', 'Badge Earned'),
                ('system', 'System Notification'),
            ], max_length=50),
        ),
        migrations.CreateModel(
            name='NotificationEmailOutbox',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('notification_type', models.CharField(max_length=50)),
                ('subject', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('html_message', models.TextField(blank=True, default='')),
                ('from_email', models.EmailField(blank=True, default='', max_length=254)),
                ('digest_mode', models.CharField(choices=[('instant', 'Instant'), ('daily', 'Daily Digest'), ('weekly', 'Weekly Digest')], max_length=20)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('sent', 'Sent'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('available_at', models.DateTimeField()),
                ('locked_at', models.DateTimeField(blank=True, null=True)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('attempts', models.PositiveSmallIntegerField(default=0)),
                ('max_attempts', models.PositiveSmallIntegerField(default=8)),
                ('last_error', models.TextField(blank=True, default='')),
                ('idempotency_key', models.CharField(max_length=255, unique=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('notification', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='email_outbox_rows', to='notifications.notification')),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notification_email_outbox', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'notification_email_outbox',
                'ordering': ['available_at', 'id'],
                'indexes': [
                    models.Index(fields=['status', 'available_at'], name='notificatio_status_aae264_idx'),
                    models.Index(fields=['recipient', 'digest_mode', 'status'], name='notificatio_recipie_e76c3c_idx'),
                ],
            },
        ),
    ]
