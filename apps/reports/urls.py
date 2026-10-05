from django.urls import path

from . import views

app_name = "reports"

urlpatterns = [
    path("admin/reports/", views.reports_index, {"scope": "admin"}, name="admin.index"),
    path(
        "admin/reports/<str:report_id>/print/",
        views.report_print,
        {"scope": "admin"},
        name="admin.print",
    ),
    path(
        "instructor/reports/",
        views.reports_index,
        {"scope": "instructor"},
        name="instructor.index",
    ),
    path(
        "instructor/reports/<str:report_id>/print/",
        views.report_print,
        {"scope": "instructor"},
        name="instructor.print",
    ),
    path(
        "student/reports/",
        views.reports_index,
        {"scope": "student"},
        name="student.index",
    ),
    path(
        "student/reports/<str:report_id>/print/",
        views.report_print,
        {"scope": "student"},
        name="student.print",
    ),
]
