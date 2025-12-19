"""
Data migration to seed preset blueprints.
Requirements: 5.1
"""
from django.db import migrations


def seed_presets(apps, schema_editor):
    """Seed the database with regulatory presets."""
    PresetBlueprint = apps.get_model('tenants', 'PresetBlueprint')
    
    presets = [
        {
            'code': 'tvet_cdacc',
            'name': 'TVET CDACC Standard',
            'description': 'TVETA/CDACC compliant curriculum structure for TVET institutions',
            'regulatory_body': 'TVETA/CDACC',
            'hierarchy_labels': ['Qualification', 'Module', 'Unit of Competency', 'Element'],
            'grading_config': {
                'mode': 'cbet',
                'scale': ['Competent', 'Not Yet Competent'],
                'pass_threshold': 50,
                'components': {
                    'theory': 30,
                    'practical': 70,
                },
                'requires_portfolio': True,
            },
            'structure_rules': {
                'module_types': ['Basic', 'Common', 'Core'],
            },
        },
        {
            'code': 'nita_trade',
            'name': 'NITA Trade Test',
            'description': 'NITA Trade Test structure for artisan certification',
            'regulatory_body': 'NITA',
            'hierarchy_labels': ['Trade Area', 'Grade Level', 'Practical Project'],
            'grading_config': {
                'mode': 'visual_review',
                'checklist': ['Safety Gear', 'Tools', 'Finished Product Quality'],
                'levels': ['Grade III', 'Grade II', 'Grade I'],
            },
            'structure_rules': {},
        },
        {
            'code': 'ntsa_driving',
            'name': 'NTSA Driving Curriculum',
            'description': 'NTSA compliant driving school curriculum',
            'regulatory_body': 'NTSA',
            'hierarchy_labels': ['License Class', 'Unit', 'Lesson Type'],
            'grading_config': {
                'mode': 'instructor_checklist',
                'lesson_types': ['Theory', 'Yard Training', 'Roadwork'],
                'components': ['Theory Test', 'Maneuver Test', 'Road Test'],
                'requires_hours_logged': True,
            },
            'structure_rules': {},
        },
        {
            'code': 'cbc_k12',
            'name': 'CBC K-12 Standard',
            'description': 'KICD Competency-Based Curriculum for K-12',
            'regulatory_body': 'KICD',
            'hierarchy_labels': ['Grade', 'Learning Area', 'Strand', 'Sub-strand'],
            'grading_config': {
                'mode': 'rubric',
                'scale': ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation'],
                'competencies': ['Communication', 'Critical Thinking', 'Digital Literacy'],
            },
            'structure_rules': {},
        },
        {
            'code': 'cct_theology',
            'name': 'CCT Theology Standard',
            'description': 'Crossview College of Theology curriculum structure',
            'regulatory_body': 'Internal',
            'hierarchy_labels': ['Program', 'Year', 'Unit', 'Session'],
            'grading_config': {
                'mode': 'summative',
                'components': {
                    'cat': 30,
                    'exam': 70,
                },
                'pass_mark': 40,
                'practicum_enabled': True,
            },
            'structure_rules': {},
        },
    ]
    
    for preset_data in presets:
        PresetBlueprint.objects.update_or_create(
            code=preset_data['code'],
            defaults=preset_data
        )


def reverse_seed(apps, schema_editor):
    """Remove seeded presets."""
    PresetBlueprint = apps.get_model('tenants', 'PresetBlueprint')
    PresetBlueprint.objects.filter(code__in=[
        'tvet_cdacc', 'nita_trade', 'ntsa_driving', 'cbc_k12', 'cct_theology'
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0002_complete_multitenancy'),
    ]

    operations = [
        migrations.RunPython(seed_presets, reverse_seed),
    ]
