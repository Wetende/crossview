from django.db import migrations


NORMALIZED_HIERARCHIES = {
    "tvet": ["Unit", "Session"],
    "theology": ["Chapter", "Lesson"],
    "nita": ["Module", "Practical"],
    "driving": ["Phase", "Lesson"],
    "cbc": ["Strand", "Lesson"],
    "online": ["Section", "Lesson"],
}

LEGACY_HIERARCHIES = {
    "tvet": ["Level", "Unit", "Learning Outcome", "Session"],
    "theology": ["Year", "Semester", "Course", "Session"],
    "nita": ["Trade", "Grade", "Module", "Practical"],
    "driving": ["License Class", "Phase", "Lesson"],
    "cbc": ["Grade", "Strand", "Sub-Strand", "Lesson"],
    "online": ["Course", "Module", "Lesson"],
}


def normalize_seeded_preset_hierarchies(apps, schema_editor):
    PresetBlueprint = apps.get_model("platform", "PresetBlueprint")

    for code, hierarchy in NORMALIZED_HIERARCHIES.items():
        PresetBlueprint.objects.filter(code=code).update(hierarchy_labels=hierarchy)


def restore_seeded_preset_hierarchies(apps, schema_editor):
    PresetBlueprint = apps.get_model("platform", "PresetBlueprint")

    for code, hierarchy in LEGACY_HIERARCHIES.items():
        PresetBlueprint.objects.filter(code=code).update(hierarchy_labels=hierarchy)


class Migration(migrations.Migration):

    dependencies = [
        ("platform", "0005_normalize_online_preset_hierarchy"),
    ]

    operations = [
        migrations.RunPython(
            normalize_seeded_preset_hierarchies,
            restore_seeded_preset_hierarchies,
        ),
    ]
