from unittest.mock import Mock

from django.test import SimpleTestCase
from google_auth_oauthlib.flow import Flow

from apps.google_workspace.configuration import normalize_scopes
from apps.google_workspace.oauth import (
    GoogleWorkspaceOAuthCallbackError,
    fetch_token_with_incremental_grants,
)


class GoogleWorkspaceOAuthScopeTests(SimpleTestCase):
    @staticmethod
    def _flow_with_warning(required_scopes, warning):
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": "test-client-id",
                    "client_secret": "test-client-secret",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": ["https://example.test/callback/"],
                }
            },
            scopes=required_scopes,
        )
        flow.fetch_token = Mock(side_effect=warning)
        return flow

    def test_token_exchange_accepts_additional_incremental_grants(self):
        required = [
            "openid",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/userinfo.email",
        ]
        returned = required + [
            "profile",
            "https://www.googleapis.com/auth/meetings.space.created",
        ]
        warning = Warning("Scope has changed")
        warning.token = {
            "access_token": "test-access-token",
            "refresh_token": "test-refresh-token",
            "expires_at": 1_900_000_000,
            "scope": returned,
            "token_type": "Bearer",
        }
        warning.new_scope = returned
        flow = self._flow_with_warning(required, warning)

        token = fetch_token_with_incremental_grants(
            flow,
            code="authorization-code",
            required_scopes=required,
        )

        self.assertEqual(token["access_token"], "test-access-token")
        self.assertEqual(flow.oauth2session.token, warning.token)
        self.assertEqual(flow.credentials.refresh_token, "test-refresh-token")
        self.assertEqual(
            normalize_scopes(flow.credentials.granted_scopes),
            set(returned),
        )

    def test_token_exchange_rejects_missing_required_scope(self):
        warning = Warning("Scope has changed")
        warning.token = {
            "access_token": "test-access-token",
            "refresh_token": "test-refresh-token",
            "expires_at": 1_900_000_000,
            "scope": [
                "openid",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            "token_type": "Bearer",
        }
        warning.new_scope = [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
        ]
        flow = self._flow_with_warning(
            [
                "openid",
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            warning,
        )

        with self.assertRaises(GoogleWorkspaceOAuthCallbackError) as context:
            fetch_token_with_incremental_grants(
                flow,
                code="authorization-code",
                required_scopes=[
                    "openid",
                    "https://www.googleapis.com/auth/calendar.events",
                    "https://www.googleapis.com/auth/userinfo.email",
                ],
            )

        self.assertEqual(context.exception.category, "scope_mismatch")
