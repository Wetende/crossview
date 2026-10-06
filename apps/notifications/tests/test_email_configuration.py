import pytest

from config.email import build_email_settings


def test_development_without_brevo_uses_console_backend():
    configured = build_email_settings(debug=True, environment={})

    assert configured["EMAIL_BACKEND"] == "django.core.mail.backends.console.EmailBackend"


@pytest.mark.parametrize(
    ("environment", "missing_name"),
    [
        ({}, "BREVO_API_KEY"),
        (
            {
                "BREVO_API_KEY": "test-api-key",
                "PLATFORM_PUBLIC_BASE_URL": "https://academy.example.test",
            },
            "DEFAULT_FROM_EMAIL",
        ),
        (
            {
                "BREVO_API_KEY": "test-api-key",
                "DEFAULT_FROM_EMAIL": "notifications@example.test",
            },
            "PLATFORM_PUBLIC_BASE_URL",
        ),
    ],
)
def test_production_requires_brevo_sender_and_public_url(environment, missing_name):
    with pytest.raises(RuntimeError, match=missing_name):
        build_email_settings(debug=False, environment=environment)


def test_production_uses_brevo_api_when_configuration_is_complete():
    configured = build_email_settings(
        debug=False,
        environment={
            "BREVO_API_KEY": "test-api-key",
            "DEFAULT_FROM_EMAIL": "notifications@example.test",
            "PLATFORM_PUBLIC_BASE_URL": "https://academy.example.test",
        },
    )

    assert configured["EMAIL_BACKEND"] == "anymail.backends.brevo.EmailBackend"
    assert configured["ANYMAIL"] == {"BREVO_API_KEY": "test-api-key"}
    assert configured["DEFAULT_FROM_EMAIL"] == "notifications@example.test"
    assert configured["PLATFORM_PUBLIC_BASE_URL"] == "https://academy.example.test"
