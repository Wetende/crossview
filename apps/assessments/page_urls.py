"""Question library page URLs."""
from django.urls import path

from . import views_pages

app_name = "question_library"

urlpatterns = [
    path(
        "instructor/question-library/",
        views_pages.instructor_question_library,
        name="instructor",
    ),
    path(
        "admin/question-banks/",
        views_pages.admin_question_banks,
        name="admin",
    ),
]
