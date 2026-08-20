from unittest.mock import patch

from django.test import TestCase

from apps.core.tests.factories import UserFactory
from apps.google_workspace.models import GoogleWorkspaceCredential
from apps.google_workspace.services import serialize_connection


class GoogleWorkspaceConnectionTests(TestCase):
    @patch(
        "apps.google_workspace.meet.confirm_calendar_access",
        return_value=True,
    )
    @patch(
        "apps.google_workspace.services.workspace_configuration",
        return_value={"available": True},
    )
    def test_connected_credential_repairs_missing_calendar_scope(
        self,
        _configuration,
        confirm_calendar_access,
    ):
        user = UserFactory(admin=True)
        credential = GoogleWorkspaceCredential.objects.create(
            user=user,
            google_email="teacher@example.test",
            refresh_token_ciphertext="encrypted-token",
            granted_scopes=["openid"],
            status=GoogleWorkspaceCredential.Status.CONNECTED,
        )

        connection = serialize_connection(user)

        self.assertTrue(connection["connected"])
        self.assertIn("calendar_events", connection["grantedCapabilities"])
        confirm_calendar_access.assert_called_once_with(credential)
        credential.refresh_from_db()
        self.assertIn(
            "https://www.googleapis.com/auth/calendar.events",
            credential.granted_scopes,
        )

    @patch("apps.google_workspace.meet.confirm_calendar_access")
    @patch(
        "apps.google_workspace.services.workspace_configuration",
        return_value={"available": False},
    )
    def test_unconfigured_deployment_does_not_call_google(
        self,
        _configuration,
        confirm_calendar_access,
    ):
        user = UserFactory(admin=True)
        GoogleWorkspaceCredential.objects.create(
            user=user,
            refresh_token_ciphertext="encrypted-token",
            granted_scopes=[],
            status=GoogleWorkspaceCredential.Status.CONNECTED,
        )

        connection = serialize_connection(user)

        self.assertFalse(connection["available"])
        confirm_calendar_access.assert_not_called()
