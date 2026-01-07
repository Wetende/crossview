"""
Progression app URLs - Student portal and Instructor dashboard routes.
Requirements: All student and instructor pages
"""

from django.urls import path
from . import views

app_name = "progression"

urlpatterns = [
    # Student Portal - Inertia pages
    path("student/programs/", views.program_list, name="student.programs"),
    path("student/programs/<int:pk>/", views.program_view, name="student.program"),
    path(
        "student/programs/<int:pk>/session/<int:node_id>/",
        views.session_viewer,
        name="student.session",
    ),
    # Assessment Results
    path(
        "student/assessments/",
        views.assessment_results,
        name="student.assessments",
    ),
    # Practicum
    path(
        "student/practicum/",
        views.practicum_history,
        name="student.practicum",
    ),
    path(
        "student/programs/<int:pk>/practicum/<int:node_id>/",
        views.practicum_upload,
        name="student.practicum.upload",
    ),
    # Certificates
    path(
        "student/certificates/",
        views.certificates_list,
        name="student.certificates",
    ),
    # Profile
    path(
        "student/profile/",
        views.profile_settings,
        name="student.profile",
    ),
    # ==========================================================================
    # Instructor Routes
    # ==========================================================================
    # Programs
    path(
        "instructor/programs/",
        views.instructor_programs,
        name="instructor.programs",
    ),
    path(
        "instructor/programs/<int:pk>/",
        views.instructor_program_detail,
        name="instructor.program",
    ),
    # Students
    path(
        "instructor/programs/<int:pk>/students/",
        views.instructor_students,
        name="instructor.students",
    ),
    path(
        "instructor/programs/<int:pk>/students/<int:enrollment_id>/",
        views.instructor_student_detail,
        name="instructor.student",
    ),
    # Gradebook
    path(
        "instructor/programs/<int:pk>/gradebook/",
        views.instructor_gradebook,
        name="instructor.gradebook",
    ),
    path(
        "instructor/programs/<int:pk>/gradebook/save/",
        views.instructor_gradebook_save,
        name="instructor.gradebook.save",
    ),
    path(
        "instructor/programs/<int:pk>/gradebook/publish/",
        views.instructor_gradebook_publish,
        name="instructor.gradebook.publish",
    ),
    # Practicum Review
    path(
        "instructor/practicum/",
        views.instructor_practicum_list,
        name="instructor.practicum",
    ),
    path(
        "instructor/practicum/<int:pk>/review/",
        views.instructor_practicum_review,
        name="instructor.practicum.review",
    ),
    # ==========================================================================
    # Admin Enrollment Management Routes
    # ==========================================================================
    path(
        "admin/enrollments/",
        views.admin_enrollments,
        name="admin.enrollments",
    ),
    path(
        "admin/enrollments/create/",
        views.admin_enrollment_create,
        name="admin.enrollment.create",
    ),
    path(
        "admin/enrollments/bulk/",
        views.admin_enrollment_bulk,
        name="admin.enrollment.bulk",
    ),
    path(
        "admin/enrollments/<int:pk>/withdraw/",
        views.admin_enrollment_withdraw,
        name="admin.enrollment.withdraw",
    ),
]
