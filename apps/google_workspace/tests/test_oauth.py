from urllib.parse import urlencode

from django.test import SimpleTestCase
from oauthlib.oauth2 import WebApplicationClient

from apps.google_workspace.oauth import scopes_for_token_exchange


class GoogleWorkspaceOAuthScopeTests(SimpleTestCase):
    def test_token_exchange_accepts_scopes_returned_by_incremental_authorization(self):
        scopes = scopes_for_token_exchange(
            [
                "openid",
                "https://www.googleapis.com/auth/calendar.events",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            (
                "email profile openid "
                "https://www.googleapis.com/auth/calendar.events "
                "https://www.googleapis.com/auth/meetings.space.created "
                "https://www.googleapis.com/auth/userinfo.email"
            ),
        )

        self.assertIn("profile", scopes)
        self.assertIn(
            "https://www.googleapis.com/auth/meetings.space.created",
            scopes,
        )
        self.assertIn(
            "https://www.googleapis.com/auth/calendar.events",
            scopes,
        )
        self.assertEqual(len(scopes), len(set(scopes)))

    def test_oauthlib_accepts_token_with_returned_legacy_scopes(self):
        requested = [
            "openid",
            "https://www.googleapis.com/auth/calendar.events",
        ]
        returned = requested + [
            "profile",
            "https://www.googleapis.com/auth/meetings.space.created",
        ]
        exchange_scopes = scopes_for_token_exchange(
            requested,
            " ".join(returned),
        )
        client = WebApplicationClient("client-id", scope=exchange_scopes)
        response = urlencode(
            {
                "access_token": "test-access-token",
                "token_type": "Bearer",
                "scope": " ".join(returned),
            }
        )

        token = client.parse_request_body_response(response)

        self.assertEqual(token["access_token"], "test-access-token")
