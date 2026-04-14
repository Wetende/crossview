import pytest
from django.urls import reverse

from apps.blueprints.models import AcademicBlueprint
from apps.core.tests.factories import UserFactory
from apps.core.taxonomy import is_valid_builder_hierarchy
from apps.platform.models import PlatformSettings
from apps.platform.tests.factories import PresetBlueprintFactory


@pytest.fixture
def admin_client(client):
    user = UserFactory(superadmin=True)
    client.force_login(user)
    return client


@pytest.mark.django_db
def test_preset_admin_action_creates_academic_blueprint(admin_client):
    preset = PresetBlueprintFactory(
        code="online-test-create",
        hierarchy_labels=["Course", "Module", "Lesson"],
        grading_config={"type": "percentage", "pass_mark": 70},
    )

    response = admin_client.post(
        reverse("admin:platform_presetblueprint_changelist"),
        {
            "action": "create_academic_blueprints",
            "_selected_action": [str(preset.id)],
            "select_across": "0",
            "index": "0",
        },
    )

    assert response.status_code == 302
    created = AcademicBlueprint.objects.get(name=f"{preset.name} (Academic)")
    assert created.hierarchy_structure == ["Module", "Lesson"]
    assert created.grading_logic.get("type") == "percentage"


@pytest.mark.django_db
def test_preset_admin_action_uses_as_active_blueprint(admin_client):
    settings = PlatformSettings.get_settings()
    settings.deployment_mode = PlatformSettings.DeploymentMode.ONLINE
    settings.active_blueprint = None
    settings.save()

    preset = PresetBlueprintFactory(
        code="online-test-active",
        hierarchy_labels=["Course", "Module", "Lesson"],
        grading_config={"type": "percentage", "pass_mark": 70},
    )

    response = admin_client.post(
        reverse("admin:platform_presetblueprint_changelist"),
        {
            "action": "use_as_active_blueprint",
            "_selected_action": [str(preset.id)],
            "select_across": "0",
            "index": "0",
        },
    )

    assert response.status_code == 302
    settings.refresh_from_db()
    assert settings.active_blueprint is not None
    assert settings.active_blueprint.name.startswith(preset.name)


@pytest.mark.django_db
def test_preset_admin_action_reuses_matching_academic_blueprint(admin_client):
    settings = PlatformSettings.get_settings()
    settings.deployment_mode = PlatformSettings.DeploymentMode.ONLINE
    settings.active_blueprint = None
    settings.save()

    existing = AcademicBlueprint.objects.create(
        name="Reusable Online Blueprint",
        description="Existing blueprint for online preset",
        hierarchy_structure=["Section", "Lesson"],
        grading_logic={"type": "percentage", "pass_mark": 70},
        progression_rules={},
        certificate_enabled=True,
        gamification_enabled=False,
        feature_flags={},
    )

    preset = PresetBlueprintFactory(
        code="online-test-reuse",
        hierarchy_labels=["Section", "Lesson"],
        grading_config={"type": "percentage", "pass_mark": 70},
    )

    before_count = AcademicBlueprint.objects.count()
    response = admin_client.post(
        reverse("admin:platform_presetblueprint_changelist"),
        {
            "action": "use_as_active_blueprint",
            "_selected_action": [str(preset.id)],
            "select_across": "0",
            "index": "0",
        },
    )

    assert response.status_code == 302
    assert AcademicBlueprint.objects.count() == before_count
    settings.refresh_from_db()
    assert settings.active_blueprint_id == existing.id


@pytest.mark.django_db
def test_platform_settings_changelist_auto_assigns_active_blueprint(admin_client):
    settings = PlatformSettings.get_settings()
    settings.deployment_mode = PlatformSettings.DeploymentMode.ONLINE
    settings.active_blueprint = None
    settings.save()

    response = admin_client.get(reverse("admin:platform_platformsettings_changelist"))

    assert response.status_code == 302
    settings.refresh_from_db()
    assert settings.active_blueprint is not None
    assert is_valid_builder_hierarchy(settings.active_blueprint.hierarchy_structure)
