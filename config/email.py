from collections.abc import Mapping


def build_email_settings(*, debug: bool, environment: Mapping[str, str]) -> dict:
    """Build fail-closed Brevo settings without reading secrets in application code."""
    api_key = str(environment.get("BREVO_API_KEY", "")).strip()
    from_email = str(environment.get("DEFAULT_FROM_EMAIL", "")).strip()
    public_base_url = str(environment.get("PLATFORM_PUBLIC_BASE_URL", "")).strip().rstrip("/")

    shared = {
        "BREVO_API_KEY": api_key,
        "DEFAULT_FROM_EMAIL": from_email or "webmaster@localhost",
        "EMAIL_FROM_NAME": str(environment.get("EMAIL_FROM_NAME", "")).strip(),
        "DEFAULT_REPLY_TO_EMAIL": str(
            environment.get("DEFAULT_REPLY_TO_EMAIL", "")
        ).strip(),
        "EMAIL_LAYOUT_TEMPLATE": str(
            environment.get("EMAIL_LAYOUT_TEMPLATE", "emails/platform_message.html")
        ).strip()
        or "emails/platform_message.html",
        "EMAIL_LOGO_URL": str(environment.get("EMAIL_LOGO_URL", "")).strip(),
        "PLATFORM_PUBLIC_BASE_URL": public_base_url,
    }

    if debug and not api_key:
        return {
            **shared,
            "EMAIL_BACKEND": "django.core.mail.backends.console.EmailBackend",
            "ANYMAIL": {},
        }

    missing = []
    if not api_key:
        missing.append("BREVO_API_KEY")
    if not from_email:
        missing.append("DEFAULT_FROM_EMAIL")
    if not public_base_url:
        missing.append("PLATFORM_PUBLIC_BASE_URL")
    if missing:
        raise RuntimeError(
            "Production email delivery requires: " + ", ".join(missing) + "."
        )

    return {
        **shared,
        "EMAIL_BACKEND": "anymail.backends.brevo.EmailBackend",
        "ANYMAIL": {"BREVO_API_KEY": api_key},
    }
