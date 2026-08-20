from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

from apps.core.tests.factories import UserFactory
from apps.google_workspace.adapter import GoogleWorkspaceAPIError
from apps.google_workspace.models import GoogleWorkspaceCredential
from apps.google_workspace.oauth import (
    CALLBACK_DIAGNOSTIC_SESSION_KEY,
    SESSION_KEY,
    GoogleWorkspaceOAuthCallbackError,
)


class GoogleWorkspaceConnectionTestViewTests(TestCase):
    def setUp(self):
        self.user = UserFactory(admin=True)
        self.client.force_login(self.user)
        self.url = reverse("google_workspace:connection-test")

    @patch(
        "apps.google_workspace.meet.confirm_calendar_access",
        return_value=True,
    )
    def test_live_calendar_test_confirms_saved_credential(self, confirm_access):
        GoogleWorkspaceCredential.objects.create(
            user=self.user,
            google_email="teacher@example.test",
            refresh_token_ciphertext="encrypted-token",
            granted_scopes=["openid"],
            status=GoogleWorkspaceCredential.Status.CONNECTED,
        )

        response = self.client.post(self.url, data={}, content_type="application/json")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(
            response.json()["diagnostic"],
            {"status": "confirmed"},
        )
        self.assertIn(
            "calendar_events",
            response.json()["connection"]["grantedCapabilities"],
        )
        confirm_access.assert_called_once()

    @patch(
        "apps.google_workspace.meet.confirm_calendar_access",
        side_effect=GoogleWorkspaceAPIError(
            "Provider detail must not be returned.",
            category="insufficient_scope",
            status_code=403,
        ),
    )
    def test_live_calendar_test_returns_safe_failure_diagnostic(
        self,
        _confirm_access,
    ):
        GoogleWorkspaceCredential.objects.create(
            user=self.user,
            google_email="teacher@example.test",
            refresh_token_ciphertext="encrypted-token",
            granted_scopes=["openid"],
            status=GoogleWorkspaceCredential.Status.CONNECTED,
        )

        with self.assertLogs("apps.google_workspace.services", level="WARNING"):
            response = self.client.post(
                self.url,
                data={},
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["ok"])
        self.assertEqual(
            response.json()["diagnostic"],
            {
                "status": "failed",
                "category": "insufficient_scope",
                "statusCode": 403,
            },
        )
        self.assertNotIn(
            "Provider detail",
            str(response.json()),
        )

    def test_live_calendar_test_requires_a_saved_credential(self):
        response = self.client.post(self.url, data={}, content_type="application/json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("Connect", response.json()["detail"])

    @patch(
        "apps.google_workspace.views.complete_authorization",
        side_effect=GoogleWorkspaceOAuthCallbackError(
            "Google did not return the offline access token Airads requires.",
            category="refresh_token_missing",
            stage="refresh_token",
        ),
    )
    def test_oauth_callback_failure_is_returned_as_safe_dashboard_diagnostic(
        self,
        _complete_authorization,
    ):
        session = self.client.session
        session[SESSION_KEY] = {
            "returnTo": "/dashboard/",
            "state": "signed-state",
            "verifier": "verifier",
        }
        session.save()

        with self.assertLogs("apps.google_workspace.views", level="ERROR"):
            callback = self.client.get(
                reverse("google_workspace:oauth-callback"),
                {"state": "signed-state", "code": "authorization-code"},
            )

        self.assertRedirects(
            callback,
            "/dashboard/",
            fetch_redirect_response=False,
        )
        diagnostic = self.client.session[CALLBACK_DIAGNOSTIC_SESSION_KEY]
        self.assertEqual(
            diagnostic,
            {
                "status": "error",
                "category": "refresh_token_missing",
                "stage": "refresh_token",
                "message": "Google did not return the offline access token Airads requires.",
            },
        )

        connection = self.client.get(reverse("google_workspace:connection"))

        self.assertEqual(connection.status_code, 200)
        self.assertEqual(connection.json()["oauthCallback"], diagnostic)
