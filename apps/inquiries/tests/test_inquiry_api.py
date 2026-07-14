import json
from unittest.mock import patch

import pytest
from django.core import mail
from django.test import Client, override_settings
from django.urls import reverse

from apps.core.tests.factories import UserFactory
from apps.inquiries.models import Inquiry
from apps.platform.models import PlatformSettings
from apps.progression.tests.factories import ProgramFactory

pytestmark = pytest.mark.django_db

EMAIL_SETTINGS = {
    "EMAIL_BACKEND": "django.core.mail.backends.locmem.EmailBackend",
    "INQUIRY_NOTIFICATION_EMAIL": "inquiries@example.com",
}


def _submit(client, payload):
    return client.post(
        reverse("inquiries:submit"),
        data=json.dumps(payload),
        content_type="application/json",
    )


@override_settings(**EMAIL_SETTINGS)
def test_submit_inquiry_saves_normalized_record_and_sends_notification(client):
    response = _submit(
        client,
        {
            "name": "  Mary Learner  ",
            "email": " MARY@example.com ",
            "phone": " 0700 111 222 ",
            "subject": "Course options",
            "message": "Please help me choose a course.",
            "source": "contact_page",
        },
    )

    assert response.status_code == 201
    inquiry = Inquiry.objects.get()
    assert response.json()["inquiryId"] == inquiry.pk
    assert inquiry.name == "Mary Learner"
    assert inquiry.email == "mary@example.com"
    assert inquiry.phone == "0700 111 222"
    assert inquiry.kind == Inquiry.Kind.GENERAL
    assert inquiry.source == "contact_page"
    assert inquiry.notification_sent_at is not None
    assert inquiry.notification_error == ""

    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["inquiries@example.com"]
    assert mail.outbox[0].reply_to == ["mary@example.com"]
    assert "Course options" in mail.outbox[0].body


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    INQUIRY_NOTIFICATION_EMAIL="",
)
def test_notification_falls_back_to_platform_contact_email(client):
    platform = PlatformSettings.get_settings()
    platform.institution_name = "Example Academy"
    platform.contact_email = "owner@example.com"
    platform.save(update_fields=["institution_name", "contact_email", "updated_at"])

    response = _submit(
        client,
        {
            "name": "Alex Example",
            "email": "alex@example.com",
            "message": "I would like more information.",
        },
    )

    assert response.status_code == 201
    assert mail.outbox[0].to == ["owner@example.com"]
    assert mail.outbox[0].subject == "[Example Academy] New general inquiry"


@override_settings(**EMAIL_SETTINGS)
def test_program_interest_accepts_camel_case_and_links_published_program(client):
    program = ProgramFactory(name="Robotics Foundations")

    response = _submit(
        client,
        {
            "fullName": "Sam Student",
            "email": "sam@example.com",
            "phone": "555-0100",
            "programId": program.pk,
            "source": "program_detail",
        },
    )

    assert response.status_code == 201
    inquiry = Inquiry.objects.get()
    assert inquiry.kind == Inquiry.Kind.PROGRAM
    assert inquiry.program == program
    assert inquiry.message == ""
    assert "Program: Robotics Foundations" in mail.outbox[0].body


@override_settings(**EMAIL_SETTINGS)
def test_program_interest_rejects_unpublished_program(client):
    program = ProgramFactory(is_published=False)

    response = _submit(
        client,
        {
            "name": "Sam Student",
            "email": "sam@example.com",
            "kind": "program",
            "programId": program.pk,
        },
    )

    assert response.status_code == 422
    assert "program_id" in response.json()["errors"]
    assert not Inquiry.objects.exists()
    assert mail.outbox == []


@override_settings(**EMAIL_SETTINGS)
def test_validation_returns_field_errors_without_creating_record(client):
    response = _submit(
        client,
        {
            "name": "",
            "email": "not-an-email",
            "message": "",
            "source": "Contact Page",
        },
    )

    assert response.status_code == 422
    assert set(response.json()["errors"]) >= {"name", "email", "message", "source"}
    assert not Inquiry.objects.exists()
    assert mail.outbox == []


@override_settings(**EMAIL_SETTINGS)
def test_malformed_json_is_rejected(client):
    response = client.post(
        reverse("inquiries:submit"),
        data="{not-json",
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json()["message"] == "Request body must contain valid JSON."
    assert not Inquiry.objects.exists()


@override_settings(**EMAIL_SETTINGS)
def test_honeypot_submission_is_silently_ignored(client):
    response = _submit(
        client,
        {
            "name": "Bot",
            "email": "bot@example.com",
            "message": "Spam",
            "website": "https://spam.example",
        },
    )

    assert response.status_code == 201
    assert not Inquiry.objects.exists()
    assert mail.outbox == []


@override_settings(**EMAIL_SETTINGS)
def test_email_failure_does_not_discard_inquiry(client):
    with patch(
        "apps.inquiries.services.EmailMessage.send",
        side_effect=RuntimeError("mail service unavailable"),
    ):
        response = _submit(
            client,
            {
                "name": "Taylor Example",
                "email": "taylor@example.com",
                "message": "Please contact me.",
            },
        )

    assert response.status_code == 201
    inquiry = Inquiry.objects.get()
    assert inquiry.notification_sent_at is None
    assert inquiry.notification_error == "mail service unavailable"


@override_settings(**EMAIL_SETTINGS)
def test_authenticated_submitter_is_recorded_and_privileged_fields_are_ignored(client):
    user = UserFactory()
    client.force_login(user)

    response = _submit(
        client,
        {
            "name": "Known Learner",
            "email": "known@example.com",
            "message": "A normal question.",
            "status": "resolved",
            "internal_notes": "attacker supplied",
        },
    )

    assert response.status_code == 201
    inquiry = Inquiry.objects.get()
    assert inquiry.submitted_by == user
    assert inquiry.status == Inquiry.Status.NEW
    assert inquiry.internal_notes == ""


@override_settings(**EMAIL_SETTINGS)
def test_form_encoded_submission_is_supported(client):
    response = client.post(
        reverse("inquiries:submit"),
        data={
            "name": "Form Submitter",
            "email": "form@example.com",
            "message": "Sent as form data.",
            "kind": "support",
            "source": "support_form",
        },
    )

    assert response.status_code == 201
    assert Inquiry.objects.get().kind == Inquiry.Kind.SUPPORT


def test_endpoint_requires_csrf_token():
    csrf_client = Client(enforce_csrf_checks=True)

    response = _submit(
        csrf_client,
        {
            "name": "Missing Token",
            "email": "csrf@example.com",
            "message": "This request has no CSRF token.",
        },
    )

    assert response.status_code == 403
    assert not Inquiry.objects.exists()
