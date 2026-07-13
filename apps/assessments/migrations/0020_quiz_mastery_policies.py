from django.db import migrations, models


def migrate_existing_quiz_policies(apps, schema_editor):
    Quiz = apps.get_model("assessments", "Quiz")

    Quiz.objects.filter(show_answers_after_submit=True).update(
        answer_release_policy="after_each_attempt"
    )
    Quiz.objects.filter(show_answers_after_submit=False).update(
        answer_release_policy="never"
    )
    Quiz.objects.filter(max_attempts__gt=1).update(allow_retake_after_pass=True)


class Migration(migrations.Migration):
    dependencies = [
        ("assessments", "0019_quizattempt_points_earned_decimal"),
    ]

    operations = [
        migrations.AddField(
            model_name="quiz",
            name="answer_release_policy",
            field=models.CharField(
                choices=[
                    ("after_each_attempt", "After every attempt"),
                    (
                        "after_pass_or_final",
                        "After passing or the final available attempt",
                    ),
                    (
                        "after_final_attempt",
                        "After the final available attempt",
                    ),
                    ("never", "Never"),
                ],
                default="after_pass_or_final",
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name="quiz",
            name="allow_retake_after_pass",
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(migrate_existing_quiz_policies, migrations.RunPython.noop),
    ]
