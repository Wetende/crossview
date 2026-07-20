from django.urls import path

from . import views


app_name = "google_workspace"

urlpatterns = [
    path("connection/", views.ClassroomConnectionView.as_view(), name="connection"),
    path("oauth/callback/", views.oauth_callback, name="oauth-callback"),
]
