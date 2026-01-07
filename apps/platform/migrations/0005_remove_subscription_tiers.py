"""
Migration to remove subscription tiers and tenant limits.

Business model changed: No SaaS subscription model.
Schools are configured manually, subscriptions are for students paying for courses.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        (
            "platform",
            "0004_rename_preset_blue_code_idx_preset_blue_code_848d49_idx_and_more",
        ),
    ]

    operations = [
        # Remove the foreign key from Tenant to SubscriptionTier
        migrations.RemoveField(
            model_name="tenant",
            name="subscription_tier",
        ),
        # Delete TenantLimits model
        migrations.DeleteModel(
            name="TenantLimits",
        ),
        # Delete SubscriptionTier model
        migrations.DeleteModel(
            name="SubscriptionTier",
        ),
    ]
