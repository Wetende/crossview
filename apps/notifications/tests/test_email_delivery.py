import pytest
from django.core import mail
from django.test import override_settings

from apps.notifications.email_delivery import (
    render_branded_email,
    send_branded_email,
)
from apps.platform.models import PlatformSettings


pytestmark = pytest.mark.django_db


@override_settings(
    DEFAULT_FROM_EMAIL="notifications@example.test",
    PLATFORM_PUBLIC_BASE_URL="https://academy.example.test",
    EMAIL_LAYOUT_TEMPLATE="emails/platform_message.html",
)
def test_dynamic_email_uses_platform_identity_logo_and_colors():
    platform = PlatformSettings.get_settings()
    platform.institution_name = "Example Academy"
    platform.tagline = "Learn without limits"
    platform.contact_email = "help@example.test"
    platform.logo = "branding/example-logo.png"
    platform.primary_color = "#123456"
    platform.secondary_color = "#FEDCBA"
    platform.save()

    rendered = render_branded_email(
        subject="Welcome",
        message="Hello <learner>\nYour account is ready.",
        action_url="/login/",
        action_label="Open account",
    )

    assert "Example Academy" in rendered.html
    assert "Learn without limits" in rendered.html
    assert "https://academy.example.test/media/branding/example-logo.png" in rendered.html
    assert "#123456" in rendered.html
    assert "#FEDCBA" in rendered.html
    assert "https://academy.example.test/login/" in rendered.html
    assert "Hello &lt;learner&gt;" in rendered.html
    assert "<learner>" in rendered.text
    assert rendered.from_email == "Example Academy <notifications@example.test>"
    assert rendered.reply_to == ["help@example.test"]


@override_settings(
    DEFAULT_FROM_EMAIL="notifications@example.test",
    PLATFORM_PUBLIC_BASE_URL="https://college.example.test",
    EMAIL_LAYOUT_TEMPLATE="emails/platform_message.html",
)
def test_dynamic_email_falls_back_to_name_when_logo_is_missing():
    platform = PlatformSettings.get_settings()
    platform.institution_name = "Second College"
    platform.logo = None
    platform.save()

    rendered = render_branded_email(subject="Notice", message="Plain notice")

    assert "Second College" in rendered.html
    assert "<img" not in rendered.html
    assert "Airads" not in rendered.html
    assert "DigikaTech" not in rendered.html


@override_settings(
    DEFAULT_FROM_EMAIL="notifications@example.test",
    PLATFORM_PUBLIC_BASE_URL="https://product.example.test",
    EMAIL_LAYOUT_TEMPLATE="emails/platform_message.html",
    EMAIL_LOGO_URL="/static/branding/product-email-logo.png",
)
def test_product_email_logo_override_uses_stable_absolute_url():
    platform = PlatformSettings.get_settings()
    platform.institution_name = "Example Product"
    platform.logo = "branding/tenant-upload.png"
    platform.save()

    rendered = render_branded_email(subject="Notice", message="Plain notice")

    assert (
        "https://product.example.test/static/branding/product-email-logo.png"
        in rendered.html
    )
    assert "tenant-upload.png" not in rendered.html


@override_settings(
    DEFAULT_FROM_EMAIL="notifications@example.test",
    PLATFORM_PUBLIC_BASE_URL="https://academy.example.test",
    EMAIL_LAYOUT_TEMPLATE="emails/platform_message.html",
)
def test_send_branded_email_includes_plain_and_html_parts():
    PlatformSettings.objects.update_or_create(
        pk=1,
        defaults={
            "institution_name": "Example Academy",
            "contact_email": "help@example.test",
        },
    )

    sent = send_branded_email(
        subject="Reset your password",
        message="Use the secure link below.",
        recipient_list=["learner@example.test"],
        action_url="/reset-password/token/",
        action_label="Reset password",
    )

    assert sent == 1
    assert len(mail.outbox) == 1
    assert mail.outbox[0].body == "Use the secure link below."
    assert mail.outbox[0].alternatives
    html = mail.outbox[0].alternatives[0][0]
    assert "Reset password" in html
    assert "https://academy.example.test/reset-password/token/" in html
    assert mail.outbox[0].reply_to == ["help@example.test"]
