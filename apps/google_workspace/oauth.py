from __future__ import annotations

import base64
import hashlib
import secrets

import requests
from django.core import signing
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from .configuration import (
    encrypt_refresh_token,
    normalize_scopes,
    require_workspace_configuration,
    scopes_for_capabilities,
)
from .models import GoogleWorkspaceCredential

STATE_SALT = "google-workspace-oauth-state"
SESSION_KEY = "google_workspace_oauth"
CALLBACK_DIAGNOSTIC_SESSION_KEY = "google_workspace_oauth_callback_diagnostic"


class GoogleWorkspaceOAuthCallbackError(RuntimeError):
    def __init__(self, message, *, category, stage):
        super().__init__(message)
        self.category = category
        self.stage = stage


def _client_config(configuration):
    return {"web": {"client_id": configuration["client_id"], "client_secret": configuration["client_secret"], "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "redirect_uris": [configuration["redirect_uri"]]}}


def granted_scopes_from_credentials(credentials, requested_scopes):
    """Prefer Google's token response over the OAuth session request."""
    granted = normalize_scopes(getattr(credentials, "granted_scopes", None))
    if granted:
        return sorted(granted)
    fallback = normalize_scopes(getattr(credentials, "scopes", None))
    return sorted(fallback or normalize_scopes(requested_scopes))


def fetch_token_with_incremental_grants(flow, *, code, required_scopes):
    """Complete Google's exchange while validating its authoritative scopes.

    OAuthlib raises ``Warning`` whenever the token response scopes are not an
    exact match for the request. Google incremental authorization can validly
    add grants from earlier consent. Recover that already-parsed token only
    when it still contains every scope Airads required for this request.
    """
    try:
        return flow.fetch_token(code=code)
    except Warning as exc:
        token = getattr(exc, "token", None)
        granted_scopes = normalize_scopes(getattr(exc, "new_scope", None))
        if not granted_scopes and token:
            granted_scopes = normalize_scopes(token.get("scope"))
        missing_scopes = normalize_scopes(required_scopes) - granted_scopes
        if not token or missing_scopes:
            raise GoogleWorkspaceOAuthCallbackError(
                "Google did not grant every permission Airads requested.",
                category="scope_mismatch",
                stage="token_exchange",
            ) from exc
        flow.oauth2session.token = dict(token)
        return flow.oauth2session.token


def build_authorization_url(request, capabilities, return_to=""):
    from google_auth_oauthlib.flow import Flow
    configuration = require_workspace_configuration()
    existing = GoogleWorkspaceCredential.objects.filter(user=request.user).first()
    scopes = scopes_for_capabilities(capabilities, existing.granted_scopes if existing else None)
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    state = signing.dumps({"userId": request.user.id, "capabilities": sorted(set(capabilities or ["calendar_events"])), "nonce": secrets.token_urlsafe(24)}, salt=STATE_SALT, compress=True)
    safe_return_to = return_to if return_to.startswith("/") and not return_to.startswith("//") else "/instructor/programs/"
    request.session.pop(CALLBACK_DIAGNOSTIC_SESSION_KEY, None)
    request.session[SESSION_KEY] = {"state": state, "verifier": verifier, "returnTo": safe_return_to}
    flow = Flow.from_client_config(_client_config(configuration), scopes=scopes)
    flow.redirect_uri = configuration["redirect_uri"]
    authorization_url, _ = flow.authorization_url(access_type="offline", include_granted_scopes="true", prompt="consent", state=state, code_challenge=challenge, code_challenge_method="S256")
    return authorization_url


def complete_authorization(request, *, state, code):
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    configuration = require_workspace_configuration()
    session_state = request.session.pop(SESSION_KEY, None) or {}
    if not state or state != session_state.get("state"):
        raise PermissionDenied("Google Workspace authorization state did not match.")
    try:
        state_data = signing.loads(state, salt=STATE_SALT, max_age=600)
    except signing.BadSignature as exc:
        raise PermissionDenied("Google Workspace authorization state expired.") from exc
    if state_data.get("userId") != request.user.id:
        raise PermissionDenied("Google Workspace authorization belongs to another user.")
    existing = GoogleWorkspaceCredential.objects.filter(user=request.user).first()
    requested_scopes = scopes_for_capabilities(
        state_data.get("capabilities"),
        existing.granted_scopes if existing else None,
    )
    flow = Flow.from_client_config(
        _client_config(configuration),
        scopes=requested_scopes,
        state=state,
        code_verifier=session_state.get("verifier"),
    )
    flow.redirect_uri = configuration["redirect_uri"]
    try:
        fetch_token_with_incremental_grants(
            flow,
            code=code,
            required_scopes=requested_scopes,
        )
    except GoogleWorkspaceOAuthCallbackError:
        raise
    except Exception as exc:
        raise GoogleWorkspaceOAuthCallbackError(
            "Google did not complete the authorization-code exchange.",
            category="token_exchange_failed",
            stage="token_exchange",
        ) from exc
    refresh_token = flow.credentials.refresh_token
    if not refresh_token and existing:
        from .configuration import decrypt_refresh_token
        refresh_token = decrypt_refresh_token(existing.refresh_token_ciphertext)
    if not refresh_token:
        raise GoogleWorkspaceOAuthCallbackError(
            "Google did not return the offline access token Airads requires.",
            category="refresh_token_missing",
            stage="refresh_token",
        )
    try:
        identity = build(
            "oauth2",
            "v2",
            credentials=flow.credentials,
            cache_discovery=False,
        ).userinfo().get().execute()
    except Exception as exc:
        raise GoogleWorkspaceOAuthCallbackError(
            "Airads could not read the authorized Google account identity.",
            category="identity_lookup_failed",
            stage="identity_lookup",
        ) from exc
    granted_scopes = normalize_scopes(existing.granted_scopes if existing else None)
    granted_scopes.update(
        granted_scopes_from_credentials(
            flow.credentials,
            requested_scopes,
        )
    )
    try:
        encrypted_refresh_token = encrypt_refresh_token(refresh_token)
    except Exception as exc:
        raise GoogleWorkspaceOAuthCallbackError(
            "Airads could not encrypt the Google offline access token.",
            category="token_encryption_failed",
            stage="token_encryption",
        ) from exc
    try:
        credential, _ = GoogleWorkspaceCredential.objects.update_or_create(
            user=request.user,
            defaults={
                "google_user_id": identity.get("id", ""),
                "google_email": identity.get("email", ""),
                "refresh_token_ciphertext": encrypted_refresh_token,
                "granted_scopes": sorted(granted_scopes),
                "status": GoogleWorkspaceCredential.Status.CONNECTED,
                "last_error": "",
                "revoked_at": None,
            },
        )
    except Exception as exc:
        raise GoogleWorkspaceOAuthCallbackError(
            "Airads could not save the authorized Google account.",
            category="credential_storage_failed",
            stage="credential_storage",
        ) from exc
    if credential.google_user_id:
        from .models import GoogleParticipantIdentity
        GoogleParticipantIdentity.objects.update_or_create(
            google_user_id=credential.google_user_id,
            defaults={"user": request.user, "verified_email": credential.google_email, "source": "workspace_oauth", "verified_by": request.user},
        )
    from .meet import set_google_meet_sync_paused
    set_google_meet_sync_paused(request.user, False)
    return credential, session_state.get("returnTo") or "/instructor/programs/"


def disconnect_workspace(credential):
    from .configuration import decrypt_refresh_token
    token = decrypt_refresh_token(credential.refresh_token_ciphertext)
    response = requests.post("https://oauth2.googleapis.com/revoke", params={"token": token}, headers={"content-type": "application/x-www-form-urlencoded"}, timeout=15)
    if response.status_code >= 500:
        raise RuntimeError("Google could not revoke the Workspace grant right now.")
    credential.status = GoogleWorkspaceCredential.Status.REVOKED
    credential.refresh_token_ciphertext = ""
    credential.revoked_at = timezone.now()
    credential.last_error = ""
    credential.save(update_fields=["status", "refresh_token_ciphertext", "revoked_at", "last_error", "updated_at"])
    from .meet import set_google_meet_sync_paused
    set_google_meet_sync_paused(credential.user, True, reason="authorization_revoked")
