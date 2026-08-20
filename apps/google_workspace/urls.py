from django.urls import path
from . import views

app_name = "google_workspace"
urlpatterns = [
    path("connection/", views.GoogleWorkspaceConnectionView.as_view(), name="connection"),
    path("oauth/callback/", views.oauth_callback, name="oauth-callback"),
    path("meet-settings/", views.GoogleMeetSettingsView.as_view(), name="meet-settings"),
]
