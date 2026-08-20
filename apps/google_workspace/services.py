import logging

from django.core.exceptions import ValidationError
from .configuration import (
    SCOPES_BY_CAPABILITY,
    granted_capabilities,
    normalize_scopes,
    workspace_configuration,
)
from .models import GoogleWorkspaceCredential


logger = logging.getLogger(__name__)

CALENDAR_ACCESS_ERRORS = {
    "authorization_invalid": "Google authorization is no longer valid. Reconnect Google Calendar.",
    "api_disabled": "Google Calendar API is disabled for the configured Google Cloud project.",
    "insufficient_scope": "Google did not grant Calendar event access. Reconnect and approve Calendar access.",
    "quota_or_transient": "Google Calendar is temporarily unavailable. Try again shortly.",
    "remote_error": "Google Calendar access could not be verified. Check the server log for the provider response.",
}


def connected_credential(user):
    return GoogleWorkspaceCredential.objects.filter(user=user, status=GoogleWorkspaceCredential.Status.CONNECTED).first()


def require_connected_credential(user):
    credential = connected_credential(user)
    if not credential:
        raise ValidationError("Connect an authorized Google teacher account first.")
    return credential


def verify_calendar_connection(credential):
    """Run a live, read-only Calendar request and return safe diagnostics."""
    from .adapter import GoogleWorkspaceAPIError
    from .meet import confirm_calendar_access

    try:
        confirmed = confirm_calendar_access(credential)
    except GoogleWorkspaceAPIError as exc:
        logger.warning(
            "Google Calendar capability verification failed "
            "user_id=%s credential_id=%s category=%s status_code=%s",
            credential.user_id,
            credential.id,
            exc.category,
            exc.status_code,
            exc_info=True,
        )
        message = CALENDAR_ACCESS_ERRORS.get(
            exc.category,
            CALENDAR_ACCESS_ERRORS["remote_error"],
        )
        if credential.last_error != message:
            credential.last_error = message
            credential.save(update_fields=["last_error", "updated_at"])
        return {
            "status": "failed",
            "category": exc.category,
            "statusCode": exc.status_code,
        }
    except ValueError:
        logger.warning(
            "Google Calendar credential verification failed "
            "user_id=%s credential_id=%s category=credential_invalid",
            credential.user_id,
            credential.id,
            exc_info=True,
        )
        message = "The stored Google authorization cannot be used. Reconnect Google Calendar."
        if credential.last_error != message:
            credential.last_error = message
            credential.save(update_fields=["last_error", "updated_at"])
        return {"status": "failed", "category": "credential_invalid"}
    if not confirmed:
        return {"status": "failed", "category": "verification_rejected"}

    scopes = normalize_scopes(credential.granted_scopes)
    scopes.update(SCOPES_BY_CAPABILITY["calendar_events"])
    credential.granted_scopes = sorted(scopes)
    credential.last_error = ""
    credential.save(update_fields=["granted_scopes", "last_error", "updated_at"])
    return {"status": "confirmed"}


def _reconcile_calendar_capability(credential):
    if not credential:
        return {"status": "not_connected"}
    if credential.status != GoogleWorkspaceCredential.Status.CONNECTED:
        return {"status": credential.status}
    if "calendar_events" in granted_capabilities(credential):
        return {"status": "granted"}
    if not credential.refresh_token_ciphertext:
        return {"status": "missing_refresh_token"}
    return verify_calendar_connection(credential)


def serialize_connection(user, *, reconcile=True):
    credential = GoogleWorkspaceCredential.objects.filter(user=user).first()
    configuration = workspace_configuration()
    calendar_access = {
        "status": "not_configured" if not configuration["available"] else "not_checked"
    }
    if configuration["available"] and reconcile:
        calendar_access = _reconcile_calendar_capability(credential)
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
        "diagnostics": {"calendarAccess": calendar_access},
    }
