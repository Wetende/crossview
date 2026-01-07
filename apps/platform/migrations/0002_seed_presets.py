# Generated migration to seed preset blueprints

from django.db import migrations


# Default preset blueprints matching MODE_BLUEPRINTS in services.py
PRESET_BLUEPRINTS = [
    {
        'name': 'TVET Standard (CDACC)',
        'code': 'tvet',
        'description': 'Competency-based blueprint for TVET institutions following CDACC guidelines',
        'regulatory_body': 'CDACC',
        'hierarchy_labels': ['Level', 'Unit', 'Learning Outcome', 'Session'],
        'grading_config': {
            'type': 'competency',
            'levels': ['Not Yet Competent', 'Competent'],
            'pass_threshold': 'Competent'
        },
        'is_active': True,
    },
    {
        'name': 'Bible College Standard',
        'code': 'theology',
        'description': 'Weighted grading blueprint for theology and bible schools',
        'regulatory_body': '',
        'hierarchy_labels': ['Year', 'Semester', 'Course', 'Session'],
        'grading_config': {
            'type': 'weighted',
            'components': [
                {'key': 'cat', 'label': 'CAT', 'weight': 0.30},
                {'key': 'exam', 'label': 'Final Exam', 'weight': 0.70}
            ],
            'pass_mark': 50
        },
        'is_active': True,
    },
    {
        'name': 'NITA Trade Test',
        'code': 'nita',
        'description': 'Trade test blueprint following NITA guidelines',
        'regulatory_body': 'NITA',
        'hierarchy_labels': ['Trade', 'Grade', 'Module', 'Practical'],
        'grading_config': {
            'type': 'competency',
            'levels': ['Fail', 'Pass', 'Credit', 'Distinction'],
            'pass_threshold': 'Pass'
        },
        'is_active': True,
    },
    {
        'name': 'Driving School (NTSA)',
        'code': 'driving',
        'description': 'Checklist-based blueprint for driving schools following NTSA guidelines',
        'regulatory_body': 'NTSA',
        'hierarchy_labels': ['License Class', 'Phase', 'Lesson'],
        'grading_config': {
            'type': 'checklist',
            'pass_all_required': True
        },
        'is_active': True,
    },
    {
        'name': 'CBC K-12 Standard',
        'code': 'cbc',
        'description': 'Competency-Based Curriculum blueprint for K-12 schools',
        'regulatory_body': 'KICD',
        'hierarchy_labels': ['Grade', 'Strand', 'Sub-Strand', 'Lesson'],
        'grading_config': {
            'type': 'rubric',
            'levels': ['Below Expectation', 'Approaching', 'Meeting', 'Exceeding'],
            'pass_threshold': 'Meeting'
        },
        'is_active': True,
    },
    {
        'name': 'Online Self-Paced',
        'code': 'online',
        'description': 'Percentage-based grading for online self-paced courses',
        'regulatory_body': '',
        'hierarchy_labels': ['Course', 'Module', 'Lesson'],
        'grading_config': {
            'type': 'percentage',
            'pass_mark': 70
        },
        'is_active': True,
    },
]


def seed_presets(apps, schema_editor):
    PresetBlueprint = apps.get_model('platform', 'PresetBlueprint')
    for preset_data in PRESET_BLUEPRINTS:
        PresetBlueprint.objects.get_or_create(
            code=preset_data['code'],
            defaults=preset_data
        )


def remove_presets(apps, schema_editor):
    PresetBlueprint = apps.get_model('platform', 'PresetBlueprint')
    codes = [p['code'] for p in PRESET_BLUEPRINTS]
    PresetBlueprint.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('platform', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_presets, remove_presets),
    ]
