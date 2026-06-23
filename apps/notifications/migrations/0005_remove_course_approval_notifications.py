from django.db import migrations, models


def preserve_course_notification_history(apps, schema_editor):
    notification_model = apps.get_model("notifications", "Notification")
    legacy_types = {"program_approved", "program_changes_requested"}

    for notification in notification_model.objects.filter(
        notification_type__in=legacy_types
    ).iterator():
        notification.notification_type = "system"
        if notification.related_program_id:
            notification.action_url = (
                f"/instructor/programs/{notification.related_program_id}/manage/"
            )
        notification.save(update_fields=["notification_type", "action_url"])

    for notification in notification_model.objects.filter(
        notification_type="system",
        title="Program Submitted For Review",
    ).iterator():
        if notification.related_program_id:
            notification.action_url = (
                f"/admin/programs/{notification.related_program_id}/"
            )
            notification.save(update_fields=["action_url"])


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0004_alter_notification_notification_type"),
    ]

    operations = [
        migrations.RunPython(
            preserve_course_notification_history,
            migrations.RunPython.noop,
        ),
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
                    ("system", "System Notification"),
                ],
                max_length=50,
            ),
        ),
    ]
