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
]
