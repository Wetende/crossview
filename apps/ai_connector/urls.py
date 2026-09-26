from django.urls import path

from . import views

app_name = "ai_connector"

urlpatterns = [
    path("mcp", views.CourseAuthoringMCPView.as_view(), name="mcp"),
    path("mcp/", views.CourseAuthoringMCPView.as_view()),
    path("account/connected-apps/", views.connected_apps, name="connected_apps"),
    path(
        "account/connected-apps/<int:application_id>/disconnect/",
        views.disconnect_app,
        name="disconnect_app",
    ),
]
