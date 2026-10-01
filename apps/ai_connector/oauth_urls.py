"""
OAuth routes for AI clients.

Django OAuth Toolkit reverses these names inside the ``oauth2_provider``
namespace when it builds metadata and registration responses, so the namespace
is kept even though only the connector's endpoints are mounted. DOT's
application-management and token-list pages are deliberately not exposed.
"""

from django.urls import path

from . import oauth

app_name = "oauth2_provider"

urlpatterns = [
    path(
        ".well-known/oauth-authorization-server",
        oauth.ConnectorServerMetadataView.as_view(),
        name="oauth-server-metadata",
    ),
    path(
        ".well-known/oauth-protected-resource",
        oauth.ConnectorResourceMetadataView.as_view(),
        name="oauth-resource-metadata",
    ),
    path(
        ".well-known/oauth-protected-resource/mcp",
        oauth.ConnectorResourceMetadataView.as_view(),
        name="oauth-resource-metadata-mcp",
    ),
    path("o/authorize/", oauth.ConnectorAuthorizationView.as_view(), name="authorize"),
    path("o/token/", oauth.ConnectorTokenView.as_view(), name="token"),
    path("o/revoke_token/", oauth.ConnectorRevokeTokenView.as_view(), name="revoke-token"),
    path("o/register/", oauth.ConnectorRegistrationView.as_view(), name="dcr-register"),
    path(
        "o/register/<str:client_id>/",
        oauth.ConnectorRegistrationManagementView.as_view(),
        name="dcr-register-management",
    ),
]
