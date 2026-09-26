"""MCP endpoint and the "Connected AI apps" account page."""

from functools import wraps

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from inertia import render
from mcp_server.views import MCPServerStreamableHttpView
from oauth2_provider.contrib.rest_framework import OAuth2ProtectedResourceAuthentication
from oauth2_provider.models import get_access_token_model, get_grant_model, get_refresh_token_model
from rest_framework import exceptions, permissions
from rest_framework.throttling import UserRateThrottle

from .access import READ_SCOPE, can_use_connector, connector_enabled, token_scopes
from .oauth import resource_metadata_url, resource_url

SCOPE_LABELS = {
    "courses:read": "Read courses",
    "courses:write": "Save confirmed course changes",
}


class ConnectorTokenAuthentication(OAuth2ProtectedResourceAuthentication):
    """Bearer tokens only; a 401 points clients at the RFC 9728 metadata document."""

    www_authenticate_realm = "mcp"

    def get_resource_metadata_url(self, request):
        return resource_metadata_url(request)

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        if user is None or not user.is_active:
            raise exceptions.AuthenticationFailed("This account is disabled or the token is not a user token.")
        if not token.resource:
            # DOT checks the audience only when one is recorded; require it so
            # every accepted token is bound to this MCP endpoint.
            raise exceptions.AuthenticationFailed(
                "This token is not bound to this server. Disconnect and reconnect the app."
            )
        return result


class HasConnectorAccess(permissions.BasePermission):
    message = (
        "This account cannot use the course-authoring connector. Only instructors "
        "and administrators with the courses:read permission can connect."
    )

    def has_permission(self, request, view):
        return READ_SCOPE in token_scopes(request.auth) and can_use_connector(request.user)


class ConnectorRateThrottle(UserRateThrottle):
    scope = "ai_connector"

    def get_rate(self):
        return settings.AI_CONNECTOR_RATE


@method_decorator(csrf_exempt, name="dispatch")
class CourseAuthoringMCPView(MCPServerStreamableHttpView):
    authentication_classes = [ConnectorTokenAuthentication]
    permission_classes = [HasConnectorAccess]
    throttle_classes = [ConnectorRateThrottle]

    def initial(self, request, *args, **kwargs):
        if not connector_enabled():
            raise Http404
        super().initial(request, *args, **kwargs)


def connector_page(view):
    """Hide account pages entirely (before any login redirect) while the connector is off."""

    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if not connector_enabled():
            raise Http404
        return view(request, *args, **kwargs)

    return wrapped


def _connections(user):
    AccessToken = get_access_token_model()
    RefreshToken = get_refresh_token_model()
    now = timezone.now()
    connections = {}

    def entry(application):
        return connections.setdefault(
            application.id,
            {
                "id": application.id,
                "name": application.name or "Unnamed AI app",
                "scopes": set(),
                "connectedAt": None,
                "lastActiveAt": None,
            },
        )

    for token in AccessToken.objects.filter(user=user, expires__gt=now, application__isnull=False).select_related("application"):
        item = entry(token.application)
        item["scopes"].update(token_scopes(token))
        item["connectedAt"] = min(filter(None, [item["connectedAt"], token.created]))
        item["lastActiveAt"] = max(filter(None, [item["lastActiveAt"], token.updated]))
    for token in RefreshToken.objects.filter(user=user, revoked__isnull=True, application__isnull=False).select_related(
        "application", "access_token"
    ):
        item = entry(token.application)
        if token.access_token_id:
            item["scopes"].update(token_scopes(token.access_token))
        item["connectedAt"] = min(filter(None, [item["connectedAt"], token.created]))
        item["lastActiveAt"] = max(filter(None, [item["lastActiveAt"], token.updated]))

    return [
        {
            **item,
            "scopes": [SCOPE_LABELS.get(scope, scope) for scope in sorted(item["scopes"])],
            "canWrite": "courses:write" in item["scopes"],
            "connectedAt": item["connectedAt"].isoformat() if item["connectedAt"] else None,
            "lastActiveAt": item["lastActiveAt"].isoformat() if item["lastActiveAt"] else None,
        }
        for item in sorted(connections.values(), key=lambda value: value["name"].lower())
    ]


@connector_page
@login_required
def connected_apps(request):
    return render(
        request,
        "Account/ConnectedApps",
        {
            "connections": _connections(request.user),
            "canConnect": can_use_connector(request.user),
            "connectorUrl": resource_url(request),
        },
    )


@connector_page
@login_required
@require_POST
def disconnect_app(request, application_id: int):
    AccessToken = get_access_token_model()
    RefreshToken = get_refresh_token_model()
    Grant = get_grant_model()
    user = request.user
    for token in RefreshToken.objects.filter(user=user, application_id=application_id, revoked__isnull=True):
        token.revoke()
    AccessToken.objects.filter(user=user, application_id=application_id).delete()
    Grant.objects.filter(user=user, application_id=application_id).delete()
    messages.success(request, "The AI app was disconnected. It can no longer read or change your courses.")
    return redirect("ai_connector:connected_apps")
