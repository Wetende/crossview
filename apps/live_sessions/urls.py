from django.urls import path

from . import views

app_name = "live_sessions"

urlpatterns = [
    path(
        "nodes/<int:node_id>/",
        views.ScheduledLearningSessionView.as_view(),
        name="session",
    ),
    path(
        "nodes/<int:node_id>/attendance/",
        views.SessionAttendanceView.as_view(),
        name="attendance",
    ),
    path(
        "nodes/<int:node_id>/attendance/<int:enrollment_id>/",
        views.SessionAttendanceOverrideView.as_view(),
        name="attendance-override",
    ),
]
