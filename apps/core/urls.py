"""
Core app URLs - Public pages and authentication.
Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1
"""

from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    # Public pages
    path("", views.landing_page, name="landing"),
    path(
        "verify-certificate/", views.verify_certificate_page, name="verify_certificate"
    ),
    path("about/", views.about_page, name="about"),
    path("contact/", views.contact_page, name="contact"),
    path("programs/", views.public_programs_list, name="programs"),
    # Authentication
    path("login/", views.login_page, name="login"),
    path("register/", views.register_page, name="register"),
    path("logout/", views.logout_view, name="logout"),
    path("forgot-password/", views.forgot_password_page, name="forgot_password"),
    path(
        "reset-password/<str:uidb64>/<str:token>/",
        views.reset_password_page,
        name="reset_password",
    ),
    # Dashboard (authenticated)
    path("dashboard/", views.dashboard, name="dashboard"),
    # Admin Program Management
    path("admin/programs/", views.admin_programs, name="admin.programs"),
    path(
        "admin/programs/create/",
        views.admin_program_create,
        name="admin.program.create",
    ),
    path("admin/programs/<int:pk>/", views.admin_program_detail, name="admin.program"),
    path(
        "admin/programs/<int:pk>/edit/",
        views.admin_program_edit,
        name="admin.program.edit",
    ),
    path(
        "admin/programs/<int:pk>/delete/",
        views.admin_program_delete,
        name="admin.program.delete",
    ),
    path(
        "admin/programs/<int:pk>/publish/",
        views.admin_program_publish,
        name="admin.program.publish",
    ),
    # Admin User Management
    path("admin/users/", views.admin_users, name="admin.users"),
    path("admin/users/create/", views.admin_user_create, name="admin.user.create"),
    path("admin/users/<int:pk>/edit/", views.admin_user_edit, name="admin.user.edit"),
    path(
        "admin/users/<int:pk>/deactivate/",
        views.admin_user_deactivate,
        name="admin.user.deactivate",
    ),
    path(
        "admin/users/<int:pk>/reset-password/",
        views.admin_user_reset_password,
        name="admin.user.reset_password",
    ),
    path(
        "admin/users/<int:pk>/delete/",
        views.admin_user_delete,
        name="admin.user.delete",
    ),
    # Admin Instructor Applications
    path(
        "admin/instructor-applications/",
        views.admin_instructor_applications,
        name="admin.instructor_applications",
    ),
    path(
        "admin/instructor-applications/<int:pk>/",
        views.admin_instructor_application_detail,
        name="admin.instructor_application",
    ),
    path(
        "admin/instructor-applications/<int:pk>/approve/",
        views.admin_instructor_application_approve,
        name="admin.instructor_application.approve",
    ),
    path(
        "admin/instructor-applications/<int:pk>/reject/",
        views.admin_instructor_application_reject,
        name="admin.instructor_application.reject",
    ),
    path(
        "admin/instructor-applications/<int:pk>/unlock/",
        views.admin_instructor_application_unlock,
        name="admin.instructor_application.unlock",
    ),
    # Admin Course Approval
    path("admin/course-approval/", views.admin_course_approval_queue, name="admin.course_approval"),
    path("admin/course-approval/<int:program_id>/", views.admin_course_review, name="admin.course_review"),
    path("admin/course-approval/<int:program_id>/approve/", views.admin_course_approve, name="admin.course_approve"),
    path("admin/course-approval/<int:program_id>/request-changes/", views.admin_course_request_changes, name="admin.course_request_changes"),
    path("admin/course-approval/<int:program_id>/preview/", views.admin_preview_as_student, name="admin.preview_as_student"),
    # Instructor Views
    path("instructor/apply/", views.instructor_apply, name="instructor.apply"),
    path("instructor/programs/", views.instructor_programs, name="instructor.programs"),
    path("instructor/programs/<int:pk>/", views.instructor_program_detail, name="instructor.program"),
    # Course Manager (Builder)
    path("instructor/programs/<int:pk>/manage/", views.instructor_program_manage, name="instructor.program_manage"),
    path("instructor/programs/<int:pk>/manage/settings/", views.instructor_program_update_settings, name="instructor.program_update_settings"),
    path("instructor/programs/<int:program_id>/nodes/create/", views.instructor_node_create, name="instructor.node_create"),
    path("instructor/programs/<int:program_id>/nodes/reorder/", views.instructor_node_reorder, name="instructor.node_reorder"),
    path("instructor/nodes/<int:node_id>/update/", views.instructor_node_update, name="instructor.node_update"),
    path("instructor/nodes/<int:node_id>/delete/", views.instructor_node_delete, name="instructor.node_delete"),
    
    path("instructor/programs/<int:program_id>/submit/", views.instructor_program_submit_for_review, name="instructor.program_submit"),
    path("instructor/programs/<int:program_id>/publish/", views.instructor_program_publish, name="instructor.program_publish"),
    path("instructor/programs/<int:program_id>/change-requests/", views.instructor_program_change_requests, name="instructor.program_change_requests"),
    path("instructor/change-requests/<int:change_request_id>/resolve/", views.instructor_resolve_change_request, name="instructor.resolve_change_request"),
    path("instructor/students/", views.instructor_students, name="instructor.students"),
    path("instructor/students/<int:pk>/", views.instructor_student_detail, name="instructor.student"),
    path("instructor/enrollments/<int:enrollment_id>/status/", views.instructor_enrollment_status, name="instructor.enrollment_status"),
    path("instructor/gradebook/", views.instructor_gradebook, name="instructor.gradebook"),
    path("instructor/programs/<int:pk>/gradebook/", views.instructor_program_gradebook, name="instructor.program_gradebook"),
    path("instructor/programs/<int:pk>/gradebook/save/", views.instructor_program_gradebook_save, name="instructor.program_gradebook_save"),
    path("instructor/gradebook/<int:enrollment_id>/", views.instructor_grade_entry, name="instructor.grade_entry"),
    path("instructor/content/", views.instructor_content, name="instructor.content"),
    path("instructor/content/<int:node_id>/edit/", views.instructor_content_edit, name="instructor.content_edit"),
    path("instructor/announcements/", views.instructor_announcements, name="instructor.announcements"),
    path("instructor/announcements/create/", views.instructor_announcement_create, name="instructor.announcement_create"),
    # Instructor Quiz Management
    path("instructor/lesson/<int:node_id>/quizzes/", views.instructor_quizzes, name="instructor.quizzes"),
    path("instructor/lesson/<int:node_id>/quizzes/create/", views.instructor_quiz_create, name="instructor.quiz_create"),
    path("instructor/quizzes/<int:quiz_id>/edit/", views.instructor_quiz_edit, name="instructor.quiz_edit"),
    path("instructor/quizzes/<int:quiz_id>/delete/", views.instructor_quiz_delete, name="instructor.quiz_delete"),
    # Instructor Assignment Management
    path("instructor/programs/<int:program_id>/assignments/", views.instructor_assignments, name="instructor.assignments"),
    path("instructor/programs/<int:program_id>/assignments/create/", views.instructor_assignment_create, name="instructor.assignment_create"),
    path("instructor/assignments/<int:assignment_id>/edit/", views.instructor_assignment_edit, name="instructor.assignment_edit"),
    path("instructor/assignments/<int:assignment_id>/submissions/", views.instructor_assignment_submissions, name="instructor.assignment_submissions"),
    path("instructor/submissions/<int:submission_id>/grade/", views.instructor_assignment_grade, name="instructor.assignment_grade"),
    # Student Quiz Taking
    path("student/quiz/<int:quiz_id>/", views.student_quiz_start, name="student.quiz_start"),
    path("student/quiz/<int:quiz_id>/submit/", views.student_quiz_submit, name="student.quiz_submit"),
    path("student/quiz/<int:quiz_id>/results/", views.student_quiz_results, name="student.quiz_results"),
    # Student Assignments
    path("student/programs/<int:program_id>/assignments/", views.student_assignments, name="student.assignments"),
    path("student/assignment/<int:assignment_id>/", views.student_assignment_view, name="student.assignment"),
    path("student/assignment/<int:assignment_id>/submit/", views.student_assignment_submit, name="student.assignment_submit"),
]
