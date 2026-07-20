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
    require_classroom_configuration,
    scopes_for_capabilities,
)
from .models import ClassroomOAuthCredential


STATE_SALT = "google-classroom-oauth-state"
SESSION_KEY = "google_classroom_oauth"


def _client_config(configuration):
    return {
        "web": {
            "client_id": configuration["client_id"],
            "client_secret": configuration["client_secret"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [configuration["redirect_uri"]],
        }
    }


def build_authorization_url(request, capabilities, return_to=""):
    from google_auth_oauthlib.flow import Flow

    configuration = require_classroom_configuration()
    existing = ClassroomOAuthCredential.objects.filter(user=request.user).first()
    scopes = scopes_for_capabilities(
        capabilities, existing.granted_scopes if existing else None
    )
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b"=").decode()
    state = signing.dumps(
        {
            "userId": request.user.id,
            "capabilities": sorted(set(capabilities or [])),
            "nonce": secrets.token_urlsafe(24),
        },
        salt=STATE_SALT,
        compress=True,
    )
    safe_return_to = return_to if return_to.startswith("/") and not return_to.startswith("//") else "/instructor/programs/"
    request.session[SESSION_KEY] = {
        "state": state,
        "verifier": verifier,
        "returnTo": safe_return_to,
    }
    flow = Flow.from_client_config(_client_config(configuration), scopes=scopes)
    flow.redirect_uri = configuration["redirect_uri"]
    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
        code_challenge=challenge,
        code_challenge_method="S256",
    )
    return authorization_url


def complete_authorization(request, *, state, code):
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build

    configuration = require_classroom_configuration()
    session_state = request.session.pop(SESSION_KEY, None) or {}
    if not state or state != session_state.get("state"):
        raise PermissionDenied("Google Classroom authorization state did not match.")
    try:
        state_data = signing.loads(state, salt=STATE_SALT, max_age=600)
    except signing.BadSignature as exc:
        raise PermissionDenied("Google Classroom authorization state expired.") from exc
    if state_data.get("userId") != request.user.id:
        raise PermissionDenied("Google Classroom authorization belongs to another user.")

    existing = ClassroomOAuthCredential.objects.filter(user=request.user).first()
    scopes = scopes_for_capabilities(
        state_data.get("capabilities"), existing.granted_scopes if existing else None
    )
    flow = Flow.from_client_config(
        _client_config(configuration),
        scopes=scopes,
        state=state,
        code_verifier=session_state.get("verifier"),
    )
    flow.redirect_uri = configuration["redirect_uri"]
    flow.fetch_token(code=code)
    refresh_token = flow.credentials.refresh_token
    if not refresh_token and existing:
        from .configuration import decrypt_refresh_token

        refresh_token = decrypt_refresh_token(existing.refresh_token_ciphertext)
    requested_capabilities = set(state_data.get("capabilities") or [])
    workspace_only = requested_capabilities and requested_capabilities.issubset(
        {"calendar_events", "meet_attendance"}
    )
    if workspace_only:
        service = build(
            "oauth2", "v2", credentials=flow.credentials, cache_discovery=False
        )
        identity = service.userinfo().get().execute()
        profile = {
            "id": identity.get("id", ""),
            "emailAddress": identity.get("email", ""),
        }
    else:
        service = build(
            "classroom", "v1", credentials=flow.credentials, cache_discovery=False
        )
        profile = service.userProfiles().get(userId="me").execute()
    credential, _ = ClassroomOAuthCredential.objects.update_or_create(
        user=request.user,
        defaults={
            "google_user_id": profile.get("id", ""),
            "google_email": profile.get("emailAddress", ""),
            "refresh_token_ciphertext": encrypt_refresh_token(refresh_token),
            "granted_scopes": sorted(set(flow.credentials.scopes or scopes)),
            "status": ClassroomOAuthCredential.Status.CONNECTED,
            "last_error": "",
            "revoked_at": None,
        },
    )
    from .meet import set_google_meet_sync_paused

    set_google_meet_sync_paused(request.user, False)
    return credential, session_state.get("returnTo") or "/instructor/programs/"


def disconnect_classroom(credential):
    from .configuration import decrypt_refresh_token

    token = decrypt_refresh_token(credential.refresh_token_ciphertext)
    response = requests.post(
        "https://oauth2.googleapis.com/revoke",
        params={"token": token},
        headers={"content-type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    if response.status_code >= 500:
        raise RuntimeError("Google could not revoke the Classroom grant right now.")
    credential.status = ClassroomOAuthCredential.Status.REVOKED
    credential.refresh_token_ciphertext = ""
    credential.revoked_at = timezone.now()
    credential.last_error = ""
    credential.save(
        update_fields=[
            "status", "refresh_token_ciphertext", "revoked_at", "last_error", "updated_at"
        ]
    )
    credential.course_links.update(sync_paused=True)
    from .meet import set_google_meet_sync_paused

    set_google_meet_sync_paused(credential.user, True, reason="authorization_revoked")
