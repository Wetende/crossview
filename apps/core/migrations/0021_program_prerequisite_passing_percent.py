from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


def clear_disabled_prerequisite_links(apps, schema_editor):
    Program = apps.get_model("core", "Program")
    for program in Program.objects.filter(prerequisites_enabled=False):
        program.prerequisite_programs.clear()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0020_canonical_program_level"),
    ]

    operations = [
        migrations.AddField(
            model_name="program",
            name="prerequisite_passing_percent",
            field=models.PositiveSmallIntegerField(
                default=50,
                help_text=(
                    "Minimum published course score required for prerequisite "
                    "courses. Use 0 for completion-only prerequisites."
                ),
                validators=[MinValueValidator(0), MaxValueValidator(100)],
            ),
        ),
        migrations.RunPython(
            clear_disabled_prerequisite_links,
            migrations.RunPython.noop,
        ),
        migrations.RemoveField(
            model_name="program",
            name="prerequisites_enabled",
        ),
    ]
