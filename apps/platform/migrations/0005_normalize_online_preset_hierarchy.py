from django.db import migrations


def normalize_online_preset_hierarchy(apps, schema_editor):
    PresetBlueprint = apps.get_model("platform", "PresetBlueprint")
    PresetBlueprint.objects.filter(code="online").update(
        hierarchy_labels=["Section", "Lesson"]
    )


def revert_online_preset_hierarchy(apps, schema_editor):
    PresetBlueprint = apps.get_model("platform", "PresetBlueprint")
    PresetBlueprint.objects.filter(code="online").update(
        hierarchy_labels=["Course", "Module", "Lesson"]
    )


class Migration(migrations.Migration):

    dependencies = [
        ("platform", "0004_platformsettings_program_categories"),
    ]

    operations = [
        migrations.RunPython(
            normalize_online_preset_hierarchy,
            revert_online_preset_hierarchy,
        ),
    ]
