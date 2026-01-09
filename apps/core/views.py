"""
Core views - Public pages and authentication.
Requirements: 1.1-1.4, 2.1-2.6, 3.1-3.6, 4.1-4.5, 5.1-5.6, 6.1-6.6
"""

import json
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

from apps.core.models import User, Program
from apps.certifications.models import Certificate, VerificationLog


def _get_post_data(request) -> dict:
    """
    Get POST data from request, handling both form-encoded and JSON data.
    Inertia.js sends data as JSON, so we need to parse request.body.
    """
    # First try request.POST (form-encoded data)
    if request.POST:
        return request.POST.dict()

    # If empty, try parsing JSON from request.body (Inertia sends JSON)
    if request.body:
        try:
            return json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            pass

    return {}


def get_dashboard_url(role: str) -> str:
    """Get dashboard URL based on user role. Requirement: 2.2"""
    # All roles use the unified dashboard
    return "/dashboard/"


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
    Platform landing page with programs showcase.
    Requirements: 1.1, 1.2, 1.3
    """
    from apps.progression.models import Enrollment
    from django.db.models import Count
    
    # Get top 6 published programs with enrollment counts
    programs = Program.objects.filter(is_published=True).order_by('-created_at')[:6]
    
    enrollment_counts = dict(
        Enrollment.objects.filter(program__is_published=True)
        .values("program_id")
        .annotate(count=Count("id"))
        .values_list("program_id", "count")
    )
    
    programs_data = [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code or "",
            "description": p.description or "",
            "enrollmentCount": enrollment_counts.get(p.id, 0),
        }
        for p in programs
    ]
    
    # Get stats for the stats section
    total_programs = Program.objects.filter(is_published=True).count()
    total_students = Enrollment.objects.values('user').distinct().count()
    
    return render(
        request,
        "Public/Landing",
        {
            "programs": programs_data,
            "stats": {
                "programCount": total_programs,
                "studentCount": total_students,
            },
        },
    )


def about_page(request):
    """About page explaining the platform philosophy."""
    return render(request, "Public/About")


def contact_page(request):
    """Contact page with inquiry form."""
    if request.method == "POST":
        # Handle contact form submission
        data = _get_post_data(request)
        # In a real app, send email or save inquiry
        messages.success(
            request, "Thank you for your message. We will contact you shortly."
        )
        return redirect("contact")

    return render(request, "Public/Contact")


def public_programs_list(request):
    """
    Public catalog of published programs.
    """
    from apps.progression.models import Enrollment, EnrollmentRequest
    
    # Base query
    programs_query = Program.objects.filter(is_published=True)

    # Search filtering
    search = request.GET.get("search", "")
    if search:
        programs_query = programs_query.filter(name__icontains=search)

    programs = programs_query.values(
        "id", "name", "code", "description", "created_at"
    ).order_by("name")

    # Get user enrollment data if authenticated
    user_enrollments = []
    user_pending_requests = []
    if request.user.is_authenticated:
        user_enrollments = list(
            Enrollment.objects.filter(user=request.user).values_list("program_id", flat=True)
        )
        user_pending_requests = list(
            EnrollmentRequest.objects.filter(
                user=request.user, status="pending"
            ).values_list("program_id", flat=True)
        )

    return render(
        request,
        "Public/Programs",
        {
            "programs": list(programs),
            "filters": {"search": search},
            "userEnrollments": user_enrollments,
            "userPendingRequests": user_pending_requests,
        },
    )


def verify_certificate_page(request):
    """
    Certificate verification page.
    """
    result = None

    if request.method == "POST":
        # Get POST data (handles both form-encoded and JSON from Inertia)
        data = _get_post_data(request)
        serial_number = data.get("serial_number", "").strip().upper()

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

            # Log verification attempt
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
    """
    # Redirect if already authenticated
    if request.user.is_authenticated:
        role = _get_user_role(request.user)
        return redirect(get_dashboard_url(role))

    if request.method == "POST":
        # Get POST data (handles both form-encoded and JSON from Inertia)
        data = _get_post_data(request)
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        remember = data.get("remember") in (True, "true", "True", "1")

        # Authenticate user
        user = authenticate(request, username=email, password=password)

        if user is not None:
            login(request, user)

            # Set session expiry based on remember me
            if not remember:
                request.session.set_expiry(0)  # Browser close

            # Role-based redirect (Requirement: 2.2)
            role = _get_user_role(user)
            return redirect(get_dashboard_url(role))

        # Check if user exists but is inactive (pending approval)
        try:
            existing_user = User.objects.get(email=email)
            if not existing_user.is_active:
                # User exists but is inactive - likely pending approval
                return render(
                    request,
                    "Auth/Login",
                    {
                        "errors": {"auth": "Your account is pending approval. Please wait for an administrator to activate your account."},
                        "registrationEnabled": _get_registration_enabled(request),
                    },
                )
        except User.DoesNotExist:
            pass

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
        # Get POST data (handles both form-encoded and JSON from Inertia)
        data = _get_post_data(request)
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        password_confirm = data.get("password_confirm", "")
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        role = data.get("role", "student")  # student or instructor

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

        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        if role == "instructor":
            # Add to Instructors group but mark as inactive (pending approval)
            from django.contrib.auth.models import Group
            instructors_group, _ = Group.objects.get_or_create(name="Instructors")
            user.groups.add(instructors_group)
            user.is_active = False  # Requires admin approval
            user.save()
            messages.info(
                request,
                "Your instructor application has been submitted. "
                "An administrator will review your request."
            )
            return redirect("/login/")
        else:
            # Student - immediate login
            login(request, user, backend="apps.core.backends.EmailBackend")
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
    """
    if request.user.is_authenticated:
        return redirect("/")

    if request.method == "POST":
        # Get POST data (handles both form-encoded and JSON from Inertia)
        data = _get_post_data(request)
        email = data.get("email", "").strip().lower()

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
        # Get POST data (handles both form-encoded and JSON from Inertia)
        data = _get_post_data(request)
        password = data.get("password", "")
        password_confirm = data.get("password_confirm", "")

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
    """
    Unified dashboard - shows different content based on user role.
    Roles: student, instructor, admin, superadmin
    """
    user = request.user
    role = _get_user_role(user)

    # Build props based on role
    props = {"role": role}

    if role == "superadmin":
        props.update(_get_superadmin_dashboard_data())
    elif role == "admin":
        props.update(_get_admin_dashboard_data(user))
    elif role == "instructor":
        props.update(_get_instructor_dashboard_data(user))
    else:  # student
        props.update(_get_student_dashboard_data(user))

    return render(request, "Dashboard", props)


def _get_student_dashboard_data(user) -> dict:
    """Get dashboard data for students."""
    from apps.progression.models import Enrollment, NodeCompletion
    from apps.curriculum.models import CurriculumNode

    # Get active enrollments with progress
    enrollments = Enrollment.objects.filter(
        user=user, status__in=["active", "completed"]
    ).select_related("program", "program__blueprint")

    enrollment_data = []
    for enrollment in enrollments:
        total_nodes = CurriculumNode.objects.filter(
            program=enrollment.program, is_published=True, children__isnull=True
        ).count()
        completed_nodes = enrollment.completions.count()
        progress = (completed_nodes / total_nodes * 100) if total_nodes > 0 else 0

        enrollment_data.append(
            {
                "id": enrollment.id,
                "programId": enrollment.program.id,
                "programName": enrollment.program.name,
                "programCode": enrollment.program.code or "",
                "progressPercent": round(progress, 1),
                "status": enrollment.status,
            }
        )

    # Get recent activity
    recent_completions = (
        NodeCompletion.objects.filter(enrollment__user=user)
        .select_related("node", "enrollment__program")
        .order_by("-completed_at")[:5]
    )

    recent_activity = [
        {
            "nodeTitle": c.node.title,
            "programName": c.enrollment.program.name,
            "completedAt": c.completed_at.isoformat(),
        }
        for c in recent_completions
    ]

    return {
        "enrollments": enrollment_data,
        "recentActivity": recent_activity,
        "upcomingDeadlines": [],
    }


def _get_instructor_dashboard_data(user) -> dict:
    """Get dashboard data for instructors."""
    from apps.progression.models import Enrollment, InstructorAssignment
    from apps.practicum.models import PracticumSubmission
    from datetime import timedelta

    # Get assigned programs
    assignments = InstructorAssignment.objects.filter(instructor=user)
    program_ids = list(assignments.values_list("program_id", flat=True))

    # Calculate stats
    total_students = Enrollment.objects.filter(
        program_id__in=program_ids, status="active"
    ).count()

    pending_reviews = PracticumSubmission.objects.filter(
        enrollment__program_id__in=program_ids, status="pending"
    ).count()

    total_enrollments = Enrollment.objects.filter(program_id__in=program_ids).count()
    completed_enrollments = Enrollment.objects.filter(
        program_id__in=program_ids, status="completed"
    ).count()
    completion_rate = (
        (completed_enrollments / total_enrollments * 100)
        if total_enrollments > 0
        else 0
    )

    # Get recent submissions
    seven_days_ago = timezone.now() - timedelta(days=7)
    recent_submissions = (
        PracticumSubmission.objects.filter(
            enrollment__program_id__in=program_ids,
            status="pending",
            submitted_at__gte=seven_days_ago,
        )
        .select_related("enrollment__user", "enrollment__program", "node")
        .order_by("-submitted_at")[:5]
    )

    submissions_data = [
        {
            "id": s.id,
            "studentName": s.enrollment.user.get_full_name() or s.enrollment.user.email,
            "programName": s.enrollment.program.name,
            "nodeTitle": s.node.title,
        }
        for s in recent_submissions
    ]

    return {
        "stats": {
            "programCount": len(program_ids),
            "totalStudents": total_students,
            "pendingReviews": pending_reviews,
            "completionRate": round(completion_rate, 1),
        },
        "recentSubmissions": submissions_data,
    }


def _get_admin_dashboard_data(user) -> dict:
    """Get dashboard data for admins."""
    from apps.progression.models import Enrollment
    from apps.certifications.models import Certificate

    # Get stats for entire platform
    total_students = User.objects.filter(is_staff=False).count()
    active_programs = Program.objects.filter(is_published=True).count()
    certificates_issued = Certificate.objects.count()
    active_enrollments = Enrollment.objects.filter(status="active").count()

    # Recent activity (simplified)
    recent_enrollments = (
        Enrollment.objects.all()
        .select_related("user", "program")
        .order_by("-enrolled_at")[:5]
    )

    recent_activity = [
        {
            "type": "enrollment",
            "description": f"{e.user.get_full_name() or e.user.email} enrolled in {e.program.name}",
            "timestamp": e.enrolled_at.strftime("%b %d, %Y"),
        }
        for e in recent_enrollments
    ]

    return {
        "stats": {
            "totalStudents": total_students,
            "activePrograms": active_programs,
            "certificatesIssued": certificates_issued,
            "activeEnrollments": active_enrollments,
        },
        "recentActivity": recent_activity,
    }


def _get_superadmin_dashboard_data() -> dict:
    """Get dashboard data for super admins (platform settings)."""
    from apps.platform.services import PlatformSettingsService
    
    platform_settings = PlatformSettingsService.get_settings()
    is_setup_required = PlatformSettingsService.is_setup_required()
    
    total_users = User.objects.count()
    total_programs = Program.objects.count()

    return {
        "platformSettings": platform_settings,
        "stats": {
            "totalUsers": total_users,
            "totalPrograms": total_programs,
        },
        "isSetupRequired": is_setup_required,
    }


# =============================================================================
# Helper Functions
# =============================================================================


def _get_registration_enabled(request) -> bool:
    """Check if registration is enabled via PlatformSettings."""
    from apps.platform.models import PlatformSettings
    try:
        settings = PlatformSettings.get_settings()
        return settings.is_feature_enabled('self_registration')
    except Exception:
        return True  # Default enabled


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


# =============================================================================
# Admin Program Management Views
# =============================================================================


def _require_admin(user) -> bool:
    """Check if user is admin or superadmin."""
    return user.is_staff or user.is_superuser


@login_required
def admin_programs(request):
    """
    List all programs.
    Requirements: FR-3.1
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    # Get filter params
    status = request.GET.get("status", "")
    blueprint_id = request.GET.get("blueprint", "")
    search = request.GET.get("search", "")
    page = int(request.GET.get("page", 1))
    per_page = 20

    # Build query
    programs_query = Program.objects.all().select_related("blueprint")

    if status == "published":
        programs_query = programs_query.filter(is_published=True)
    elif status == "draft":
        programs_query = programs_query.filter(is_published=False)

    if blueprint_id:
        programs_query = programs_query.filter(blueprint_id=blueprint_id)

    if search:
        programs_query = programs_query.filter(name__icontains=search)

    # Count and paginate
    total = programs_query.count()
    programs_query = programs_query.order_by("-created_at")
    programs = programs_query[(page - 1) * per_page : page * per_page]

    # Get enrollment counts
    from apps.progression.models import Enrollment
    from django.db.models import Count

    enrollment_counts = dict(
        Enrollment.objects.all()
        .values("program_id")
        .annotate(count=Count("id"))
        .values_list("program_id", "count")
    )

    programs_data = [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code or "",
            "description": p.description or "",
            "blueprintName": p.blueprint.name if p.blueprint else None,
            "blueprintId": p.blueprint_id,
            "isPublished": p.is_published,
            "enrollmentCount": enrollment_counts.get(p.id, 0),
            "createdAt": p.created_at.isoformat(),
        }
        for p in programs
    ]

    # Get blueprints for filter dropdown
    from apps.blueprints.models import AcademicBlueprint

    blueprints = AcademicBlueprint.objects.all().values("id", "name")

    return render(
        request,
        "Admin/Programs/Index",
        {
            "programs": programs_data,
            "blueprints": list(blueprints),
            "filters": {
                "status": status,
                "blueprint": blueprint_id,
                "search": search,
            },
            "pagination": {
                "page": page,
                "perPage": per_page,
                "total": total,
                "totalPages": (total + per_page - 1) // per_page,
            },
        },
    )


@login_required
def admin_program_detail(request, pk: int):
    """
    View program details.
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404
    from apps.progression.models import Enrollment, InstructorAssignment
    from apps.curriculum.models import CurriculumNode

    program = get_object_or_404(Program, pk=pk)

    # Get stats
    enrollment_count = Enrollment.objects.filter(program=program).count()
    active_enrollments = Enrollment.objects.filter(
        program=program, status="active"
    ).count()
    completed_enrollments = Enrollment.objects.filter(
        program=program, status="completed"
    ).count()
    node_count = CurriculumNode.objects.filter(program=program).count()

    # Get instructors
    instructors = InstructorAssignment.objects.filter(program=program).select_related(
        "instructor"
    )
    instructors_data = [
        {
            "id": a.instructor.id,
            "name": a.instructor.get_full_name() or a.instructor.email,
            "email": a.instructor.email,
            "role": a.role,
        }
        for a in instructors
    ]

    return render(
        request,
        "Admin/Programs/Show",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "description": program.description or "",
                "blueprintId": program.blueprint_id,
                "blueprintName": program.blueprint.name if program.blueprint else None,
                "isPublished": program.is_published,
                "createdAt": program.created_at.isoformat(),
            },
            "stats": {
                "enrollmentCount": enrollment_count,
                "activeEnrollments": active_enrollments,
                "completedEnrollments": completed_enrollments,
                "nodeCount": node_count,
            },
            "instructors": instructors_data,
        },
    )


@login_required
def admin_program_create(request):
    """
    Create a new program.
    Requirements: FR-3.2
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    from apps.blueprints.models import AcademicBlueprint
    from apps.progression.models import InstructorAssignment

    if request.method == "POST":
        data = _get_post_data(request)
        errors = {}

        name = data.get("name", "").strip()
        if not name:
            errors["name"] = "Name is required"

        code = data.get("code", "").strip()
        blueprint_id = data.get("blueprintId")

        if not blueprint_id:
            errors["blueprintId"] = "Blueprint is required"

        if errors:
            return render(
                request,
                "Admin/Programs/Form",
                {
                    "mode": "create",
                    "blueprints": _get_blueprints_for_form(),
                    "instructors": _get_instructors_for_form(),
                    "errors": errors,
                    "formData": data,
                },
            )

        # Create program
        program = Program.objects.create(
            blueprint_id=blueprint_id,
            name=name,
            code=code or None,
            description=data.get("description", ""),
            is_published=data.get("isPublished", False),
        )

        # Assign instructors
        instructor_ids = data.get("instructorIds", [])
        for instructor_id in instructor_ids:
            InstructorAssignment.objects.create(
                program=program,
                instructor_id=instructor_id,
                role="instructor",
            )

        return redirect("core:admin.program", pk=program.id)

    # GET - show create form
    return render(
        request,
        "Admin/Programs/Form",
        {
            "mode": "create",
            "blueprints": _get_blueprints_for_form(),
            "instructors": _get_instructors_for_form(),
        },
    )


@login_required
def admin_program_edit(request, pk: int):
    """
    Edit a program.
    Requirements: FR-3.3
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404
    from apps.progression.models import InstructorAssignment

    program = get_object_or_404(Program, pk=pk)

    if request.method == "POST":
        data = _get_post_data(request)
        errors = {}

        name = data.get("name", "").strip()
        if not name:
            errors["name"] = "Name is required"

        if errors:
            return render(
                request,
                "Admin/Programs/Form",
                {
                    "mode": "edit",
                    "program": _serialize_program(program),
                    "blueprints": _get_blueprints_for_form(),
                    "instructors": _get_instructors_for_form(),
                    "errors": errors,
                },
            )

        # Update program
        program.name = name
        program.code = data.get("code", "").strip() or None
        program.description = data.get("description", "")
        program.is_published = data.get("isPublished", False)

        # Only update blueprint if no enrollments
        from apps.progression.models import Enrollment

        if not Enrollment.objects.filter(program=program).exists():
            program.blueprint_id = data.get("blueprintId")

        program.save()

        # Update instructors
        instructor_ids = data.get("instructorIds", [])
        InstructorAssignment.objects.filter(program=program).delete()
        for instructor_id in instructor_ids:
            InstructorAssignment.objects.create(
                program=program,
                instructor_id=instructor_id,
                role="instructor",
            )

        return redirect("core:admin.program", pk=program.id)

    # GET - show edit form
    current_instructors = list(
        InstructorAssignment.objects.filter(program=program).values_list(
            "instructor_id", flat=True
        )
    )

    return render(
        request,
        "Admin/Programs/Form",
        {
            "mode": "edit",
            "program": _serialize_program(program),
            "currentInstructorIds": current_instructors,
            "blueprints": _get_blueprints_for_form(),
            "instructors": _get_instructors_for_form(),
            "canChangeBlueprint": not Enrollment.objects.filter(
                program=program
            ).exists(),
        },
    )


@login_required
def admin_program_delete(request, pk: int):
    """Delete a program."""
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("core:admin.programs")

    from django.shortcuts import get_object_or_404
    from apps.progression.models import Enrollment

    program = get_object_or_404(Program, pk=pk)

    # Check for enrollments
    if Enrollment.objects.filter(program=program).exists():
        messages.error(request, "Cannot delete program with enrollments")
        return redirect("core:admin.program", pk=pk)

    program.delete()
    messages.success(request, "Program deleted successfully")
    return redirect("core:admin.programs")


@login_required
def admin_program_publish(request, pk: int):
    """Toggle program publish status."""
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("core:admin.programs")

    from django.shortcuts import get_object_or_404

    program = get_object_or_404(Program, pk=pk)
    program.is_published = not program.is_published
    program.save()

    return redirect("core:admin.program", pk=pk)


def _get_blueprints_for_form() -> list:
    """Get blueprints for dropdown (single-tenant: all blueprints)."""
    from apps.blueprints.models import AcademicBlueprint

    blueprints = AcademicBlueprint.objects.all().order_by("name")
    return [
        {
            "id": b.id,
            "name": b.name,
            "hierarchyLabels": b.hierarchy_structure or [],
        }
        for b in blueprints
    ]


def _get_instructors_for_form() -> list:
    """Get instructors for dropdown (single-tenant: all staff)."""
    instructors = User.objects.filter(
        is_staff=True,
    ).order_by("first_name", "last_name")

    return [
        {
            "id": u.id,
            "name": u.get_full_name() or u.email,
            "email": u.email,
        }
        for u in instructors
    ]


def _serialize_program(program: Program) -> dict:
    """Serialize program for frontend."""
    return {
        "id": program.id,
        "name": program.name,
        "code": program.code or "",
        "description": program.description or "",
        "blueprintId": program.blueprint_id,
        "blueprintName": program.blueprint.name if program.blueprint else None,
        "isPublished": program.is_published,
    }


# =============================================================================
# Admin User Management Views
# =============================================================================


@login_required
def admin_users(request):
    """
    List all users (single-tenant).
    Requirements: FR-5.1
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    # Get filter params
    role = request.GET.get("role", "")
    status = request.GET.get("status", "")
    search = request.GET.get("search", "")
    page = int(request.GET.get("page", 1))
    per_page = 20

    # Build query (single-tenant: all users)
    users_query = User.objects.all()

    if role == "admin":
        users_query = users_query.filter(is_staff=True)
    elif role == "instructor":
        users_query = users_query.filter(groups__name="Instructors")
    elif role == "student":
        users_query = users_query.filter(is_staff=False).exclude(
            groups__name="Instructors"
        )

    if status == "active":
        users_query = users_query.filter(is_active=True)
    elif status == "inactive":
        users_query = users_query.filter(is_active=False)

    if search:
        from django.db.models import Q

        users_query = users_query.filter(
            Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
        )

    # Count and paginate
    total = users_query.count()
    users_query = users_query.order_by("-date_joined")
    users = users_query[(page - 1) * per_page : page * per_page]

    users_data = []
    for u in users:
        user_role = (
            "admin"
            if u.is_staff
            else (
                "instructor"
                if u.groups.filter(name="Instructors").exists()
                else "student"
            )
        )
        users_data.append(
            {
                "id": u.id,
                "email": u.email,
                "firstName": u.first_name,
                "lastName": u.last_name,
                "fullName": u.get_full_name() or u.email,
                "role": user_role,
                "isActive": u.is_active,
                "dateJoined": u.date_joined.isoformat(),
                "lastLogin": u.last_login.isoformat() if u.last_login else None,
            }
        )

    return render(
        request,
        "Admin/Users/Index",
        {
            "users": users_data,
            "filters": {
                "role": role,
                "status": status,
                "search": search,
            },
            "pagination": {
                "page": page,
                "perPage": per_page,
                "total": total,
                "totalPages": (total + per_page - 1) // per_page,
            },
        },
    )


@login_required
def admin_user_create(request):
    """
    Create a new user.
    Requirements: US-6.2
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    from django.contrib.auth.models import Group

    if request.method == "POST":
        data = _get_post_data(request)
        errors = {}

        email = data.get("email", "").strip().lower()
        if not email:
            errors["email"] = "Email is required"
        elif User.objects.filter(email=email).exists():
            errors["email"] = "Email already exists"

        first_name = data.get("firstName", "").strip()
        last_name = data.get("lastName", "").strip()
        password = data.get("password", "")
        role = data.get("role", "student")

        if not password:
            errors["password"] = "Password is required"
        else:
            password_error = _validate_password_strength(password)
            if password_error:
                errors["password"] = password_error

        if errors:
            return render(
                request,
                "Admin/Users/Form",
                {
                    "mode": "create",
                    "errors": errors,
                    "formData": data,
                },
            )

        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # Set role
        if role == "admin":
            user.is_staff = True
            user.save()
        elif role == "instructor":
            instructor_group, _ = Group.objects.get_or_create(name="Instructors")
            user.groups.add(instructor_group)

        messages.success(request, f"User {email} created successfully")
        return redirect("core:admin.users")

    return render(
        request,
        "Admin/Users/Form",
        {
            "mode": "create",
        },
    )


@login_required
def admin_user_edit(request, pk: int):
    """
    Edit a user.
    Requirements: US-6.3
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404
    from django.contrib.auth.models import Group

    user = get_object_or_404(User, pk=pk)

    if request.method == "POST":
        data = _get_post_data(request)
        errors = {}

        email = data.get("email", "").strip().lower()
        if not email:
            errors["email"] = "Email is required"
        elif User.objects.filter(email=email).exclude(pk=pk).exists():
            errors["email"] = "Email already exists"

        if errors:
            return render(
                request,
                "Admin/Users/Form",
                {
                    "mode": "edit",
                    "user": _serialize_user(user),
                    "errors": errors,
                },
            )

        # Update user
        user.email = email
        user.username = email
        user.first_name = data.get("firstName", "").strip()
        user.last_name = data.get("lastName", "").strip()
        user.is_active = data.get("isActive", True)
        user.save()

        # Update role
        role = data.get("role", "student")
        instructor_group, _ = Group.objects.get_or_create(name="Instructors")

        if role == "admin":
            user.is_staff = True
            user.groups.remove(instructor_group)
        elif role == "instructor":
            user.is_staff = False
            user.groups.add(instructor_group)
        else:
            user.is_staff = False
            user.groups.remove(instructor_group)
        user.save()

        messages.success(request, "User updated successfully")
        return redirect("core:admin.users")

    # Determine current role
    current_role = (
        "admin"
        if user.is_staff
        else (
            "instructor"
            if user.groups.filter(name="Instructors").exists()
            else "student"
        )
    )

    return render(
        request,
        "Admin/Users/Form",
        {
            "mode": "edit",
            "user": _serialize_user(user),
            "currentRole": current_role,
        },
    )


@login_required
def admin_user_deactivate(request, pk: int):
    """Toggle user active status."""
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("core:admin.users")

    from django.shortcuts import get_object_or_404

    user = get_object_or_404(User, pk=pk)

    # Don't allow deactivating yourself
    if user.id == request.user.id:
        messages.error(request, "Cannot deactivate your own account")
        return redirect("core:admin.users")

    user.is_active = not user.is_active
    user.save()

    status = "activated" if user.is_active else "deactivated"
    messages.success(request, f"User {status} successfully")
    return redirect("core:admin.users")


@login_required
def admin_user_reset_password(request, pk: int):
    """Send password reset email to user."""
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("core:admin.users")

    from django.shortcuts import get_object_or_404
    from django.core.mail import send_mail

    user = get_object_or_404(User, pk=pk)

    # Generate reset token
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    # Send reset email
    reset_url = f"{request.scheme}://{request.get_host()}/reset-password/{uid}/{token}/"
    send_mail(
        subject="Password Reset Request",
        message=f"Click here to reset your password: {reset_url}",
        from_email=None,
        recipient_list=[user.email],
        fail_silently=True,
    )

    messages.success(request, f"Password reset email sent to {user.email}")
    return redirect("core:admin.users")


@login_required
def admin_user_delete(request, pk: int):
    """
    Delete a user permanently.
    Only admins and superadmins can delete users.
    Superusers cannot be deleted (for safety).
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("core:admin.users")

    from django.shortcuts import get_object_or_404
    from apps.progression.models import Enrollment

    user = get_object_or_404(User, pk=pk)

    # Don't allow deleting yourself
    if user.id == request.user.id:
        messages.error(request, "Cannot delete your own account")
        return redirect("core:admin.users")

    # Don't allow deleting superusers (safety)
    if user.is_superuser:
        messages.error(request, "Cannot delete superuser accounts")
        return redirect("core:admin.users")

    # Check for enrollments - warn but allow delete
    enrollments_count = Enrollment.objects.filter(user=user).count()
    
    user_email = user.email
    user.delete()
    
    if enrollments_count > 0:
        messages.success(
            request,
            f"User {user_email} deleted along with {enrollments_count} enrollment(s)"
        )
    else:
        messages.success(request, f"User {user_email} deleted successfully")
    
    return redirect("core:admin.users")


def _serialize_user(user: User) -> dict:
    """Serialize user for frontend."""
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "isActive": user.is_active,
    }


# =============================================================================
# Instructor Views
# =============================================================================


def _require_instructor(user) -> bool:
    """Check if user is instructor (or higher)."""
    if user.is_superuser or user.is_staff:
        return True
    return hasattr(user, "groups") and user.groups.filter(name="Instructors").exists()


def _get_instructor_program_ids(user) -> list:
    """Get list of program IDs assigned to this instructor."""
    from apps.progression.models import InstructorAssignment
    return list(
        InstructorAssignment.objects.filter(instructor=user).values_list("program_id", flat=True)
    )


@login_required
def instructor_programs(request):
    """List programs assigned to this instructor."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    program_ids = _get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids).select_related("blueprint")
    
    from apps.progression.models import Enrollment
    from django.db.models import Count
    
    enrollment_counts = dict(
        Enrollment.objects.filter(program_id__in=program_ids)
        .values("program_id")
        .annotate(count=Count("id"))
        .values_list("program_id", "count")
    )
    
    programs_data = [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code or "",
            "description": p.description or "",
            "blueprintName": p.blueprint.name if p.blueprint else None,
            "enrollmentCount": enrollment_counts.get(p.id, 0),
            "isPublished": p.is_published,
        }
        for p in programs
    ]
    
    return render(request, "Instructor/Programs/Index", {"programs": programs_data})


@login_required
def instructor_program_detail(request, pk: int):
    """View program details for instructor."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from django.shortcuts import get_object_or_404
    from apps.progression.models import Enrollment
    from apps.curriculum.models import CurriculumNode
    
    program_ids = _get_instructor_program_ids(request.user)
    program = get_object_or_404(Program, pk=pk, id__in=program_ids)
    
    # Get enrolled students
    enrollments = Enrollment.objects.filter(
        program=program
    ).select_related("user").order_by("user__last_name", "user__first_name")
    
    students_data = [
        {
            "id": e.id,
            "userId": e.user.id,
            "name": e.user.get_full_name() or e.user.email,
            "email": e.user.email,
            "status": e.status,
            "enrolledAt": e.enrolled_at.isoformat(),
        }
        for e in enrollments
    ]
    
    # Get curriculum nodes
    nodes = CurriculumNode.objects.filter(program=program, parent__isnull=True).order_by("position")
    
    return render(
        request,
        "Instructor/Programs/Detail",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "description": program.description or "",
            },
            "students": students_data,
            "curriculum": [{"id": n.id, "title": n.title, "type": n.node_type} for n in nodes],
        },
    )


@login_required
def instructor_students(request):
    """List all students enrolled in instructor's programs."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from apps.progression.models import Enrollment
    
    program_ids = _get_instructor_program_ids(request.user)
    
    enrollments = (
        Enrollment.objects.filter(program_id__in=program_ids)
        .select_related("user", "program")
        .order_by("user__last_name", "user__first_name")
    )
    
    # Group by user
    students_map = {}
    for e in enrollments:
        if e.user.id not in students_map:
            students_map[e.user.id] = {
                "id": e.user.id,
                "name": e.user.get_full_name() or e.user.email,
                "email": e.user.email,
                "programs": [],
            }
        students_map[e.user.id]["programs"].append({
            "id": e.program.id,
            "name": e.program.name,
            "status": e.status,
        })
    
    return render(
        request,
        "Instructor/Students/Index",
        {"students": list(students_map.values())},
    )


@login_required
def instructor_student_detail(request, pk: int):
    """View individual student details."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from django.shortcuts import get_object_or_404
    from apps.progression.models import Enrollment, NodeCompletion
    
    program_ids = _get_instructor_program_ids(request.user)
    student = get_object_or_404(User, pk=pk)
    
    # Only show enrollment data for instructor's programs
    enrollments = Enrollment.objects.filter(
        user=student, program_id__in=program_ids
    ).select_related("program")
    
    enrollments_data = []
    for e in enrollments:
        completions = NodeCompletion.objects.filter(enrollment=e).count()
        enrollments_data.append({
            "id": e.id,
            "programId": e.program.id,
            "programName": e.program.name,
            "status": e.status,
            "completions": completions,
            "enrolledAt": e.enrolled_at.isoformat(),
        })
    
    return render(
        request,
        "Instructor/Students/Detail",
        {
            "student": {
                "id": student.id,
                "name": student.get_full_name() or student.email,
                "email": student.email,
            },
            "enrollments": enrollments_data,
        },
    )


@login_required
def instructor_gradebook(request):
    """Gradebook for instructor's programs."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from apps.progression.models import Enrollment
    
    program_ids = _get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids).select_related("blueprint")
    
    # Get grading config from blueprint
    programs_data = []
    for p in programs:
        grading_config = p.blueprint.grading_logic if p.blueprint else {}
        enrollments = Enrollment.objects.filter(program=p, status="active").select_related("user")
        
        programs_data.append({
            "id": p.id,
            "name": p.name,
            "gradingType": grading_config.get("type") or grading_config.get("mode", "percentage"),
            "gradingConfig": grading_config,
            "studentCount": enrollments.count(),
        })
    
    return render(request, "Instructor/Gradebook/Index", {"programs": programs_data})


@login_required
def instructor_grade_entry(request, enrollment_id: int):
    """Enter grades for a specific enrollment."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from django.shortcuts import get_object_or_404
    from apps.progression.models import Enrollment
    
    program_ids = _get_instructor_program_ids(request.user)
    enrollment = get_object_or_404(Enrollment, pk=enrollment_id, program_id__in=program_ids)
    
    if request.method == "POST":
        data = _get_post_data(request)
        # TODO: Save grades based on blueprint grading_type
        messages.success(request, "Grades saved successfully")
        return redirect("core:instructor.gradebook")
    
    grading_config = enrollment.program.blueprint.grading_logic if enrollment.program.blueprint else {}
    
    return render(
        request,
        "Instructor/GradeEntry",
        {
            "enrollment": {
                "id": enrollment.id,
                "studentName": enrollment.user.get_full_name() or enrollment.user.email,
                "programName": enrollment.program.name,
            },
            "gradingType": grading_config.get("type", "percentage"),
            "gradingConfig": grading_config,
        },
    )


@login_required
def instructor_program_gradebook(request, pk: int):
    """Gradebook for a specific program with quiz and assignment scores."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from django.shortcuts import get_object_or_404
    from apps.progression.models import Enrollment
    from apps.assessments.models import Quiz, QuizAttempt, Assignment, AssignmentSubmission
    
    program_ids = _get_instructor_program_ids(request.user)
    program = get_object_or_404(Program, pk=pk, id__in=program_ids)
    
    grading_config = program.blueprint.grading_logic if program.blueprint else {}
    
    # Get all quizzes and assignments for the program
    quizzes = list(Quiz.objects.filter(node__program=program, is_published=True).order_by('created_at'))
    assignments = list(Assignment.objects.filter(program=program, is_published=True).order_by('created_at'))
    
    # Get enrolled students with their grades
    enrollments = Enrollment.objects.filter(
        program=program
    ).select_related("user").order_by("user__last_name", "user__first_name")
    
    # Prefetch quiz attempts and assignment submissions for all enrollments
    enrollment_ids = [e.id for e in enrollments]
    
    quiz_attempts = QuizAttempt.objects.filter(
        enrollment_id__in=enrollment_ids
    ).select_related('quiz')
    
    assignment_submissions = AssignmentSubmission.objects.filter(
        enrollment_id__in=enrollment_ids
    ).select_related('assignment')
    
    # Index attempts/submissions by enrollment
    quiz_attempts_by_enrollment = {}
    for attempt in quiz_attempts:
        if attempt.enrollment_id not in quiz_attempts_by_enrollment:
            quiz_attempts_by_enrollment[attempt.enrollment_id] = {}
        quiz_id = attempt.quiz_id
        # Keep best score per quiz
        if quiz_id not in quiz_attempts_by_enrollment[attempt.enrollment_id]:
            quiz_attempts_by_enrollment[attempt.enrollment_id][quiz_id] = attempt
        elif attempt.score and (quiz_attempts_by_enrollment[attempt.enrollment_id][quiz_id].score is None or 
                                attempt.score > quiz_attempts_by_enrollment[attempt.enrollment_id][quiz_id].score):
            quiz_attempts_by_enrollment[attempt.enrollment_id][quiz_id] = attempt
    
    submissions_by_enrollment = {}
    for sub in assignment_submissions:
        if sub.enrollment_id not in submissions_by_enrollment:
            submissions_by_enrollment[sub.enrollment_id] = {}
        submissions_by_enrollment[sub.enrollment_id][sub.assignment_id] = sub
    
    students_data = []
    for e in enrollments:
        # Get manual grades from enrollment
        manual_grades = e.grades if hasattr(e, 'grades') and e.grades else {"components": {}}
        
        # Build quiz scores
        quiz_scores = []
        for q in quizzes:
            attempt = quiz_attempts_by_enrollment.get(e.id, {}).get(q.id)
            quiz_scores.append({
                "quizId": q.id,
                "title": q.title,
                "score": float(attempt.score) if attempt and attempt.score else None,
                "passed": attempt.passed if attempt else None,
                "attemptCount": QuizAttempt.objects.filter(enrollment=e, quiz=q).count(),
            })
        
        # Build assignment scores
        assignment_scores = []
        for a in assignments:
            sub = submissions_by_enrollment.get(e.id, {}).get(a.id)
            assignment_scores.append({
                "assignmentId": a.id,
                "title": a.title,
                "weight": a.weight,
                "score": sub.get_final_score() if sub and sub.score else None,
                "status": sub.status if sub else "not_submitted",
                "isLate": sub.is_late if sub else False,
            })
        
        # Calculate overall score
        total_weight = 0
        weighted_score = 0
        
        # Quiz component (assume equal weight split)
        quiz_weight = grading_config.get("quiz_weight", 30)  # Default 30%
        quiz_total = len(quizzes)
        quiz_sum = sum(qs["score"] or 0 for qs in quiz_scores)
        if quiz_total > 0:
            weighted_score += (quiz_sum / quiz_total) * (quiz_weight / 100)
            total_weight += quiz_weight
        
        # Assignment component
        for asc in assignment_scores:
            if asc["score"] is not None:
                weighted_score += asc["score"] * (asc["weight"] / 100)
            total_weight += asc["weight"]
        
        overall = (weighted_score / total_weight * 100) if total_weight > 0 else None
        
        students_data.append({
            "enrollmentId": e.id,
            "name": e.user.get_full_name() or e.user.email,
            "email": e.user.email,
            "grades": manual_grades,
            "quizScores": quiz_scores,
            "assignmentScores": assignment_scores,
            "overallScore": round(overall, 1) if overall else None,
            "isPublished": getattr(e, 'grades_published', False),
        })
    
    return render(
        request,
        "Instructor/Gradebook",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
            },
            "gradingConfig": grading_config,
            "quizzes": [{"id": q.id, "title": q.title} for q in quizzes],
            "assignments": [{"id": a.id, "title": a.title, "weight": a.weight} for a in assignments],
            "students": students_data,
        },
    )



@login_required
def instructor_program_gradebook_save(request, pk: int):
    """Save grades for a specific program."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    if request.method != "POST":
        return redirect("core:instructor.gradebook")
    
    from django.shortcuts import get_object_or_404
    from apps.progression.models import Enrollment
    
    program_ids = _get_instructor_program_ids(request.user)
    program = get_object_or_404(Program, pk=pk, id__in=program_ids)
    
    data = _get_post_data(request)
    grades_data = data.get("grades", {})
    
    # Update grades for each enrollment
    for enrollment_id_str, grade_info in grades_data.items():
        try:
            enrollment_id = int(enrollment_id_str)
            enrollment = Enrollment.objects.filter(id=enrollment_id, program=program).first()
            if enrollment:
                # Store grades in enrollment - this may need a JSONField on Enrollment model
                enrollment.grades = grade_info
                enrollment.save(update_fields=['grades'])
        except (ValueError, TypeError):
            continue
    
    messages.success(request, "Grades saved successfully")
    return redirect("core:instructor.program_gradebook", pk=pk)


@login_required
def instructor_content(request):
    """List curriculum content for instructor's programs."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from apps.curriculum.models import CurriculumNode
    
    def serialize_node(node):
        """Recursively serialize node with children."""
        children = node.children.all().order_by("position")
        return {
            "id": node.id,
            "title": node.title,
            "type": node.node_type,
            "children": [serialize_node(child) for child in children],
        }
    
    program_ids = _get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids)
    
    programs_data = []
    for p in programs:
        root_nodes = CurriculumNode.objects.filter(
            program=p, parent__isnull=True
        ).prefetch_related("children").order_by("position")
        programs_data.append({
            "id": p.id,
            "name": p.name,
            "nodes": [serialize_node(n) for n in root_nodes],
        })
    
    return render(request, "Instructor/Content/Index", {"programs": programs_data})


@login_required
def instructor_content_edit(request, node_id: int):
    """Edit session content with block-based editor."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from django.shortcuts import get_object_or_404
    from apps.curriculum.models import CurriculumNode
    from apps.content.models import LessonBlock
    import os
    import uuid
    
    program_ids = _get_instructor_program_ids(request.user)
    node = get_object_or_404(CurriculumNode, pk=node_id, program_id__in=program_ids)
    
    if request.method == "POST":
        data = _get_post_data(request)
        action = data.get("action", "save")
        
        if action == "save_meta":
            # Save node metadata
            node.title = data.get("title", node.title)
            node.description = data.get("description", node.description)
            props = node.properties or {}
            props["objectives"] = data.get("objectives", props.get("objectives", ""))
            node.properties = props
            node.save(skip_validation=True)
            messages.success(request, "Content updated")
        
        elif action == "add_block":
            block_type = data.get("blockType", "text")
            position = LessonBlock.objects.filter(node=node).count()
            
            block = LessonBlock.objects.create(
                node=node,
                block_type=block_type,
                position=position,
                content=data.get("content", ""),
            )
            messages.success(request, f"{block_type.title()} block added")
        
        elif action == "update_block":
            block_id = data.get("blockId")
            try:
                block = LessonBlock.objects.get(pk=block_id, node=node)
                block.content = data.get("content", block.content)
                block.save()
                messages.success(request, "Block updated")
            except LessonBlock.DoesNotExist:
                messages.error(request, "Block not found")
        
        elif action == "delete_block":
            block_id = data.get("blockId")
            try:
                block = LessonBlock.objects.get(pk=block_id, node=node)
                block.delete()
                # Reorder remaining blocks
                blocks = LessonBlock.objects.filter(node=node).order_by("position")
                for i, b in enumerate(blocks):
                    b.position = i
                    b.save(update_fields=["position"])
                messages.success(request, "Block deleted")
            except LessonBlock.DoesNotExist:
                messages.error(request, "Block not found")
        
        elif action == "reorder_blocks":
            order = data.get("order", [])  # List of block IDs in new order
            for i, block_id in enumerate(order):
                LessonBlock.objects.filter(pk=block_id, node=node).update(position=i)
            messages.success(request, "Blocks reordered")
        
        return redirect("core:instructor.content_edit", node_id=node_id)
    
    # Handle file uploads via multipart form
    if request.FILES:
        block_type = request.POST.get("blockType", "file")
        uploaded_file = request.FILES.get("file")
        
        if uploaded_file:
            from django.conf import settings
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'content', str(node_id))
            os.makedirs(upload_dir, exist_ok=True)
            unique_name = f"{uuid.uuid4().hex}_{uploaded_file.name}"
            file_path = os.path.join(upload_dir, unique_name)
            
            with open(file_path, 'wb+') as dest:
                for chunk in uploaded_file.chunks():
                    dest.write(chunk)
            
            position = LessonBlock.objects.filter(node=node).count()
            LessonBlock.objects.create(
                node=node,
                block_type=block_type,
                position=position,
                file_path=file_path,
                file_name=uploaded_file.name,
                content=request.POST.get("caption", ""),
            )
            messages.success(request, f"{block_type.title()} uploaded")
            return redirect("core:instructor.content_edit", node_id=node_id)
    
    # Get existing blocks
    blocks = LessonBlock.objects.filter(node=node).order_by("position")
    props = node.properties or {}
    
    return render(
        request,
        "Instructor/Content/Edit",
        {
            "node": {
                "id": node.id,
                "title": node.title,
                "description": node.description or "",
                "objectives": props.get("objectives", ""),
                "nodeType": node.node_type,
                "programId": node.program.id,
                "programName": node.program.name,
            },
            "blocks": [
                {
                    "id": b.id,
                    "type": b.block_type,
                    "position": b.position,
                    "content": b.content,
                    "filePath": b.file_path,
                    "fileName": b.file_name,
                    "metadata": b.metadata,
                }
                for b in blocks
            ],
        },
    )



@login_required
def instructor_announcements(request):
    """List announcements for instructor's programs."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from apps.progression.models import Announcement
    from django.utils import timezone
    from django.utils.timesince import timesince
    
    program_ids = _get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids)
    
    announcements = Announcement.objects.filter(
        program_id__in=program_ids
    ).select_related("program", "author").order_by("-is_pinned", "-created_at")
    
    announcements_data = [
        {
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "programId": a.program_id,
            "programName": a.program.name,
            "isPinned": a.is_pinned,
            "createdAt": timesince(a.created_at) + " ago",
        }
        for a in announcements
    ]
    
    return render(
        request,
        "Instructor/Announcements/Index",
        {
            "programs": [{"id": p.id, "name": p.name} for p in programs],
            "announcements": announcements_data,
        },
    )


@login_required
def instructor_announcement_create(request):
    """Create a new announcement."""
    if not _require_instructor(request.user):
        return redirect("/dashboard/")
    
    from apps.progression.models import Announcement
    
    program_ids = _get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids)
    
    if request.method == "POST":
        data = _get_post_data(request)
        program_id = data.get("programId")
        
        # Validate program belongs to instructor
        if int(program_id) not in program_ids:
            messages.error(request, "Invalid program selected")
            return redirect("core:instructor.announcements")
        
        Announcement.objects.create(
            program_id=program_id,
            author=request.user,
            title=data.get("title", ""),
            content=data.get("content", ""),
            is_pinned=data.get("isPinned", False),
        )
        messages.success(request, "Announcement posted successfully")
        return redirect("core:instructor.announcements")
    
    return render(
        request,
        "Instructor/Announcements/Create",
        {"programs": [{"id": p.id, "name": p.name} for p in programs]},
    )


# =============================================================================
# Instructor Application Workflow
# =============================================================================


@login_required
def instructor_apply(request):
    """
    Instructor application form.
    Allows users to apply to become instructors with their credentials.
    """
    from apps.core.models import InstructorProfile, InstructorCertification
    import os
    from django.conf import settings
    
    user = request.user
    
    # Get or create instructor profile
    profile, created = InstructorProfile.objects.get_or_create(user=user)
    
    # If already approved, redirect to dashboard
    if profile.status == 'approved':
        messages.info(request, "You are already an approved instructor.")
        return redirect("/dashboard/")
    
    # If pending review, show status page
    if profile.status == 'pending_review':
        return render(
            request,
            "Instructor/Apply",
            {
                "profile": _serialize_instructor_profile(profile),
                "isPending": True,
            },
        )
    
    if request.method == "POST":
        data = _get_post_data(request)
        action = data.get("action", "save")
        
        # Update profile fields
        profile.bio = data.get("bio", profile.bio)
        profile.job_title = data.get("jobTitle", profile.job_title)
        profile.linkedin_url = data.get("linkedinUrl", profile.linkedin_url)
        profile.teaching_experience = data.get("teachingExperience", profile.teaching_experience)
        profile.why_teach_here = data.get("whyTeachHere", profile.why_teach_here)
        
        # Handle resume upload if present
        if "resume" in request.FILES:
            resume_file = request.FILES["resume"]
            upload_dir = os.path.join(settings.MEDIA_ROOT, "instructor_resumes", str(user.id))
            os.makedirs(upload_dir, exist_ok=True)
            resume_path = os.path.join(upload_dir, resume_file.name)
            with open(resume_path, "wb+") as destination:
                for chunk in resume_file.chunks():
                    destination.write(chunk)
            profile.resume_path = resume_path
        
        # Handle certification uploads
        if "certifications" in request.FILES:
            cert_files = request.FILES.getlist("certifications")
            cert_dir = os.path.join(settings.MEDIA_ROOT, "instructor_certs", str(user.id))
            os.makedirs(cert_dir, exist_ok=True)
            for cert_file in cert_files:
                cert_path = os.path.join(cert_dir, cert_file.name)
                with open(cert_path, "wb+") as destination:
                    for chunk in cert_file.chunks():
                        destination.write(chunk)
                InstructorCertification.objects.create(
                    profile=profile,
                    file_path=cert_path,
                    file_name=cert_file.name,
                )
        
        if action == "submit":
            # Validate required fields
            errors = {}
            if not profile.bio:
                errors["bio"] = "Bio is required"
            if not profile.teaching_experience:
                errors["teachingExperience"] = "Teaching experience is required"
            if not profile.why_teach_here:
                errors["whyTeachHere"] = "Please explain why you want to teach here"
            
            if errors:
                profile.save()
                return render(
                    request,
                    "Instructor/Apply",
                    {
                        "profile": _serialize_instructor_profile(profile),
                        "errors": errors,
                        "isPending": False,
                    },
                )
            
            # Submit for review
            profile.status = 'pending_review'
            profile.save()
            messages.success(request, "Your application has been submitted for review!")
            return redirect("/dashboard/")
        else:
            # Just save draft
            profile.save()
            messages.success(request, "Application saved as draft.")
    
    return render(
        request,
        "Instructor/Apply",
        {
            "profile": _serialize_instructor_profile(profile),
            "isPending": False,
        },
    )


def _serialize_instructor_profile(profile):
    """Serialize instructor profile for frontend."""
    from apps.core.models import InstructorCertification
    
    certifications = InstructorCertification.objects.filter(profile=profile)
    
    return {
        "id": profile.id,
        "status": profile.status,
        "bio": profile.bio,
        "jobTitle": profile.job_title,
        "linkedinUrl": profile.linkedin_url,
        "teachingExperience": profile.teaching_experience,
        "whyTeachHere": profile.why_teach_here,
        "resumePath": profile.resume_path,
        "hasResume": bool(profile.resume_path),
        "certifications": [
            {"id": c.id, "fileName": c.file_name}
            for c in certifications
        ],
        "rejectionReason": profile.rejection_reason,
        "createdAt": profile.created_at.isoformat() if profile.created_at else None,
    }


@login_required
def admin_instructor_applications(request):
    """
    Admin queue for reviewing instructor applications.
    """
    from apps.core.models import InstructorProfile
    
    if not _require_admin(request.user):
        return redirect("/dashboard/")
    
    # Get filter params
    status_filter = request.GET.get("status", "pending_review")
    page = int(request.GET.get("page", 1))
    per_page = 20
    
    # Build query
    applications_query = InstructorProfile.objects.select_related("user")
    
    if status_filter:
        applications_query = applications_query.filter(status=status_filter)
    
    applications_query = applications_query.order_by("-created_at")
    
    # Paginate
    total = applications_query.count()
    offset = (page - 1) * per_page
    applications = applications_query[offset : offset + per_page]
    
    applications_data = [
        {
            "id": a.id,
            "userId": a.user.id,
            "email": a.user.email,
            "name": a.user.get_full_name() or a.user.email,
            "status": a.status,
            "jobTitle": a.job_title,
            "bio": a.bio[:200] + "..." if len(a.bio) > 200 else a.bio,
            "linkedinUrl": a.linkedin_url,
            "hasResume": bool(a.resume_path),
            "createdAt": a.created_at.isoformat(),
        }
        for a in applications
    ]
    
    return render(
        request,
        "Admin/InstructorApplications/Index",
        {
            "applications": applications_data,
            "filters": {"status": status_filter},
            "pagination": {
                "page": page,
                "perPage": per_page,
                "total": total,
                "hasNext": offset + per_page < total,
                "hasPrev": page > 1,
            },
            "statusChoices": InstructorProfile.STATUS_CHOICES,
        },
    )


@login_required
def admin_instructor_application_detail(request, pk: int):
    """
    View a single instructor application with full details.
    """
    from apps.core.models import InstructorProfile, InstructorCertification
    
    if not _require_admin(request.user):
        return redirect("/dashboard/")
    
    try:
        profile = InstructorProfile.objects.select_related("user").get(pk=pk)
    except InstructorProfile.DoesNotExist:
        messages.error(request, "Application not found")
        return redirect("core:admin.instructor_applications")
    
    certifications = InstructorCertification.objects.filter(profile=profile)
    
    return render(
        request,
        "Admin/InstructorApplications/Detail",
        {
            "application": {
                "id": profile.id,
                "userId": profile.user.id,
                "email": profile.user.email,
                "name": profile.user.get_full_name() or profile.user.email,
                "status": profile.status,
                "jobTitle": profile.job_title,
                "bio": profile.bio,
                "linkedinUrl": profile.linkedin_url,
                "teachingExperience": profile.teaching_experience,
                "whyTeachHere": profile.why_teach_here,
                "hasResume": bool(profile.resume_path),
                "resumePath": profile.resume_path,
                "certifications": [
                    {"id": c.id, "fileName": c.file_name, "filePath": c.file_path}
                    for c in certifications
                ],
                "rejectionReason": profile.rejection_reason,
                "createdAt": profile.created_at.isoformat(),
            },
        },
    )


@login_required
def admin_instructor_application_approve(request, pk: int):
    """
    Approve an instructor application.
    """
    from apps.core.models import InstructorProfile
    from django.contrib.auth.models import Group
    
    if not _require_admin(request.user):
        return redirect("/dashboard/")
    
    if request.method != "POST":
        return redirect("core:admin.instructor_applications")
    
    try:
        profile = InstructorProfile.objects.select_related("user").get(pk=pk)
    except InstructorProfile.DoesNotExist:
        messages.error(request, "Application not found")
        return redirect("core:admin.instructor_applications")
    
    # Approve the application
    profile.status = 'approved'
    profile.reviewed_by = request.user
    profile.reviewed_at = timezone.now()
    profile.save()
    
    # Add user to Instructors group and activate
    instructors_group, _ = Group.objects.get_or_create(name="Instructors")
    profile.user.groups.add(instructors_group)
    profile.user.is_active = True
    profile.user.save()
    
    # TODO: Send approval email notification
    
    messages.success(request, f"Instructor application for {profile.user.email} has been approved!")
    return redirect("core:admin.instructor_applications")


@login_required
def admin_instructor_application_reject(request, pk: int):
    """
    Reject an instructor application.
    Requires reason and auto-deletes sensitive files.
    """
    from apps.core.models import InstructorProfile, InstructorCertification
    import os
    
    if not _require_admin(request.user):
        return redirect("/dashboard/")
    
    if request.method != "POST":
        return redirect("core:admin.instructor_applications")
    
    try:
        profile = InstructorProfile.objects.select_related("user").get(pk=pk)
    except InstructorProfile.DoesNotExist:
        messages.error(request, "Application not found")
        return redirect("core:admin.instructor_applications")
    
    data = _get_post_data(request)
    reason = data.get("reason", "").strip()
    
    if not reason:
        messages.error(request, "Rejection reason is required")
        return redirect("core:admin.instructor_application", pk=pk)
    
    # Reject the application
    profile.status = 'rejected'
    profile.rejection_reason = reason
    profile.reviewed_by = request.user
    profile.reviewed_at = timezone.now()
    
    # Auto-delete sensitive files (resume and certifications)
    if profile.resume_path and os.path.exists(profile.resume_path):
        try:
            os.remove(profile.resume_path)
        except OSError:
            pass
    profile.resume_path = None
    
    certifications = InstructorCertification.objects.filter(profile=profile)
    for cert in certifications:
        if cert.file_path and os.path.exists(cert.file_path):
            try:
                os.remove(cert.file_path)
            except OSError:
                pass
    certifications.delete()
    
    profile.save()
    
    # TODO: Send rejection email notification with reason
    
    messages.success(request, f"Instructor application for {profile.user.email} has been rejected.")
    return redirect("core:admin.instructor_applications")


@login_required
def admin_instructor_application_unlock(request, pk: int):
    """
    Unlock a rejected application for re-submission.
    """
    from apps.core.models import InstructorProfile
    
    if not _require_admin(request.user):
        return redirect("/dashboard/")
    
    if request.method != "POST":
        return redirect("core:admin.instructor_applications")
    
    try:
        profile = InstructorProfile.objects.get(pk=pk, status='rejected')
    except InstructorProfile.DoesNotExist:
        messages.error(request, "Application not found or not in rejected state")
        return redirect("core:admin.instructor_applications")
    
    # Unlock to draft state
    profile.status = 'draft'
    profile.rejection_reason = ''
    profile.save()
    
    # TODO: Send unlock notification email
    
    messages.success(request, f"Application unlocked. The user can now resubmit.")
    return redirect("core:admin.instructor_applications")


# =============================================================================
# Quiz Management Views (Instructor)
# =============================================================================


@login_required
def instructor_quizzes(request, node_id: int):
    """
    List quizzes for a lesson/session node.
    """
    from apps.curriculum.models import CurriculumNode
    from apps.assessments.models import Quiz
    from apps.progression.models import InstructorAssignment
    
    try:
        node = CurriculumNode.objects.select_related('program').get(pk=node_id)
    except CurriculumNode.DoesNotExist:
        messages.error(request, "Lesson not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=node.program
    ).exists() and not request.user.is_staff:
        messages.error(request, "You don't have access to this lesson")
        return redirect("/dashboard/")
    
    quizzes = Quiz.objects.filter(node=node).order_by('-created_at')
    
    return render(
        request,
        "Instructor/Quizzes/Index",
        {
            "node": {
                "id": node.id,
                "title": node.title,
                "programId": node.program.id,
                "programName": node.program.name,
            },
            "quizzes": [
                {
                    "id": q.id,
                    "title": q.title,
                    "questionCount": q.questions.count(),
                    "timeLimit": q.time_limit_minutes,
                    "maxAttempts": q.max_attempts,
                    "passThreshold": q.pass_threshold,
                    "isPublished": q.is_published,
                    "createdAt": q.created_at.isoformat(),
                }
                for q in quizzes
            ],
        },
    )


@login_required
def instructor_quiz_create(request, node_id: int):
    """
    Create a new quiz for a lesson.
    """
    from apps.curriculum.models import CurriculumNode
    from apps.assessments.models import Quiz
    from apps.progression.models import InstructorAssignment
    
    try:
        node = CurriculumNode.objects.select_related('program').get(pk=node_id)
    except CurriculumNode.DoesNotExist:
        messages.error(request, "Lesson not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=node.program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    if request.method == "POST":
        data = _get_post_data(request)
        
        quiz = Quiz.objects.create(
            node=node,
            title=data.get("title", "Untitled Quiz"),
            description=data.get("description", ""),
            time_limit_minutes=int(data.get("timeLimit")) if data.get("timeLimit") else None,
            max_attempts=int(data.get("maxAttempts", 1)),
            pass_threshold=int(data.get("passThreshold", 70)),
        )
        
        messages.success(request, "Quiz created! Now add questions.")
        return redirect("core:instructor.quiz_edit", quiz_id=quiz.id)
    
    return render(
        request,
        "Instructor/Quizzes/Create",
        {
            "node": {
                "id": node.id,
                "title": node.title,
                "programName": node.program.name,
            },
        },
    )


@login_required
def instructor_quiz_edit(request, quiz_id: int):
    """
    Edit quiz settings and manage questions.
    """
    from apps.assessments.models import Quiz, Question
    from apps.progression.models import InstructorAssignment
    
    try:
        quiz = Quiz.objects.select_related('node', 'node__program').get(pk=quiz_id)
    except Quiz.DoesNotExist:
        messages.error(request, "Quiz not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=quiz.node.program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    if request.method == "POST":
        data = _get_post_data(request)
        action = data.get("action", "save")
        
        if action == "update_settings":
            quiz.title = data.get("title", quiz.title)
            quiz.description = data.get("description", quiz.description)
            quiz.time_limit_minutes = int(data.get("timeLimit")) if data.get("timeLimit") else None
            quiz.max_attempts = int(data.get("maxAttempts", 1))
            quiz.pass_threshold = int(data.get("passThreshold", 70))
            quiz.save()
            messages.success(request, "Quiz settings updated")
        
        elif action == "add_question":
            question_type = data.get("questionType", "mcq")
            text = data.get("text", "")
            points = int(data.get("points", 1))
            
            # Build answer_data based on type
            if question_type == "mcq":
                options = data.get("options", [])
                correct = int(data.get("correctAnswer", 0))
                answer_data = {"options": options, "correct": correct}
            elif question_type == "true_false":
                correct = data.get("correctAnswer") in (True, "true", "True")
                answer_data = {"correct": correct}
            else:  # short_answer
                keywords = data.get("keywords", [])
                manual = data.get("manualGrading", True)
                answer_data = {"keywords": keywords, "manual_grading": manual}
            
            position = quiz.questions.count()
            Question.objects.create(
                quiz=quiz,
                question_type=question_type,
                text=text,
                points=points,
                position=position,
                answer_data=answer_data,
            )
            messages.success(request, "Question added")
        
        elif action == "delete_question":
            question_id = data.get("questionId")
            Question.objects.filter(pk=question_id, quiz=quiz).delete()
            messages.success(request, "Question deleted")
        
        elif action == "publish":
            if quiz.questions.count() == 0:
                messages.error(request, "Cannot publish a quiz with no questions")
            else:
                quiz.is_published = True
                quiz.save()
                messages.success(request, "Quiz published!")
        
        elif action == "unpublish":
            quiz.is_published = False
            quiz.save()
            messages.info(request, "Quiz unpublished")
        
        return redirect("core:instructor.quiz_edit", quiz_id=quiz.id)
    
    questions = quiz.questions.all()
    
    return render(
        request,
        "Instructor/Quizzes/Edit",
        {
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "description": quiz.description,
                "timeLimit": quiz.time_limit_minutes,
                "maxAttempts": quiz.max_attempts,
                "passThreshold": quiz.pass_threshold,
                "isPublished": quiz.is_published,
                "nodeId": quiz.node.id,
                "nodeTitle": quiz.node.title,
                "programName": quiz.node.program.name,
            },
            "questions": [
                {
                    "id": q.id,
                    "type": q.question_type,
                    "text": q.text,
                    "points": q.points,
                    "position": q.position,
                    "answerData": q.answer_data,
                }
                for q in questions
            ],
        },
    )


@login_required
def instructor_quiz_delete(request, quiz_id: int):
    """
    Delete a quiz.
    """
    from apps.assessments.models import Quiz
    from apps.progression.models import InstructorAssignment
    
    if request.method != "POST":
        return redirect("/dashboard/")
    
    try:
        quiz = Quiz.objects.select_related('node', 'node__program').get(pk=quiz_id)
    except Quiz.DoesNotExist:
        messages.error(request, "Quiz not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=quiz.node.program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    node_id = quiz.node.id
    quiz.delete()
    messages.success(request, "Quiz deleted")
    return redirect("core:instructor.quizzes", node_id=node_id)


# =============================================================================
# Quiz Taking Views (Student)
# =============================================================================


@login_required
def student_quiz_start(request, quiz_id: int):
    """
    Start a quiz attempt.
    """
    from apps.assessments.models import Quiz, QuizAttempt
    from apps.progression.models import Enrollment
    
    try:
        quiz = Quiz.objects.select_related('node', 'node__program').prefetch_related('questions').get(pk=quiz_id, is_published=True)
    except Quiz.DoesNotExist:
        messages.error(request, "Quiz not found or not published")
        return redirect("/dashboard/")
    
    # Check enrollment
    try:
        enrollment = Enrollment.objects.get(user=request.user, program=quiz.node.program, status='active')
    except Enrollment.DoesNotExist:
        messages.error(request, "You are not enrolled in this program")
        return redirect("/dashboard/")
    
    # Check attempts remaining
    existing_attempts = QuizAttempt.objects.filter(enrollment=enrollment, quiz=quiz).count()
    if existing_attempts >= quiz.max_attempts:
        messages.error(request, "You have used all your attempts for this quiz")
        return redirect("core:student.quiz_results", quiz_id=quiz_id)
    
    # Check for in-progress attempt
    in_progress = QuizAttempt.objects.filter(
        enrollment=enrollment, quiz=quiz, submitted_at__isnull=True
    ).first()
    
    if in_progress:
        # Resume existing attempt
        attempt = in_progress
    else:
        # Start new attempt
        attempt = QuizAttempt.objects.create(
            enrollment=enrollment,
            quiz=quiz,
            attempt_number=existing_attempts + 1,
            started_at=timezone.now(),
        )
    
    # Serialize questions (without answers for student view)
    questions = [
        {
            "id": q.id,
            "type": q.question_type,
            "text": q.text,
            "points": q.points,
            "options": q.answer_data.get("options") if q.question_type == "mcq" else None,
        }
        for q in quiz.questions.all()
    ]
    
    return render(
        request,
        "Student/Quiz/Take",
        {
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "description": quiz.description,
                "timeLimit": quiz.time_limit_minutes,
                "nodeTitle": quiz.node.title,
            },
            "attempt": {
                "id": attempt.id,
                "attemptNumber": attempt.attempt_number,
                "startedAt": attempt.started_at.isoformat(),
                "answers": attempt.answers,
            },
            "questions": questions,
            "attemptsRemaining": quiz.max_attempts - existing_attempts - (0 if in_progress else 1),
        },
    )


@login_required
def student_quiz_submit(request, quiz_id: int):
    """
    Submit quiz answers and calculate score.
    """
    from apps.assessments.models import Quiz, QuizAttempt
    from apps.progression.models import Enrollment
    
    if request.method != "POST":
        return redirect("core:student.quiz_start", quiz_id=quiz_id)
    
    try:
        quiz = Quiz.objects.get(pk=quiz_id)
    except Quiz.DoesNotExist:
        messages.error(request, "Quiz not found")
        return redirect("/dashboard/")
    
    try:
        enrollment = Enrollment.objects.get(user=request.user, program=quiz.node.program)
    except Enrollment.DoesNotExist:
        return redirect("/dashboard/")
    
    # Get in-progress attempt
    attempt = QuizAttempt.objects.filter(
        enrollment=enrollment, quiz=quiz, submitted_at__isnull=True
    ).first()
    
    if not attempt:
        messages.error(request, "No quiz attempt in progress")
        return redirect("core:student.quiz_start", quiz_id=quiz_id)
    
    # Save answers
    data = _get_post_data(request)
    attempt.answers = data.get("answers", {})
    attempt.submitted_at = timezone.now()
    
    # Calculate score
    points_earned, points_possible, percentage, passed = attempt.calculate_score()
    attempt.points_earned = points_earned
    attempt.points_possible = points_possible
    attempt.score = percentage
    attempt.passed = passed
    attempt.save()
    
    if passed is True:
        messages.success(request, f"Congratulations! You passed with {percentage}%!")
    elif passed is False:
        messages.warning(request, f"You scored {percentage}%. Required: {quiz.pass_threshold}%")
    else:
        messages.info(request, "Your quiz has been submitted for review.")
    
    return redirect("core:student.quiz_results", quiz_id=quiz_id)


@login_required
def student_quiz_results(request, quiz_id: int):
    """
    View quiz results.
    """
    from apps.assessments.models import Quiz, QuizAttempt
    from apps.progression.models import Enrollment
    
    try:
        quiz = Quiz.objects.select_related('node', 'node__program').get(pk=quiz_id)
    except Quiz.DoesNotExist:
        messages.error(request, "Quiz not found")
        return redirect("/dashboard/")
    
    try:
        enrollment = Enrollment.objects.get(user=request.user, program=quiz.node.program)
    except Enrollment.DoesNotExist:
        return redirect("/dashboard/")
    
    attempts = QuizAttempt.objects.filter(
        enrollment=enrollment, quiz=quiz, submitted_at__isnull=False
    ).order_by('-attempt_number')
    
    return render(
        request,
        "Student/Quiz/Results",
        {
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "passThreshold": quiz.pass_threshold,
                "maxAttempts": quiz.max_attempts,
                "nodeTitle": quiz.node.title,
            },
            "attempts": [
                {
                    "id": a.id,
                    "attemptNumber": a.attempt_number,
                    "score": float(a.score) if a.score else None,
                    "pointsEarned": a.points_earned,
                    "pointsPossible": a.points_possible,
                    "passed": a.passed,
                    "submittedAt": a.submitted_at.isoformat() if a.submitted_at else None,
                }
                for a in attempts
            ],
            "canRetry": attempts.count() < quiz.max_attempts,
        },
    )


# =============================================================================
# Assignment Management Views (Instructor)
# =============================================================================


@login_required
def instructor_assignments(request, program_id: int):
    """
    List assignments for a program.
    """
    from apps.assessments.models import Assignment
    from apps.progression.models import InstructorAssignment
    
    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    assignments = Assignment.objects.filter(program=program).order_by('created_at')
    
    return render(
        request,
        "Instructor/Assignments/Index",
        {
            "program": {
                "id": program.id,
                "name": program.name,
            },
            "assignments": [
                {
                    "id": a.id,
                    "title": a.title,
                    "weight": a.weight,
                    "dueDate": a.due_date.isoformat() if a.due_date else None,
                    "submissionType": a.submission_type,
                    "isPublished": a.is_published,
                    "submissionCount": a.submissions.count(),
                    "pendingCount": a.submissions.filter(status='submitted').count(),
                }
                for a in assignments
            ],
        },
    )


@login_required
def instructor_assignment_create(request, program_id: int):
    """
    Create a new assignment.
    """
    from apps.assessments.models import Assignment
    from apps.progression.models import InstructorAssignment
    
    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    if request.method == "POST":
        data = _get_post_data(request)
        
        due_date = None
        if data.get("dueDate"):
            from django.utils.dateparse import parse_datetime
            due_date = parse_datetime(data.get("dueDate"))
        
        assignment = Assignment.objects.create(
            program=program,
            title=data.get("title", "Untitled Assignment"),
            description=data.get("description", ""),
            instructions=data.get("instructions", ""),
            weight=int(data.get("weight", 20)),
            due_date=due_date,
            allow_late_submission=data.get("allowLateSubmission", False),
            late_penalty_percent=int(data.get("latePenalty", 0)),
            submission_type=data.get("submissionType", "file"),
            allowed_file_types=data.get("allowedFileTypes", ["pdf", "docx"]),
        )
        
        messages.success(request, "Assignment created!")
        return redirect("core:instructor.assignment_edit", assignment_id=assignment.id)
    
    return render(
        request,
        "Instructor/Assignments/Create",
        {
            "program": {
                "id": program.id,
                "name": program.name,
            },
        },
    )


@login_required
def instructor_assignment_edit(request, assignment_id: int):
    """
    Edit assignment details.
    """
    from apps.assessments.models import Assignment
    from apps.progression.models import InstructorAssignment
    
    try:
        assignment = Assignment.objects.select_related('program').get(pk=assignment_id)
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=assignment.program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    if request.method == "POST":
        data = _get_post_data(request)
        action = data.get("action", "save")
        
        if action == "save":
            assignment.title = data.get("title", assignment.title)
            assignment.description = data.get("description", assignment.description)
            assignment.instructions = data.get("instructions", assignment.instructions)
            assignment.weight = int(data.get("weight", assignment.weight))
            
            if data.get("dueDate"):
                from django.utils.dateparse import parse_datetime
                assignment.due_date = parse_datetime(data.get("dueDate"))
            
            assignment.allow_late_submission = data.get("allowLateSubmission", False)
            assignment.late_penalty_percent = int(data.get("latePenalty", 0))
            assignment.submission_type = data.get("submissionType", assignment.submission_type)
            assignment.allowed_file_types = data.get("allowedFileTypes", assignment.allowed_file_types)
            assignment.save()
            messages.success(request, "Assignment updated")
        
        elif action == "publish":
            assignment.is_published = True
            assignment.save()
            messages.success(request, "Assignment published!")
        
        elif action == "unpublish":
            assignment.is_published = False
            assignment.save()
            messages.info(request, "Assignment unpublished")
        
        return redirect("core:instructor.assignment_edit", assignment_id=assignment.id)
    
    return render(
        request,
        "Instructor/Assignments/Edit",
        {
            "assignment": {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "instructions": assignment.instructions,
                "weight": assignment.weight,
                "dueDate": assignment.due_date.isoformat() if assignment.due_date else None,
                "allowLateSubmission": assignment.allow_late_submission,
                "latePenalty": assignment.late_penalty_percent,
                "submissionType": assignment.submission_type,
                "allowedFileTypes": assignment.allowed_file_types,
                "isPublished": assignment.is_published,
                "programId": assignment.program.id,
                "programName": assignment.program.name,
            },
        },
    )


@login_required
def instructor_assignment_submissions(request, assignment_id: int):
    """
    View/grade student submissions for an assignment.
    """
    from apps.assessments.models import Assignment, AssignmentSubmission
    from apps.progression.models import InstructorAssignment
    
    try:
        assignment = Assignment.objects.select_related('program').get(pk=assignment_id)
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=assignment.program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    status_filter = request.GET.get("status", "all")
    submissions = AssignmentSubmission.objects.filter(assignment=assignment).select_related(
        'enrollment', 'enrollment__user'
    ).order_by('-submitted_at')
    
    if status_filter != "all":
        submissions = submissions.filter(status=status_filter)
    
    return render(
        request,
        "Instructor/Assignments/Submissions",
        {
            "assignment": {
                "id": assignment.id,
                "title": assignment.title,
                "programId": assignment.program.id,
                "programName": assignment.program.name,
            },
            "submissions": [
                {
                    "id": s.id,
                    "studentId": s.enrollment.user.id,
                    "studentName": s.enrollment.user.get_full_name() or s.enrollment.user.email,
                    "studentEmail": s.enrollment.user.email,
                    "status": s.status,
                    "submittedAt": s.submitted_at.isoformat(),
                    "isLate": s.is_late,
                    "hasFile": bool(s.file_path),
                    "hasText": bool(s.text_content),
                    "score": float(s.score) if s.score else None,
                    "finalScore": s.get_final_score(),
                }
                for s in submissions
            ],
            "filter": status_filter,
        },
    )


@login_required
def instructor_assignment_grade(request, submission_id: int):
    """
    Grade a single submission.
    """
    from apps.assessments.models import AssignmentSubmission
    from apps.progression.models import InstructorAssignment
    
    try:
        submission = AssignmentSubmission.objects.select_related(
            'assignment', 'assignment__program', 'enrollment', 'enrollment__user'
        ).get(pk=submission_id)
    except AssignmentSubmission.DoesNotExist:
        messages.error(request, "Submission not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=submission.assignment.program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    if request.method == "POST":
        data = _get_post_data(request)
        
        submission.score = float(data.get("score", 0))
        submission.feedback = data.get("feedback", "")
        submission.status = data.get("status", "graded")
        submission.graded_by = request.user
        submission.graded_at = timezone.now()
        submission.save()
        
        messages.success(request, "Submission graded")
        return redirect("core:instructor.assignment_submissions", assignment_id=submission.assignment.id)
    
    return render(
        request,
        "Instructor/Assignments/Grade",
        {
            "submission": {
                "id": submission.id,
                "studentName": submission.enrollment.user.get_full_name() or submission.enrollment.user.email,
                "studentEmail": submission.enrollment.user.email,
                "status": submission.status,
                "submittedAt": submission.submitted_at.isoformat(),
                "isLate": submission.is_late,
                "filePath": submission.file_path,
                "fileName": submission.file_name,
                "textContent": submission.text_content,
                "score": float(submission.score) if submission.score else None,
                "feedback": submission.feedback,
            },
            "assignment": {
                "id": submission.assignment.id,
                "title": submission.assignment.title,
                "instructions": submission.assignment.instructions,
                "latePenalty": submission.assignment.late_penalty_percent,
            },
        },
    )


# =============================================================================
# Assignment Views (Student)
# =============================================================================


@login_required
def student_assignments(request, program_id: int):
    """
    List assignments for an enrolled program.
    """
    from apps.assessments.models import Assignment, AssignmentSubmission
    from apps.progression.models import Enrollment
    
    try:
        enrollment = Enrollment.objects.select_related('program').get(
            user=request.user, program_id=program_id, status='active'
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "You are not enrolled in this program")
        return redirect("/dashboard/")
    
    assignments = Assignment.objects.filter(program_id=program_id, is_published=True).order_by('due_date')
    
    # Get existing submissions
    submissions = {
        s.assignment_id: s
        for s in AssignmentSubmission.objects.filter(
            enrollment=enrollment, assignment__in=assignments
        )
    }
    
    return render(
        request,
        "Student/Assignments/Index",
        {
            "program": {
                "id": enrollment.program.id,
                "name": enrollment.program.name,
            },
            "assignments": [
                {
                    "id": a.id,
                    "title": a.title,
                    "description": a.description,
                    "dueDate": a.due_date.isoformat() if a.due_date else None,
                    "weight": a.weight,
                    "submissionType": a.submission_type,
                    "submitted": a.id in submissions,
                    "submission": {
                        "id": submissions[a.id].id,
                        "status": submissions[a.id].status,
                        "score": float(submissions[a.id].score) if submissions[a.id].score else None,
                        "submittedAt": submissions[a.id].submitted_at.isoformat(),
                    } if a.id in submissions else None,
                }
                for a in assignments
            ],
        },
    )


@login_required
def student_assignment_view(request, assignment_id: int):
    """
    View assignment details and submit.
    """
    from apps.assessments.models import Assignment, AssignmentSubmission
    from apps.progression.models import Enrollment
    
    try:
        assignment = Assignment.objects.select_related('program').get(pk=assignment_id, is_published=True)
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")
    
    try:
        enrollment = Enrollment.objects.get(user=request.user, program=assignment.program, status='active')
    except Enrollment.DoesNotExist:
        messages.error(request, "You are not enrolled in this program")
        return redirect("/dashboard/")
    
    # Get existing submission
    existing = AssignmentSubmission.objects.filter(enrollment=enrollment, assignment=assignment).first()
    
    return render(
        request,
        "Student/Assignments/View",
        {
            "assignment": {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "instructions": assignment.instructions,
                "dueDate": assignment.due_date.isoformat() if assignment.due_date else None,
                "weight": assignment.weight,
                "submissionType": assignment.submission_type,
                "allowedFileTypes": assignment.allowed_file_types,
                "allowLateSubmission": assignment.allow_late_submission,
                "latePenalty": assignment.late_penalty_percent,
                "programName": assignment.program.name,
            },
            "submission": {
                "id": existing.id,
                "status": existing.status,
                "submittedAt": existing.submitted_at.isoformat(),
                "isLate": existing.is_late,
                "fileName": existing.file_name,
                "textContent": existing.text_content,
                "score": float(existing.score) if existing.score else None,
                "feedback": existing.feedback,
            } if existing else None,
        },
    )


@login_required
def student_assignment_submit(request, assignment_id: int):
    """
    Submit an assignment.
    """
    from apps.assessments.models import Assignment, AssignmentSubmission
    from apps.progression.models import Enrollment
    import os
    import uuid
    
    if request.method != "POST":
        return redirect("core:student.assignment", assignment_id=assignment_id)
    
    try:
        assignment = Assignment.objects.select_related('program').get(pk=assignment_id, is_published=True)
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")
    
    try:
        enrollment = Enrollment.objects.get(user=request.user, program=assignment.program, status='active')
    except Enrollment.DoesNotExist:
        return redirect("/dashboard/")
    
    # Check for existing submission
    existing = AssignmentSubmission.objects.filter(enrollment=enrollment, assignment=assignment).first()
    if existing and existing.status == 'graded':
        messages.error(request, "This assignment has already been graded")
        return redirect("core:student.assignment", assignment_id=assignment_id)
    
    # Check due date
    is_late = False
    if assignment.due_date and timezone.now() > assignment.due_date:
        if not assignment.allow_late_submission:
            messages.error(request, "The submission deadline has passed")
            return redirect("core:student.assignment", assignment_id=assignment_id)
        is_late = True
    
    # Handle file upload
    file_path = None
    file_name = None
    if 'file' in request.FILES:
        uploaded_file = request.FILES['file']
        file_name = uploaded_file.name
        
        # Validate file type
        ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else ''
        if assignment.allowed_file_types and ext not in assignment.allowed_file_types:
            messages.error(request, f"File type .{ext} is not allowed")
            return redirect("core:student.assignment", assignment_id=assignment_id)
        
        # Save file
        from django.conf import settings
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'submissions', str(assignment.id))
        os.makedirs(upload_dir, exist_ok=True)
        unique_name = f"{uuid.uuid4().hex}_{file_name}"
        file_path = os.path.join(upload_dir, unique_name)
        
        with open(file_path, 'wb+') as dest:
            for chunk in uploaded_file.chunks():
                dest.write(chunk)
    
    # Get text content
    text_content = request.POST.get('text_content', '')
    
    if existing:
        # Update existing submission
        existing.file_path = file_path or existing.file_path
        existing.file_name = file_name or existing.file_name
        existing.text_content = text_content or existing.text_content
        existing.submitted_at = timezone.now()
        existing.is_late = is_late
        existing.status = 'submitted'
        existing.save()
        messages.success(request, "Assignment resubmitted")
    else:
        # Create new submission
        AssignmentSubmission.objects.create(
            enrollment=enrollment,
            assignment=assignment,
            file_path=file_path,
            file_name=file_name,
            text_content=text_content,
            submitted_at=timezone.now(),
            is_late=is_late,
        )
        messages.success(request, "Assignment submitted!")
    
    return redirect("core:student.assignment", assignment_id=assignment_id)


# =============================================================================
# Course Vetting Workflow Views
# =============================================================================


@login_required
def instructor_program_submit_for_review(request, program_id: int):
    """
    Submit a program for admin review.
    """
    from apps.progression.models import InstructorAssignment
    
    if request.method != "POST":
        return redirect("core:instructor.program", pk=program_id)
    
    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    # Validate program can be submitted
    if program.submission_status not in ('draft', 'changes_requested'):
        messages.error(request, "This program cannot be submitted in its current state")
        return redirect("core:instructor.program", pk=program_id)
    
    # Update status
    program.submission_status = 'submitted'
    program.submitted_at = timezone.now()
    program.submitted_by = request.user
    program.save()
    
    messages.success(request, "Program submitted for review! You'll be notified when it's reviewed.")
    return redirect("core:instructor.program", pk=program_id)


@login_required
def admin_course_approval_queue(request):
    """
    Admin view: List programs pending approval.
    """
    if not request.user.is_staff:
        return redirect("/dashboard/")
    
    status_filter = request.GET.get("status", "submitted")
    
    programs = Program.objects.select_related('submitted_by').filter(
        submission_status=status_filter
    ).order_by('-submitted_at')
    
    return render(
        request,
        "Admin/CourseApproval/Index",
        {
            "programs": [
                {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description[:200] + "..." if len(p.description) > 200 else p.description,
                    "submittedAt": p.submitted_at.isoformat() if p.submitted_at else None,
                    "submittedBy": {
                        "id": p.submitted_by.id,
                        "name": p.submitted_by.get_full_name() or p.submitted_by.email,
                    } if p.submitted_by else None,
                    "status": p.submission_status,
                }
                for p in programs
            ],
            "filter": status_filter,
        },
    )


@login_required
def admin_course_review(request, program_id: int):
    """
    Admin view: Review a single program submission.
    """
    from apps.curriculum.models import CurriculumNode, CourseChangeRequest
    
    if not request.user.is_staff:
        return redirect("/dashboard/")
    
    try:
        program = Program.objects.select_related('submitted_by').get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("core:admin.course_approval")
    
    # Get curriculum structure
    nodes = CurriculumNode.objects.filter(program=program).order_by('path')
    
    # Get existing change requests
    change_requests = CourseChangeRequest.objects.filter(
        program=program, is_resolved=False
    ).select_related('node', 'created_by')
    
    return render(
        request,
        "Admin/CourseApproval/Review",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "description": program.description,
                "status": program.submission_status,
                "submittedAt": program.submitted_at.isoformat() if program.submitted_at else None,
                "submittedBy": {
                    "id": program.submitted_by.id,
                    "name": program.submitted_by.get_full_name() or program.submitted_by.email,
                    "email": program.submitted_by.email,
                } if program.submitted_by else None,
                "isPublished": program.is_published,
            },
            "curriculum": [
                {
                    "id": n.id,
                    "title": n.title,
                    "nodeType": n.node_type,
                    "depth": n.depth,
                    "path": n.path,
                }
                for n in nodes
            ],
            "changeRequests": [
                {
                    "id": cr.id,
                    "message": cr.message,
                    "nodeId": cr.node.id if cr.node else None,
                    "nodeTitle": cr.node.title if cr.node else "General",
                    "createdAt": cr.created_at.isoformat(),
                    "createdBy": cr.created_by.get_full_name() or cr.created_by.email,
                }
                for cr in change_requests
            ],
        },
    )


@login_required
def admin_course_approve(request, program_id: int):
    """
    Approve a program submission.
    """
    if not request.user.is_staff or request.method != "POST":
        return redirect("core:admin.course_approval")
    
    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("core:admin.course_approval")
    
    if program.submission_status != 'submitted':
        messages.error(request, "Program is not pending approval")
        return redirect("core:admin.course_review", program_id=program_id)
    
    program.submission_status = 'approved'
    program.save()
    
    # TODO: Send approval notification email to instructor
    
    messages.success(request, f"Program '{program.name}' has been approved!")
    return redirect("core:admin.course_approval")


@login_required
def admin_course_request_changes(request, program_id: int):
    """
    Request changes on a program submission.
    """
    from apps.curriculum.models import CourseChangeRequest
    
    if not request.user.is_staff or request.method != "POST":
        return redirect("core:admin.course_approval")
    
    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("core:admin.course_approval")
    
    data = _get_post_data(request)
    message = data.get("message", "").strip()
    node_id = data.get("nodeId")
    
    if not message:
        messages.error(request, "Please provide feedback for the instructor")
        return redirect("core:admin.course_review", program_id=program_id)
    
    # Create change request
    node = None
    if node_id:
        from apps.curriculum.models import CurriculumNode
        node = CurriculumNode.objects.filter(pk=node_id, program=program).first()
    
    CourseChangeRequest.objects.create(
        program=program,
        node=node,
        message=message,
        created_by=request.user,
    )
    
    # Update program status
    if program.submission_status == 'submitted':
        program.submission_status = 'changes_requested'
        program.save()
    
    # TODO: Send notification email to instructor
    
    messages.success(request, "Change request added")
    return redirect("core:admin.course_review", program_id=program_id)


@login_required
def instructor_program_change_requests(request, program_id: int):
    """
    Instructor view: See change requests for their program.
    """
    from apps.curriculum.models import CourseChangeRequest
    from apps.progression.models import InstructorAssignment
    
    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    change_requests = CourseChangeRequest.objects.filter(
        program=program
    ).select_related('node', 'created_by').order_by('-created_at')
    
    return render(
        request,
        "Instructor/Program/ChangeRequests",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "status": program.submission_status,
            },
            "changeRequests": [
                {
                    "id": cr.id,
                    "message": cr.message,
                    "nodeId": cr.node.id if cr.node else None,
                    "nodeTitle": cr.node.title if cr.node else "General",
                    "isResolved": cr.is_resolved,
                    "createdAt": cr.created_at.isoformat(),
                }
                for cr in change_requests
            ],
        },
    )


@login_required
def instructor_resolve_change_request(request, change_request_id: int):
    """
    Mark a change request as resolved.
    """
    from apps.curriculum.models import CourseChangeRequest
    from apps.progression.models import InstructorAssignment
    
    if request.method != "POST":
        return redirect("/dashboard/")
    
    try:
        cr = CourseChangeRequest.objects.select_related('program').get(pk=change_request_id)
    except CourseChangeRequest.DoesNotExist:
        messages.error(request, "Change request not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=cr.program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    cr.is_resolved = True
    cr.save()
    
    messages.success(request, "Change request marked as resolved")
    return redirect("core:instructor.program_change_requests", program_id=cr.program.id)


@login_required
def instructor_program_publish(request, program_id: int):
    """
    Publish an approved program.
    """
    from apps.progression.models import InstructorAssignment
    
    if request.method != "POST":
        return redirect("core:instructor.program", pk=program_id)
    
    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("/dashboard/")
    
    # Verify instructor access
    if not InstructorAssignment.objects.filter(
        instructor=request.user, program=program
    ).exists() and not request.user.is_staff:
        return redirect("/dashboard/")
    
    # Only approved programs can be published
    if program.submission_status != 'approved':
        messages.error(request, "Only approved programs can be published")
        return redirect("core:instructor.program", pk=program_id)
    
    program.is_published = True
    program.save()
    
    messages.success(request, f"'{program.name}' is now live for students!")
    return redirect("core:instructor.program", pk=program_id)


@login_required
def admin_preview_as_student(request, program_id: int):
    """
    Deep link for admin to preview a program as a student would see it.
    """
    if not request.user.is_staff:
        return redirect("/dashboard/")
    
    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("core:admin.course_approval")
    
    # Mark session as preview mode
    request.session['preview_program_id'] = program_id
    
    # Redirect to public program detail (or student learning view)
    return redirect("core:programs")  # This would ideally go to a program detail page
