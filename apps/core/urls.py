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
]
