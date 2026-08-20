from django.core.exceptions import ValidationError
from .configuration import granted_capabilities, workspace_configuration
from .models import GoogleWorkspaceCredential


def connected_credential(user):
    return GoogleWorkspaceCredential.objects.filter(user=user, status=GoogleWorkspaceCredential.Status.CONNECTED).first()


def require_connected_credential(user):
    credential = connected_credential(user)
    if not credential:
        raise ValidationError("Connect an authorized Google teacher account first.")
    return credential


def serialize_connection(user):
    credential = GoogleWorkspaceCredential.objects.filter(user=user).first()
    return {"available": workspace_configuration()["available"], "connected": bool(credential and credential.status == GoogleWorkspaceCredential.Status.CONNECTED), "status": credential.status if credential else "disconnected", "googleEmail": credential.google_email if credential else "", "grantedScopes": credential.granted_scopes if credential else [], "grantedCapabilities": sorted(granted_capabilities(credential)) if credential else [], "lastError": credential.last_error if credential else ""}
