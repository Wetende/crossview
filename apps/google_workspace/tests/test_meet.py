from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from apps.google_workspace.meet import confirm_calendar_access


class GoogleCalendarAccessTests(SimpleTestCase):
    @patch("apps.google_workspace.meet._credentials")
    @patch("googleapiclient.discovery.build")
    def test_confirmation_uses_a_read_only_calendar_request(
        self,
        build,
        credentials,
    ):
        credential = Mock(
            granted_scopes=["openid"],
            refresh_token_ciphertext="encrypted-token",
        )
        request = Mock()
        request.execute.return_value = {"items": []}
        calendar = Mock()
        calendar.events.return_value.list.return_value = request
        build.return_value = calendar

        confirmed = confirm_calendar_access(credential)

        self.assertTrue(confirmed)
        credentials.assert_called_once()
        self.assertIn(
            "https://www.googleapis.com/auth/calendar.events",
            credentials.call_args.kwargs["scopes"],
        )
        calendar.events.return_value.list.assert_called_once_with(
            calendarId="primary",
            maxResults=1,
        )
        request.execute.assert_called_once_with()
