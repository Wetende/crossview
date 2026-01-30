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
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import ensure_csrf_cookie
from inertia import render

from apps.certifications.models import Certificate, VerificationLog
from apps.core.models import Program, User
from apps.core.utils import get_instructor_program_ids, get_post_data, is_instructor


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


def _group_programs_by_level(
    programs: list, course_levels: list, level_key: str = "level"
) -> list:
    """
    Group program dictionaries by configured course level values.

    Returns ordered groups using course_levels order with a fallback group for unknown levels.
    """
    level_map = {}
    ordered_values = []
    for level in course_levels or []:
        value = (level or {}).get("value")
        label = (level or {}).get("label")
        if value:
            level_map[value] = label or value
            ordered_values.append(value)

    groups = []
    grouped = {value: [] for value in ordered_values}
    unknown = []

    for program in programs:
        level_value = (program or {}).get(level_key) or ""
        if level_value in grouped:
            grouped[level_value].append(program)
        else:
            unknown.append(program)

    for value in ordered_values:
        groups.append(
            {
                "value": value,
                "label": level_map.get(value, value),
                "programs": grouped[value],
            }
        )

    if unknown:
        groups.append(
            {"value": "unassigned", "label": "Unassigned", "programs": unknown}
        )

    return groups


# =============================================================================
# Public Pages
# =============================================================================


def landing_page(request):
    """
    Platform landing page with programs showcase.
    Requirements: 1.1, 1.2, 1.3
    """
    from django.db.models import Count

    from apps.progression.models import Enrollment

    # Get top 6 published programs with enrollment counts
    programs = Program.objects.filter(is_published=True).order_by("-created_at")[:6]

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
            "thumbnail": p.thumbnail.url if p.thumbnail else None,
            "badge_type": p.badge_type,
            "category": p.category,
            "rating": 4.5,  # Placeholder rating
            "price": p.custom_pricing.get("price", 0) if p.custom_pricing else 0,
            "original_price": p.custom_pricing.get("original_price")
            if p.custom_pricing
            else None,
            "enrollmentCount": enrollment_counts.get(p.id, 0),
        }
        for p in programs
    ]

    # Get ALL published programs for contact form dropdown
    all_programs = Program.objects.filter(is_published=True).order_by("name")
    all_programs_data = [{"id": p.id, "name": p.name} for p in all_programs]

    # Get stats for the stats section
    total_programs = Program.objects.filter(is_published=True).count()
    total_students = Enrollment.objects.values("user").distinct().count()

    return render(
        request,
        "Public/Landing",
        {
            "programs": programs_data,
            "allPrograms": all_programs_data,  # For contact form dropdown
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
    """Contact page with inquiry form. Also handles hero section form submissions."""
    if request.method == "POST":
        from apps.core.models import ContactInquiry, Program

        data = get_post_data(request)

        # Get program if specified (from course dropdown)
        program = None
        program_id = data.get("course") or data.get("program_id")
        if program_id:
            try:
                program = Program.objects.get(pk=program_id)
            except (Program.DoesNotExist, ValueError):
                pass

        # Save inquiry
        ContactInquiry.objects.create(
            name=data.get("name", ""),
            email=data.get("email", ""),
            phone=data.get("phone", ""),
            program=program,
            message=data.get("message", ""),
        )

        messages.success(
            request, "Thank you for your message. We will contact you shortly."
        )
        return redirect("contact")

    return render(request, "Public/Contact")


def public_programs_list(request):
    """
    Public catalog of published programs.
    """
    from django.db.models import Count

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment, EnrollmentRequest

    # Base query
    programs_query = Program.objects.filter(is_published=True)

    # Search filtering
    search = request.GET.get("search", "")
    if search:
        programs_query = programs_query.filter(name__icontains=search)

    # Category filtering
    category = request.GET.get("category", "")
    if category:
        programs_query = programs_query.filter(category__iexact=category)

    level = request.GET.get("level", "")
    if level:
        programs_query = programs_query.filter(level=level)

    programs = list(programs_query.order_by("name"))

    # Get lecture counts per program
    lecture_counts = dict(
        CurriculumNode.objects.filter(
            program__in=programs,
            is_published=True,
            node_type="lesson",
            children__isnull=True,
        )
        .values("program_id")
        .annotate(count=Count("id"))
        .values_list("program_id", "count")
    )

    # Build programs data with new fields
    programs_data = []
    for p in programs:
        # Get thumbnail URL
        thumbnail_url = p.thumbnail.url if p.thumbnail else None

        # Calculate price display
        price_data = p.custom_pricing or {}
        price = price_data.get("price", 0)
        original_price = price_data.get("original_price")

        programs_data.append(
            {
                "id": p.id,
                "name": p.name,
                "code": p.code or "",
                "description": p.description or "",
                "created_at": p.created_at.isoformat(),
                "thumbnail": thumbnail_url,
                "category": p.category or "",
                "level": p.level or "beginner",
                "badge_type": p.badge_type,
                "duration_hours": p.duration_hours,
                "video_hours": p.video_hours,
                "lecture_count": lecture_counts.get(p.id, 0),
                "price": price,
                "original_price": original_price,
                "rating": 4.5,  # TODO: Calculate from reviews when implemented
            }
        )

    # Get unique categories for filtering
    categories = list(
        Program.objects.filter(is_published=True, category__isnull=False)
        .exclude(category="")
        .values_list("category", flat=True)
        .distinct()
    )

    # Get user enrollment data if authenticated
    user_enrollments = []
    user_pending_requests = []
    if request.user.is_authenticated:
        user_enrollments = list(
            Enrollment.objects.filter(user=request.user).values_list(
                "program_id", flat=True
            )
        )
        user_pending_requests = list(
            EnrollmentRequest.objects.filter(
                user=request.user, status="pending"
            ).values_list("program_id", flat=True)
        )

    from apps.platform.models import PlatformSettings

    platform_settings = PlatformSettings.get_settings()
    course_levels = platform_settings.get_course_levels()
    grouped_programs = _group_programs_by_level(programs_data, course_levels)

    return render(
        request,
        "Public/Programs",
        {
            "programs": programs_data,
            "groupedPrograms": grouped_programs,
            "courseLevels": course_levels,
            "filters": {"search": search, "category": category, "level": level},
            "categories": categories,
            "userEnrollments": user_enrollments,
            "userPendingRequests": user_pending_requests,
        },
    )


def public_program_detail(request, pk: int):
    """
    Public course detail page with full course information.
    Adapts CTAs based on enrollment status and school mode (Chameleon engine).
    """
    from django.db.models import Count
    from django.shortcuts import get_object_or_404

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment, EnrollmentRequest, NodeCompletion

    # Check if this is a preview
    is_preview = request.session.get("preview_program_id") == pk

    if is_preview:
        # Allow access even if not published
        program = get_object_or_404(Program, pk=pk)
    else:
        # Strict check
        program = get_object_or_404(Program, pk=pk, is_published=True)

    # Build curriculum tree for display
    def build_tree(nodes):
        result = []
        for node in nodes:
            # If preview, show all children. If public, show only published.
            if is_preview:
                children = node.children.all().order_by("position")
            else:
                children = node.children.filter(is_published=True).order_by("position")

            result.append(
                {
                    "id": node.id,
                    "title": node.title,
                    "type": node.node_type,
                    "duration": node.properties.get("duration_minutes", 0),
                    "isPreview": node.properties.get("is_preview", False),
                    "children": build_tree(children) if children.exists() else [],
                }
            )
        return result

    if is_preview:
        root_nodes = (
            CurriculumNode.objects.filter(program=program, parent__isnull=True)
            .prefetch_related("children")
            .order_by("position")
        )
    else:
        root_nodes = (
            CurriculumNode.objects.filter(
                program=program, parent__isnull=True, is_published=True
            )
            .prefetch_related("children")
            .order_by("position")
        )

    curriculum = build_tree(root_nodes)

    # Get lecture/lesson count
    lecture_count = CurriculumNode.objects.filter(
        program=program, is_published=True, node_type="lesson", children__isnull=True
    ).count()

    # Get total completable nodes count
    total_nodes = CurriculumNode.objects.filter(
        program=program,
        is_published=True,
        node_type__in=["lesson", "quiz", "assignment"],
    ).count()

    # Get instructor info
    instructors_data = []
    # Use InstructorAssignment model to get correctly assigned instructors
    from apps.progression.models import InstructorAssignment

    assignments = InstructorAssignment.objects.filter(program=program).select_related(
        "instructor"
    )

    for assignment in assignments:
        instructor = assignment.instructor
        instructors_data.append(
            {
                "id": instructor.id,
                "name": instructor.get_full_name() or instructor.email,
                "avatar": None,  # TODO: Add avatar field
                "role": assignment.role,  # Include role (e.g. "Primary Instructor")
            }
        )

    # Get related/popular programs
    related_programs = []
    if program.category:
        related_qs = Program.objects.filter(
            is_published=True, category=program.category
        ).exclude(pk=pk)[:4]

        for p in related_qs:
            price_data = p.custom_pricing or {}
            related_programs.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "thumbnail": p.thumbnail.url if p.thumbnail else None,
                    "category": p.category or "",
                    "rating": 4.5,
                    "price": price_data.get("price", 0),
                }
            )

    # Get user enrollment status and progress
    enrollment_status = None
    enrollment_data = None
    progress_percent = 0
    is_completed = False
    completed_nodes = 0

    if request.user.is_authenticated:
        enrollment = Enrollment.objects.filter(
            user=request.user, program=program
        ).first()
        if enrollment:
            enrollment_status = "enrolled"
            # Calculate progress
            completed_nodes = enrollment.completions.count()
            progress_percent = round(
                (completed_nodes / total_nodes * 100) if total_nodes > 0 else 0, 1
            )
            is_completed = enrollment.status == "completed" or progress_percent >= 100

            enrollment_data = {
                "id": enrollment.id,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
                "progressPercent": progress_percent,
                "isCompleted": is_completed,
                "completedNodes": completed_nodes,
                "totalNodes": total_nodes,
            }
        elif EnrollmentRequest.objects.filter(
            user=request.user, program=program, status="pending"
        ).exists():
            enrollment_status = "pending"

    # Calculate price display and enrollment mode
    price_data = program.custom_pricing or {}
    price = price_data.get("price", 0)

    # Determine enrollment mode based on pricing
    if price > 0:
        enrollment_mode = "paid"
    elif price_data.get("requires_approval", False):
        enrollment_mode = "approval"
    else:
        enrollment_mode = "free"

    # Build program data
    program_data = {
        "id": program.id,
        "name": program.name,
        "code": program.code or "",
        "description": program.description or "",
        "thumbnail": program.thumbnail.url if program.thumbnail else None,
        "category": program.category or "",
        "level": program.level or "beginner",
        "duration_hours": program.duration_hours,
        "video_hours": program.video_hours,
        "lecture_count": lecture_count,
        "badge_type": program.badge_type,
        "price": price,
        "original_price": price_data.get("original_price"),
        "faq": program.faq or [],
        "notices": program.notices or [],
        "what_you_learn": program.what_you_learn or [],
        "resources": [
            {
                "id": r.id,
                "title": r.title,
                "url": r.file.url,
                "type": r.resource_type,
                "ext": r.file.name.split(".")[-1] if "." in r.file.name else "",
            }
            for r in program.resources.all()
        ],
        "rating": 4.5,  # TODO: Calculate from reviews
        "review_count": 0,  # TODO: Count reviews
    }

    # Get course levels for displaying label
    from apps.platform.models import PlatformSettings

    platform_settings = PlatformSettings.get_settings()
    course_levels = platform_settings.get_course_levels()

    return render(
        request,
        "Public/ProgramDetail",
        {
            "program": program_data,
            "curriculum": curriculum,
            "instructors": instructors_data,
            "popularPrograms": related_programs,
            "enrollmentStatus": enrollment_status,
            "enrollmentData": enrollment_data,
            "enrollmentMode": enrollment_mode,
            "courseLevels": course_levels,
        },
    )


def verify_certificate_page(request):
    """
    Certificate verification page.
    """
    result = None

    if request.method == "POST":
        # Get POST data (handles both form-encoded and JSON from Inertia)
        data = get_post_data(request)
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


@ensure_csrf_cookie
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
        data = get_post_data(request)
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
                        "errors": {
                            "auth": "Your account is pending approval. Please wait for an administrator to activate your account."
                        },
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


@ensure_csrf_cookie
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
        data = get_post_data(request)
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
                "An administrator will review your request.",
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


@ensure_csrf_cookie
def forgot_password_page(request):
    """
    Forgot password page - sends reset email.
    """
    if request.user.is_authenticated:
        return redirect("/")

    if request.method == "POST":
        # Get POST data (handles both form-encoded and JSON from Inertia)
        data = get_post_data(request)
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


@ensure_csrf_cookie
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
        data = get_post_data(request)
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
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment, NodeCompletion

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
    from datetime import timedelta

    from apps.practicum.models import PracticumSubmission
    from apps.progression.models import Enrollment, InstructorAssignment

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
    from apps.certifications.models import Certificate
    from apps.progression.models import Enrollment

    # Get stats for entire platform

    # Calculate Total Students (Not staff, not superuser, not in Instructors group)
    total_students = (
        User.objects.filter(is_staff=False, is_superuser=False)
        .exclude(groups__name="Instructors")
        .count()
    )

    # Calculate Total Instructors (In Instructors group)
    total_instructors = User.objects.filter(groups__name="Instructors").count()

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
            "totalInstructors": total_instructors,
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
        return settings.is_feature_enabled("self_registration")
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
    level = request.GET.get("level", "")
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

    if level:
        programs_query = programs_query.filter(level=level)

    # Count and paginate
    total = programs_query.count()
    programs_query = programs_query.order_by("-created_at")
    programs = programs_query[(page - 1) * per_page : page * per_page]

    # Get enrollment counts
    from django.db.models import Count

    from apps.progression.models import Enrollment

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
            "level": p.level or "",
            "isPublished": p.is_published,
            "enrollmentCount": enrollment_counts.get(p.id, 0),
            "createdAt": p.created_at.isoformat(),
        }
        for p in programs
    ]

    # Get blueprints for filter dropdown
    from apps.blueprints.models import AcademicBlueprint

    blueprints = AcademicBlueprint.objects.all().values("id", "name")

    from apps.platform.models import PlatformSettings

    platform_settings = PlatformSettings.get_settings()
    course_levels = platform_settings.get_course_levels()
    grouped_programs = _group_programs_by_level(programs_data, course_levels)

    return render(
        request,
        "Admin/Programs/Index",
        {
            "programs": programs_data,
            "groupedPrograms": grouped_programs,
            "blueprints": list(blueprints),
            "courseLevels": course_levels,
            "filters": {
                "status": status,
                "blueprint": blueprint_id,
                "search": search,
                "level": level,
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

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment, InstructorAssignment

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

    # Get readiness status (even if not publishing yet)
    from apps.core.services.validation import ProgramValidationService

    validator = ProgramValidationService()
    validation_errors = validator.validate(program)

    # Structure readiness report for frontend
    readiness = {
        "isReady": len(validation_errors) == 0,
        "errors": validation_errors,
        "checks": [
            {
                "label": "Structural Integrity",
                "passed": "Program must have at least one Session/Lesson."
                not in validation_errors,
            },
            {
                "label": "Instructor Assignment",
                "passed": "Program must have at least one assigned Instructor."
                not in validation_errors,
            },
            {
                "label": "Metadata (Description)",
                "passed": "Program must have a Description for the public catalog."
                not in validation_errors,
            },
            {
                "label": "Metadata (Thumbnail)",
                "passed": "Program must have a Thumbnail image."
                not in validation_errors,
            },
            {
                "label": "Mode Validations",
                "passed": not any("assessment weight" in e for e in validation_errors),
            },
        ],
    }

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
            "readiness": readiness,
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
    from apps.platform.models import PlatformSettings

    if request.method == "POST":
        data = get_post_data(request)
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
                    "courseLevels": PlatformSettings.get_settings().get_course_levels(),
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
            level=data.get("level", ""),
        )

        # Assign instructors
        instructor_ids = data.get("instructorIds", [])
        for instructor_id in instructor_ids:
            InstructorAssignment.objects.create(
                program=program,
                instructor_id=instructor_id,
                role="instructor",
            )

        return redirect("core:admin.program.content", pk=program.id)

    # GET - show create form
    return render(
        request,
        "Admin/Programs/Form",
        {
            "mode": "create",
            "blueprints": _get_blueprints_for_form(),
            "instructors": _get_instructors_for_form(),
            "courseLevels": PlatformSettings.get_settings().get_course_levels(),
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
    
    from apps.platform.models import PlatformSettings
    from apps.progression.models import Enrollment, InstructorAssignment

    program = get_object_or_404(Program, pk=pk)

    if request.method == "POST":
        data = get_post_data(request)
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
                    "courseLevels": PlatformSettings.get_settings().get_course_levels(),
                    "errors": errors,
                },
            )

        # Update program
        program.name = name
        program.code = data.get("code", "").strip() or None
        program.description = data.get("description", "")
        program.is_published = data.get("isPublished", False)
        program.level = data.get("level", "")

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
            "courseLevels": PlatformSettings.get_settings().get_course_levels(),
            "canChangeBlueprint": not Enrollment.objects.filter(
                program=program
            ).exists(),
        },
    )



@login_required
def admin_program_content(request, pk: int):
    """
    Manage program content/syllabus.
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404

    from apps.core.models import ProgramResource
    from apps.platform.models import PlatformSettings

    program = get_object_or_404(Program, pk=pk)

    if request.method == "POST":
        # Handle file uploads (standard multipart/form-data)
        data = request.POST
        files = request.FILES

        # Update General Info
        program.description = data.get("description", "")
        program.category = data.get("category", "")

        platform_settings = PlatformSettings.get_settings()
        course_levels = platform_settings.get_course_levels()
        valid_level_values = {
            (level or {}).get("value") for level in (course_levels or [])
        }
        selected_level = (data.get("level") or "").strip()
        if not selected_level or selected_level not in valid_level_values:
            messages.error(request, "Level is required and must be a valid option.")
            return redirect("core:admin.program.content", pk=program.id)

        program.level = selected_level

        # Update Content/Syllabus - Split by newline
        what_you_learn_raw = data.get("whatYouLearn", "")
        # Filter empty lines
        program.what_you_learn = [
            line.strip() for line in what_you_learn_raw.split("\n") if line.strip()
        ]

        # Handle Thumbnail
        if "thumbnail" in files:
            program.thumbnail = files["thumbnail"]

        program.save()

        # Handle Course Materials
        # Robust handling for different array naming conventions (materials, materials[], materials[0])
        for key in files:
            if key == "materials" or key.startswith("materials["):
                file_list = files.getlist(key)
                for f in file_list:
                    ProgramResource.objects.create(
                        program=program, file=f, title=f.name, resource_type="material"
                    )

        messages.success(request, "Program content saved successfully")
        return redirect("core:admin.program", pk=program.id)

    # GET - show content form

    # Get platform settings
    platform_settings = PlatformSettings.get_settings()
    course_levels = platform_settings.get_course_levels()
    # Logic: only show categories if explicitly configured in platform settings.
    categories = platform_settings.program_categories or []

    # Serialize what_you_learn as string for TextArea
    what_you_learn_str = "\n".join(program.what_you_learn or [])

    return render(
        request,
        "Admin/Programs/Content",
        {
            "program": {
                **_serialize_program(program),
                "thumbnailUrl": program.thumbnail.url if program.thumbnail else None,
            },
            "initialData": {
                "description": program.description or "",
                "category": program.category or "",
                "level": program.level or "",
                "whatYouLearn": what_you_learn_str,
            },
            "courseLevels": course_levels,
            "categories": categories,
            "resources": [
                {
                    "id": r.id,
                    "title": r.title,
                    "url": r.file.url,
                    "type": r.resource_type,
                }
                for r in program.resources.all()
            ],
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

    from apps.core.services.validation import ProgramValidationService
    from apps.curriculum.models import CurriculumNode

    program = get_object_or_404(Program, pk=pk)

    # If we are TRYING to publish (currently False), run validation
    if not program.is_published:
        validator = ProgramValidationService()
        errors = validator.validate(program)

        if errors:
            # Block publishing
            for error in errors:
                messages.error(request, error)
            return redirect("core:admin.program", pk=pk)

    # Proceed if valid or if unpublishing
    was_published = program.is_published
    program.is_published = not program.is_published
    program.save()

    # Cascade unpublish: when program becomes unpublished, unpublish all child nodes
    if was_published and not program.is_published:
        CurriculumNode.objects.filter(program=program).update(is_published=False)
        messages.success(request, f"Program '{program.name}' unpublished.")
    else:
        messages.success(request, f"Program '{program.name}' published successfully.")

    return redirect("core:admin.program", pk=pk)


def _get_blueprints_for_form() -> list:
    """Get active blueprint(s) for the tenant."""
    from apps.blueprints.models import AcademicBlueprint
    from apps.platform.models import PlatformSettings

    settings = PlatformSettings.get_settings()

    # In single-tenant mode, we only show the configured blueprint
    if settings.active_blueprint:
        blueprints = [settings.active_blueprint]
    else:
        # Fallback: show all blueprints if tenant not fully configured
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
    instructors = User.objects.filter(groups__name="Instructors").order_by(
        "first_name", "last_name"
    )

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
        data = get_post_data(request)
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

    from django.contrib.auth.models import Group
    from django.shortcuts import get_object_or_404

    user = get_object_or_404(User, pk=pk)

    if request.method == "POST":
        data = get_post_data(request)
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

    from django.core.mail import send_mail
    from django.shortcuts import get_object_or_404

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
            f"User {user_email} deleted along with {enrollments_count} enrollment(s)",
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


@login_required
def instructor_programs(request):
    """List programs assigned to this instructor."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    program_ids = get_instructor_program_ids(request.user)
    level = request.GET.get("level", "")
    programs = Program.objects.filter(id__in=program_ids).select_related("blueprint")
    if level:
        programs = programs.filter(level=level)

    from django.db.models import Count

    from apps.progression.models import Enrollment

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
            "level": p.level or "",
            "isPublished": p.is_published,
        }
        for p in programs
    ]

    from apps.platform.models import PlatformSettings

    platform_settings = PlatformSettings.get_settings()
    course_levels = platform_settings.get_course_levels()
    grouped_programs = _group_programs_by_level(programs_data, course_levels)

    return render(
        request,
        "Instructor/Programs/Index",
        {
            "programs": programs_data,
            "groupedPrograms": grouped_programs,
            "courseLevels": course_levels,
            "filters": {"level": level},
        },
    )


@login_required
def instructor_program_detail(request, pk: int):
    """View program details for instructor."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment

    program_ids = get_instructor_program_ids(request.user)
    program = get_object_or_404(Program, pk=pk, id__in=program_ids)

    # Get enrolled students
    enrollments = (
        Enrollment.objects.filter(program=program)
        .select_related("user")
        .order_by("user__last_name", "user__first_name")
    )

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
    nodes = CurriculumNode.objects.filter(
        program=program, parent__isnull=True
    ).order_by("position")

    # Get program resources
    resources = [
        {
            "id": r.id,
            "title": r.title,
            "url": r.file.url,
            "type": r.resource_type,
            "ext": r.file.name.split(".")[-1] if "." in r.file.name else "",
        }
        for r in program.resources.all()
    ]

    return render(
        request,
        "Instructor/Programs/Detail",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "description": program.description or "",
                "resources": resources,
            },
            "students": students_data,
            "curriculum": [
                {"id": n.id, "title": n.title, "type": n.node_type} for n in nodes
            ],
        },
    )


@login_required
def instructor_students(request):
    """List all students enrolled in instructor's programs."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from apps.progression.models import Enrollment

    program_ids = get_instructor_program_ids(request.user)

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
        students_map[e.user.id]["programs"].append(
            {
                "id": e.program.id,
                "name": e.program.name,
                "status": e.status,
            }
        )

    return render(
        request,
        "Instructor/Students/Index",
        {"students": list(students_map.values())},
    )


@login_required
def instructor_student_detail(request, pk: int):
    """View individual student details."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404

    from apps.progression.models import Enrollment, NodeCompletion

    program_ids = get_instructor_program_ids(request.user)
    student = get_object_or_404(User, pk=pk)

    # Only show enrollment data for instructor's programs
    enrollments = Enrollment.objects.filter(
        user=student, program_id__in=program_ids
    ).select_related("program")

    enrollments_data = []
    for e in enrollments:
        completions = NodeCompletion.objects.filter(enrollment=e).count()
        enrollments_data.append(
            {
                "id": e.id,
                "programId": e.program.id,
                "programName": e.program.name,
                "status": e.status,
                "completions": completions,
                "enrolledAt": e.enrolled_at.isoformat(),
            }
        )

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
def instructor_enrollment_status(request, enrollment_id: int):
    """Update enrollment status (active, suspended, withdrawn, completed)."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("core:instructor.students")

    from django.shortcuts import get_object_or_404

    from apps.progression.models import Enrollment

    program_ids = get_instructor_program_ids(request.user)
    enrollment = get_object_or_404(
        Enrollment, pk=enrollment_id, program_id__in=program_ids
    )

    data = get_post_data(request)
    new_status = data.get("status", "")

    valid_statuses = ["active", "suspended", "withdrawn", "completed"]
    if new_status in valid_statuses:
        enrollment.status = new_status
        enrollment.save(update_fields=["status"])
        messages.success(request, f"Enrollment status updated to {new_status}")
    else:
        messages.error(request, "Invalid status")

    return redirect("core:instructor.students")


def _get_students_for_program(program_id: int, user) -> list:
    """
    Get student statistics for a program.
    Extracted from api_instructor_program_students for use with Inertia partial reload.
    """
    from django.shortcuts import get_object_or_404

    from apps.assessments.models import (
        Assignment,
        AssignmentSubmission,
        Quiz,
        QuizAttempt,
    )
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment, NodeCompletion

    program_ids = get_instructor_program_ids(user)
    program = get_object_or_404(Program, pk=program_id, id__in=program_ids)

    # Get enrolled students
    enrollments = (
        Enrollment.objects.filter(program=program, status="active")
        .select_related("user")
        .order_by("user__last_name", "user__first_name")
    )

    # Get curriculum counts for progress calculation
    total_lessons = CurriculumNode.objects.filter(
        program=program, node_type="lesson", is_published=True
    ).count()
    total_quizzes = Quiz.objects.filter(
        node__program=program, is_published=True
    ).count()
    total_assignments = Assignment.objects.filter(
        program=program, is_published=True
    ).count()

    # Prefetch completions and attempts
    enrollment_ids = [e.id for e in enrollments]

    # Node completions by enrollment
    completions = NodeCompletion.objects.filter(
        enrollment_id__in=enrollment_ids
    ).select_related("node")

    completions_by_enrollment = {}
    for c in completions:
        if c.enrollment_id not in completions_by_enrollment:
            completions_by_enrollment[c.enrollment_id] = {"lessons": 0}
        if c.node.node_type == "lesson":
            completions_by_enrollment[c.enrollment_id]["lessons"] += 1

    # Quiz attempts by enrollment
    quiz_attempts = QuizAttempt.objects.filter(
        enrollment_id__in=enrollment_ids, passed=True
    )
    quizzes_passed_by_enrollment = {}
    for attempt in quiz_attempts:
        if attempt.enrollment_id not in quizzes_passed_by_enrollment:
            quizzes_passed_by_enrollment[attempt.enrollment_id] = set()
        quizzes_passed_by_enrollment[attempt.enrollment_id].add(attempt.quiz_id)

    # Assignment submissions by enrollment
    assignment_subs = AssignmentSubmission.objects.filter(
        enrollment_id__in=enrollment_ids, status="graded"
    )
    assignments_passed_by_enrollment = {}
    for sub in assignment_subs:
        if sub.enrollment_id not in assignments_passed_by_enrollment:
            assignments_passed_by_enrollment[sub.enrollment_id] = set()
        # Consider passed if final score >= 50%
        if sub.score and sub.score >= 50:
            assignments_passed_by_enrollment[sub.enrollment_id].add(sub.assignment_id)

    students_data = []
    for e in enrollments:
        lessons_passed = completions_by_enrollment.get(e.id, {}).get("lessons", 0)
        quizzes_passed = len(quizzes_passed_by_enrollment.get(e.id, set()))
        assignments_passed = len(assignments_passed_by_enrollment.get(e.id, set()))

        # Calculate overall progress
        total_items = total_lessons + total_quizzes + total_assignments
        completed_items = lessons_passed + quizzes_passed + assignments_passed
        overall_progress = round(
            (completed_items / total_items * 100) if total_items > 0 else 0
        )

        students_data.append(
            {
                "id": e.id,
                "name": e.user.get_full_name() or e.user.email,
                "email": e.user.email,
                "avatarUrl": None,
                "startedAt": e.enrolled_at.isoformat() if e.enrolled_at else None,
                "lessonsPassed": lessons_passed,
                "lessonsTotal": total_lessons,
                "quizzesPassed": quizzes_passed,
                "quizzesTotal": total_quizzes,
                "assignmentsPassed": assignments_passed,
                "assignmentsTotal": total_assignments,
                "overallProgress": overall_progress,
            }
        )

    return students_data


def instructor_gradebook(request):
    """Gradebook for instructor's programs with partial reload for students."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from apps.progression.models import Enrollment

    program_ids = get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids).select_related("blueprint")

    # Get grading config from blueprint
    programs_data = []
    for p in programs:
        grading_config = p.blueprint.grading_logic if p.blueprint else {}
        enrollments = Enrollment.objects.filter(
            program=p, status="active"
        ).select_related("user")

        programs_data.append(
            {
                "id": p.id,
                "name": p.name,
                "thumbnailUrl": p.thumbnail.url if p.thumbnail else None,
                "gradingType": grading_config.get("type")
                or grading_config.get("mode", "percentage"),
                "gradingConfig": grading_config,
                "studentCount": enrollments.count(),
            }
        )

    # Handle partial reload for expanded program students
    expand_program_id = request.GET.get("expand_program")
    expanded_students = None
    expanded_program_id = None

    if expand_program_id:
        try:
            pid = int(expand_program_id)
            if pid in program_ids:
                expanded_students = _get_students_for_program(pid, request.user)
                expanded_program_id = pid
        except (ValueError, TypeError):
            pass

    return render(
        request,
        "Instructor/Gradebook/Index",
        {
            "programs": programs_data,
            "expandedStudents": expanded_students,
            "expandedProgramId": expanded_program_id,
        },
    )


@login_required
def instructor_grade_entry(request, enrollment_id: int):
    """Enter grades for a specific enrollment."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404

    from apps.progression.models import Enrollment

    program_ids = get_instructor_program_ids(request.user)
    enrollment = get_object_or_404(
        Enrollment, pk=enrollment_id, program_id__in=program_ids
    )

    if request.method == "POST":
        data = get_post_data(request)
        # TODO: Save grades based on blueprint grading_type
        messages.success(request, "Grades saved successfully")
        return redirect("core:instructor.gradebook")

    grading_config = (
        enrollment.program.blueprint.grading_logic
        if enrollment.program.blueprint
        else {}
    )

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
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404

    from apps.assessments.models import (
        Assignment,
        AssignmentSubmission,
        Quiz,
        QuizAttempt,
    )
    from apps.progression.models import Enrollment

    program_ids = get_instructor_program_ids(request.user)
    program = get_object_or_404(Program, pk=pk, id__in=program_ids)

    grading_config = program.blueprint.grading_logic if program.blueprint else {}

    # Get all quizzes and assignments for the program
    quizzes = list(
        Quiz.objects.filter(node__program=program, is_published=True).order_by(
            "created_at"
        )
    )
    assignments = list(
        Assignment.objects.filter(program=program, is_published=True).order_by(
            "created_at"
        )
    )

    # Get enrolled students with their grades
    enrollments = (
        Enrollment.objects.filter(program=program)
        .select_related("user")
        .order_by("user__last_name", "user__first_name")
    )

    # Prefetch quiz attempts and assignment submissions for all enrollments
    enrollment_ids = [e.id for e in enrollments]

    quiz_attempts = QuizAttempt.objects.filter(
        enrollment_id__in=enrollment_ids
    ).select_related("quiz")

    assignment_submissions = AssignmentSubmission.objects.filter(
        enrollment_id__in=enrollment_ids
    ).select_related("assignment")

    # Index attempts/submissions by enrollment
    quiz_attempts_by_enrollment = {}
    for attempt in quiz_attempts:
        if attempt.enrollment_id not in quiz_attempts_by_enrollment:
            quiz_attempts_by_enrollment[attempt.enrollment_id] = {}
        quiz_id = attempt.quiz_id
        # Keep best score per quiz
        if quiz_id not in quiz_attempts_by_enrollment[attempt.enrollment_id]:
            quiz_attempts_by_enrollment[attempt.enrollment_id][quiz_id] = attempt
        elif attempt.score and (
            quiz_attempts_by_enrollment[attempt.enrollment_id][quiz_id].score is None
            or attempt.score
            > quiz_attempts_by_enrollment[attempt.enrollment_id][quiz_id].score
        ):
            quiz_attempts_by_enrollment[attempt.enrollment_id][quiz_id] = attempt

    submissions_by_enrollment = {}
    for sub in assignment_submissions:
        if sub.enrollment_id not in submissions_by_enrollment:
            submissions_by_enrollment[sub.enrollment_id] = {}
        submissions_by_enrollment[sub.enrollment_id][sub.assignment_id] = sub

    students_data = []
    for e in enrollments:
        # Get manual grades from enrollment
        manual_grades = (
            e.grades if hasattr(e, "grades") and e.grades else {"components": {}}
        )

        # Build quiz scores
        quiz_scores = []
        for q in quizzes:
            attempt = quiz_attempts_by_enrollment.get(e.id, {}).get(q.id)
            quiz_scores.append(
                {
                    "quizId": q.id,
                    "title": q.title,
                    "score": float(attempt.score)
                    if attempt and attempt.score
                    else None,
                    "passed": attempt.passed if attempt else None,
                    "attemptCount": QuizAttempt.objects.filter(
                        enrollment=e, quiz=q
                    ).count(),
                }
            )

        # Build assignment scores
        assignment_scores = []
        for a in assignments:
            sub = submissions_by_enrollment.get(e.id, {}).get(a.id)
            assignment_scores.append(
                {
                    "assignmentId": a.id,
                    "title": a.title,
                    "weight": a.weight,
                    "score": sub.get_final_score() if sub and sub.score else None,
                    "status": sub.status if sub else "not_submitted",
                    "isLate": sub.is_late if sub else False,
                }
            )

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

        students_data.append(
            {
                "enrollmentId": e.id,
                "name": e.user.get_full_name() or e.user.email,
                "email": e.user.email,
                "grades": manual_grades,
                "quizScores": quiz_scores,
                "assignmentScores": assignment_scores,
                "overallScore": round(overall, 1) if overall else None,
                "isPublished": getattr(e, "grades_published", False),
            }
        )

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
            "assignments": [
                {"id": a.id, "title": a.title, "weight": a.weight} for a in assignments
            ],
            "students": students_data,
        },
    )


@login_required
def instructor_program_gradebook_save(request, pk: int):
    """Save grades for a specific program."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("core:instructor.gradebook")

    from django.shortcuts import get_object_or_404

    from apps.progression.models import Enrollment

    program_ids = get_instructor_program_ids(request.user)
    program = get_object_or_404(Program, pk=pk, id__in=program_ids)

    data = get_post_data(request)
    grades_data = data.get("grades", {})

    # Update grades for each enrollment
    for enrollment_id_str, grade_info in grades_data.items():
        try:
            enrollment_id = int(enrollment_id_str)
            enrollment = Enrollment.objects.filter(
                id=enrollment_id, program=program
            ).first()
            if enrollment:
                # Store grades in enrollment - this may need a JSONField on Enrollment model
                enrollment.grades = grade_info
                enrollment.save(update_fields=["grades"])
        except (ValueError, TypeError):
            continue

    messages.success(request, "Grades saved successfully")
    return redirect("core:instructor.program_gradebook", pk=pk)


# Note: instructor_content and instructor_content_edit functions removed
# Content editing is now handled by Course Builder via instructor_node_update


@login_required
def instructor_announcements_index(request):
    """
    List all announcements across instructor's programs.
    Announcements are stored in Program.notices JSONField.
    """
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    program_ids = get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids)

    # Gather all notices from all programs
    announcements = []
    for p in programs:
        notices = p.notices or []
        for idx, notice in enumerate(notices):
            announcements.append(
                {
                    "programId": p.id,
                    "programName": p.name,
                    "message": notice.get("message", ""),
                    "createdAt": notice.get("createdAt"),
                    "index": idx,
                }
            )

    # Sort by date descending
    announcements.sort(key=lambda x: x.get("createdAt") or "", reverse=True)

    return render(
        request,
        "Instructor/Announcements/Index",
        {
            "announcements": announcements,
            "programs": [{"id": p.id, "name": p.name} for p in programs],
        },
    )


@login_required
def instructor_announcement_create(request):
    """
    Create a new announcement for a program.
    Appends to Program.notices JSONField.
    """
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    program_ids = get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids)

    if request.method == "POST":
        data = get_post_data(request)
        program_id = data.get("programId")
        message = data.get("message", "").strip()

        if not program_id or not message:
            messages.error(request, "Please select a course and enter a message")
            return render(
                request,
                "Instructor/Announcements/Create",
                {"programs": [{"id": p.id, "name": p.name} for p in programs]},
            )

        try:
            program = Program.objects.get(pk=program_id, id__in=program_ids)
        except Program.DoesNotExist:
            messages.error(request, "Program not found")
            return redirect("core:instructor.announcements")

        # Append new notice
        notices = program.notices or []
        notices.append(
            {
                "message": message,
                "createdAt": timezone.now().isoformat(),
                "createdBy": request.user.id,
            }
        )
        program.notices = notices
        program.save(update_fields=["notices"])

        messages.success(request, "Announcement created successfully")
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
    import os

    from django.conf import settings

    from apps.core.models import InstructorCertification, InstructorProfile

    user = request.user

    # Get or create instructor profile
    profile, created = InstructorProfile.objects.get_or_create(user=user)

    # If already approved, redirect to dashboard
    if profile.status == "approved":
        messages.info(request, "You are already an approved instructor.")
        return redirect("/dashboard/")

    # If pending review, show status page
    if profile.status == "pending_review":
        return render(
            request,
            "Instructor/Apply",
            {
                "profile": _serialize_instructor_profile(profile),
                "isPending": True,
            },
        )

    if request.method == "POST":
        data = get_post_data(request)
        action = data.get("action", "save")

        # Update profile fields
        profile.bio = data.get("bio", profile.bio)
        profile.job_title = data.get("jobTitle", profile.job_title)
        profile.linkedin_url = data.get("linkedinUrl", profile.linkedin_url)
        profile.teaching_experience = data.get(
            "teachingExperience", profile.teaching_experience
        )
        profile.why_teach_here = data.get("whyTeachHere", profile.why_teach_here)

        # Handle resume upload if present
        if "resume" in request.FILES:
            resume_file = request.FILES["resume"]
            upload_dir = os.path.join(
                settings.MEDIA_ROOT, "instructor_resumes", str(user.id)
            )
            os.makedirs(upload_dir, exist_ok=True)
            resume_path = os.path.join(upload_dir, resume_file.name)
            with open(resume_path, "wb+") as destination:
                for chunk in resume_file.chunks():
                    destination.write(chunk)
            profile.resume_path = resume_path

        # Handle certification uploads
        if "certifications" in request.FILES:
            cert_files = request.FILES.getlist("certifications")
            cert_dir = os.path.join(
                settings.MEDIA_ROOT, "instructor_certs", str(user.id)
            )
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
            profile.status = "pending_review"
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
            {"id": c.id, "fileName": c.file_name} for c in certifications
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
    from apps.core.models import InstructorCertification, InstructorProfile

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
    from django.contrib.auth.models import Group

    from apps.core.models import InstructorProfile

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
    profile.status = "approved"
    profile.reviewed_by = request.user
    profile.reviewed_at = timezone.now()
    profile.save()

    # Add user to Instructors group and activate
    instructors_group, _ = Group.objects.get_or_create(name="Instructors")
    profile.user.groups.add(instructors_group)
    profile.user.is_active = True
    profile.user.save()

    # TODO: Send approval email notification

    messages.success(
        request, f"Instructor application for {profile.user.email} has been approved!"
    )
    return redirect("core:admin.instructor_applications")


@login_required
def admin_instructor_application_reject(request, pk: int):
    """
    Reject an instructor application.
    Requires reason and auto-deletes sensitive files.
    """
    import os

    from apps.core.models import InstructorCertification, InstructorProfile

    if not _require_admin(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("core:admin.instructor_applications")

    try:
        profile = InstructorProfile.objects.select_related("user").get(pk=pk)
    except InstructorProfile.DoesNotExist:
        messages.error(request, "Application not found")
        return redirect("core:admin.instructor_applications")

    data = get_post_data(request)
    reason = data.get("reason", "").strip()

    if not reason:
        messages.error(request, "Rejection reason is required")
        return redirect("core:admin.instructor_application", pk=pk)

    # Reject the application
    profile.status = "rejected"
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

    messages.success(
        request, f"Instructor application for {profile.user.email} has been rejected."
    )
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
        profile = InstructorProfile.objects.get(pk=pk, status="rejected")
    except InstructorProfile.DoesNotExist:
        messages.error(request, "Application not found or not in rejected state")
        return redirect("core:admin.instructor_applications")

    # Unlock to draft state
    profile.status = "draft"
    profile.rejection_reason = ""
    profile.save()

    # TODO: Send unlock notification email

    messages.success(request, f"Application unlocked. The user can now resubmit.")
    return redirect("core:admin.instructor_applications")


# Note: instructor_quizzes, instructor_quiz_create, instructor_quiz_edit, and
# instructor_quiz_delete functions removed. Quiz management is now handled by
# Course Builder via QuizEditor component and instructor_node_update.


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
        quiz = (
            Quiz.objects.select_related("node", "node__program")
            .prefetch_related("questions")
            .get(pk=quiz_id, is_published=True)
        )
    except Quiz.DoesNotExist:
        messages.error(request, "Quiz not found or not published")
        return redirect("/dashboard/")

    # Check enrollment
    try:
        enrollment = Enrollment.objects.get(
            user=request.user, program=quiz.node.program, status="active"
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "You are not enrolled in this program")
        return redirect("/dashboard/")

    # Check attempts remaining
    existing_attempts = QuizAttempt.objects.filter(
        enrollment=enrollment, quiz=quiz
    ).count()
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
    # Serialize questions (without answers for student view)
    import random

    quiz_questions = quiz.questions.all().prefetch_related(
        "options", "matching_pairs", "gap_answers"
    )

    questions = []
    for q in quiz_questions:
        q_data = {
            "id": q.id,
            "type": q.question_type,
            "text": q.text,
            "points": q.points,
        }

        if q.question_type in ["mcq", "mcq_multi"]:
            opts = list(q.options.all())
            if quiz.shuffle_options:
                random.shuffle(opts)
            else:
                opts.sort(key=lambda x: x.position)
            q_data["options"] = [o.text for o in opts]

        elif q.question_type == "matching":
            q_data["pairs"] = [
                {"left_text": p.left_text, "right_text": p.right_text}
                for p in q.matching_pairs.all()
            ]

        elif q.question_type == "ordering":
            items = list(q.answer_data.get("correct_order", []))
            random.shuffle(items)
            q_data["items"] = items

        questions.append(q_data)

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
            "attemptsRemaining": quiz.max_attempts
            - existing_attempts
            - (0 if in_progress else 1),
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
        enrollment = Enrollment.objects.get(
            user=request.user, program=quiz.node.program
        )
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
    data = get_post_data(request)
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
        messages.warning(
            request, f"You scored {percentage}%. Required: {quiz.pass_threshold}%"
        )
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
        quiz = Quiz.objects.select_related("node", "node__program").get(pk=quiz_id)
    except Quiz.DoesNotExist:
        messages.error(request, "Quiz not found")
        return redirect("/dashboard/")

    try:
        enrollment = Enrollment.objects.get(
            user=request.user, program=quiz.node.program
        )
    except Enrollment.DoesNotExist:
        return redirect("/dashboard/")

    attempts = QuizAttempt.objects.filter(
        enrollment=enrollment, quiz=quiz, submitted_at__isnull=False
    ).order_by("-attempt_number")

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
                    "submittedAt": a.submitted_at.isoformat()
                    if a.submitted_at
                    else None,
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
def instructor_assignments_global(request):
    """
    Global assignments list across all instructor programs.
    Shows all assignments with passed/non-passed/pending counts.
    """
    from django.db.models import Count, Q

    from apps.assessments.models import Assignment, AssignmentSubmission
    from apps.progression.models import InstructorAssignment

    if not is_instructor(request.user):
        return redirect("/dashboard/")

    program_ids = get_instructor_program_ids(request.user)

    # Get search and filter params
    search = request.GET.get("search", "").strip()
    status_filter = request.GET.get("status", "all")

    # Build query with counts
    assignments = (
        Assignment.objects.filter(program_id__in=program_ids, is_published=True)
        .select_related("program")
        .annotate(
            total_count=Count("submissions"),
            passed_count=Count(
                "submissions",
                filter=Q(submissions__status="graded", submissions__score__gte=50),
            ),
            failed_count=Count(
                "submissions",
                filter=Q(submissions__status="graded", submissions__score__lt=50),
            ),
            pending_count=Count(
                "submissions", filter=Q(submissions__status="submitted")
            ),
        )
        .order_by("-created_at")
    )

    # Apply search filter
    if search:
        assignments = assignments.filter(title__icontains=search)

    # Apply status filter (assignments with at least one submission of that status)
    if status_filter == "pending":
        assignments = assignments.filter(pending_count__gt=0)
    elif status_filter == "passed":
        assignments = assignments.filter(passed_count__gt=0)
    elif status_filter == "failed":
        assignments = assignments.filter(failed_count__gt=0)

    return render(
        request,
        "Instructor/Assignments/Global",
        {
            "assignments": [
                {
                    "id": a.id,
                    "title": a.title,
                    "programId": a.program.id,
                    "programName": a.program.name,
                    "totalCount": a.total_count,
                    "passedCount": a.passed_count,
                    "failedCount": a.failed_count,
                    "pendingCount": a.pending_count,
                }
                for a in assignments
            ],
            "search": search,
            "filter": status_filter,
        },
    )


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
    if (
        not InstructorAssignment.objects.filter(
            instructor=request.user, program=program
        ).exists()
        and not request.user.is_staff
    ):
        return redirect("/dashboard/")

    assignments = Assignment.objects.filter(program=program).order_by("created_at")

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
                    "pendingCount": a.submissions.filter(status="submitted").count(),
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
    if (
        not InstructorAssignment.objects.filter(
            instructor=request.user, program=program
        ).exists()
        and not request.user.is_staff
    ):
        return redirect("/dashboard/")

    if request.method == "POST":
        data = get_post_data(request)

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
        assignment = Assignment.objects.select_related("program").get(pk=assignment_id)
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")

    # Verify instructor access
    if (
        not InstructorAssignment.objects.filter(
            instructor=request.user, program=assignment.program
        ).exists()
        and not request.user.is_staff
    ):
        return redirect("/dashboard/")

    if request.method == "POST":
        data = get_post_data(request)
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
            assignment.submission_type = data.get(
                "submissionType", assignment.submission_type
            )
            assignment.allowed_file_types = data.get(
                "allowedFileTypes", assignment.allowed_file_types
            )
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
                "dueDate": assignment.due_date.isoformat()
                if assignment.due_date
                else None,
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
        assignment = Assignment.objects.select_related("program").get(pk=assignment_id)
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")

    # Verify instructor access
    if (
        not InstructorAssignment.objects.filter(
            instructor=request.user, program=assignment.program
        ).exists()
        and not request.user.is_staff
    ):
        return redirect("/dashboard/")

    status_filter = request.GET.get("status", "all")
    submissions = (
        AssignmentSubmission.objects.filter(assignment=assignment)
        .select_related("enrollment", "enrollment__user")
        .order_by("-submitted_at")
    )

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
                    "studentName": s.enrollment.user.get_full_name()
                    or s.enrollment.user.email,
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
            "assignment", "assignment__program", "enrollment", "enrollment__user"
        ).get(pk=submission_id)
    except AssignmentSubmission.DoesNotExist:
        messages.error(request, "Submission not found")
        return redirect("/dashboard/")

    # Verify instructor access
    # Verify instructor access
    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program=submission.assignment.program
        ).exists()
        or request.user.is_staff
    ):
        return redirect("/dashboard/")

    if request.method == "POST":
        data = get_post_data(request)

        submission.score = float(data.get("score", 0))
        submission.feedback = data.get("feedback", "")
        submission.status = data.get("status", "graded")
        submission.graded_by = request.user
        submission.graded_at = timezone.now()
        submission.graded_at = timezone.now()
        submission.save()

        # Trigger progression check
        from apps.progression.services import ProgressionEngine

        engine = ProgressionEngine()
        engine.handle_assignment_grading(submission)

        messages.success(request, "Submission graded")
        return redirect(
            "core:instructor.assignment_submissions",
            assignment_id=submission.assignment.id,
        )

    return render(
        request,
        "Instructor/Assignments/Grade",
        {
            "submission": {
                "id": submission.id,
                "studentName": submission.enrollment.user.get_full_name()
                or submission.enrollment.user.email,
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
        enrollment = Enrollment.objects.select_related("program").get(
            user=request.user, program_id=program_id, status="active"
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "You are not enrolled in this program")
        return redirect("/dashboard/")

    assignments = Assignment.objects.filter(
        program_id=program_id, is_published=True
    ).order_by("due_date")

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
                        "score": float(submissions[a.id].score)
                        if submissions[a.id].score
                        else None,
                        "submittedAt": submissions[a.id].submitted_at.isoformat(),
                    }
                    if a.id in submissions
                    else None,
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
        assignment = Assignment.objects.select_related("program").get(
            pk=assignment_id, is_published=True
        )
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")

    try:
        enrollment = Enrollment.objects.get(
            user=request.user, program=assignment.program, status="active"
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "You are not enrolled in this program")
        return redirect("/dashboard/")

    # Get existing submission
    existing = AssignmentSubmission.objects.filter(
        enrollment=enrollment, assignment=assignment
    ).first()

    return render(
        request,
        "Student/Assignments/View",
        {
            "assignment": {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "instructions": assignment.instructions,
                "dueDate": assignment.due_date.isoformat()
                if assignment.due_date
                else None,
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
            }
            if existing
            else None,
        },
    )


@login_required
def student_assignment_submit(request, assignment_id: int):
    """
    Submit an assignment.
    """
    import os
    import uuid

    from apps.assessments.models import Assignment, AssignmentSubmission
    from apps.progression.models import Enrollment

    if request.method != "POST":
        return redirect("core:student.assignment", assignment_id=assignment_id)

    try:
        assignment = Assignment.objects.select_related("program").get(
            pk=assignment_id, is_published=True
        )
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")

    try:
        enrollment = Enrollment.objects.get(
            user=request.user, program=assignment.program, status="active"
        )
    except Enrollment.DoesNotExist:
        return redirect("/dashboard/")

    # Check for existing submission
    existing = AssignmentSubmission.objects.filter(
        enrollment=enrollment, assignment=assignment
    ).first()
    if existing and existing.status == "graded":
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
    if "file" in request.FILES:
        uploaded_file = request.FILES["file"]
        file_name = uploaded_file.name

        # Validate file type
        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        if assignment.allowed_file_types and ext not in assignment.allowed_file_types:
            messages.error(request, f"File type .{ext} is not allowed")
            return redirect("core:student.assignment", assignment_id=assignment_id)

        # Save file
        from django.conf import settings

        upload_dir = os.path.join(
            settings.MEDIA_ROOT, "submissions", str(assignment.id)
        )
        os.makedirs(upload_dir, exist_ok=True)
        unique_name = f"{uuid.uuid4().hex}_{file_name}"
        file_path = os.path.join(upload_dir, unique_name)

        with open(file_path, "wb+") as dest:
            for chunk in uploaded_file.chunks():
                dest.write(chunk)

    # Get text content
    text_content = request.POST.get("text_content", "")

    if existing:
        # Update existing submission
        existing.file_path = file_path or existing.file_path
        existing.file_name = file_name or existing.file_name
        existing.text_content = text_content or existing.text_content
        existing.submitted_at = timezone.now()
        existing.is_late = is_late
        existing.status = "submitted"
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
    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program=program
        ).exists()
        or request.user.is_staff
    ):
        return redirect("/dashboard/")

    # Validate program can be submitted
    if program.submission_status not in ("draft", "changes_requested"):
        messages.error(request, "This program cannot be submitted in its current state")
        return redirect("core:instructor.program", pk=program_id)

    # Update status
    program.submission_status = "submitted"
    program.submitted_at = timezone.now()
    program.submitted_by = request.user
    program.save()

    messages.success(
        request, "Program submitted for review! You'll be notified when it's reviewed."
    )
    return redirect("core:instructor.program", pk=program_id)


@login_required
def admin_course_approval_queue(request):
    """
    Admin view: List programs pending approval.
    """
    if not request.user.is_staff:
        return redirect("/dashboard/")

    status_filter = request.GET.get("status", "submitted")

    programs = (
        Program.objects.select_related("submitted_by")
        .filter(submission_status=status_filter)
        .order_by("-submitted_at")
    )

    return render(
        request,
        "Admin/CourseApproval/Index",
        {
            "programs": [
                {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description[:200] + "..."
                    if len(p.description) > 200
                    else p.description,
                    "submittedAt": p.submitted_at.isoformat()
                    if p.submitted_at
                    else None,
                    "submittedBy": {
                        "id": p.submitted_by.id,
                        "name": p.submitted_by.get_full_name() or p.submitted_by.email,
                    }
                    if p.submitted_by
                    else None,
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
    from apps.curriculum.models import CourseChangeRequest, CurriculumNode

    if not request.user.is_staff:
        return redirect("/dashboard/")

    try:
        program = Program.objects.select_related("submitted_by").get(pk=program_id)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("core:admin.course_approval")

    # Get curriculum structure
    nodes = CurriculumNode.objects.filter(program=program).order_by("path")

    # Get existing change requests
    change_requests = CourseChangeRequest.objects.filter(
        program=program, is_resolved=False
    ).select_related("node", "created_by")

    return render(
        request,
        "Admin/CourseApproval/Review",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "description": program.description,
                "status": program.submission_status,
                "submittedAt": program.submitted_at.isoformat()
                if program.submitted_at
                else None,
                "submittedBy": {
                    "id": program.submitted_by.id,
                    "name": program.submitted_by.get_full_name()
                    or program.submitted_by.email,
                    "email": program.submitted_by.email,
                }
                if program.submitted_by
                else None,
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

    if program.submission_status != "submitted":
        messages.error(request, "Program is not pending approval")
        return redirect("core:admin.course_review", program_id=program_id)

    program.submission_status = "approved"
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

    data = get_post_data(request)
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
    if program.submission_status == "submitted":
        program.submission_status = "changes_requested"
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
    if (
        not InstructorAssignment.objects.filter(
            instructor=request.user, program=program
        ).exists()
        and not request.user.is_staff
    ):
        return redirect("/dashboard/")

    change_requests = (
        CourseChangeRequest.objects.filter(program=program)
        .select_related("node", "created_by")
        .order_by("-created_at")
    )

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
        cr = CourseChangeRequest.objects.select_related("program").get(
            pk=change_request_id
        )
    except CourseChangeRequest.DoesNotExist:
        messages.error(request, "Change request not found")
        return redirect("/dashboard/")

    # Verify instructor access
    if (
        not InstructorAssignment.objects.filter(
            instructor=request.user, program=cr.program
        ).exists()
        and not request.user.is_staff
    ):
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
    if (
        not InstructorAssignment.objects.filter(
            instructor=request.user, program=program
        ).exists()
        and not request.user.is_staff
    ):
        return redirect("/dashboard/")

    # Only approved programs can be published
    if program.submission_status != "approved":
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
    request.session["preview_program_id"] = program_id

    # Redirect to public program detail (or student learning view)
    return redirect("core:programs")  # This would ideally go to a program detail page


# =============================================================================
# Instructor Course Manager (MasterStudy-style)
# =============================================================================


def serialize_program_data(program):
    """
    Serialize program data for frontend consumption.
    Reduces code duplication across endpoints.
    """
    from apps.platform.models import PlatformSettings
    
    platform_settings = PlatformSettings.get_settings()
    
    return {
        "program": {
            "id": program.id,
            "name": program.name,
            "code": program.code,
            "description": program.description,
            "level": program.level,
            "category": program.category,
            "thumbnail": program.thumbnail.url if program.thumbnail else None,
            "whatYouLearn": program.what_you_learn or [],
            "resources": [
                {
                    "id": r.id,
                    "title": r.title,
                    "url": r.file.url,
                    "type": r.resource_type,
                    "ext": r.file.name.split(".")[-1] if "." in r.file.name else "",
                }
                for r in program.resources.all()
            ],
            "faq": program.faq,
            "notices": program.notices,
            "customPricing": program.custom_pricing,
            "blueprint": {
                "name": program.blueprint.name if program.blueprint else "Default",
                "hierarchy": program.blueprint.hierarchy_structure
                if program.blueprint
                else ["Module", "Lesson"],
                "featureFlags": program.blueprint.get_effective_feature_flags()
                if program.blueprint
                else {
                    "quizzes": True,
                    "assignments": True,
                    "practicum": False,
                    "portfolio": False,
                    "gamification": False,
                },
                "gradingType": (program.blueprint.grading_logic or {}).get(
                    "type", "weighted"
                )
                if program.blueprint
                else "weighted",
            }
            if program.blueprint
            else None,
        },
        "courseLevels": platform_settings.get_course_levels(),
        "platformFeatures": platform_settings.get_default_features_for_mode(),
        "deploymentMode": platform_settings.deployment_mode,
    }


def build_curriculum_tree(program):
    """
    Build and serialize the complete curriculum tree for a program.
    Returns a nested tree structure with all descendants.
    
    Performance: O(n) time with 1 database query.
    Fetches all nodes in a single query, then builds tree in memory.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    from apps.curriculum.models import CurriculumNode
    
    # Single query to fetch ALL nodes for this program
    all_nodes = list(
        CurriculumNode.objects.filter(program=program)
        .order_by("position")
        .values("id", "parent_id", "title", "node_type", "description", "properties", "position")
    )
    
    logger.info(f"[CURRICULUM_TREE] Fetched {len(all_nodes)} nodes for program {program.id}")
    
    if not all_nodes:
        return []
    
    # Build parent → children mapping in memory
    children_map = {}  # parent_id → list of child nodes
    for node in all_nodes:
        parent_id = node["parent_id"]
        if parent_id not in children_map:
            children_map[parent_id] = []
        children_map[parent_id].append(node)
    
    def serialize_node(node, depth=0):
        """Recursively serialize a node and its children from memory."""
        node_id = node["id"]
        children = children_map.get(node_id, [])
        
        logger.debug(f"[CURRICULUM_TREE] {'  ' * depth}Node {node_id}: '{node['title']}' with {len(children)} children")
        
        return {
            "id": node_id,
            "title": node["title"],
            "type": node["node_type"],
            "description": node["description"],
            "properties": node["properties"],
            "position": node["position"],
            "children": [serialize_node(child, depth + 1) for child in children],
        }
    
    # Root nodes have parent_id = None
    root_nodes = children_map.get(None, [])
    
    logger.info(f"[CURRICULUM_TREE] Tree complete: {len(root_nodes)} root nodes")
    
    return [serialize_node(n) for n in root_nodes]


@login_required
def instructor_program_manage(request, pk: int):
    """
    New MasterStudy-style Course Manager.
    Entry point for Curriculum Builder, Settings, etc.
    """
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import InstructorAssignment

    # Verify access
    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program_id=pk
        ).exists()
        or request.user.is_staff
    ):
        return redirect("/dashboard/")

    program = get_object_or_404(Program.objects.select_related("blueprint"), pk=pk)

    # Get full curriculum tree using helper
    curriculum = build_curriculum_tree(program)

    # Serialize program data using shared helper
    response_data = serialize_program_data(program)
    response_data["curriculum"] = curriculum

    return render(request, "Instructor/Program/Manage", response_data)


@login_required
def instructor_node_create(request, program_id: int):
    """Create a new curriculum node."""
    if not is_instructor(request.user) or request.method != "POST":
        return redirect("/dashboard/")

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import InstructorAssignment

    # Verify access
    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program_id=program_id
        ).exists()
        or request.user.is_staff
    ):
        messages.error(request, "Permission denied")
        return redirect("/dashboard/")

    data = get_post_data(request)
    parent_id = data.get("parent_id")
    title = data.get("title", "New Item")
    frontend_type = data.get(
        "type"
    )  # Frontend can specify: Lesson, Quiz, Assignment, etc.

    from django.shortcuts import get_object_or_404
    from django.http import JsonResponse
    
    program = get_object_or_404(Program.objects.select_related("blueprint"), pk=program_id)
    
    # Error proofing: Validate blueprint configuration at use time
    if not program.blueprint:
        messages.error(request, "Program must have a blueprint configured")
        return redirect("core:instructor.program_manage", pk=program_id)
    
    blueprint_structure = program.blueprint.hierarchy_structure
    
    # Error proofing: Validate blueprint has exactly 2 tiers (Container, Content)
    if len(blueprint_structure) != 2:
        messages.error(
            request,
            f"Blueprint must define exactly 2 hierarchy levels. Found {len(blueprint_structure)}: {blueprint_structure}"
        )
        return redirect("core:instructor.program_manage", pk=program_id)

    try:
        parent = None
        if parent_id:
            parent = CurriculumNode.objects.filter(
                pk=parent_id, program_id=program_id
            ).first()
            if not parent:
                raise ValueError("Invalid parent node")

            current_depth = parent.get_depth()
            if current_depth + 1 >= len(blueprint_structure):
                raise ValueError("Maximum nesting depth reached")
            
            # All children use the blueprint hierarchy structure
            # Lesson types (video, text, quiz, assignment, live) are differentiated by properties.lesson_type
            node_type = blueprint_structure[current_depth + 1]
        else:
            # Root level nodes (containers) use the first item in blueprint structure
            node_type = blueprint_structure[0]

        # Enforce two-tier builder taxonomy validation (Level is admin-set, not in tree)
        # Reuse current_depth from line 4728 to avoid redundant get_depth() call
        depth = current_depth + 1 if parent else 0
        
        if depth > 1:
            raise ValueError(
                f"Cannot create {blueprint_structure[depth]} at depth {depth}. "
                f"Maximum depth is 1. Hierarchy: {blueprint_structure[0]} → {blueprint_structure[1]}"
            )
        
        # Validate parent-child relationships
        if parent and depth > 0 and parent.get_depth() != 0:
            raise ValueError(
                f"Invalid parent. {blueprint_structure[1]} nodes must be children of "
                f"{blueprint_structure[0]} nodes (depth 0), not depth {parent.get_depth()} nodes."
            )

        position = CurriculumNode.objects.filter(program=program, parent=parent).count()

        node_properties = data.get("properties", {})

        # Auto-publish: if program is published, new content is also published
        auto_publish = program.is_published

        node = CurriculumNode.objects.create(
            program=program,
            parent=parent,
            title=title,
            node_type=node_type,
            position=position,
            properties=node_properties,
            is_published=auto_publish,
        )

        messages.success(request, f"{node_type} '{title}' created successfully")
        
        # Build updated curriculum tree and return as Inertia response
        curriculum = build_curriculum_tree(program)
        
        # Serialize program data using shared helper
        response_data = serialize_program_data(program)
        response_data["curriculum"] = curriculum
        
        return render(request, "Instructor/Program/Manage", response_data)
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Node creation failed: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        messages.error(request, str(e))
        return redirect("core:instructor.program_manage", pk=program_id)



def _sync_quiz_questions(node, questions_data: list):
    """
    Sync quiz questions from frontend JSON to proper database tables.

    Frontend sends questions as:
    [{"id": "temp_123", "db_id": null, "type": "mcq", "text": "...", "points": 1,
      "options": ["A", "B", "C"], "correct": 0}, ...]

    This function:
    1. Creates/updates Quiz record for the node
    2. Creates new Question records for items without db_id
    3. Updates existing Question records for items with db_id
    4. Deletes removed questions
    5. Stores db_id mapping back in node properties
    """
    from apps.assessments.models import Question, QuestionOption, Quiz

    if not questions_data:
        return

    # Get or create Quiz for this node
    quiz, created = Quiz.objects.get_or_create(
        node=node,
        defaults={
            "title": node.title,
            "pass_threshold": node.properties.get("passing_grade", 70),
            "time_limit_minutes": node.properties.get("quiz_duration"),
            "max_attempts": node.properties.get("max_attempts", 1),
            "randomize_questions": node.properties.get("randomize_questions", False),
            "retake_penalty_percent": node.properties.get("retake_penalty", 0),
        },
    )

    # Update quiz settings if not created
    if not created:
        quiz.title = node.title
        quiz.pass_threshold = node.properties.get("passing_grade", 70)
        quiz.time_limit_minutes = node.properties.get("quiz_duration")
        quiz.max_attempts = node.properties.get("max_attempts", 1)
        quiz.randomize_questions = node.properties.get("randomize_questions", False)
        quiz.retake_penalty_percent = node.properties.get("retake_penalty", 0)
        quiz.save()

    # Track existing question IDs
    existing_ids = set(quiz.questions.values_list("id", flat=True))
    processed_ids = set()
    updated_questions = []

    for idx, q_data in enumerate(questions_data):
        db_id = q_data.get("db_id")
        question_type = q_data.get("type", "mcq")

        # Map frontend types to backend types
        type_mapping = {
            "multiple_choice": "mcq",
            "true_false": "true_false",
            "short_answer": "short_answer",
            "matching": "matching",
            "fill_blank": "fill_blank",
            "ordering": "ordering",
        }
        backend_type = type_mapping.get(question_type, question_type)

        # Build answer_data based on question type
        answer_data = {}
        if backend_type == "mcq":
            answer_data = {
                "options": q_data.get("options", []),
                "correct": q_data.get("correct", 0),
            }
        elif backend_type == "true_false":
            answer_data = {"correct": q_data.get("correct", True)}
        elif backend_type == "short_answer":
            answer_data = {
                "keywords": q_data.get("keywords", []),
                "manual_grading": q_data.get("manual_grading", True),
            }
        elif backend_type == "ordering":
            answer_data = {"correct_order": q_data.get("correct_order", [])}

        if db_id and db_id in existing_ids:
            # Update existing question
            Question.objects.filter(pk=db_id).update(
                text=q_data.get("text", ""),
                question_type=backend_type,
                points=q_data.get("points", 1),
                position=idx,
                answer_data=answer_data,
            )
            processed_ids.add(db_id)

            # Handle MCQ options update
            if backend_type == "mcq" and "options" in q_data:
                question = Question.objects.get(pk=db_id)
                question.options.all().delete()
                for opt_idx, opt_text in enumerate(q_data.get("options", [])):
                    QuestionOption.objects.create(
                        question=question,
                        text=opt_text,
                        is_correct=(opt_idx == q_data.get("correct", 0)),
                        position=opt_idx,
                    )

            updated_questions.append({**q_data, "db_id": db_id})
        else:
            # Create new question
            new_question = Question.objects.create(
                quiz=quiz,
                text=q_data.get("text", ""),
                question_type=backend_type,
                points=q_data.get("points", 1),
                position=idx,
                answer_data=answer_data,
            )
            processed_ids.add(new_question.id)

            # Create MCQ options
            if backend_type == "mcq" and "options" in q_data:
                for opt_idx, opt_text in enumerate(q_data.get("options", [])):
                    QuestionOption.objects.create(
                        question=new_question,
                        text=opt_text,
                        is_correct=(opt_idx == q_data.get("correct", 0)),
                        position=opt_idx,
                    )

            updated_questions.append({**q_data, "db_id": new_question.id})

    # Delete removed questions
    removed_ids = existing_ids - processed_ids
    if removed_ids:
        Question.objects.filter(id__in=removed_ids).delete()

    # Update node properties with db_ids for frontend tracking
    node.properties["questions"] = updated_questions
    node.properties["quiz_id"] = quiz.id
    node.save(update_fields=["properties"])


def _sync_assignment(node):
    """
    Sync assignment data from node properties to the Assignment table.

    Assignment nodes store properties like:
    - instructions: HTML text
    - points: integer
    - due_date: ISO date string
    - submission_type: 'file', 'text', 'both'
    - allowed_file_types: list of extensions

    This syncs to the Assignment model for proper submission handling.
    """
    from apps.assessments.models import Assignment

    props = node.properties or {}

    # Get or create Assignment for this node's program
    assignment, created = Assignment.objects.get_or_create(
        program=node.program,
        title=node.title,
        defaults={
            "description": node.description or "",
            "instructions": props.get("instructions", ""),
            "weight": props.get("weight", 10),
            "due_date": props.get("due_date"),
            "allow_late_submission": props.get("allow_late_submission", False),
            "late_penalty_percent": props.get("late_penalty", 0),
            "submission_type": props.get("submission_type", "file"),
            "allowed_file_types": props.get("allowed_file_types", ["pdf", "docx"]),
            "max_file_size_mb": props.get("max_file_size_mb", 10),
        },
    )

    if not created:
        assignment.description = node.description or assignment.description
        assignment.instructions = props.get("instructions", assignment.instructions)
        assignment.weight = props.get("weight", assignment.weight)
        assignment.due_date = props.get("due_date", assignment.due_date)
        assignment.allow_late_submission = props.get(
            "allow_late_submission", assignment.allow_late_submission
        )
        assignment.late_penalty_percent = props.get(
            "late_penalty", assignment.late_penalty_percent
        )
        assignment.submission_type = props.get(
            "submission_type", assignment.submission_type
        )
        assignment.allowed_file_types = props.get(
            "allowed_file_types", assignment.allowed_file_types
        )
        assignment.max_file_size_mb = props.get(
            "max_file_size_mb", assignment.max_file_size_mb
        )
        assignment.save()

    # Store assignment_id in node properties for reference
    node.properties["assignment_id"] = assignment.id
    node.save(update_fields=["properties"])


@login_required
def instructor_node_update(request, node_id: int):
    """Update node details (title, description, properties)."""
    if not is_instructor(request.user) or request.method != "POST":
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import InstructorAssignment

    program_ids = get_instructor_program_ids(request.user)
    node = get_object_or_404(CurriculumNode, pk=node_id, program_id__in=program_ids)

    data = get_post_data(request)
    node.title = data.get("title", node.title)
    node.description = data.get("description", node.description)

    # Handle properties update (e.g. video URL, duration) if passed
    if "properties" in data:
        # Shallow merge
        props = node.properties or {}
        props.update(data["properties"])
        node.properties = props

    node.save()

    # Sync quiz questions to proper database tables if this is a quiz node
    node_type = (node.node_type or "").lower()
    lesson_type = (node.properties.get("lesson_type") or "").lower()

    if node_type == "quiz" or lesson_type == "quiz":
        questions_data = node.properties.get("questions", [])
        if questions_data:
            _sync_quiz_questions(node, questions_data)

    # Sync assignment data to Assignment table
    if node_type == "assignment" or lesson_type == "assignment":
        _sync_assignment(node)

    messages.success(request, "Node updated")
    return redirect("core:instructor.program_manage", pk=node.program_id)


@login_required
def instructor_node_delete(request, node_id: int):
    """Delete a node and its children."""
    if not is_instructor(request.user) or request.method != "POST":
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404

    from apps.curriculum.models import CurriculumNode

    program_ids = get_instructor_program_ids(request.user)
    node = get_object_or_404(CurriculumNode, pk=node_id, program_id__in=program_ids)

    program_id = node.program_id
    node.delete()
    messages.success(request, "Item deleted")
    return redirect("core:instructor.program_manage", pk=program_id)


@login_required
def instructor_program_preview(request, pk: int):
    """
    Allow instructor to preview their program as a student.
    """
    from apps.progression.models import InstructorAssignment

    # Verify access (Instructor of program or staff)
    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program_id=pk
        ).exists()
        or request.user.is_staff
    ):
        return redirect("/dashboard/")

    # Mark session as preview mode for this program
    request.session["preview_program_id"] = pk

    # Redirect to the public detail page
    return redirect("core:program_detail", pk=pk)


@login_required
def instructor_node_reorder(request, program_id: int):
    """Reorder siblings."""
    if not is_instructor(request.user) or request.method != "POST":
        return redirect("/dashboard/")

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import InstructorAssignment

    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program_id=program_id
        ).exists()
        or request.user.is_staff
    ):
        return redirect("/dashboard/")

    # For MVP, maybe just "move up/down" or full list update?
    # Let's assume full list of IDs for a specific parent context
    data = get_post_data(request)
    ordered_ids = data.get("ordered_ids", [])

    for idx, node_id in enumerate(ordered_ids):
        # Bulk update would be better but keeping it safe for now
        CurriculumNode.objects.filter(pk=node_id, program_id=program_id).update(
            position=idx
        )

    messages.success(request, "Order updated")
    return redirect("core:instructor.program_manage", pk=program_id)


@login_required
def instructor_program_update_settings(request, pk: int):
    """Update extended settings: FAQ, Pricing, Notices."""
    if not is_instructor(request.user) or request.method != "POST":
        return redirect("/dashboard/")

    from apps.progression.models import InstructorAssignment

    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program_id=pk
        ).exists()
        or request.user.is_staff
    ):
        return redirect("/dashboard/")

    program = Program.objects.get(pk=pk)
    data = get_post_data(request)

    if "faq" in data:
        program.faq = data["faq"]
    if "notices" in data:
        program.notices = data["notices"]
    if "custom_pricing" in data:
        program.custom_pricing = data["custom_pricing"]

    program.save()
    messages.success(request, "Settings updated")
    return redirect("core:instructor.program_manage", pk=pk)


@login_required
def instructor_lesson_file_upload(request, node_id: int):
    """
    Upload a file attachment to a lesson node.
    Returns JSON with file URL and metadata.
    """
    import os
    import uuid

    from django.conf import settings
    from django.http import JsonResponse

    if not is_instructor(request.user) or request.method != "POST":
        return JsonResponse({"error": "Permission denied"}, status=403)

    from apps.curriculum.models import CurriculumNode

    program_ids = get_instructor_program_ids(request.user)
    try:
        node = CurriculumNode.objects.get(pk=node_id, program_id__in=program_ids)
    except CurriculumNode.DoesNotExist:
        return JsonResponse({"error": "Node not found"}, status=404)

    if "file" not in request.FILES:
        return JsonResponse({"error": "No file provided"}, status=400)

    uploaded_file = request.FILES["file"]
    file_name = uploaded_file.name

    # Create upload directory
    upload_dir = os.path.join(
        settings.MEDIA_ROOT, "lesson_files", str(node.program_id), str(node_id)
    )
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename to prevent collisions
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
    unique_name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
    file_path = os.path.join(upload_dir, unique_name)

    # Save file
    with open(file_path, "wb+") as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    # Build file URL
    relative_path = f"lesson_files/{node.program_id}/{node_id}/{unique_name}"
    file_url = f"{settings.MEDIA_URL}{relative_path}"

    # Add to node's file list
    files = node.properties.get("files", [])
    file_entry = {
        "id": uuid.uuid4().hex[:8],
        "name": file_name,
        "url": file_url,
        "path": relative_path,
        "size": uploaded_file.size,
        "uploaded_at": timezone.now().isoformat(),
    }
    files.append(file_entry)
    node.properties["files"] = files
    node.save(update_fields=["properties"])

    return JsonResponse({"success": True, "file": file_entry})


@login_required
def instructor_lesson_file_delete(request, node_id: int):
    """Delete a file attachment from a lesson node."""
    import os

    from django.conf import settings
    from django.http import JsonResponse

    if not is_instructor(request.user) or request.method != "POST":
        return JsonResponse({"error": "Permission denied"}, status=403)

    from apps.curriculum.models import CurriculumNode

    program_ids = get_instructor_program_ids(request.user)
    try:
        node = CurriculumNode.objects.get(pk=node_id, program_id__in=program_ids)
    except CurriculumNode.DoesNotExist:
        return JsonResponse({"error": "Node not found"}, status=404)

    data = get_post_data(request)
    file_id = data.get("file_id")

    if not file_id:
        return JsonResponse({"error": "No file_id provided"}, status=400)

    # Find and remove file from list
    files = node.properties.get("files", [])
    file_to_delete = None
    updated_files = []

    for f in files:
        if f.get("id") == file_id:
            file_to_delete = f
        else:
            updated_files.append(f)

    if not file_to_delete:
        return JsonResponse({"error": "File not found"}, status=404)

    # Delete physical file
    file_path = os.path.join(settings.MEDIA_ROOT, file_to_delete.get("path", ""))
    if os.path.exists(file_path):
        os.remove(file_path)

    # Update node
    node.properties["files"] = updated_files
    node.save(update_fields=["properties"])

    return JsonResponse({"success": True})


# =============================================================================
# Material Import/Clone (Feature 3B)
# =============================================================================


@login_required
def instructor_material_search(request, program_id: int):
    """
    Search existing materials that can be imported into the current program.
    Returns materials from all programs the instructor has access to.
    """
    from django.http import JsonResponse

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import InstructorAssignment

    if not is_instructor(request.user):
        return JsonResponse({"error": "Permission denied"}, status=403)

    # Get all programs this instructor has access to
    if request.user.is_staff:
        accessible_program_ids = list(Program.objects.values_list("id", flat=True))
    else:
        accessible_program_ids = list(
            InstructorAssignment.objects.filter(instructor=request.user).values_list(
                "program_id", flat=True
            )
        )

    q = request.GET.get("q", "")
    type_filter = request.GET.get("type", "")

    # Only content nodes (with parent), exclude current program to avoid duplicates
    nodes = (
        CurriculumNode.objects.filter(
            program_id__in=accessible_program_ids,
            parent__isnull=False,  # Only content nodes, not top-level sections
        )
        .exclude(program_id=program_id)
        .select_related("program")
    )

    if q:
        nodes = nodes.filter(title__icontains=q)

    if type_filter:
        # Filter by node_type or lesson_type in properties
        nodes = nodes.filter(
            models.Q(node_type__iexact=type_filter)
            | models.Q(properties__lesson_type=type_filter)
        )

    results = [
        {
            "id": n.id,
            "title": n.title,
            "type": n.node_type,
            "properties": n.properties,
            "program_name": n.program.name,
            "program_id": n.program_id,
        }
        for n in nodes[:50]
    ]

    return JsonResponse({"materials": results})


def _clone_quiz(source_quiz, new_node):
    """Clone a quiz and all its questions to a new node."""
    import copy

    from apps.assessments.models import (
        Question,
        QuestionGapAnswer,
        QuestionMatchingPair,
        QuestionOption,
        Quiz,
    )

    new_quiz = Quiz.objects.create(
        node=new_node,
        title=source_quiz.title,
        description=source_quiz.description,
        pass_threshold=source_quiz.pass_threshold,
        time_limit_minutes=source_quiz.time_limit_minutes,
        max_attempts=source_quiz.max_attempts,
        randomize_questions=source_quiz.randomize_questions,
        show_answers_after_submit=source_quiz.show_answers_after_submit,
        retake_penalty_percent=source_quiz.retake_penalty_percent,
        shuffle_options=source_quiz.shuffle_options,
        is_published=False,  # Cloned quizzes start unpublished
    )

    for q in source_quiz.questions.all():
        new_question = Question.objects.create(
            quiz=new_quiz,
            text=q.text,
            question_type=q.question_type,
            points=q.points,
            position=q.position,
            answer_data=copy.deepcopy(q.answer_data),
        )

        # Clone options for MCQ
        for opt in q.options.all():
            QuestionOption.objects.create(
                question=new_question,
                text=opt.text,
                is_correct=opt.is_correct,
                position=opt.position,
            )

        # Clone matching pairs
        for pair in q.matching_pairs.all():
            QuestionMatchingPair.objects.create(
                question=new_question,
                left_text=pair.left_text,
                right_text=pair.right_text,
                position=pair.position,
            )

        # Clone gap answers
        for gap in q.gap_answers.all():
            QuestionGapAnswer.objects.create(
                question=new_question,
                gap_index=gap.gap_index,
                accepted_answers=copy.deepcopy(gap.accepted_answers),
            )

    return new_quiz


def _clone_node(source_node, target_parent, target_program):
    """
    Deep clone a curriculum node with all children and related data.
    Returns the newly created node.
    """
    import copy

    from apps.curriculum.models import CurriculumNode

    # Prepare properties - clear any IDs that reference the source
    cloned_properties = copy.deepcopy(source_node.properties or {})
    cloned_properties.pop("quiz_id", None)  # Will be regenerated if quiz is cloned
    cloned_properties.pop("assignment_id", None)

    new_node = CurriculumNode.objects.create(
        program=target_program,
        parent=target_parent,
        title=f"{source_node.title} (Copy)",
        node_type=source_node.node_type,
        description=source_node.description,
        properties=cloned_properties,
        position=target_parent.children.count() if target_parent else 0,
        is_published=False,  # Cloned content starts unpublished
    )

    # Clone Quiz if exists
    if hasattr(source_node, "quizzes") and source_node.quizzes.exists():
        for quiz in source_node.quizzes.all():
            new_quiz = _clone_quiz(quiz, new_node)
            # Update properties with new quiz_id
            new_node.properties["quiz_id"] = new_quiz.id
            new_node.save(update_fields=["properties"])

    # Recursively clone children
    for child in source_node.children.all():
        _clone_node(child, new_node, target_program)

    return new_node


@login_required
def instructor_material_import(request, program_id: int):
    """
    Clone selected nodes into a target section.
    POST: {source_node_ids: [1, 2, 3], target_section_id: 10}
    Uses Inertia redirect pattern.
    """
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import InstructorAssignment

    if not is_instructor(request.user) or request.method != "POST":
        messages.error(request, "Method not allowed")
        return redirect(f"/instructor/course-builder/{program_id}/")

    # Verify access to target program
    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program_id=program_id
        ).exists()
        or request.user.is_staff
    ):
        messages.error(request, "Permission denied")
        return redirect(f"/instructor/course-builder/{program_id}/")

    data = get_post_data(request)
    source_ids = data.get("source_node_ids", [])
    target_section_id = data.get("target_section_id")

    if not source_ids or not target_section_id:
        messages.error(request, "Missing source_node_ids or target_section_id")
        return redirect(f"/instructor/course-builder/{program_id}/")

    try:
        target_program = Program.objects.get(pk=program_id)
        target_section = CurriculumNode.objects.get(
            pk=target_section_id, program=target_program
        )
    except (Program.DoesNotExist, CurriculumNode.DoesNotExist):
        messages.error(request, "Invalid target program or section")
        return redirect(f"/instructor/course-builder/{program_id}/")

    imported_count = 0
    for source_id in source_ids:
        try:
            source_node = CurriculumNode.objects.get(pk=source_id)
            _clone_node(source_node, target_section, target_program)
            imported_count += 1
        except CurriculumNode.DoesNotExist:
            continue  # Skip invalid source nodes

    messages.success(request, f"Imported {imported_count} item(s)")
    return redirect(f"/instructor/course-builder/{program_id}/")


# =============================================================================
# Q&A Tab Integration (Feature 3C)
# =============================================================================


@login_required
def instructor_node_discussions(request, node_id: int):
    """
    Get all discussion threads for a curriculum node.
    Returns discussions with reply counts for the Q&A tab.
    """
    from django.http import JsonResponse

    from apps.curriculum.models import CurriculumNode
    from apps.discussions.models import DiscussionThread

    if not is_instructor(request.user):
        return JsonResponse({"error": "Permission denied"}, status=403)

    program_ids = get_instructor_program_ids(request.user)

    try:
        node = CurriculumNode.objects.get(pk=node_id, program_id__in=program_ids)
    except CurriculumNode.DoesNotExist:
        return JsonResponse({"error": "Node not found"}, status=404)

    threads = (
        DiscussionThread.objects.filter(node=node)
        .select_related("user")
        .order_by("-is_pinned", "-created_at")
    )

    discussions = [
        {
            "id": t.id,
            "title": t.title,
            "content": t.content,
            "author": t.user.get_full_name() or t.user.email,
            "author_id": t.user.id,
            "is_pinned": t.is_pinned,
            "is_locked": t.is_locked,
            "replies_count": t.posts.count(),
            "created_at": t.created_at.isoformat(),
        }
        for t in threads
    ]

    return JsonResponse({"discussions": discussions})


@login_required
def instructor_discussion_create(request, node_id: int):
    """
    Create a new discussion thread for a curriculum node.
    POST: {title: "Discussion Title", content: "Initial post content", is_pinned: false}
    Uses Inertia redirect pattern.
    """
    from apps.curriculum.models import CurriculumNode
    from apps.discussions.models import DiscussionThread

    referer = request.META.get("HTTP_REFERER", "/instructor/")

    if not is_instructor(request.user) or request.method != "POST":
        messages.error(request, "Method not allowed")
        return redirect(referer)

    program_ids = get_instructor_program_ids(request.user)

    try:
        node = CurriculumNode.objects.get(pk=node_id, program_id__in=program_ids)
    except CurriculumNode.DoesNotExist:
        messages.error(request, "Node not found")
        return redirect(referer)

    data = get_post_data(request)
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    is_pinned = data.get("is_pinned", False)

    if not title:
        messages.error(request, "Title is required")
        return redirect(referer)

    thread = DiscussionThread.objects.create(
        node=node,
        user=request.user,
        title=title,
        content=content,
        is_pinned=is_pinned,
    )

    messages.success(request, f"Discussion created: {thread.title}")
    return redirect(referer)


@login_required
def instructor_discussion_toggle_pin(request, discussion_id: int):
    """Toggle the pinned status of a discussion thread. Uses Inertia redirect."""
    from apps.discussions.models import DiscussionThread

    referer = request.META.get("HTTP_REFERER", "/instructor/")

    if not is_instructor(request.user) or request.method != "POST":
        messages.error(request, "Method not allowed")
        return redirect(referer)

    program_ids = get_instructor_program_ids(request.user)

    try:
        thread = DiscussionThread.objects.select_related("node").get(
            pk=discussion_id, node__program_id__in=program_ids
        )
    except DiscussionThread.DoesNotExist:
        messages.error(request, "Discussion not found")
        return redirect(referer)

    thread.is_pinned = not thread.is_pinned
    thread.save(update_fields=["is_pinned"])

    status = "pinned" if thread.is_pinned else "unpinned"
    messages.success(request, f"Discussion {status}")
    return redirect(referer)


@login_required
def instructor_discussion_toggle_lock(request, discussion_id: int):
    """Toggle the locked status of a discussion thread. Uses Inertia redirect."""
    from apps.discussions.models import DiscussionThread

    referer = request.META.get("HTTP_REFERER", "/instructor/")

    if not is_instructor(request.user) or request.method != "POST":
        messages.error(request, "Method not allowed")
        return redirect(referer)

    program_ids = get_instructor_program_ids(request.user)

    try:
        thread = DiscussionThread.objects.select_related("node").get(
            pk=discussion_id, node__program_id__in=program_ids
        )
    except DiscussionThread.DoesNotExist:
        messages.error(request, "Discussion not found")
        return redirect(referer)

    thread.is_locked = not thread.is_locked
    thread.save(update_fields=["is_locked"])

    status = "locked" if thread.is_locked else "unlocked"
    messages.success(request, f"Discussion {status}")
    return redirect(referer)


@login_required
def instructor_discussion_reply(request):
    """
    Create a reply post for a discussion thread.
    POST: {thread: 123, content: "Reply content"}
    Uses Inertia redirect pattern.
    """
    from apps.discussions.models import DiscussionPost, DiscussionThread

    referer = request.META.get("HTTP_REFERER", "/instructor/")

    if not is_instructor(request.user) or request.method != "POST":
        messages.error(request, "Method not allowed")
        return redirect(referer)

    data = get_post_data(request)
    thread_id = data.get("thread")
    content = data.get("content", "").strip()

    if not thread_id or not content:
        messages.error(request, "Thread ID and content are required")
        return redirect(referer)

    program_ids = get_instructor_program_ids(request.user)

    try:
        thread = DiscussionThread.objects.select_related("node").get(
            pk=thread_id, node__program_id__in=program_ids
        )
    except DiscussionThread.DoesNotExist:
        messages.error(request, "Discussion not found")
        return redirect(referer)

    if thread.is_locked:
        messages.error(request, "This discussion is locked")
        return redirect(referer)

    DiscussionPost.objects.create(
        thread=thread,
        user=request.user,
        content=content,
    )

    messages.success(request, "Reply posted")
    return redirect(referer)
