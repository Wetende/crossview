from django.db import migrations, models


LEVEL_LABELS = {
    "entry": "Entry",
    "foundation": "Foundation",
    "artisan": "Artisan",
    "certificate": "Certificate",
    "diploma": "Diploma",
    "advanced": "Advanced",
    "professional": "Professional",
    "post_professional": "Post-Professional",
    "skill_upgrade": "Skill Upgrade",
    "trade_test": "Trade Test",
    "degree": "Degree",
    "grade_1_3": "Lower Primary (1-3)",
    "grade_4_6": "Upper Primary (4-6)",
    "grade_7_9": "Junior Secondary (7-9)",
    "grade_10_12": "Senior Secondary (10-12)",
    "beginner": "Beginner",
    "intermediate": "Intermediate",
}


def canonicalize_program_levels(apps, schema_editor):
    Program = apps.get_model("core", "Program")
    for program in Program.objects.all().only("id", "level", "official_level"):
        official_level = (program.official_level or "").strip()
        current_level = (program.level or "").strip()
        normalized = current_level.lower()
        program.level = official_level or LEVEL_LABELS.get(normalized, "")
        program.save(update_fields=["level"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0019_remove_course_approval_workflow"),
    ]

    operations = [
        migrations.AlterField(
            model_name="program",
            name="level",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Student-facing course level, e.g. Beginner, Level 5, Certificate I.",
                max_length=100,
            ),
        ),
        migrations.RunPython(canonicalize_program_levels, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="program",
            name="official_level",
        ),
    ]
