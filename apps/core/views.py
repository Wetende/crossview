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
    Platform landing page.
    Requirements: 1.1, 1.2, 1.3
    """
    return render(
        request,
        "Public/Landing",
        {},
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
    # Base query
    programs_query = Program.objects.filter(is_published=True)

    # Search filtering
    search = request.GET.get("search", "")
    if search:
        programs_query = programs_query.filter(name__icontains=search)

    programs = programs_query.values(
        "id", "name", "code", "description", "created_at"
    ).order_by("name")

    return render(
        request,
        "Public/Programs",
        {
            "programs": list(programs),
            "filters": {"search": search},
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
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # Log in the new user
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
    """Get dashboard data for admins (single-tenant)."""
    from apps.progression.models import Enrollment
    from apps.certifications.models import Certificate

    # Get stats for entire platform (single-tenant)
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
    """Get dashboard data for super admins (single-tenant platform settings)."""
    from apps.tenants.services import PlatformSettingsService
    
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
    from apps.tenants.models import PlatformSettings
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

    # Build query (single-tenant: all programs)
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


def _serialize_user(user: User) -> dict:
    """Serialize user for frontend."""
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "isActive": user.is_active,
    }
