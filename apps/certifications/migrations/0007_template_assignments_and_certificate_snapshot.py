import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("certifications", "0006_seed_certificate_starters"),
        ("core", "0024_program_review_defaults"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="certificate",
            name="layout_snapshot",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="certificate",
            name="template_version",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="certificates",
                to="certifications.certificatetemplateversion",
            ),
        ),
        migrations.CreateModel(
            name="CertificateAsset",
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
                (
                    "file",
                    models.ImageField(upload_to="certificates/assets/%Y/%m/"),
                ),
                ("original_name", models.CharField(max_length=255)),
                ("content_type", models.CharField(max_length=100)),
                ("size", models.PositiveIntegerField()),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="certificate_assets",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "certificate_assets",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="CertificateTemplateAssignment",
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
                (
                    "scope",
                    models.CharField(
                        choices=[
                            ("default", "System default"),
                            ("category", "Course category"),
                            ("course", "Course"),
                        ],
                        max_length=20,
                    ),
                ),
                ("category", models.CharField(blank=True, default="", max_length=100)),
                ("issue_enabled", models.BooleanField(default=True)),
                (
                    "assigned_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="certificate_template_assignments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "program",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="certificate_assignment",
                        to="core.program",
                    ),
                ),
                (
                    "template_version",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="assignments",
                        to="certifications.certificatetemplateversion",
                    ),
                ),
            ],
            options={
                "db_table": "certificate_template_assignments",
                "indexes": [
                    models.Index(
                        fields=["scope", "category"],
                        name="cert_assign_scope_cat_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        condition=models.Q(("scope", "default")),
                        fields=("scope",),
                        name="cert_assign_one_default",
                    ),
                    models.UniqueConstraint(
                        condition=models.Q(("scope", "category")),
                        fields=("category",),
                        name="cert_assign_one_category",
                    ),
                    models.CheckConstraint(
                        condition=(
                            models.Q(
                                ("category", ""),
                                ("program__isnull", True),
                                ("scope", "default"),
                                ("template_version__isnull", False),
                            )
                            | (
                                models.Q(
                                    ("program__isnull", True),
                                    ("scope", "category"),
                                    ("template_version__isnull", False),
                                )
                                & ~models.Q(("category", ""))
                            )
                            | models.Q(
                                ("category", ""),
                                ("program__isnull", False),
                                ("scope", "course"),
                            )
                        ),
                        name="cert_assign_scope_fields",
                    ),
                ],
            },
        ),
    ]
