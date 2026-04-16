from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("platform", "0004_platformsettings_program_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="platformsettings",
            name="public_content",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text=(
                    "Optional public page content overrides such as "
                    "heroHeadline, mission, vision, impactSchools, stats, and "
                    "footerDescription."
                ),
            ),
        ),
        migrations.AddField(
            model_name="platformsettings",
            name="social_links",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text=(
                    "Optional social links such as facebook, twitter, "
                    "linkedin, and youtube."
                ),
            ),
        ),
    ]
