from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from django.contrib.sessions.middleware import SessionMiddleware
from django.core.exceptions import PermissionDenied
from django.test import RequestFactory

from apps.google_classroom.configuration import (
    decrypt_refresh_token,
    encrypt_refresh_token,
    scopes_for_capabilities,
)
from apps.google_classroom.adapter import ClassroomAPIError, GoogleClassroomAdapter
from apps.google_classroom.models import ClassroomOAuthCredential
from apps.google_classroom.oauth import (
    build_authorization_url,
    complete_authorization,
    disconnect_classroom,
)
from apps.google_classroom.services import serialize_connection


def session_request(user):
    request = RequestFactory().get("/")
    request.user = user
    SessionMiddleware(lambda value: value).process_request(request)
    request.session.save()
    return request


@pytest.mark.django_db
def test_refresh_token_is_encrypted_and_capabilities_are_incremental(
    classroom_settings, instructor
):
    ciphertext = encrypt_refresh_token("offline-token")

    assert ciphertext != "offline-token"
    assert decrypt_refresh_token(ciphertext) == "offline-token"
    assert scopes_for_capabilities(["roster_read"]) == [
        "https://www.googleapis.com/auth/classroom.courses.readonly",
        "https://www.googleapis.com/auth/classroom.profile.emails",
        "https://www.googleapis.com/auth/classroom.rosters.readonly",
    ]


@pytest.mark.django_db
def test_authorization_uses_signed_state_pkce_and_safe_return_path(
    classroom_settings, instructor
):
    request = session_request(instructor)
    flow = Mock()
    flow.authorization_url.return_value = ("https://accounts.google.test/authorize", "x")

    with patch("google_auth_oauthlib.flow.Flow.from_client_config", return_value=flow):
        url = build_authorization_url(
            request,
            ["course_manage"],
            return_to="https://attacker.example/redirect",
        )

    assert url == "https://accounts.google.test/authorize"
    assert request.session["google_classroom_oauth"]["returnTo"] == "/instructor/programs/"
    assert request.session["google_classroom_oauth"]["verifier"]
    kwargs = flow.authorization_url.call_args.kwargs
    assert kwargs["access_type"] == "offline"
    assert kwargs["include_granted_scopes"] == "true"
    assert kwargs["code_challenge_method"] == "S256"
    assert kwargs["code_challenge"]


@pytest.mark.django_db
def test_callback_persists_profile_scopes_and_encrypted_refresh_token(
    classroom_settings, instructor
):
    request = session_request(instructor)
    authorization_flow = Mock()
    authorization_flow.authorization_url.return_value = ("https://accounts.google.test", "x")
    with patch(
        "google_auth_oauthlib.flow.Flow.from_client_config",
        return_value=authorization_flow,
    ):
        build_authorization_url(
            request,
            ["course_manage"],
            return_to="/instructor/programs/1/manage/?tab=classroom",
        )
    state = request.session["google_classroom_oauth"]["state"]

    callback_flow = Mock()
    callback_flow.credentials = SimpleNamespace(
        refresh_token="new-offline-token",
        scopes=["https://www.googleapis.com/auth/classroom.courses"],
    )
    profile_request = Mock()
    profile_request.execute.return_value = {
        "id": "google-teacher-9",
        "emailAddress": "verified-teacher@example.test",
    }
    service = Mock()
    service.userProfiles.return_value.get.return_value = profile_request

    with (
        patch(
            "google_auth_oauthlib.flow.Flow.from_client_config",
            return_value=callback_flow,
        ),
        patch("googleapiclient.discovery.build", return_value=service),
    ):
        credential, return_to = complete_authorization(
            request, state=state, code="authorization-code"
        )

    callback_flow.fetch_token.assert_called_once_with(code="authorization-code")
    assert credential.google_user_id == "google-teacher-9"
    assert credential.google_email == "verified-teacher@example.test"
    assert decrypt_refresh_token(credential.refresh_token_ciphertext) == "new-offline-token"
    assert return_to.endswith("?tab=classroom")


@pytest.mark.django_db
def test_callback_rejects_state_not_bound_to_session(classroom_settings, instructor):
    request = session_request(instructor)
    with pytest.raises(PermissionDenied):
        complete_authorization(request, state="untrusted", code="code")


@pytest.mark.django_db
def test_disconnect_revokes_grant_and_pauses_links(
    classroom_settings, credential, course_link
):
    response = Mock(status_code=200)
    with patch("apps.google_classroom.oauth.requests.post", return_value=response) as revoke:
        disconnect_classroom(credential)

    credential.refresh_from_db()
    course_link.refresh_from_db()
    assert credential.status == ClassroomOAuthCredential.Status.REVOKED
    assert credential.refresh_token_ciphertext == ""
    assert course_link.sync_paused is True
    assert revoke.call_args.kwargs["params"] == {"token": "refresh-token"}


@pytest.mark.django_db
def test_connection_summary_reports_granted_capabilities(credential):
    summary = serialize_connection(credential.user)

    assert summary["connected"] is True
    assert set(summary["grantedCapabilities"]) == {
        "course_manage",
        "course_read",
        "roster_read",
        "roster_manage",
        "content",
        "grades",
    }


@pytest.mark.django_db
def test_invalid_google_grant_pauses_every_link(credential, course_link):
    response = SimpleNamespace(status=401)
    google_error = RuntimeError("invalid_grant")
    google_error.resp = response
    google_error.content = b'{"error":"invalid_grant"}'
    request = Mock()
    request.execute.side_effect = google_error
    adapter = GoogleClassroomAdapter(credential, service=Mock())

    with pytest.raises(ClassroomAPIError) as exc_info:
        adapter._execute(request)

    credential.refresh_from_db()
    course_link.refresh_from_db()
    assert exc_info.value.category == "authorization_invalid"
    assert credential.status == ClassroomOAuthCredential.Status.INVALID
    assert course_link.sync_paused is True
