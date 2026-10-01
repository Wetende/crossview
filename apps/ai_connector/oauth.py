"""
OAuth for AI clients, built on Django OAuth Toolkit.

DOT supplies authorization, PKCE, tokens, rotation, revocation, RFC 8707
audience checks, dynamic client registration and discovery metadata. These
subclasses add the connector's rules: the feature flag, instructor-only
consent, an optional read-only grant, approved redirect hosts and rate limits.
"""

import json
from urllib.parse import urlparse

from django.conf import settings
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from oauth2_provider.views import (
    AuthorizationView,
    DynamicClientRegistrationManagementView,
    DynamicClientRegistrationView,
    OAuthProtectedResourceMetadataView,
    OAuthServerMetadataView,
    RevokeTokenView,
    TokenView,
)
from rest_framework.throttling import AnonRateThrottle

from .access import LEARNERS_SCOPE, MESSAGES_SCOPE, WRITE_SCOPE, can_use_connector, connector_enabled
from .content import base_url

LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1"}
ALLOWED_GRANT_TYPES = {"authorization_code", "refresh_token"}


def resource_url(request) -> str:
    return f"{base_url(request)}/mcp"


def resource_metadata_url(request) -> str:
    return f"{base_url(request)}/.well-known/oauth-protected-resource/mcp"


class FeatureFlagMixin:
    def dispatch(self, request, *args, **kwargs):
        if not connector_enabled():
            raise Http404
        return super().dispatch(request, *args, **kwargs)


class RegistrationThrottle(AnonRateThrottle):
    scope = "ai_connector_registration"

    def get_rate(self):
        return settings.AI_CONNECTOR_REGISTRATION_RATE

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


def redirect_uri_problem(uri) -> str | None:
    """Explain why a client redirect URI is not acceptable, or return None."""
    parsed = urlparse(str(uri))
    host = (parsed.hostname or "").lower()
    if parsed.username or parsed.password or parsed.fragment:
        return f"{uri} must not contain credentials or a fragment."
    if parsed.scheme == "http":
        return None if host in LOOPBACK_HOSTS else f"{uri}: http is only allowed for localhost."
    if parsed.scheme != "https" or not host:
        return f"{uri} must be an https URL."
    allowed = [item.lower() for item in settings.AI_CONNECTOR_ALLOWED_REDIRECT_HOSTS]
    if any(host == item or host.endswith(f".{item}") for item in allowed):
        return None
    return f"{host} is not an approved AI client for this connector."


def _registration_error(error, description, status=400):
    return JsonResponse({"error": error, "error_description": description}, status=status)


# The flag mixin overrides dispatch(), which drops DOT's csrf_exempt marking;
# these machine-to-machine endpoints must stay exempt.
@method_decorator(csrf_exempt, name="dispatch")
class ConnectorRegistrationView(FeatureFlagMixin, DynamicClientRegistrationView):
    """Open RFC 7591 registration limited to approved AI clients' redirect URIs."""

    def post(self, request, *args, **kwargs):
        throttle = RegistrationThrottle()
        if not throttle.allow_request(request, self):
            return _registration_error(
                "temporarily_unavailable", "Too many registrations; try again later.", status=429
            )
        try:
            data = json.loads(request.body or b"{}")
        except (json.JSONDecodeError, ValueError):
            data = None
        if isinstance(data, dict):
            redirect_uris = data.get("redirect_uris")
            if not isinstance(redirect_uris, list) or not redirect_uris:
                return _registration_error("invalid_redirect_uri", "At least one redirect_uri is required.")
            for uri in redirect_uris:
                problem = redirect_uri_problem(uri)
                if problem:
                    return _registration_error("invalid_redirect_uri", problem)
            grant_types = data.get("grant_types", ["authorization_code"])
            if not isinstance(grant_types, list) or not set(grant_types) <= ALLOWED_GRANT_TYPES:
                return _registration_error(
                    "invalid_client_metadata",
                    "Only the authorization_code and refresh_token grant types are supported.",
                )
            if any(value != "code" for value in data.get("response_types", ["code"]) or []):
                return _registration_error(
                    "invalid_client_metadata", "Only the 'code' response type is supported."
                )
        return super().post(request, *args, **kwargs)


@method_decorator(csrf_exempt, name="dispatch")
class ConnectorRegistrationManagementView(FeatureFlagMixin, DynamicClientRegistrationManagementView):
    """RFC 7592 read and delete only; updates could bypass redirect checks."""

    http_method_names = ["get", "delete", "options"]


class ConnectorAuthorizationView(FeatureFlagMixin, AuthorizationView):
    template_name = "ai_connector/authorize.html"

    def _not_allowed(self, request):
        return render(request, "ai_connector/authorize_denied.html", status=403)

    def get(self, request, *args, **kwargs):
        if not can_use_connector(request.user):
            return self._not_allowed(request)
        if request.GET.get("code_challenge_method", "S256") != "S256":
            # DOT also refuses to issue a code; stop before showing consent.
            return self._request_error(request, "invalid_request", 'Use the "S256" PKCE method.')
        # Bind every grant, and so every token, to this server's MCP endpoint
        # (RFC 8707). Clients that omit the resource get it added here.
        expected = resource_url(request)
        resources = request.GET.getlist("resource")
        if not resources:
            query = request.GET.copy()
            query.setlist("resource", [expected])
            return redirect(f"{request.path}?{query.urlencode()}")
        if any(value.rstrip("/") != expected for value in resources):
            return self._request_error(
                request, "invalid_target", f"This server only issues access for {expected}."
            )
        return super().get(request, *args, **kwargs)

    def _request_error(self, request, error, description):
        return render(
            request,
            self.template_name,
            {"error": {"error": error, "description": description}},
            status=400,
        )

    def post(self, request, *args, **kwargs):
        if not can_use_connector(request.user):
            return self._not_allowed(request)
        return super().post(request, *args, **kwargs)

    def form_valid(self, form):
        # The resource travels in a hidden field; never let an edited form
        # produce an unbound grant.
        expected = resource_url(self.request)
        resources = str(form.cleaned_data.get("resource") or "").split()
        if not resources or any(value.rstrip("/") != expected for value in resources):
            form.cleaned_data["resource"] = expected
        scopes = form.cleaned_data.get("scope", "").split()
        if WRITE_SCOPE in scopes and not self.request.POST.get("allow_write"):
            scopes.remove(WRITE_SCOPE)
        expanded_enabled = getattr(settings, "AI_CONNECTOR_V2_ENABLED", False)
        if LEARNERS_SCOPE in scopes and (not expanded_enabled or not self.request.POST.get("allow_learners")):
            scopes.remove(LEARNERS_SCOPE)
        if MESSAGES_SCOPE in scopes and (not expanded_enabled or not self.request.POST.get("allow_messages")):
            scopes.remove(MESSAGES_SCOPE)
        form.cleaned_data["scope"] = " ".join(scopes)
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        redirect_uri = kwargs.get("redirect_uri") or ""
        context["redirect_host"] = urlparse(redirect_uri).hostname or ""
        scopes = kwargs.get("scopes") or []
        context["requests_write"] = WRITE_SCOPE in scopes
        expanded_enabled = getattr(settings, "AI_CONNECTOR_V2_ENABLED", False)
        context["requests_learners"] = expanded_enabled and LEARNERS_SCOPE in scopes
        context["requests_messages"] = expanded_enabled and MESSAGES_SCOPE in scopes
        return context


@method_decorator(csrf_exempt, name="dispatch")
class ConnectorTokenView(FeatureFlagMixin, TokenView):
    pass


@method_decorator(csrf_exempt, name="dispatch")
class ConnectorRevokeTokenView(FeatureFlagMixin, RevokeTokenView):
    pass


class ConnectorServerMetadataView(FeatureFlagMixin, OAuthServerMetadataView):
    pass


class ConnectorResourceMetadataView(FeatureFlagMixin, OAuthProtectedResourceMetadataView):
    """RFC 9728 metadata for the MCP endpoint, served at the root and /mcp path forms."""

    def get_resource(self, request):
        return resource_url(request)
