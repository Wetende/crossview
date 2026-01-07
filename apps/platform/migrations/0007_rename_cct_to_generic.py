"""
Data migration to update existing CCT presets to generic names.
"""
from django.db import migrations


def update_cct_to_generic(apps, schema_editor):
    """Update existing cct_theology preset to generic_theology."""
    PresetBlueprint = apps.get_model('platform', 'PresetBlueprint')
    PresetBlueprint.objects.filter(code='cct_theology').update(
        code='generic_theology',
        name='Theology School Standard',
        description='Generic theology/Bible school curriculum structure'
    )


def reverse_update(apps, schema_editor):
    """Reverse the update (for rollback)."""
    PresetBlueprint = apps.get_model('platform', 'PresetBlueprint')
    PresetBlueprint.objects.filter(code='generic_theology').update(
        code='cct_theology',
        name='CCT Theology Standard',
        description='Crossview College of Theology curriculum structure'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('platform', '0006_add_platform_settings'),
    ]

    operations = [
        migrations.RunPython(update_cct_to_generic, reverse_update),
    ]
