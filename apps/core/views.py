"""
Core views - Public pages and authentication.
Requirements: 1.1-1.4, 2.1-2.6, 3.1-3.6, 4.1-4.5, 5.1-5.6, 6.1-6.6
"""

from datetime import datetime
from typing import Optional

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from inertia import render

from apps.core.models import User
from apps.tenants.models import SubscriptionTier
from apps.certifications.models import Certificate, VerificationLog


def get_dashboard_url(role: str) -> str:
    """Get dashboard URL based on user role. Requirement: 2.2"""
    role_dashboards = {
        "superadmin": "/admin/dashboard/",
        "admin": "/admin/dashboard/",
        "instructor": "/instructor/dashboard/",
        "student": "/student/dashboard/",
    }
    return role_dashboards.get(role, "/student/dashboard/")


def _get_user_role(user: User) -> str:
    """Determine user role for dashboard redirect."""
    if user.is_superuser:
        return "superadmin"
    if user.is_staff:
        return "admin"
    if hasattr(user, "groups") and user.groups.filter(name="Instructors").exists():
        return "instructor"
    return "student"


# =============================================================================
# Public Pages
# =============================================================================


def landing_page(request):
    """
    Platform landing page with subscription tiers.
    Requirements: 1.1, 1.2, 1.3
    """
    tiers = SubscriptionTier.objects.filter(is_active=True).values(
        "id",
        "name",
        "code",
        "price_monthly",
        "max_students",
        "max_programs",
        "max_storage_mb",
        "features",
    )
    return render(
        request,
        "Public/Landing",
        {
            "tiers": list(tiers),
        },
    )


def verify_certificate_page(request):
    """
    Certificate verification page.
    Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
    """
    result = None

    if request.method == "POST":
        serial_number = request.POST.get("serial_number", "").strip().upper()

        if serial_number:
            # Look up certificate
            certificate = (
                Certificate.objects.filter(serial_number=serial_number)
                .select_related("enrollment")
                .first()
            )

            # Determine result
            if certificate:
                result = {
                    "found": True,
                    "certificate": {
                        "serialNumber": certificate.serial_number,
                        "studentName": certificate.student_name,
                        "programTitle": certificate.program_title,
                        "completionDate": certificate.completion_date.isoformat(),
                        "issueDate": certificate.issue_date.isoformat(),
                        "isRevoked": certificate.is_revoked,
                        "revokedAt": (
                            certificate.revoked_at.isoformat()
                            if certificate.revoked_at
                            else None
                        ),
                    },
                }
                log_result = "revoked" if certificate.is_revoked else "valid"
            else:
                result = {"found": False}
                log_result = "not_found"

            # Log verification attempt (Requirement: 5.5)
            VerificationLog.objects.create(
                certificate=certificate,
                serial_number_queried=serial_number,
                ip_address=_get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                result=log_result,
                verified_at=timezone.now(),
            )

    return render(
        request,
        "Public/VerifyCertificate",
        {
            "result": result,
        },
    )


def _get_client_ip(request) -> Optional[str]:
    """Extract client IP from request."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


# =============================================================================
# Authentication Views
# =============================================================================


def login_page(request):
    """
    Login page with form handling.
    Requirements: 2.1, 2.2, 2.3, 2.5, 2.6
    """
    # Redirect if already authenticated
    if request.user.is_authenticated:
        role = _get_user_role(request.user)
        return redirect(get_dashboard_url(role))

    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")
        remember = request.POST.get("remember") == "true"

        # Authenticate user
        user = authenticate(request, username=email, password=password)

        if user is not None:
            # Check tenant match if on tenant subdomain
            tenant = getattr(request, "tenant", None)
            if tenant and user.tenant_id != tenant.id:
                # User doesn't belong to this tenant - same error for security
                return render(
                    request,
                    "Auth/Login",
                    {
                        "errors": {"auth": "Invalid email or password"},
                        "registrationEnabled": _get_registration_enabled(request),
                    },
                )

            login(request, user)

            # Set session expiry based on remember me
            if not remember:
                request.session.set_expiry(0)  # Browser close

            # Role-based redirect (Requirement: 2.2)
            role = _get_user_role(user)
            return redirect(get_dashboard_url(role))

        # Invalid credentials - same message for security (Requirement: 2.3)
        return render(
            request,
            "Auth/Login",
            {
                "errors": {"auth": "Invalid email or password"},
                "registrationEnabled": _get_registration_enabled(request),
            },
        )

    return render(
        request,
        "Auth/Login",
        {
            "registrationEnabled": _get_registration_enabled(request),
        },
    )


def register_page(request):
    """
    Registration page with form handling.
    Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
    """
    # Redirect if already authenticated
    if request.user.is_authenticated:
        role = _get_user_role(request.user)
        return redirect(get_dashboard_url(role))

    # Check if registration is enabled (Requirement: 3.5)
    registration_enabled = _get_registration_enabled(request)
    if not registration_enabled:
        return render(
            request,
            "Auth/Register",
            {
                "registrationEnabled": False,
            },
        )

    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()
        password = request.POST.get("password", "")
        password_confirm = request.POST.get("password_confirm", "")
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()

        errors = {}

        # Validate email uniqueness (Requirement: 3.3)
        if User.objects.filter(email=email).exists():
            errors["email"] = "Email already registered"

        # Validate password match
        if password != password_confirm:
            errors["password_confirm"] = "Passwords do not match"

        # Validate password strength (Requirement: 3.4)
        password_errors = _validate_password_strength(password)
        if password_errors:
            errors["password"] = password_errors

        # Validate required fields
        if not email:
            errors["email"] = "Email is required"
        if not first_name:
            errors["first_name"] = "First name is required"
        if not last_name:
            errors["last_name"] = "Last name is required"

        if errors:
            return render(
                request,
                "Auth/Register",
                {
                    "errors": errors,
                    "registrationEnabled": True,
                },
            )

        # Create user with student role (Requirement: 3.2)
        tenant = getattr(request, "tenant", None)
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            tenant=tenant,
        )

        # Log in the new user
        login(request, user)
        messages.success(request, "Account created successfully!")

        return redirect(get_dashboard_url("student"))

    return render(
        request,
        "Auth/Register",
        {
            "registrationEnabled": True,
        },
    )


def forgot_password_page(request):
    """
    Forgot password page - sends reset email.
    Requirements: 4.1, 4.2
    """
    if request.user.is_authenticated:
        return redirect("/")

    if request.method == "POST":
        email = request.POST.get("email", "").strip().lower()

        # Always show success message to prevent email enumeration (Requirement: 4.2)
        success_message = "If an account exists with this email, you will receive a password reset link."

        if email:
            user = User.objects.filter(email=email).first()
            if user:
                # Generate reset token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                # Send reset email (simplified - would use proper email template)
                reset_url = f"{request.scheme}://{request.get_host()}/reset-password/{uid}/{token}/"
                send_mail(
                    subject="Password Reset Request",
                    message=f"Click here to reset your password: {reset_url}",
                    from_email=None,  # Uses DEFAULT_FROM_EMAIL
                    recipient_list=[email],
                    fail_silently=True,
                )

        return render(
            request,
            "Auth/ForgotPassword",
            {
                "success": success_message,
            },
        )

    return render(request, "Auth/ForgotPassword", {})


def reset_password_page(request, uidb64: str, token: str):
    """
    Reset password page - validates token and resets password.
    Requirements: 4.3, 4.4, 4.5
    """
    if request.user.is_authenticated:
        return redirect("/")

    # Validate token
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is None or not default_token_generator.check_token(user, token):
        return render(
            request,
            "Auth/ResetPassword",
            {
                "errors": {"token": "Invalid or expired reset link"},
                "tokenValid": False,
            },
        )

    if request.method == "POST":
        password = request.POST.get("password", "")
        password_confirm = request.POST.get("password_confirm", "")

        errors = {}

        if password != password_confirm:
            errors["password_confirm"] = "Passwords do not match"

        password_errors = _validate_password_strength(password)
        if password_errors:
            errors["password"] = password_errors

        if errors:
            return render(
                request,
                "Auth/ResetPassword",
                {
                    "errors": errors,
                    "tokenValid": True,
                },
            )

        # Reset password (Requirement: 4.5)
        user.set_password(password)
        user.save()

        messages.success(request, "Password reset successfully. Please log in.")
        return redirect("/login/")

    return render(
        request,
        "Auth/ResetPassword",
        {
            "tokenValid": True,
        },
    )


def logout_view(request):
    """Log out the current user."""
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect("/login/")


# =============================================================================
# Dashboard Views
# =============================================================================


@login_required
def home(request):
    """Home page - redirects to appropriate dashboard."""
    role = _get_user_role(request.user)
    return redirect(get_dashboard_url(role))


@login_required
def dashboard(request):
    """Dashboard page."""
    return render(
        request,
        "Dashboard",
        props={
            "stats": {
                "programs": 12,
                "students": 156,
                "certificates": 45,
                "completionRate": 78,
            }
        },
    )


# =============================================================================
# Helper Functions
# =============================================================================


def _get_registration_enabled(request) -> bool:
    """Check if registration is enabled for current tenant."""
    tenant = getattr(request, "tenant", None)
    if tenant:
        return tenant.settings.get("registration_enabled", True)
    return True  # Default enabled for main domain


def _validate_password_strength(password: str) -> Optional[str]:
    """
    Validate password meets strength requirements.
    Requirement: 3.4

    Returns error message if invalid, None if valid.
    """
    if len(password) < 8:
        return "Password must be at least 8 characters"

    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)

    if not (has_upper and has_lower and has_digit):
        return "Password must contain uppercase, lowercase, and a number"

    return None
