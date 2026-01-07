"""Factory Boy factories for platform app."""

import factory
from factory.django import DjangoModelFactory
from apps.platform.models import PresetBlueprint


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
