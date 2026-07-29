from importlib import import_module

from django.db import migrations
from django.utils import timezone


seed_helpers = import_module(
    "apps.certifications.migrations.0006_seed_certificate_starters"
)
element = seed_helpers.element
layout = seed_helpers.layout


def definitions():
    common_copy = [
        ("text", "CERTIFICATE OF COMPLETION"),
        ("dynamic_text", "{{student_name}}"),
        ("text", "has successfully completed"),
        ("dynamic_text", "{{program_title}}"),
        ("dynamic_text", "Issued {{issue_date}}"),
        ("dynamic_text", "{{serial_number}}"),
    ]
    return [
        {
            "key": "elegant-teal",
            "name": "Elegant Teal",
            "description": "",
            "orientation": "portrait",
            "width": 210,
            "height": 297,
            "layout": layout(
                "#fbfdfc",
                [
                    element("et-top", "line", 24, 31, 54, 2, styles={"stroke": "#168c7a", "strokeWidth": 2}),
                    element("et-kicker", common_copy[0][0], 24, 47, 162, 12, common_copy[0][1], font_size=12, font_weight=700, color="#168c7a", align="left", letterSpacing=1.5),
                    element("et-student", common_copy[1][0], 24, 83, 162, 30, common_copy[1][1], font_size=30, font_weight=700, color="#17332f", align="left"),
                    element("et-copy", common_copy[2][0], 24, 126, 162, 10, common_copy[2][1], font_size=11, color="#637672", align="left"),
                    element("et-course", common_copy[3][0], 24, 145, 162, 30, common_copy[3][1], font_size=20, font_weight=650, color="#168c7a", align="left"),
                    element("et-date", common_copy[4][0], 24, 232, 90, 10, common_copy[4][1], font_size=10, color="#637672", align="left"),
                    element("et-code", common_copy[5][0], 24, 252, 90, 8, common_copy[5][1], font_size=8, color="#80908d", align="left"),
                    element("et-block", "shape", 162, 222, 24, 42, styles={"fill": "#168c7a", "stroke": "transparent"}, z_index=0),
                ],
                accent="#168c7a",
            ),
        },
        {
            "key": "geometric-navy",
            "name": "Geometric Navy",
            "description": "",
            "orientation": "landscape",
            "width": 297,
            "height": 210,
            "layout": layout(
                "#f8fafc",
                [
                    element("gn-left", "shape", 0, 0, 30, 210, styles={"fill": "#102a43", "stroke": "transparent"}, z_index=0),
                    element("gn-corner", "shape", 30, 0, 45, 28, styles={"fill": "#2bb0a6", "stroke": "transparent"}, z_index=0),
                    element("gn-kicker", common_copy[0][0], 57, 44, 200, 10, common_copy[0][1], font_size=12, font_weight=700, color="#2b7a78", align="left", letterSpacing=1.7),
                    element("gn-student", common_copy[1][0], 57, 70, 200, 27, common_copy[1][1], font_size=31, font_weight=700, color="#102a43", align="left"),
                    element("gn-copy", common_copy[2][0], 57, 108, 200, 9, common_copy[2][1], font_size=11, color="#65788a", align="left"),
                    element("gn-course", common_copy[3][0], 57, 123, 200, 22, common_copy[3][1], font_size=20, font_weight=650, color="#2b7a78", align="left"),
                    element("gn-date", common_copy[4][0], 57, 170, 95, 9, common_copy[4][1], font_size=9, color="#65788a", align="left"),
                    element("gn-code", common_copy[5][0], 177, 170, 80, 9, common_copy[5][1], font_size=8, color="#65788a", align="right"),
                ],
                accent="#2bb0a6",
            ),
        },
        {
            "key": "golden-horizon",
            "name": "Golden Horizon",
            "description": "",
            "orientation": "landscape",
            "width": 297,
            "height": 210,
            "layout": layout(
                "#fffaf2",
                [
                    element("gh-band", "shape", 0, 0, 297, 23, styles={"fill": "#c8952e", "stroke": "transparent"}, z_index=0),
                    element("gh-accent", "shape", 225, 23, 72, 34, styles={"fill": "#f0cc76", "stroke": "transparent"}, z_index=0),
                    element("gh-kicker", common_copy[0][0], 39, 48, 219, 11, common_copy[0][1], font_size=12, font_weight=700, color="#a87315", letterSpacing=1.8),
                    element("gh-student", common_copy[1][0], 39, 73, 219, 28, common_copy[1][1], font_size=32, font_weight=700, color="#3c3021"),
                    element("gh-copy", common_copy[2][0], 39, 110, 219, 9, common_copy[2][1], font_size=11, color="#7e705e"),
                    element("gh-course", common_copy[3][0], 39, 126, 219, 23, common_copy[3][1], font_size=21, font_weight=650, color="#a87315"),
                    element("gh-date", common_copy[4][0], 39, 172, 90, 9, common_copy[4][1], font_size=9, color="#7e705e", align="left"),
                    element("gh-code", common_copy[5][0], 168, 172, 90, 9, common_copy[5][1], font_size=8, color="#7e705e", align="right"),
                ],
                accent="#c8952e",
            ),
        },
        {
            "key": "creative-coral",
            "name": "Creative Coral",
            "description": "",
            "orientation": "landscape",
            "width": 297,
            "height": 210,
            "layout": layout(
                "#fff9f6",
                [
                    element("cc-block", "shape", 0, 0, 78, 54, styles={"fill": "#ef684a", "stroke": "transparent"}, z_index=0),
                    element("cc-dot", "shape", 257, 22, 18, 18, shape="circle", styles={"fill": "#172b4d", "stroke": "transparent"}, z_index=0),
                    element("cc-kicker", common_copy[0][0], 88, 45, 167, 10, common_copy[0][1], font_size=11, font_weight=700, color="#ef684a", align="left", letterSpacing=1.5),
                    element("cc-student", common_copy[1][0], 88, 70, 167, 28, common_copy[1][1], font_size=31, font_weight=700, color="#172b4d", align="left"),
                    element("cc-copy", common_copy[2][0], 88, 108, 167, 9, common_copy[2][1], font_size=11, color="#748094", align="left"),
                    element("cc-course", common_copy[3][0], 88, 124, 167, 22, common_copy[3][1], font_size=20, font_weight=650, color="#ef684a", align="left"),
                    element("cc-date", common_copy[4][0], 88, 171, 82, 9, common_copy[4][1], font_size=9, color="#748094", align="left"),
                    element("cc-code", common_copy[5][0], 176, 171, 79, 9, common_copy[5][1], font_size=8, color="#748094", align="right"),
                ],
                accent="#ef684a",
            ),
        },
        {
            "key": "emerald-grid",
            "name": "Emerald Grid",
            "description": "",
            "orientation": "landscape",
            "width": 297,
            "height": 210,
            "layout": layout(
                "#f7fcf9",
                [
                    element("eg-border", "shape", 10, 10, 277, 190, shape="border", styles={"fill": "transparent", "stroke": "#16734b", "strokeWidth": 1.3}, z_index=0),
                    element("eg-square1", "shape", 10, 10, 24, 24, styles={"fill": "#16734b", "stroke": "transparent"}, z_index=0),
                    element("eg-square2", "shape", 263, 176, 24, 24, styles={"fill": "#d3a62c", "stroke": "transparent"}, z_index=0),
                    element("eg-kicker", common_copy[0][0], 46, 41, 205, 10, common_copy[0][1], font_size=12, font_weight=700, color="#16734b", letterSpacing=1.6),
                    element("eg-student", common_copy[1][0], 46, 69, 205, 29, common_copy[1][1], font_size=31, font_weight=700, color="#16362a"),
                    element("eg-copy", common_copy[2][0], 46, 108, 205, 9, common_copy[2][1], font_size=11, color="#667c73"),
                    element("eg-course", common_copy[3][0], 46, 124, 205, 22, common_copy[3][1], font_size=20, font_weight=650, color="#16734b"),
                    element("eg-date", common_copy[4][0], 46, 168, 90, 9, common_copy[4][1], font_size=9, color="#667c73", align="left"),
                    element("eg-code", common_copy[5][0], 161, 168, 90, 9, common_copy[5][1], font_size=8, color="#667c73", align="right"),
                ],
                accent="#16734b",
            ),
        },
    ]


def seed_more_templates(apps, schema_editor):
    CertificateTemplate = apps.get_model("certifications", "CertificateTemplate")
    CertificateTemplateVersion = apps.get_model(
        "certifications", "CertificateTemplateVersion"
    )
    for item in definitions():
        template, _ = CertificateTemplate.objects.update_or_create(
            name=item["name"],
            is_starter=True,
            defaults={
                "owner": None,
                "visibility": "system",
                "status": "published",
                "current_version_number": 1,
                "metadata": {
                    "starterKey": item["key"],
                    "description": item["description"],
                },
            },
        )
        CertificateTemplateVersion.objects.update_or_create(
            template=template,
            version_number=1,
            defaults={
                "orientation": item["orientation"],
                "width_mm": item["width"],
                "height_mm": item["height"],
                "layout": item["layout"],
                "created_by": None,
                "is_published": True,
                "published_at": timezone.now(),
            },
        )


def remove_more_templates(apps, schema_editor):
    names = [item["name"] for item in definitions()]
    apps.get_model("certifications", "CertificateTemplate").objects.filter(
        name__in=names,
        is_starter=True,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("certifications", "0007_template_assignments_and_certificate_snapshot"),
    ]

    operations = [
        migrations.RunPython(seed_more_templates, remove_more_templates),
    ]
