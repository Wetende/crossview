# Generated for the visual certificate builder.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def normalize_template_metadata(apps, schema_editor):
    CertificateTemplate = apps.get_model("certifications", "CertificateTemplate")
    CertificateTemplate.objects.filter(metadata__isnull=True).update(metadata={})


class Migration(migrations.Migration):

    dependencies = [
        ("certifications", "0004_certificateeligibility"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="certificatetemplate",
            name="current_version_number",
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="certificatetemplate",
            name="is_starter",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="certificatetemplate",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="certificate_templates",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="certificatetemplate",
            name="source_template",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="derived_templates",
                to="certifications.certificatetemplate",
            ),
        ),
        migrations.AddField(
            model_name="certificatetemplate",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("published", "Published"),
                    ("archived", "Archived"),
                ],
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="certificatetemplate",
            name="visibility",
            field=models.CharField(
                choices=[
                    ("private", "Private"),
                    ("shared", "Shared"),
                    ("system", "System"),
                ],
                default="private",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="certificatetemplate",
            name="template_html",
            field=models.TextField(
                blank=True,
                default="",
                help_text=(
                    "Legacy HTML renderer content. Visual templates use "
                    "versioned layout data."
                ),
            ),
        ),
        migrations.RunPython(
            normalize_template_metadata,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="certificatetemplate",
            name="metadata",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name="CertificateTemplateVersion",
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
                ("version_number", models.PositiveIntegerField()),
                (
                    "orientation",
                    models.CharField(
                        choices=[
                            ("landscape", "Landscape"),
                            ("portrait", "Portrait"),
                        ],
                        default="landscape",
                        max_length=20,
                    ),
                ),
                (
                    "width_mm",
                    models.DecimalField(
                        decimal_places=2,
                        default=297,
                        max_digits=6,
                    ),
                ),
                (
                    "height_mm",
                    models.DecimalField(
                        decimal_places=2,
                        default=210,
                        max_digits=6,
                    ),
                ),
                ("layout", models.JSONField(default=dict)),
                ("is_published", models.BooleanField(default=False)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("checksum", models.CharField(blank=True, default="", max_length=64)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="certificate_template_versions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "template",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="versions",
                        to="certifications.certificatetemplate",
                    ),
                ),
            ],
            options={
                "db_table": "certificate_template_versions",
                "ordering": ["template_id", "-version_number"],
                "indexes": [
                    models.Index(
                        fields=["template", "is_published"],
                        name="cert_ver_published_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("template", "version_number"),
                        name="cert_tmpl_version_unique",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(
                            ("height_mm__gt", 0),
                            ("width_mm__gt", 0),
                        ),
                        name="cert_tmpl_page_positive",
                    ),
                ],
            },
        ),
        migrations.AddIndex(
            model_name="certificatetemplate",
            index=models.Index(
                fields=["visibility", "status"],
                name="cert_tmpl_vis_status_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="certificatetemplate",
            index=models.Index(fields=["owner"], name="cert_tmpl_owner_idx"),
        ),
        migrations.AddIndex(
            model_name="certificatetemplate",
            index=models.Index(fields=["is_starter"], name="cert_tmpl_starter_idx"),
        ),
        migrations.AddConstraint(
            model_name="certificatetemplate",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(("is_starter", False))
                    | models.Q(("owner__isnull", True), ("visibility", "system"))
                ),
                name="cert_starter_is_system",
            ),
        ),
    ]
