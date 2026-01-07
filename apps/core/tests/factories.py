"""
Factory Boy factories for core app models.
"""

import factory
from factory.django import DjangoModelFactory
from django.contrib.auth import get_user_model


User = get_user_model()


class UserFactory(DjangoModelFactory):
    """Factory for User model."""

    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
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
