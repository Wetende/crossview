from django.db import migrations


def promote_google_meet_lessons(apps, schema_editor):
    CurriculumNode = apps.get_model("curriculum", "CurriculumNode")

    for node in CurriculumNode.objects.all().only("id", "properties").iterator():
        properties = node.properties if isinstance(node.properties, dict) else {}
        lesson_type = str(properties.get("lesson_type") or "").strip().lower()
        provider = str(
            properties.get("provider")
            or properties.get("session_provider")
            or ""
        ).strip().lower()
        if lesson_type not in {"live_class", "live_meeting"}:
            continue
        if provider != "google_meet":
            continue

        updated = dict(properties)
        updated["lesson_type"] = "google_meet"
        updated["session_kind"] = "live_meeting"
        updated["provider"] = "google_meet"
        updated["session_provider"] = "google_meet"
        CurriculumNode.objects.filter(pk=node.pk).update(properties=updated)


class Migration(migrations.Migration):
    dependencies = [("curriculum", "0005_delete_course_change_request")]

    operations = [
        migrations.RunPython(promote_google_meet_lessons, migrations.RunPython.noop),
    ]
