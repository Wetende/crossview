from types import SimpleNamespace

from django.test import SimpleTestCase

from apps.google_workspace.configuration import granted_capabilities
from apps.google_workspace.oauth import granted_scopes_from_credentials


class GoogleWorkspaceScopeTests(SimpleTestCase):
    def test_space_delimited_scope_value_is_normalized(self):
        credential = SimpleNamespace(
            granted_scopes=(
                "openid https://www.googleapis.com/auth/userinfo.email "
                "https://www.googleapis.com/auth/calendar.events"
            )
        )

        self.assertIn("calendar_events", granted_capabilities(credential))

    def test_full_calendar_scope_satisfies_calendar_event_capability(self):
        credential = SimpleNamespace(
            granted_scopes=["https://www.googleapis.com/auth/calendar"]
        )

        self.assertIn("calendar_events", granted_capabilities(credential))

    def test_callback_prefers_scopes_reported_as_granted_by_google(self):
        credentials = SimpleNamespace(
            granted_scopes=(
                "openid https://www.googleapis.com/auth/userinfo.email "
                "https://www.googleapis.com/auth/calendar.events"
            ),
            scopes=["openid", "https://www.googleapis.com/auth/userinfo.email"],
        )

        scopes = granted_scopes_from_credentials(
            credentials,
            requested_scopes=[
                "openid",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
        )

        self.assertIn("https://www.googleapis.com/auth/calendar.events", scopes)
