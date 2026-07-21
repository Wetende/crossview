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
    path("programs/<slug:slug>/", views.public_program_detail, name="program_detail"),
    path("programs/<int:pk>/review/", views.program_review_submit, name="program_review_submit"),
    # Authentication
    path("login/", views.login_page, name="login"),
    path("register/", views.register_page, name="register"),
    path("auth/google/onetap/", views.google_one_tap_login, name="google_onetap_login"),
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
        "admin/programs/<int:program_id>/assign-instructors/",
        views.admin_program_assign_instructors,
        name="admin.program.assign_instructors",
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
    path(
        "admin/programs/<int:pk>/featured/",
        views.admin_program_toggle_featured,
        name="admin.program.featured",
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
    path("admin/reviews/", views.admin_reviews, name="admin.reviews"),
    path("admin/reviews/<int:review_id>/approve/", views.admin_review_approve, name="admin.review.approve"),
    path("admin/reviews/<int:review_id>/reject/", views.admin_review_reject, name="admin.review.reject"),
    # Admin Announcements
    path("admin/announcements/", views.admin_announcements_index, name="admin.announcements"),
    path("admin/announcements/create/", views.admin_announcement_create, name="admin.announcement_create"),
    path("admin/announcements/<int:pk>/delete/", views.admin_announcement_delete, name="admin.announcement_delete"),
    # Instructor Views
    path("instructor/", views.instructor_landing, name="instructor.landing"),
    path("instructor/programs/", views.instructor_programs, name="instructor.programs"),
    path(
        "instructor/programs/create/",
        views.instructor_program_create,
        name="instructor.program_create",
    ),
    path("instructor/programs/<int:pk>/", views.instructor_program_detail, name="instructor.program"),
    path("instructor/programs/<int:pk>/preview/", views.instructor_program_preview, name="instructor.program_preview"),
    # Course Manager (Builder)
    path("instructor/programs/<int:pk>/manage/", views.instructor_program_manage, name="instructor.program_manage"),
    path("instructor/programs/<int:pk>/manage/settings/", views.instructor_program_update_settings, name="instructor.program_update_settings"),
    path("instructor/programs/<int:program_id>/nodes/create/", views.instructor_node_create, name="instructor.node_create"),
    path("instructor/programs/<int:program_id>/nodes/reorder/", views.instructor_node_reorder, name="instructor.node_reorder"),
    path("instructor/nodes/<int:node_id>/update/", views.instructor_node_update, name="instructor.node_update"),
    path("instructor/nodes/<int:node_id>/delete/", views.instructor_node_delete, name="instructor.node_delete"),
    path("instructor/nodes/<int:node_id>/files/upload/", views.instructor_lesson_file_upload, name="instructor.lesson_file_upload"),
    path("instructor/nodes/<int:node_id>/files/delete/", views.instructor_lesson_file_delete, name="instructor.lesson_file_delete"),
    path(
        "instructor/nodes/<int:node_id>/document/upload/",
        views.instructor_lesson_document_upload,
        name="instructor.lesson_document_upload",
    ),
    path(
        "instructor/nodes/<int:node_id>/document/delete/",
        views.instructor_lesson_document_delete,
        name="instructor.lesson_document_delete",
    ),
    path(
        "instructor/nodes/<int:node_id>/images/upload/",
        views.instructor_lesson_image_upload,
        name="instructor.lesson_image_upload",
    ),
    path(
        "instructor/nodes/<int:node_id>/quiz/images/upload/",
        views.instructor_quiz_image_upload,
        name="instructor.quiz_image_upload",
    ),
    # Material Import/Clone (Feature 3B)
    path("instructor/programs/<int:program_id>/materials/search/", views.instructor_material_search, name="instructor.material_search"),
    path("instructor/programs/<int:program_id>/materials/import/", views.instructor_material_import, name="instructor.material_import"),
    # Q&A Tab Integration (Feature 3C)
    path("instructor/nodes/<int:node_id>/discussions/", views.instructor_node_discussions, name="instructor.node_discussions"),
    path("instructor/nodes/<int:node_id>/discussions/create/", views.instructor_discussion_create, name="instructor.discussion_create"),
    path("instructor/discussions/<int:discussion_id>/toggle-pin/", views.instructor_discussion_toggle_pin, name="instructor.discussion_toggle_pin"),
    path("instructor/discussions/<int:discussion_id>/toggle-lock/", views.instructor_discussion_toggle_lock, name="instructor.discussion_toggle_lock"),
    path("instructor/discussions/reply/", views.instructor_discussion_reply, name="instructor.discussion_reply"),
    path("instructor/programs/<int:program_id>/validate/", views.instructor_program_validate, name="instructor.program_validate"),
    path("instructor/programs/<int:program_id>/publish/", views.instructor_program_publish, name="instructor.program_publish"),
    path("instructor/programs/<int:program_id>/unpublish/", views.instructor_program_unpublish, name="instructor.program_unpublish"),
    path("instructor/students/", views.instructor_students, name="instructor.students"),
    path("instructor/students/<int:pk>/", views.instructor_student_detail, name="instructor.student"),
    path("instructor/enrollments/<int:enrollment_id>/status/", views.instructor_enrollment_status, name="instructor.enrollment_status"),
    path("instructor/gradebook/", views.instructor_gradebook, name="instructor.gradebook"),
    path("instructor/programs/<int:pk>/gradebook/", views.instructor_program_gradebook, name="instructor.program_gradebook"),
    path("instructor/programs/<int:pk>/gradebook/save/", views.instructor_program_gradebook_save, name="instructor.program_gradebook_save"),
    path("instructor/gradebook/<int:enrollment_id>/", views.instructor_grade_entry, name="instructor.grade_entry"),
    # Instructor Announcements
    path("instructor/announcements/", views.instructor_announcements_index, name="instructor.announcements"),
    path("instructor/announcements/create/", views.instructor_announcement_create, name="instructor.announcement_create"),
    path("instructor/announcements/<int:pk>/delete/", views.instructor_announcement_delete, name="instructor.announcement_delete"),
    # Instructor Assignment Management
    path("instructor/assignments/", views.instructor_assignments_global, name="instructor.assignments_global"),
    path("instructor/programs/<int:program_id>/assignments/", views.instructor_assignments, name="instructor.assignments"),
    path("instructor/assignments/<int:assignment_id>/submissions/", views.instructor_assignment_submissions, name="instructor.assignment_submissions"),
    path("instructor/submissions/<int:submission_id>/grade/", views.instructor_assignment_grade, name="instructor.assignment_grade"),
    # Student Quiz Taking
    path("student/quiz/<int:quiz_id>/", views.student_quiz_start, name="student.quiz_start"),
    path("student/quiz/<int:quiz_id>/save/", views.student_quiz_save, name="student.quiz_save"),
    path("student/quiz/<int:quiz_id>/submit/", views.student_quiz_submit, name="student.quiz_submit"),
    path("student/quiz/<int:quiz_id>/results/", views.student_quiz_results, name="student.quiz_results"),
    # Student Assignments
    path("student/assignment/<int:assignment_id>/", views.student_assignment_view, name="student.assignment"),
    path("student/assignment/<int:assignment_id>/submit/", views.student_assignment_submit, name="student.assignment_submit"),
]
