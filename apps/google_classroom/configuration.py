from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError


SCOPES_BY_CAPABILITY = {
    "course_read": {
        "https://www.googleapis.com/auth/classroom.courses.readonly",
    },
    "course_manage": {
        "https://www.googleapis.com/auth/classroom.courses",
    },
    "roster_read": {
        "https://www.googleapis.com/auth/classroom.rosters.readonly",
        "https://www.googleapis.com/auth/classroom.profile.emails",
    },
    "roster_manage": {
        "https://www.googleapis.com/auth/classroom.rosters",
        "https://www.googleapis.com/auth/classroom.profile.emails",
    },
    "content": {
        "https://www.googleapis.com/auth/classroom.coursework.students",
        "https://www.googleapis.com/auth/classroom.courseworkmaterials",
        "https://www.googleapis.com/auth/classroom.announcements",
        "https://www.googleapis.com/auth/classroom.topics",
    },
    "grades": {
        "https://www.googleapis.com/auth/classroom.coursework.students",
        "https://www.googleapis.com/auth/classroom.profile.emails",
    },
    "calendar_events": {
        "https://www.googleapis.com/auth/calendar.events",
    },
    "meet_attendance": {
        "https://www.googleapis.com/auth/meetings.space.created",
    },
}
CLASSROOM_CAPABILITIES = {
    "course_read",
    "course_manage",
    "roster_read",
    "roster_manage",
    "content",
    "grades",
}
WORKSPACE_IDENTITY_SCOPES = {
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
}


def workspace_configuration():
    values = {
        "client_id": settings.GOOGLE_WORKSPACE_CLIENT_ID
        or settings.GOOGLE_CLASSROOM_CLIENT_ID,
        "client_secret": settings.GOOGLE_WORKSPACE_CLIENT_SECRET
        or settings.GOOGLE_CLASSROOM_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_WORKSPACE_REDIRECT_URI
        or settings.GOOGLE_CLASSROOM_REDIRECT_URI,
        "encryption_key": settings.GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY
        or settings.GOOGLE_CLASSROOM_TOKEN_ENCRYPTION_KEY,
    }
    values["available"] = bool(
        (settings.GOOGLE_WORKSPACE_ENABLED or settings.GOOGLE_CLASSROOM_ENABLED)
        and all(values.values())
    )
    return values


def classroom_configuration():
    """Backward-compatible name for the shared Google Workspace setup."""
    return workspace_configuration()


def require_workspace_configuration():
    configuration = workspace_configuration()
    if not configuration["available"]:
        raise ImproperlyConfigured(
            "Google Workspace requires its enabled flag, OAuth client, redirect URI, and token encryption key."
        )
    return configuration


def require_classroom_configuration():
    """Backward-compatible alias retained for Classroom callers."""
    return require_workspace_configuration()


def scopes_for_capabilities(capabilities, existing_scopes=None):
    requested = set(capabilities or [])
    if not requested or requested & CLASSROOM_CAPABILITIES:
        requested.add("course_read")
    unknown = requested - set(SCOPES_BY_CAPABILITY)
    if unknown:
        raise ValueError(f"Unsupported Google Workspace capabilities: {', '.join(sorted(unknown))}")
    scopes = set(existing_scopes or [])
    for capability in requested:
        scopes.update(SCOPES_BY_CAPABILITY[capability])
    if requested and not requested & CLASSROOM_CAPABILITIES:
        scopes.update(WORKSPACE_IDENTITY_SCOPES)
    return sorted(scopes)


def granted_capabilities(credential):
    granted_scopes = set(credential.granted_scopes or [])
    return {
        capability
        for capability, scopes in SCOPES_BY_CAPABILITY.items()
        if scopes.issubset(granted_scopes)
    }


def require_capabilities(credential, capabilities):
    missing = set(capabilities) - granted_capabilities(credential)
    if missing:
        labels = ", ".join(sorted(name.replace("_", " ") for name in missing))
        raise ValidationError(
            f"Authorize the following Google Workspace capabilities first: {labels}."
        )


def _fernet():
    configuration = require_classroom_configuration()
    try:
        return Fernet(configuration["encryption_key"].encode())
    except (TypeError, ValueError) as exc:
        raise ImproperlyConfigured(
            "GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY must be a valid Fernet key."
        ) from exc


def encrypt_refresh_token(token):
    if not token:
        raise ValueError("Google did not return an offline refresh token.")
    return _fernet().encrypt(token.encode()).decode()


def decrypt_refresh_token(ciphertext):
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("The stored Google Workspace authorization cannot be decrypted.") from exc


def classroom_public_base_url():
    value = settings.PLATFORM_PUBLIC_BASE_URL
    if not value:
        raise ImproperlyConfigured(
            "PLATFORM_PUBLIC_BASE_URL is required to publish secure course links to Google Classroom."
        )
    return value
