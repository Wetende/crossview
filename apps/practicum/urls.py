"""Practicum app URLs."""

from django.urls import path
from . import views
from . import views_admin

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
    
    # Rubric Management (Instructor + Admin)
    path("rubrics/", views_admin.rubrics_list, name="rubrics"),
    path("rubrics/create/", views_admin.rubric_create, name="rubric.create"),
    path("rubrics/<int:pk>/edit/", views_admin.rubric_edit, name="rubric.edit"),
    path("rubrics/<int:pk>/delete/", views_admin.rubric_delete, name="rubric.delete"),
]

