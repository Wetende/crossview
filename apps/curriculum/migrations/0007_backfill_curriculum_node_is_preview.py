from django.db import migrations

TRUE_STRINGS = {"true", "1", "yes", "on"}
BATCH_SIZE = 500


def _preview_flag(properties) -> bool:
    value = properties.get("is_preview") if isinstance(properties, dict) else None
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value == 1
    if isinstance(value, str):
        return value.strip().lower() in TRUE_STRINGS
    return False


def backfill_is_preview(apps, schema_editor):
    """Copy the builder's properties.is_preview toggle into the column."""
    CurriculumNode = apps.get_model("curriculum", "CurriculumNode")

    enable_ids = []
    disable_ids = []
    nodes = CurriculumNode.objects.only("id", "properties", "is_preview").iterator()
    for node in nodes:
        flag = _preview_flag(node.properties)
        if flag == node.is_preview:
            continue
        (enable_ids if flag else disable_ids).append(node.pk)

    for ids, flag in ((enable_ids, True), (disable_ids, False)):
        for start in range(0, len(ids), BATCH_SIZE):
            CurriculumNode.objects.filter(pk__in=ids[start : start + BATCH_SIZE]).update(
                is_preview=flag
            )


class Migration(migrations.Migration):
    dependencies = [("curriculum", "0006_promote_google_meet_lesson_type")]

    operations = [
        migrations.RunPython(backfill_is_preview, migrations.RunPython.noop),
    ]
