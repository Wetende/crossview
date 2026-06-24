# Generated for Virtual Campus admissions routing.

from django.db import migrations, models
import django.db.models.deletion


CAMPUSES = [
    ("eldoret", "Eldoret Campus", "physical", "eldoret@airads.ac.ke"),
    ("nakuru", "Nakuru Campus", "physical", "nakuru@airads.ac.ke"),
    ("kericho", "Kericho Campus", "physical", "kericho@airads.ac.ke"),
    ("kisumu", "Kisumu City Campus", "physical", "kisumu@airads.ac.ke"),
    ("bungoma", "Bungoma Campus", "physical", "bungoma@airads.ac.ke"),
    ("maralal", "Maralal Campus", "physical", "maralal@airads.ac.ke"),
    ("lodwar", "Lodwar Campus", "physical", "lodwar@airads.ac.ke"),
    ("virtual", "Virtual Campus", "virtual", "virtualcampus@airads.ac.ke"),
]


def seed_campuses(apps, schema_editor):
    Campus = apps.get_model("core", "Campus")
    for slug, name, campus_type, contact_email in CAMPUSES:
        Campus.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "campus_type": campus_type,
                "contact_email": contact_email,
                "is_active": True,
            },
        )


def unseed_campuses(apps, schema_editor):
    Campus = apps.get_model("core", "Campus")
    Campus.objects.filter(slug__in=[campus[0] for campus in CAMPUSES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0015_admissionapplication"),
    ]

    operations = [
        migrations.CreateModel(
            name="Campus",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=120, unique=True)),
                ("slug", models.SlugField(max_length=80, unique=True)),
                (
                    "campus_type",
                    models.CharField(
                        choices=[
                            ("physical", "Physical"),
                            ("virtual", "Virtual"),
                        ],
                        default="physical",
                        max_length=20,
                    ),
                ),
                ("contact_email", models.EmailField(blank=True, default="", max_length=254)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "db_table": "campuses",
                "ordering": ["campus_type", "name"],
                "indexes": [
                    models.Index(
                        fields=["campus_type", "is_active"],
                        name="campuses_campus__c29f88_idx",
                    ),
                ],
            },
        ),
        migrations.AddField(
            model_name="admissionapplication",
            name="study_mode",
            field=models.CharField(
                choices=[
                    ("on_campus", "On Campus"),
                    ("virtual", "Virtual"),
                ],
                default="on_campus",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="admissionapplication",
            name="campus",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="admission_applications",
                to="core.campus",
            ),
        ),
        migrations.AddField(
            model_name="admissionapplication",
            name="program",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="admission_applications",
                to="core.program",
            ),
        ),
        migrations.AddIndex(
            model_name="admissionapplication",
            index=models.Index(
                fields=["study_mode", "-created_at"],
                name="admission_a_study_m_482b50_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="admissionapplication",
            index=models.Index(
                fields=["campus", "-created_at"],
                name="admission_a_campus__096630_idx",
            ),
        ),
        migrations.RunPython(seed_campuses, unseed_campuses),
    ]
