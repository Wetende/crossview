from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0006_notification_idempotency_key_and_outbox"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="notification_type",
            field=models.CharField(
                choices=[
                    ("enrollment_confirmed", "Enrollment Confirmed"),
                    ("enrollment_approved", "Enrollment Approved"),
                    ("enrollment_rejected", "Enrollment Rejected"),
                    ("discussion_comment", "Lesson Discussion Comment"),
                    ("discussion_reply", "Lesson Discussion Reply"),
                    ("grade_published", "Grade Published"),
                    ("assignment_graded", "Assignment Graded"),
                    ("quiz_graded", "Quiz Graded"),
                    ("announcement", "New Announcement"),
                    ("direct_message", "Direct Message"),
                    ("instructor_approved", "Instructor Approved"),
                    ("instructor_rejected", "Instructor Rejected"),
                    ("course_start_reminder", "Course Start Reminder"),
                    ("assignment_reminder", "Assignment Reminder"),
                    ("access_expiry_reminder", "Access Expiry Reminder"),
                    ("inactivity_reminder", "Inactivity Reminder"),
                    ("badge_earned", "Badge Earned"),
                    ("system", "System Notification"),
                ],
                max_length=50,
            ),
        ),
    ]
