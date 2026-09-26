from django.db import migrations
from django.db.models import Q

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
    """Copy the builder's properties.is_preview toggle into the column.

    Only rows that carry the key or already have the column set can change, so
    the rest of the table is never loaded; candidates are paged by primary key.
    """
    CurriculumNode = apps.get_model("curriculum", "CurriculumNode")
    candidates = (
        CurriculumNode.objects.filter(
            Q(properties__has_key="is_preview") | Q(is_preview=True)
        )
        .only("id", "properties", "is_preview")
        .order_by("pk")
    )

    last_pk = 0
    while True:
        batch = list(candidates.filter(pk__gt=last_pk)[:BATCH_SIZE])
        if not batch:
            break
        last_pk = batch[-1].pk

        enable_ids = []
        disable_ids = []
        for node in batch:
            flag = _preview_flag(node.properties)
            if flag != node.is_preview:
                (enable_ids if flag else disable_ids).append(node.pk)

        if enable_ids:
            CurriculumNode.objects.filter(pk__in=enable_ids).update(is_preview=True)
        if disable_ids:
            CurriculumNode.objects.filter(pk__in=disable_ids).update(is_preview=False)


class Migration(migrations.Migration):
    # Batched, idempotent backfill: run outside one long transaction.
    atomic = False

    dependencies = [("curriculum", "0006_promote_google_meet_lesson_type")]

    operations = [
        migrations.RunPython(backfill_is_preview, migrations.RunPython.noop),
    ]
