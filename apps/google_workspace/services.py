from django.core.exceptions import ValidationError
from .configuration import (
    SCOPES_BY_CAPABILITY,
    granted_capabilities,
    normalize_scopes,
    workspace_configuration,
)
from .models import GoogleWorkspaceCredential


def connected_credential(user):
    return GoogleWorkspaceCredential.objects.filter(user=user, status=GoogleWorkspaceCredential.Status.CONNECTED).first()


def require_connected_credential(user):
    credential = connected_credential(user)
    if not credential:
        raise ValidationError("Connect an authorized Google teacher account first.")
    return credential


def _reconcile_calendar_capability(credential):
    if (
        not credential
        or credential.status != GoogleWorkspaceCredential.Status.CONNECTED
        or "calendar_events" in granted_capabilities(credential)
        or not credential.refresh_token_ciphertext
    ):
        return

    from .adapter import GoogleWorkspaceAPIError
    from .meet import confirm_calendar_access

    try:
        confirmed = confirm_calendar_access(credential)
    except (GoogleWorkspaceAPIError, ValueError):
        return
    if not confirmed:
        return

    scopes = normalize_scopes(credential.granted_scopes)
    scopes.update(SCOPES_BY_CAPABILITY["calendar_events"])
    credential.granted_scopes = sorted(scopes)
    credential.last_error = ""
    credential.save(update_fields=["granted_scopes", "last_error", "updated_at"])


def serialize_connection(user):
    credential = GoogleWorkspaceCredential.objects.filter(user=user).first()
    configuration = workspace_configuration()
    if configuration["available"]:
        _reconcile_calendar_capability(credential)
    return {
        "available": configuration["available"],
        "connected": bool(
            credential
            and credential.status == GoogleWorkspaceCredential.Status.CONNECTED
        ),
        "status": credential.status if credential else "disconnected",
        "googleEmail": credential.google_email if credential else "",
        "grantedScopes": credential.granted_scopes if credential else [],
        "grantedCapabilities": (
            sorted(granted_capabilities(credential)) if credential else []
        ),
        "lastError": credential.last_error if credential else "",
    }
