"""Admin and route boundaries for product-locked deployments."""

import pytest
from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory, override_settings

from apps.blueprints.admin import AcademicBlueprintAdmin
from apps.blueprints.models import AcademicBlueprint
from apps.core.admin import ProgramAdmin
from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.platform.admin import PlatformSettingsAdmin, PresetBlueprintAdmin
from apps.platform.models import PlatformSettings, PresetBlueprint


LOCKED_CAPABILITIES = {
    "deployment_mode": "online",
    "blueprint_mode": "online",
    "setup_complete": True,
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


def _field_names(fieldsets) -> set[str]:
    return {
        field
        for _, options in fieldsets
        for field in options.get("fields", ())
    }


@pytest.mark.django_db
@override_settings(LMS_PLATFORM_POLICY=LOCKED_CAPABILITIES)
def test_django_admin_hides_locked_modules_and_fields():
    request = RequestFactory().get("/admin/")
    request.user = UserFactory(superadmin=True)
    site = AdminSite()

    settings_admin = PlatformSettingsAdmin(PlatformSettings, site)
    field_names = _field_names(settings_admin.get_fieldsets(request))

    assert "institution_name" not in field_names
    assert "tagline" not in field_names
    assert "deployment_mode" not in field_names
    assert "active_blueprint" not in field_names
    assert "is_setup_complete" not in field_names
    assert "logo" not in field_names
    assert "features" not in field_names
    assert "contact_email" in field_names
    assert "currency_code" in field_names
    assert "currency_symbol" in field_names
    assert "course_levels" in field_names
    assert "program_categories" in field_names

    preset_admin = PresetBlueprintAdmin(PresetBlueprint, site)
    blueprint_admin = AcademicBlueprintAdmin(AcademicBlueprint, site)
    assert preset_admin.has_module_permission(request) is False
    assert preset_admin.has_view_permission(request) is False
    assert blueprint_admin.has_module_permission(request) is False
    assert blueprint_admin.has_view_permission(request) is False


@pytest.mark.django_db
@override_settings(LMS_PLATFORM_POLICY=LOCKED_CAPABILITIES)
def test_program_admin_forces_the_locked_active_blueprint():
    request = RequestFactory().post("/admin/core/program/add/")
    request.user = UserFactory(superadmin=True)
    wrong_blueprint = AcademicBlueprint.objects.create(
        name="Wrong Blueprint",
        hierarchy_structure=["Unit", "Lesson"],
        grading_logic={"type": "points", "pass_mark": 50},
        progression_rules={},
    )
    program = Program(name="Locked Course", code="LOCK-101", blueprint=wrong_blueprint)
    program_admin = ProgramAdmin(Program, AdminSite())

    assert "blueprint" in program_admin.get_readonly_fields(request)
    program_admin.save_model(request, program, form=None, change=False)

    assert program.blueprint.name == "Online Self-Paced"


@pytest.mark.django_db
@override_settings(LMS_PLATFORM_POLICY=LOCKED_CAPABILITIES)
def test_locked_routes_are_not_available_even_to_superadmins(client):
    user = UserFactory(superadmin=True)
    client.force_login(user)

    assert client.get("/admin/settings/").status_code == 302
    assert client.get("/superadmin/presets/").status_code == 302
    assert client.get("/setup/").status_code == 302
    assert client.get("/admin/blueprints/").status_code == 403
