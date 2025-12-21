"""
Factory Boy factories for core app models.
"""

import factory
from factory.django import DjangoModelFactory
from django.contrib.auth import get_user_model

from apps.tenants.models import Tenant, TenantBranding, SubscriptionTier

User = get_user_model()


class SubscriptionTierFactory(DjangoModelFactory):
    """Factory for SubscriptionTier model."""

    class Meta:
        model = SubscriptionTier

    name = factory.Sequence(lambda n: f"Tier {n}")
    code = factory.Sequence(lambda n: f"tier-{n}")
    max_students = 100
    max_storage_mb = 5000
    max_programs = 10
    price_monthly = factory.Faker(
        "pydecimal", left_digits=4, right_digits=2, positive=True
    )
    features = {"highlights": ["Feature 1", "Feature 2"]}
    is_active = True


class TenantFactory(DjangoModelFactory):
    """Factory for Tenant model."""

    class Meta:
        model = Tenant

    name = factory.Faker("company")
    subdomain = factory.Sequence(lambda n: f"tenant{n}")
    admin_email = factory.Faker("email")
    subscription_tier = factory.SubFactory(SubscriptionTierFactory)
    is_active = True
    settings = {"registration_enabled": True}


class TenantBrandingFactory(DjangoModelFactory):
    """Factory for TenantBranding model."""

    class Meta:
        model = TenantBranding

    tenant = factory.SubFactory(TenantFactory)
    institution_name = factory.LazyAttribute(lambda o: o.tenant.name)
    tagline = factory.Faker("catch_phrase")
    primary_color = "#3B82F6"
    secondary_color = "#1E40AF"


class UserFactory(DjangoModelFactory):
    """Factory for User model."""

    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    tenant = factory.SubFactory(TenantFactory)
    is_active = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        password = extracted or "TestPass123"
        self.set_password(password)
        if create:
            self.save()

    class Params:
        admin = factory.Trait(is_staff=True, is_superuser=False)
        superadmin = factory.Trait(is_staff=True, is_superuser=True)
        instructor = factory.Trait(is_staff=False, is_superuser=False)
