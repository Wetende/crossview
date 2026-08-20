from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError

SCOPES_BY_CAPABILITY = {
    "calendar_events": {"https://www.googleapis.com/auth/calendar.events"},
    "meet_attendance": {"https://www.googleapis.com/auth/meetings.space.created"},
}
WORKSPACE_IDENTITY_SCOPES = {"openid", "https://www.googleapis.com/auth/userinfo.email"}


def workspace_configuration():
    values = {
        "client_id": settings.GOOGLE_WORKSPACE_CLIENT_ID,
        "client_secret": settings.GOOGLE_WORKSPACE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_WORKSPACE_REDIRECT_URI,
        "encryption_key": settings.GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY,
    }
    values["available"] = bool(settings.GOOGLE_WORKSPACE_ENABLED and all(values.values()))
    return values


def require_workspace_configuration():
    configuration = workspace_configuration()
    if not configuration["available"]:
        raise ImproperlyConfigured("Google Workspace requires its enabled flag, OAuth client, redirect URI, and token encryption key.")
    return configuration


def scopes_for_capabilities(capabilities, existing_scopes=None):
    requested = set(capabilities or ["calendar_events"])
    unknown = requested - set(SCOPES_BY_CAPABILITY)
    if unknown:
        raise ValueError(f"Unsupported Google Workspace capabilities: {', '.join(sorted(unknown))}")
    scopes = set(existing_scopes or []) | WORKSPACE_IDENTITY_SCOPES
    for capability in requested:
        scopes.update(SCOPES_BY_CAPABILITY[capability])
    return sorted(scopes)


def granted_capabilities(credential):
    granted = set(credential.granted_scopes or [])
    return {capability for capability, scopes in SCOPES_BY_CAPABILITY.items() if scopes.issubset(granted)}


def require_capabilities(credential, capabilities):
    missing = set(capabilities) - granted_capabilities(credential)
    if missing:
        labels = ", ".join(sorted(item.replace("_", " ") for item in missing))
        raise ValidationError(f"Authorize the following Google Workspace capabilities first: {labels}.")


def _fernet():
    try:
        return Fernet(require_workspace_configuration()["encryption_key"].encode())
    except (TypeError, ValueError) as exc:
        raise ImproperlyConfigured("GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY must be a valid Fernet key.") from exc


def encrypt_refresh_token(token):
    if not token:
        raise ValueError("Google did not return an offline refresh token.")
    return _fernet().encrypt(token.encode()).decode()


def decrypt_refresh_token(ciphertext):
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("The stored Google Workspace authorization cannot be decrypted.") from exc


def workspace_public_base_url():
    value = settings.PLATFORM_PUBLIC_BASE_URL
    if not value:
        raise ImproperlyConfigured("PLATFORM_PUBLIC_BASE_URL is required for secure Google Meet lesson links.")
    return value
