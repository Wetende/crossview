import json

import pytest
from django.urls import reverse

from apps.core.tests.factories import UserFactory
from apps.platform.models import PlatformSettings
from apps.progression.tests.factories import ProgramFactory


@pytest.mark.django_db
def test_admin_program_categories_page_lists_categories_with_program_counts(client):
    settings = PlatformSettings.get_settings()
    settings.program_categories = ["Engineering & ICT", "Business Management"]
    settings.save(update_fields=["program_categories", "updated_at"])
    ProgramFactory(category="Engineering & ICT")
    ProgramFactory(category="Engineering & ICT")
    ProgramFactory(category="")

    admin = UserFactory(admin=True)
    client.force_login(admin)

    response = client.get(
        reverse("tenants:admin.program_categories"),
        HTTP_X_INERTIA="true",
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["component"] == "Admin/ProgramCategories/Index"
    assert payload["props"]["categories"] == [
        {"name": "Engineering & ICT", "programCount": 2},
        {"name": "Business Management", "programCount": 0},
    ]
    assert payload["props"]["uncategorizedProgramCount"] == 1


@pytest.mark.django_db
def test_admin_program_categories_update_normalizes_categories(client):
    settings = PlatformSettings.get_settings()
    settings.program_categories = ["Old Category"]
    settings.save(update_fields=["program_categories", "updated_at"])

    admin = UserFactory(admin=True)
    client.force_login(admin)

    response = client.post(
        reverse("tenants:admin.program_categories"),
        data=json.dumps(
            {
                "programCategories": [
                    " Engineering & ICT ",
                    "",
                    "Media   Studies",
                    "Engineering & ICT",
                ],
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == 302
    assert response["Location"] == reverse("tenants:admin.program_categories")

    settings.refresh_from_db()
    assert settings.get_program_categories() == [
        "Engineering & ICT",
        "Media Studies",
    ]


@pytest.mark.django_db
def test_non_admin_cannot_manage_program_categories(client):
    user = UserFactory()
    client.force_login(user)

    response = client.get(reverse("tenants:admin.program_categories"))

    assert response.status_code == 302
    assert response["Location"] == "/dashboard/"
