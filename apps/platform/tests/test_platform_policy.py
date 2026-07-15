"""Contract tests for optional deployment-level platform locks."""

import pytest
from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.test import override_settings

from apps.blueprints.models import AcademicBlueprint
from apps.platform.models import PlatformSettings
from apps.platform.policy import get_platform_capabilities
from apps.platform.services import PlatformSettingsService, PresetBlueprintService


LOCKED_POLICY = {
    "institution_name": "Locked Academy",
    "tagline": "Learn from anywhere",
    "logo_url": "/static/brand/logo.png",
    "favicon_url": "/static/brand/favicon.png",
    "primary_color": "#112233",
    "secondary_color": "#F0A500",
    "deployment_mode": "online",
    "blueprint_mode": "online",
    "setup_complete": True,
    "feature_overrides": {
        "practicum": False,
        "self_registration": True,
        "enrollment_mode": "open",
    },
    "capabilities": {
        "manageIdentity": False,
        "manageBranding": False,
        "manageDeployment": False,
        "managePresets": False,
        "manageBlueprints": False,
        "manageFeatures": False,
        "runSetup": False,
        "manageRegistration": False,
        "showAdminSettings": False,
        "showSubscription": False,
    },
}


@pytest.fixture(autouse=True)
def clear_platform_cache():
    cache.clear()
    yield
    cache.clear()


@override_settings(LMS_PLATFORM_POLICY={})
def test_missing_policy_preserves_fully_configurable_engine_defaults():
    assert all(get_platform_capabilities().values())


@pytest.mark.django_db
@override_settings(LMS_PLATFORM_POLICY=LOCKED_POLICY)
def test_model_save_and_shared_payload_enforce_locked_product_decisions():
    wrong_blueprint = AcademicBlueprint.objects.create(
        name="Alternate Blueprint",
        hierarchy_structure=["Unit", "Lesson"],
        grading_logic={"type": "points", "pass_mark": 50},
        progression_rules={},
    )
    settings = PlatformSettings(
        institution_name="Changed Name",
        tagline="Changed tagline",
        deployment_mode="tvet",
        active_blueprint=wrong_blueprint,
        primary_color="#000000",
        secondary_color="#FFFFFF",
        features={"practicum": True, "payments": False},
        is_setup_complete=False,
    )
    settings.save()
    settings.refresh_from_db()

    assert settings.institution_name == "Locked Academy"
    assert settings.tagline == "Learn from anywhere"
    assert settings.deployment_mode == "online"
    assert settings.active_blueprint.name == "Online Self-Paced"
    assert settings.primary_color == "#112233"
    assert settings.secondary_color == "#F0A500"
    assert settings.is_setup_complete is True
    assert settings.features["practicum"] is False
    assert settings.features["self_registration"] is True
    assert settings.features["payments"] is False

    settings.institution_name = "Second bypass attempt"
    settings.deployment_mode = "theology"
    settings.active_blueprint = wrong_blueprint
    settings.features = {"practicum": True}
    settings.save(
        update_fields=[
            "institution_name",
            "deployment_mode",
            "active_blueprint",
            "features",
        ]
    )
    settings.refresh_from_db()

    assert settings.institution_name == "Locked Academy"
    assert settings.deployment_mode == "online"
    assert settings.active_blueprint.name == "Online Self-Paced"
    assert settings.features["practicum"] is False

    payload = PlatformSettings.get_cached_platform_payload()
    assert payload["institutionName"] == "Locked Academy"
    assert payload["logoUrl"] == "/static/brand/logo.png"
    assert payload["faviconUrl"] == "/static/brand/favicon.png"
    assert payload["features"]["enrollment_mode"] == "open"
    assert payload["capabilities"]["manageDeployment"] is False


@pytest.mark.django_db
@override_settings(LMS_PLATFORM_POLICY=LOCKED_POLICY)
def test_services_reject_locked_configuration_mutations():
    PlatformSettings.get_settings()

    with pytest.raises(PermissionDenied):
        PlatformSettingsService.update_institution_info("Another Academy")
    with pytest.raises(PermissionDenied):
        PlatformSettingsService.update_deployment_mode("tvet")
    with pytest.raises(PermissionDenied):
        PlatformSettingsService.update_branding(primary_color="#000000")
    with pytest.raises(PermissionDenied):
        PlatformSettingsService.update_features({"payments": False})
    with pytest.raises(PermissionDenied):
        PlatformSettingsService.update_registration(False)
    with pytest.raises(PermissionDenied):
        PlatformSettingsService.complete_setup()
    with pytest.raises(PermissionDenied):
        PresetBlueprintService.list_presets()

    assert PlatformSettingsService.is_setup_required() is False
    assert PlatformSettingsService.get_deployment_modes() == [
        {"value": "online", "label": "Online Courses (Self-Paced)"}
    ]
