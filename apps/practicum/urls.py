"""Practicum app URLs."""

from django.urls import path
from . import views

app_name = "practicum"

urlpatterns = [
    # REST API endpoints for file operations
    path(
        "api/v1/student/practicum/upload/",
        views.practicum_upload,
        name="student.practicum.upload.api",
    ),
    path(
        "api/v1/student/practicum/<int:pk>/download/",
        views.practicum_download,
        name="student.practicum.download.api",
    ),
]
