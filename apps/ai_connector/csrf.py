"""CSRF handling for OAuth clients that authenticate in opaque browser contexts."""

from urllib.parse import urlsplit

from django.middleware.csrf import CsrfViewMiddleware
from django.urls import Resolver404, resolve


OAUTH_AUTHORIZE_VIEW = "oauth2_provider:authorize"
LOGIN_VIEW = "core:login"


def _is_local_oauth_authorize_url(value: str) -> bool:
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return False

    try:
        return resolve(parsed.path).view_name == OAUTH_AUTHORIZE_VIEW
    except Resolver404:
        return False


class ConnectorCsrfViewMiddleware(CsrfViewMiddleware):
    """Accept opaque OAuth browser origins without weakening token checks.

    ChatGPT can render the user-authentication flow in a sandboxed browser
    context. Browsers serialize the origin of that context as ``null`` even
    though the displayed document came from this LMS. Django rejects that origin
    before checking the form's CSRF token.

    Only the connector authorization view and a login that returns to that
    view receive this exception. ``CsrfViewMiddleware`` still requires the
    normal CSRF cookie and matching form/header token for both requests.
    """

    def _origin_verified(self, request):
        if request.META.get("HTTP_ORIGIN") == "null" and self._is_connector_oauth_request(request):
            return True
        return super()._origin_verified(request)

    @staticmethod
    def _is_connector_oauth_request(request) -> bool:
        match = request.resolver_match
        if match is None:
            return False
        if match.view_name == OAUTH_AUTHORIZE_VIEW:
            return True
        if match.view_name != LOGIN_VIEW:
            return False
        return _is_local_oauth_authorize_url(request.POST.get("next", ""))
