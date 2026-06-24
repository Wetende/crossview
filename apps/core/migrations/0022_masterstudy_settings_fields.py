from django.db import migrations, models
from django.utils.text import slugify


def populate_program_slugs(apps, schema_editor):
    Program = apps.get_model("core", "Program")
    used_slugs = set()

    for program in Program.objects.order_by("id"):
        base_slug = slugify(program.name or program.code or f"course-{program.id}") or f"course-{program.id}"
        slug = base_slug[:255]
        suffix = 2

        while slug in used_slugs or Program.objects.exclude(pk=program.pk).filter(slug=slug).exists():
            suffix_text = f"-{suffix}"
            slug = f"{base_slug[: 255 - len(suffix_text)]}{suffix_text}"
            suffix += 1

        used_slugs.add(slug)
        program.slug = slug
        program.save(update_fields=["slug"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0021_program_prerequisite_passing_percent"),
    ]

    operations = [
        migrations.AddField(
            model_name="program",
            name="slug",
            field=models.SlugField(blank=True, db_index=True, help_text="Public course URL slug.", max_length=255),
        ),
        migrations.AddField(
            model_name="program",
            name="preview_description",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="program",
            name="is_featured",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="program",
            name="lock_lessons_in_order",
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(populate_program_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="program",
            name="slug",
            field=models.SlugField(blank=True, db_index=True, help_text="Public course URL slug.", max_length=255, unique=True),
        ),
        migrations.AddIndex(
            model_name="program",
            index=models.Index(fields=["is_published", "is_featured"], name="programs_is_publ_617f45_idx"),
        ),
    ]
