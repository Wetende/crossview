import json

import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_program_interest_submission_creates_pending_application(client):
    from apps.core.models import AdmissionApplication
    from apps.progression.tests.factories import ProgramFactory

    program = ProgramFactory(name="Introduction to AI", is_published=True)

    response = client.post(
        reverse("core:program_interest_submit", kwargs={"pk": program.id}),
        data=json.dumps(
            {
                "fullName": "  Mary Wanjiku  ",
                "email": " MARY@example.com ",
                "phone": " 0715 000 222 ",
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == 302
    assert response.url == f"/programs/{program.slug}/"

    application = AdmissionApplication.objects.get()
    assert application.full_name == "Mary Wanjiku"
    assert application.email == "mary@example.com"
    assert application.phone == "0715 000 222"
    assert application.whatsapp == "0715 000 222"
    assert application.program == program
    assert application.preferred_programme == "Introduction to AI"
    assert application.preferred_campus == "Course detail enquiry"
    assert application.source == "program_detail_modal"
    assert application.status == AdmissionApplication.STATUS_NEW


@pytest.mark.django_db
def test_program_interest_submission_validates_required_fields(client):
    from apps.core.models import AdmissionApplication
    from apps.progression.tests.factories import ProgramFactory

    program = ProgramFactory(is_published=True)

    response = client.post(
        reverse("core:program_interest_submit", kwargs={"pk": program.id}),
        data=json.dumps(
            {
                "fullName": "",
                "email": "not-an-email",
                "phone": "",
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == 302
    assert response.url == f"/programs/{program.slug}/"
    assert AdmissionApplication.objects.count() == 0
