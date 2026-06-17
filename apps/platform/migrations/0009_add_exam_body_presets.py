"""
Data migration: Update TVET presets for examining body architecture.

- Deletes the standalone 'nita' preset (NITA is now an exam body within TVET)
- Adds 6 new exam-body-specific presets (kasneb, cdacc, knec, nita_trade, icm_exam, icm_professional)
- All hierarchies are 2-tier compliant (Container → Content)
"""

from django.db import migrations


NEW_EXAM_BODY_PRESETS = [
    {
        "name": "KASNEB Professional/Exam",
        "code": "kasneb",
        "description": (
            "Paper-based blueprint for KASNEB professional and diploma examinations. "
            "Supports CPA, CS, CIFA, CCP, CISSE, CQP, ATD, DDMA, DCNSA, CAMS."
        ),
        "regulatory_body": "KASNEB",
        "hierarchy_labels": ["Paper", "Topic"],
        "grading_config": {
            "type": "weighted",
            "components": [
                {"key": "exam", "label": "Final Exam", "weight": 1.0},
            ],
            "pass_mark": 50,
        },
        "is_active": True,
    },
    {
        "name": "CDACC CBET",
        "code": "cdacc",
        "description": (
            "Competency-based blueprint for CDACC-accredited courses. "
            "Supports Levels 4-7 (Artisan through Higher Diploma)."
        ),
        "regulatory_body": "CDACC",
        "hierarchy_labels": ["Unit of Competency", "Session"],
        "grading_config": {
            "type": "competency",
            "levels": ["Not Yet Competent", "Competent"],
            "pass_threshold": "Competent",
        },
        "is_active": True,
    },
    {
        "name": "KNEC TVET",
        "code": "knec",
        "description": (
            "Module-based blueprint for KNEC-examined TVET courses. "
            "Supports NVCET, Artisan, Craft Certificate, Diploma, Higher Diploma."
        ),
        "regulatory_body": "KNEC",
        "hierarchy_labels": ["Module", "Topic"],
        "grading_config": {
            "type": "weighted",
            "components": [
                {"key": "cat", "label": "CAT", "weight": 0.30},
                {"key": "exam", "label": "Final Exam", "weight": 0.70},
            ],
            "pass_mark": 50,
        },
        "is_active": True,
    },
    {
        "name": "NITA Trade Test",
        "code": "nita_trade",
        "description": (
            "Practical skill-based blueprint for NITA trade testing. "
            "Supports Craft Proficiency, Industrial Artisan, Trade Test Grades I-III, "
            "and Skill Upgrading courses."
        ),
        "regulatory_body": "NITA",
        "hierarchy_labels": ["Practical Skill", "Task"],
        "grading_config": {
            "type": "competency",
            "levels": ["Fail", "Pass", "Credit", "Distinction"],
            "pass_threshold": "Pass",
        },
        "is_active": True,
    },
    {
        "name": "ICM Exam-Based",
        "code": "icm_exam",
        "description": (
            "Unit-based blueprint for ICM exam-based qualifications. "
            "Supports Foundation (Level 3) through Advanced Diploma (Level 6)."
        ),
        "regulatory_body": "ICM",
        "hierarchy_labels": ["Unit", "Topic"],
        "grading_config": {
            "type": "weighted",
            "components": [
                {"key": "exam", "label": "Final Exam", "weight": 1.0},
            ],
            "pass_mark": 50,
        },
        "is_active": True,
    },
    {
        "name": "ICM Professional Diploma",
        "code": "icm_professional",
        "description": (
            "Assignment-based blueprint for ICM professional diploma qualifications "
            "(Level 7 / Post Graduate Diploma). Uses open-book assignments."
        ),
        "regulatory_body": "ICM",
        "hierarchy_labels": ["Assignment", "Submission"],
        "grading_config": {
            "type": "weighted",
            "components": [
                {"key": "assignment", "label": "Assignment", "weight": 1.0},
            ],
            "pass_mark": 50,
        },
        "is_active": True,
    },
]


def add_exam_body_presets(apps, schema_editor):
    PresetBlueprint = apps.get_model("platform", "PresetBlueprint")

    # Delete the standalone 'nita' preset (NITA is now an exam body within TVET)
    PresetBlueprint.objects.filter(code="nita").delete()

    # Explicitly ensure the generic 'tvet' preset is 2-tier compliant
    PresetBlueprint.objects.filter(code="tvet").update(hierarchy_labels=["Unit", "Session"])

    # Add new exam-body-specific presets
    for preset_data in NEW_EXAM_BODY_PRESETS:
        PresetBlueprint.objects.get_or_create(
            code=preset_data["code"],
            defaults=preset_data,
        )


def remove_exam_body_presets(apps, schema_editor):
    PresetBlueprint = apps.get_model("platform", "PresetBlueprint")

    # Remove new presets
    codes = [p["code"] for p in NEW_EXAM_BODY_PRESETS]
    PresetBlueprint.objects.filter(code__in=codes).delete()

    # Restore the standalone nita preset
    PresetBlueprint.objects.get_or_create(
        code="nita",
        defaults={
            "name": "NITA Trade Test",
            "code": "nita",
            "description": "Trade test blueprint following NITA guidelines",
            "regulatory_body": "NITA",
            "hierarchy_labels": ["Module", "Practical"],
            "grading_config": {
                "type": "competency",
                "levels": ["Fail", "Pass", "Credit", "Distinction"],
                "pass_threshold": "Pass",
            },
            "is_active": True,
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ("platform", "0008_platformsettings_currency_code_and_more"),
    ]

    operations = [
        migrations.RunPython(
            add_exam_body_presets,
            remove_exam_body_presets,
        ),
    ]
