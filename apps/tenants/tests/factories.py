"""Factory Boy factories for tenants app."""

import factory
from factory.django import DjangoModelFactory
from apps.tenants.models import Tenant, SubscriptionTier, TenantLimits, PresetBlueprint


class SubscriptionTierFactory(DjangoModelFactory):
    class Meta:
        model = SubscriptionTier

    name = factory.Sequence(lambda n: f"Tier {n}")
    code = factory.Sequence(lambda n: f"tier-{n}")
    max_students = 100
    max_programs = 10
    max_storage_mb = 5000
    price_monthly = factory.Faker(
        "pydecimal", left_digits=4, right_digits=2, positive=True
    )
    is_active = True


class TenantFactory(DjangoModelFactory):
    class Meta:
        model = Tenant

    name = factory.Faker("company")
    subdomain = factory.Sequence(lambda n: f"tenant{n}")
    admin_email = factory.Faker("email")
    subscription_tier = factory.SubFactory(SubscriptionTierFactory)
    is_active = True


class TenantLimitsFactory(DjangoModelFactory):
    class Meta:
        model = TenantLimits

    tenant = factory.SubFactory(TenantFactory)
    max_students = 100
    max_programs = 10
    max_storage_mb = 5000
    current_students = 0
    current_programs = 0
    current_storage_mb = 0


class PresetBlueprintFactory(DjangoModelFactory):
    class Meta:
        model = PresetBlueprint

    name = factory.Sequence(lambda n: f"Preset {n}")
    code = factory.Sequence(lambda n: f"preset-{n}")
    description = factory.Faker("sentence")
    regulatory_body = "TVETA"
    hierarchy_labels = ["Year", "Unit", "Session"]
    grading_config = {"mode": "percentage", "passMark": 50}
    is_active = True
