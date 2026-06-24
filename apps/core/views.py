"""
Core views - Public pages and authentication.
Requirements: 1.1-1.4, 2.1-2.6, 3.1-3.6, 4.1-4.5, 5.1-5.6, 6.1-6.6
"""

from datetime import datetime
import re
from typing import Optional

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.core.mail import send_mail
from django.db.models import Count, Q
from django.db import transaction
from django.http import Http404, JsonResponse
from django.shortcuts import redirect
from django.utils.dateparse import parse_date, parse_datetime
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.html import strip_tags
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import ensure_csrf_cookie
from inertia import render

from apps.assessments.text_normalization import (
    normalize_assessment_text,
    normalize_assessment_text_list,
    normalize_assessment_text_mapping,
    normalize_question_answer_data,
    normalize_true_false_choice,
    true_false_choice_to_index,
)
from apps.assessments.official_results import (
    assignment_attempt_passed,
    can_start_quiz_attempt,
    get_assignment_attempts_remaining,
    get_official_assignment_attempt,
    get_official_quiz_attempt,
    refresh_assignment_official_flags,
)
from apps.certifications.models import Certificate, VerificationLog
from apps.core.learning_outcomes import (
    extract_learning_outcome_items_from_html,
    resolve_learning_outcomes_html,
)
from apps.core.models import AdmissionApplication, Campus, Program, User
from apps.core.taxonomy import (
    MAX_BUILDER_DEPTH,
    get_builder_hierarchy_or_default,
    validate_builder_hierarchy,
)
from apps.core.utils import (
    get_instructor_program_ids,
    get_post_data,
    is_instructor,
    should_render_inertia_prop,
)


def get_dashboard_url(role: str) -> str:
    """Get dashboard URL based on user role. Requirement: 2.2"""
    # All app roles use the unified dashboard. Superusers behave like admins.
    return "/dashboard/"


def _get_user_role(user: User) -> str:
    """Determine the app-facing user role for dashboard routing."""
    if user.is_superuser:
        return "admin"
    if user.is_staff:
        return "admin"
    if hasattr(user, "groups") and user.groups.filter(name="Instructors").exists():
        return "instructor"
    return "student"


def _group_programs_by_level(programs: list, level_key: str = "level") -> list:
    """
    Group program dictionaries by their canonical level.

    Blank-level programs are intentionally omitted from groups. The full program
    list remains available to render them without a fake level heading.
    """
    grouped = {}
    for program in programs:
        level_value = str((program or {}).get(level_key) or "").strip()
        if level_value:
            grouped.setdefault(level_value, []).append(program)

    return [
        {"value": level_value, "label": level_value, "programs": group_programs}
        for level_value, group_programs in grouped.items()
        if group_programs
    ]


def _build_level_options(programs: list, level_key: str = "level") -> list:
    """Return level options present in the current program scope."""
    seen = set()
    options = []
    for program in programs:
        level_value = str((program or {}).get(level_key) or "").strip()
        if not level_value or level_value in seen:
            continue
        seen.add(level_value)
        options.append({"value": level_value, "label": level_value})
    return options


def _program_public_url(program) -> str:
    return f"/programs/{program.slug}/"


def _build_pagination(page: int, per_page: int, total: int) -> dict:
    return {
        "page": page,
        "perPage": per_page,
        "total": total,
        "totalPages": (total + per_page - 1) // per_page,
    }


def _is_virtual_request(request) -> bool:
    return bool(getattr(request, "is_virtual_campus", False))


def _virtual_base_url() -> str:
    return getattr(settings, "VIRTUAL_CAMPUS_BASE_URL", "https://virtual.airads.ac.ke")


def _build_site_context(request) -> dict:
    is_virtual = _is_virtual_request(request)
    virtual_base = _virtual_base_url()
    return {
        "entry": "virtual" if is_virtual else "main",
        "isVirtualCampus": is_virtual,
        "routes": {
            "mainHome": "https://airads.ac.ke/" if is_virtual else "/",
            "virtualHome": "/" if is_virtual else f"{virtual_base}/",
            "virtualCourses": "/courses/" if is_virtual else f"{virtual_base}/courses/",
            "virtualApply": "/apply/" if is_virtual else f"{virtual_base}/apply/",
        },
    }


# =============================================================================
# Public Pages
# =============================================================================


def landing_page(request):
    """
    Platform landing page with programs showcase.
    Requirements: 1.1, 1.2, 1.3
    """
    if _is_virtual_request(request):
        return airads_virtual_landing(request)

    from django.db.models import Count

    from apps.progression.models import Enrollment

    landing_payload = cache.get("landing_page:payload")
    if landing_payload is None:
        programs = list(
            Program.objects.filter(is_published=True)
            .only(
                "id",
                "slug",
                "name",
                "code",
                "description",
                "thumbnail",
                "badge_type",
                "category",
                "custom_pricing",
                "created_at",
            )
            .order_by("-created_at")[:6]
        )
        program_ids = [program.id for program in programs]

        enrollment_counts = dict(
            Enrollment.objects.filter(program_id__in=program_ids)
            .values("program_id")
            .annotate(count=Count("id"))
            .values_list("program_id", "count")
        )

        from collections import defaultdict
        from apps.curriculum.models import CurriculumNode

        stats_by_program_id = defaultdict(
            lambda: {"lesson_count": 0, "duration_minutes": 0}
        )
        assessment_types = {"quiz", "assignment", "practicum", "peer_review"}

        if program_ids:
            leaf_nodes = CurriculumNode.objects.filter(
                program_id__in=program_ids,
                is_published=True,
                children__isnull=True,
            ).values_list("program_id", "node_type", "properties")

            for program_id, node_type, properties in leaf_nodes:
                node_type_norm = (node_type or "").strip().lower()
                props = properties if isinstance(properties, dict) else {}
                lesson_type_norm = str(props.get("lesson_type") or "").strip().lower()
                if (
                    node_type_norm in assessment_types
                    or lesson_type_norm in assessment_types
                ):
                    continue
                stats_by_program_id[program_id]["lesson_count"] += 1
                minutes = props.get("duration_minutes", 0)
                try:
                    minutes_int = int(minutes) if minutes is not None else 0
                except (TypeError, ValueError):
                    minutes_int = 0
                stats_by_program_id[program_id]["duration_minutes"] += max(
                    0, minutes_int
                )

        def _minutes_to_hours(total_minutes: int) -> float:
            if not total_minutes:
                return 0
            return round(total_minutes / 60.0, 1)

        programs_data = []
        for program in programs:
            stats = stats_by_program_id[program.id]
            duration_hours = _minutes_to_hours(stats["duration_minutes"])

            programs_data.append(
                {
                    "id": program.id,
                    "slug": program.slug,
                    "publicUrl": _program_public_url(program),
                    "name": program.name,
                    "code": program.code or "",
                    "description": program.description or "",
                    "thumbnail": program.thumbnail.url if program.thumbnail else None,
                    "badge_type": program.badge_type,
                    "category": program.category,
                    "lecture_count": stats["lesson_count"],
                    "duration_hours": duration_hours,
                    "rating": 4.5,
                    "price": (
                        program.custom_pricing.get("price", 0)
                        if program.custom_pricing
                        else 0
                    ),
                    "original_price": (
                        program.custom_pricing.get("original_price")
                        if program.custom_pricing
                        else None
                    ),
                    "enrollmentCount": enrollment_counts.get(program.id, 0),
                }
            )

        landing_payload = {
            "programs": programs_data,
            "stats": {
                "programCount": Program.objects.filter(is_published=True).count(),
                "studentCount": Enrollment.objects.values("user").distinct().count(),
            },
        }
        cache.set("landing_page:payload", landing_payload, timeout=300)

    return render(
        request,
        "Public/Home",
        landing_payload,
    )


def about_page(request):
    """About page explaining the platform philosophy."""
    return render(request, "Public/About")


def contact_page(request):
    """Contact page - displays contact info only (AI chatbot coming soon)."""
    return render(request, "Public/Contact")


def public_programs_list(request):
    """
    Public catalog of published programs.
    """
    from collections import defaultdict
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment, EnrollmentRequest

    try:
        page = max(int(request.GET.get("page", 1)), 1)
    except (TypeError, ValueError):
        page = 1
    per_page = 12

    include_programs = should_render_inertia_prop(
        request, "programs", "groupedPrograms"
    )
    include_grouped_programs = should_render_inertia_prop(request, "groupedPrograms")
    include_level_options = should_render_inertia_prop(
        request, "courseLevels", "groupedPrograms"
    )
    include_categories = should_render_inertia_prop(request, "categories")
    include_user_enrollments = should_render_inertia_prop(request, "userEnrollments")
    include_user_pending_requests = should_render_inertia_prop(
        request, "userPendingRequests"
    )
    include_filters = should_render_inertia_prop(request, "filters")
    include_pagination = should_render_inertia_prop(request, "pagination")

    programs_query = Program.objects.filter(is_published=True)
    search = request.GET.get("search", "")
    if search:
        programs_query = programs_query.filter(name__icontains=search)

    category = request.GET.get("category", "")
    if category:
        programs_query = programs_query.filter(category=category)

    level_options_data = list(programs_query.values("level").order_by("level"))

    level = request.GET.get("level", "")
    if level:
        programs_query = programs_query.filter(level=level)

    total = programs_query.count()
    offset = (page - 1) * per_page

    programs = []
    programs_data = []
    if include_programs:
        programs = list(
            programs_query.only(
                "id",
                "slug",
                "name",
                "code",
                "description",
                "preview_description",
                "created_at",
                "thumbnail",
                "category",
                "level",
                "is_featured",
                "badge_type",
                "video_hours",
                "custom_pricing",
                "rating_average",
                "rating_count",
            ).order_by("-is_featured", "name")[offset : offset + per_page]
        )
        program_ids = [program.id for program in programs]

        assessment_types = {"quiz", "assignment"}
        leaf_nodes = CurriculumNode.objects.filter(
            program_id__in=program_ids,
            is_published=True,
            children__isnull=True,
        ).values_list("program_id", "node_type", "properties")

        stats_by_program_id = defaultdict(
            lambda: {
                "lesson_count": 0,
                "assessment_count": 0,
                "duration_minutes": 0,
            }
        )

        for program_id, node_type, properties in leaf_nodes:
            node_type_norm = (node_type or "").strip().lower()
            props = properties if isinstance(properties, dict) else {}
            lesson_type_norm = str(props.get("lesson_type") or "").strip().lower()
            is_assessment = (
                node_type_norm in assessment_types
                or lesson_type_norm in assessment_types
            )

            if is_assessment:
                stats_by_program_id[program_id]["assessment_count"] += 1
            else:
                stats_by_program_id[program_id]["lesson_count"] += 1

            if not is_assessment:
                minutes = props.get("duration_minutes", 0)
                try:
                    minutes_int = int(minutes) if minutes is not None else 0
                except (TypeError, ValueError):
                    minutes_int = 0
                stats_by_program_id[program_id]["duration_minutes"] += max(
                    0, minutes_int
                )

    def _minutes_to_hours(total_minutes: int) -> float:
        if not total_minutes:
            return 0
        return round(total_minutes / 60.0, 1)

    for program in programs:
        price_data = program.custom_pricing or {}
        programs_data.append(
            {
                "id": program.id,
                "slug": program.slug,
                "publicUrl": _program_public_url(program),
                "name": program.name,
                "code": program.code or "",
                "description": program.description or "",
                "preview_description": program.preview_description or "",
                "created_at": program.created_at.isoformat(),
                "thumbnail": program.thumbnail.url if program.thumbnail else None,
                "category": program.category or "",
                "level": program.level or "",
                "isFeatured": program.is_featured,
                "badge_type": program.badge_type,
                "duration_hours": _minutes_to_hours(
                    stats_by_program_id[program.id]["duration_minutes"]
                ),
                "lecture_count": stats_by_program_id[program.id]["lesson_count"],
                "assessment_count": stats_by_program_id[program.id]["assessment_count"],
                "video_hours": program.video_hours,
                "price": price_data.get("price", 0),
                "original_price": price_data.get("original_price"),
                "rating": float(program.rating_average or 0),
                "review_count": program.rating_count,
            }
        )

    props = {}
    if include_programs:
        props["programs"] = programs_data
    if include_grouped_programs:
        props["groupedPrograms"] = _group_programs_by_level(programs_data)
    if include_level_options:
        props["courseLevels"] = _build_level_options(level_options_data)
    if include_filters:
        props["filters"] = {
            "search": search,
            "category": category,
            "level": level,
            "page": page,
        }
    if include_pagination:
        props["pagination"] = _build_pagination(page, per_page, total)
    if include_categories:
        props["categories"] = cache.get_or_set(
            "public_programs:categories",
            lambda: list(
                Program.objects.filter(is_published=True, category__isnull=False)
                .exclude(category="")
                .values_list("category", flat=True)
                .distinct()
            ),
            900,
        )
    if request.user.is_authenticated and include_user_enrollments:
        props["userEnrollments"] = list(
            Enrollment.objects.filter(user=request.user).values_list(
                "program_id", flat=True
            )
        )
    elif include_user_enrollments:
        props["userEnrollments"] = []
    if request.user.is_authenticated and include_user_pending_requests:
        props["userPendingRequests"] = list(
            EnrollmentRequest.objects.filter(
                user=request.user, status="pending"
            ).values_list("program_id", flat=True)
        )
    elif include_user_pending_requests:
        props["userPendingRequests"] = []

    return render(
        request,
        "Public/Programs",
        props,
    )


def public_program_detail(
    request,
    slug: str | None = None,
    *,
    pk: int | None = None,
    is_preview: bool = False,
    builder_url: str | None = None,
):
    """
    Public course detail page with full course information.
    Adapts CTAs based on enrollment status and school mode (Chameleon engine).
    """
    from django.db.models import Count
    from django.shortcuts import get_object_or_404

    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment, EnrollmentRequest, NodeCompletion

    if is_preview:
        # Allow access even if not published
        program = get_object_or_404(Program, pk=pk)
    else:
        # Strict check
        program = get_object_or_404(Program, slug=slug, is_published=True)

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

    # Compute sidebar stats from curriculum leaf nodes.
    # Treat leaf nodes as lessons unless they are assessments (quiz/assignment).
    assessment_types = {"quiz", "assignment"}
    base_node_filter = {"program": program}
    if not is_preview:
        base_node_filter["is_published"] = True

    leaf_nodes_qs = CurriculumNode.objects.filter(
        **base_node_filter,
        children__isnull=True,
    ).values_list("node_type", "properties")

    lesson_count = 0
    assessment_count = 0
    duration_minutes = 0

    for node_type, properties in leaf_nodes_qs:
        node_type_norm = (node_type or "").strip().lower()
        props = properties if isinstance(properties, dict) else {}
        lesson_type_norm = str(props.get("lesson_type") or "").strip().lower()
        is_assessment = (
            node_type_norm in assessment_types or lesson_type_norm in assessment_types
        )

        if is_assessment:
            assessment_count += 1
            continue

        lesson_count += 1
        minutes = props.get("duration_minutes", 0)
        try:
            minutes_int = int(minutes) if minutes is not None else 0
        except (TypeError, ValueError):
            minutes_int = 0
        duration_minutes += max(0, minutes_int)

    duration_hours = round(duration_minutes / 60.0, 1) if duration_minutes else 0

    # Get total completable nodes count
    total_nodes_filter = {
        "program": program,
        "node_type__in": ["lesson", "quiz", "assignment"],
    }
    if not is_preview:
        total_nodes_filter["is_published"] = True
    total_nodes = CurriculumNode.objects.filter(**total_nodes_filter).count()

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
        ).exclude(pk=program.pk)[:4]

        for p in related_qs:
            price_data = p.custom_pricing or {}
            related_programs.append(
                {
                    "id": p.id,
                    "slug": p.slug,
                    "publicUrl": _program_public_url(p),
                    "name": p.name,
                    "thumbnail": p.thumbnail.url if p.thumbnail else None,
                    "category": p.category or "",
                    "rating": 4.5,
                    "price": price_data.get("price", 0),
                }
            )

    from apps.reviews.models import ProgramReview

    approved_reviews_qs = (
        ProgramReview.objects.filter(
            program=program,
            status="approved",
        )
        .select_related("user")
        .order_by("-moderated_at", "-updated_at")[:20]
    )

    approved_reviews = [
        {
            "id": review.id,
            "rating": review.rating,
            "reviewText": review.review_html,
            "user": {
                "id": review.user_id,
                "name": review.user.get_full_name()
                or review.user.username
                or review.user.email,
            },
            "updatedAt": review.updated_at.isoformat() if review.updated_at else None,
        }
        for review in approved_reviews_qs
    ]

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
            is_completed = progress_percent >= 100

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

    pending_payment = False
    if request.user.is_authenticated:
        from apps.commerce.models import OrderItem

        pending_payment = OrderItem.objects.filter(
            order__user=request.user,
            program=program,
            order__status__in=["created", "pending_payment", "pending_manual_payment"],
        ).exists()

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

    from apps.core.services.course_prerequisites import CoursePrerequisiteService

    prerequisite_evaluation = CoursePrerequisiteService.evaluate(
        request.user if request.user.is_authenticated else None,
        program,
    )
    prerequisite_status = prerequisite_evaluation.as_dict()

    if enrollment_status == "enrolled":
        cta_state = "enrolled"
    elif enrollment_status == "pending":
        cta_state = "pending"
    elif (
        request.user.is_authenticated
        and prerequisite_evaluation.required
        and not prerequisite_evaluation.eligible
    ):
        cta_state = "prerequisites_required"
    elif pending_payment:
        cta_state = "pending_payment"
    elif enrollment_mode == "paid":
        cta_state = "not_enrolled_paid"
    else:
        cta_state = "not_enrolled"

    # Build program data
    program_data = {
        "id": program.id,
        "slug": program.slug,
        "publicUrl": _program_public_url(program),
        "name": program.name,
        "code": program.code or "",
        "description": program.description or "",
        "preview_description": program.preview_description or "",
        "thumbnail": program.thumbnail.url if program.thumbnail else None,
        "category": program.category or "",
        "level": program.level or "",
        "duration_hours": duration_hours,
        "lecture_count": lesson_count,
        "assessment_count": assessment_count,
        "video_hours": program.video_hours,
        "badge_type": program.badge_type,
        "isFeatured": program.is_featured,
        "price": price,
        "original_price": price_data.get("original_price"),
        "faq": program.faq or [],
        "notices": program.notices or [],
        "what_you_learn": program.what_you_learn_items or [],
        "what_you_learn_html": program.what_you_learn_html or "",
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
        "rating": float(program.rating_average or 0),
        "review_count": program.rating_count,
            "reviews": approved_reviews,
            "prerequisites": prerequisite_status,
        }

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
            "ctaState": cta_state,
            "prerequisiteStatus": prerequisite_status,
            "isPreview": is_preview,
            "builderUrl": builder_url,
        },
    )


def _recompute_program_rating(program_id: int):
    from django.db.models import Avg, Count

    from apps.reviews.models import ProgramReview

    aggregates = ProgramReview.objects.filter(
        program_id=program_id,
        status="approved",
    ).aggregate(avg_rating=Avg("rating"), count_rating=Count("id"))

    avg_rating = aggregates.get("avg_rating") or 0
    count_rating = aggregates.get("count_rating") or 0

    Program.objects.filter(pk=program_id).update(
        rating_average=round(float(avg_rating), 2),
        rating_count=int(count_rating),
    )


@login_required
def program_review_submit(request, pk: int):
    from apps.progression.models import Enrollment
    from apps.reviews.models import ProgramReview

    if request.method != "POST":
        return redirect("core:programs")

    program = Program.objects.filter(pk=pk, is_published=True).first()
    if not program:
        messages.error(request, "Program not found.")
        return redirect("core:programs")

    enrollment = Enrollment.objects.filter(user=request.user, program=program).first()
    if not enrollment or enrollment.status != "completed":
        messages.error(request, "You can only review courses after completing them.")
        return redirect(_program_public_url(program))

    data = get_post_data(request)
    try:
        rating = int(data.get("rating") or 0)
    except (TypeError, ValueError):
        rating = 0

    if rating < 1 or rating > 5:
        messages.error(request, "Rating must be between 1 and 5.")
        return redirect(_program_public_url(program))

    raw_review = str(data.get("review_html") or data.get("review") or "").strip()
    review_text = strip_tags(raw_review).strip()
    review_html = raw_review

    if review_text and len(review_text) > 5000:
        messages.error(request, "Review is too long (max 5000 characters).")
        return redirect(_program_public_url(program))

    review, created = ProgramReview.objects.get_or_create(
        program=program,
        user=request.user,
        defaults={
            "enrollment": enrollment,
            "rating": rating,
            "review_html": review_html,
            "status": "pending",
        },
    )

    if not created:
        review.enrollment = enrollment
        review.rating = rating
        review.review_html = review_html
        review.status = "pending"
        review.moderated_by = None
        review.moderated_at = None
        review.moderation_note = ""
        review.save()

    messages.success(request, "Review submitted and awaiting moderation.")
    return redirect(_program_public_url(program))


@login_required
def admin_reviews(request):
    if not request.user.is_staff:
        return redirect("/dashboard/")

    from apps.reviews.models import ProgramReview

    status_filter = request.GET.get("status", "pending")
    valid_statuses = {"pending", "approved", "rejected"}
    if status_filter not in valid_statuses:
        status_filter = "pending"

    reviews_qs = ProgramReview.objects.select_related(
        "program",
        "user",
        "moderated_by",
    )
    if status_filter:
        reviews_qs = reviews_qs.filter(status=status_filter)

    reviews = [
        {
            "id": review.id,
            "program": {"id": review.program_id, "name": review.program.name},
            "user": {
                "id": review.user_id,
                "name": review.user.get_full_name()
                or review.user.username
                or review.user.email,
            },
            "rating": review.rating,
            "reviewText": review.review_html,
            "status": review.status,
            "moderationNote": review.moderation_note,
            "moderatedAt": review.moderated_at.isoformat()
            if review.moderated_at
            else None,
            "moderatedBy": (
                review.moderated_by.get_full_name()
                or review.moderated_by.username
                or review.moderated_by.email
            )
            if review.moderated_by
            else None,
            "updatedAt": review.updated_at.isoformat() if review.updated_at else None,
        }
        for review in reviews_qs.order_by("-updated_at")[:200]
    ]

    return render(
        request,
        "Admin/Reviews",
        {
            "reviews": reviews,
            "filters": {"status": status_filter},
            "statusOptions": [
                {"value": "pending", "label": "Pending"},
                {"value": "approved", "label": "Approved"},
                {"value": "rejected", "label": "Rejected"},
            ],
        },
    )


@login_required
def admin_review_approve(request, review_id: int):
    if not request.user.is_staff or request.method != "POST":
        return redirect("/dashboard/")

    from apps.reviews.models import ProgramReview

    review = (
        ProgramReview.objects.select_related("program").filter(pk=review_id).first()
    )
    if not review:
        messages.error(request, "Review not found.")
        return redirect("core:admin.reviews")

    review.status = "approved"
    review.moderated_by = request.user
    review.moderated_at = timezone.now()
    review.moderation_note = str(
        get_post_data(request).get("moderation_note") or ""
    ).strip()
    review.save()

    _recompute_program_rating(review.program_id)
    messages.success(request, "Review approved.")
    return redirect("core:admin.reviews")


@login_required
def admin_review_reject(request, review_id: int):
    if not request.user.is_staff or request.method != "POST":
        return redirect("/dashboard/")

    from apps.reviews.models import ProgramReview

    review = (
        ProgramReview.objects.select_related("program").filter(pk=review_id).first()
    )
    if not review:
        messages.error(request, "Review not found.")
        return redirect("core:admin.reviews")

    review.status = "rejected"
    review.moderated_by = request.user
    review.moderated_at = timezone.now()
    review.moderation_note = str(
        get_post_data(request).get("moderation_note") or ""
    ).strip()
    review.save()

    _recompute_program_rating(review.program_id)
    messages.success(request, "Review rejected.")
    return redirect("core:admin.reviews")


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
        
        from apps.notifications.services import NotificationService
        NotificationService.notify_user_registered(user)

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
    Roles: student, instructor, admin
    """
    user = request.user
    role = _get_user_role(user)

    # Build props based on role
    props = {"role": role}

    if role == "admin":
        props.update(_get_admin_dashboard_data(user))
    elif role == "instructor":
        props.update(_get_instructor_dashboard_data(user))
    else:  # student
        props.update(_get_student_dashboard_data(user))

    return render(request, "Dashboard", props)


def _get_student_dashboard_data(user) -> dict:
    """Get dashboard data for students."""
    from apps.assessments.models import (
        Assignment,
        AssignmentSubmission,
        QuizAttempt,
    )
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment, NodeCompletion

    # Get active enrollments with progress
    enrollments = list(
        Enrollment.objects.filter(
            user=user, status__in=["active", "completed"]
        ).select_related("program")
    )

    # Batch-compute lecture counts (leaf nodes) per program
    program_ids = [e.program_id for e in enrollments]
    enrollment_ids = [e.id for e in enrollments]
    assessment_types = ["quiz", "assignment", "practicum", "peer_review"]

    from django.db.models import Count, Q

    leaf_counts = dict(
        CurriculumNode.objects.filter(
            program_id__in=program_ids,
            is_published=True,
            children__isnull=True,
        )
        .values("program_id")
        .annotate(cnt=Count("id"))
        .values_list("program_id", "cnt")
    )

    lesson_counts = dict(
        CurriculumNode.objects.filter(
            program_id__in=program_ids,
            is_published=True,
            children__isnull=True,
        )
        .exclude(
            Q(node_type__in=assessment_types)
            | Q(properties__lesson_type__in=assessment_types)
        )
        .values("program_id")
        .annotate(cnt=Count("id"))
        .values_list("program_id", "cnt")
    )

    completion_counts = dict(
        NodeCompletion.objects.filter(enrollment_id__in=enrollment_ids)
        .values("enrollment_id")
        .annotate(cnt=Count("id"))
        .values_list("enrollment_id", "cnt")
    )

    enrollment_data = []
    for enrollment in enrollments:
        total_nodes = leaf_counts.get(enrollment.program_id, 0)
        lesson_count = lesson_counts.get(enrollment.program_id, 0)
        completed_nodes = completion_counts.get(enrollment.id, 0)
        progress = (completed_nodes / total_nodes * 100) if total_nodes > 0 else 0
        if enrollment.status in {"active", "completed"}:
            target_status = "completed" if progress >= 100 else "active"
            if enrollment.status != target_status:
                enrollment.status = target_status
                enrollment.completed_at = (
                    timezone.now() if target_status == "completed" else None
                )
                enrollment.save(update_fields=["status", "completed_at", "updated_at"])

        program = enrollment.program
        enrollment_data.append(
            {
                "id": enrollment.id,
                "programId": program.id,
                "programName": program.name,
                "programCode": program.code or "",
                "progressPercent": round(progress, 1),
                "status": enrollment.status,
                "thumbnail": (program.thumbnail.url if program.thumbnail else None),
                "category": program.category or "",
                "durationHours": program.duration_hours or 0,
                "lectureCount": lesson_count,
                "ratingAverage": float(program.rating_average or 0),
                "ratingCount": program.rating_count or 0,
                "badgeType": program.badge_type,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
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

    # ---- Assignments across all enrolled programs ----
    assignments_qs = (
        Assignment.objects.filter(
            program_id__in=program_ids,
            is_published=True,
        )
        .select_related("program")
        .order_by("-due_date", "-created_at")
    )

    # Map enrollment per program for quick lookup
    enrollment_by_program = {e.program_id: e for e in enrollments}

    assignments_data = []
    for assignment in assignments_qs:
        enrollment_for_program = enrollment_by_program.get(assignment.program_id)
        submission = None
        if enrollment_for_program:
            submission = (
                AssignmentSubmission.objects.filter(
                    enrollment=enrollment_for_program,
                    assignment=assignment,
                )
                .order_by("-attempt_number")
                .first()
            )

        assignments_data.append(
            {
                "id": assignment.id,
                "title": assignment.title,
                "programName": assignment.program.name,
                "programId": assignment.program.id,
                "dueDate": (
                    assignment.due_date.isoformat() if assignment.due_date else None
                ),
                "submissionStatus": submission.status if submission else "not_started",
                "score": float(submission.score)
                if submission and submission.score is not None
                else None,
                "passed": submission.passed if submission else None,
                "submittedAt": (
                    submission.submitted_at.isoformat()
                    if submission and submission.submitted_at
                    else None
                ),
            }
        )

    # ---- Quizzes across all enrolled programs ----
    quiz_attempts = (
        QuizAttempt.objects.filter(
            enrollment_id__in=enrollment_ids,
            submitted_at__isnull=False,
        )
        .select_related("quiz__node__program", "enrollment__program")
        .order_by("-submitted_at")
    )

    # Group by quiz to get summary
    quiz_map = {}
    for attempt in quiz_attempts:
        quiz = attempt.quiz
        key = quiz.id
        if key not in quiz_map:
            quiz_map[key] = {
                "id": quiz.id,
                "title": quiz.title,
                "programName": attempt.enrollment.program.name,
                "programId": attempt.enrollment.program.id,
                "questionCount": quiz.questions.count(),
                "attempts": 0,
                "bestScore": None,
                "passed": False,
            }

        entry = quiz_map[key]
        entry["attempts"] += 1

        score_val = float(attempt.score) if attempt.score is not None else None
        if score_val is not None:
            if entry["bestScore"] is None or score_val > entry["bestScore"]:
                entry["bestScore"] = score_val

        if attempt.passed:
            entry["passed"] = True

    quizzes_data = list(quiz_map.values())

    return {
        "enrollments": enrollment_data,
        "recentActivity": recent_activity,
        "assignments": assignments_data,
        "quizzes": quizzes_data,
        "upcomingDeadlines": [],
    }


def _get_instructor_dashboard_data(user) -> dict:
    """Get dashboard data for instructors."""
    from datetime import timedelta

    from apps.practicum.models import PracticumSubmission
    from apps.progression.models import (
        Enrollment,
        EnrollmentRequest,
        InstructorAssignment,
    )

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

    # Pending enrollment requests across all instructor's programs
    pending_enrollments = EnrollmentRequest.objects.filter(
        program_id__in=program_ids, status="pending"
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

    # Get recent pending enrollment requests
    pending_enrollment_requests = (
        EnrollmentRequest.objects.filter(program_id__in=program_ids, status="pending")
        .select_related("user", "program")
        .order_by("-created_at")[:5]
    )

    enrollment_requests_data = [
        {
            "id": r.id,
            "studentName": r.user.get_full_name() or r.user.email,
            "programName": r.program.name,
            "programId": r.program.id,
            "createdAt": r.created_at.isoformat(),
        }
        for r in pending_enrollment_requests
    ]

    return {
        "stats": {
            "programCount": len(program_ids),
            "totalStudents": total_students,
            "pendingReviews": pending_reviews,
            "pendingEnrollments": pending_enrollments,
            "completionRate": round(completion_rate, 1),
        },
        "recentSubmissions": submissions_data,
        "pendingEnrollmentRequests": enrollment_requests_data,
    }


def _get_admin_dashboard_data(user) -> dict:
    """Get dashboard data for admins."""
    from apps.certifications.models import Certificate
    from apps.practicum.models import PracticumSubmission
    from apps.progression.models import Enrollment, EnrollmentRequest

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
    total_programs = Program.objects.count()
    certificates_issued = Certificate.objects.count()
    active_enrollments = Enrollment.objects.filter(status="active").count()
    completed_enrollments = Enrollment.objects.filter(status="completed").count()
    pending_enrollment_requests = EnrollmentRequest.objects.filter(
        status="pending"
    ).count()
    pending_practicum_submissions = PracticumSubmission.objects.filter(
        status="pending"
    ).count()

    # Recent activity (simplified)
    recent_enrollments = (
        Enrollment.objects.all()
        .select_related("user", "program")
        .order_by("-enrolled_at")[:8]
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
            "totalPrograms": total_programs,
            "certificatesIssued": certificates_issued,
            "activeEnrollments": active_enrollments,
            "completedEnrollments": completed_enrollments,
            "pendingEnrollmentRequests": pending_enrollment_requests,
            "pendingPracticumSubmissions": pending_practicum_submissions,
        },
        "recentActivity": recent_activity,
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

    status = request.GET.get("status", "")
    blueprint_id = request.GET.get("blueprint", "")
    search = request.GET.get("search", "")
    level = request.GET.get("level", "")
    try:
        page = max(int(request.GET.get("page", 1)), 1)
    except (TypeError, ValueError):
        page = 1
    per_page = 20
    include_programs = should_render_inertia_prop(
        request, "programs", "groupedPrograms"
    )
    include_grouped_programs = should_render_inertia_prop(request, "groupedPrograms")
    include_blueprints = should_render_inertia_prop(request, "blueprints")
    include_level_options = should_render_inertia_prop(
        request, "courseLevels", "groupedPrograms"
    )
    include_filters = should_render_inertia_prop(request, "filters")
    include_pagination = should_render_inertia_prop(request, "pagination")

    programs_query = Program.objects.all().select_related("blueprint")

    if status == "published":
        programs_query = programs_query.filter(is_published=True)
    elif status == "draft":
        programs_query = programs_query.filter(is_published=False)

    if blueprint_id:
        programs_query = programs_query.filter(blueprint_id=blueprint_id)

    if search:
        programs_query = programs_query.filter(name__icontains=search)

    level_options_data = list(programs_query.values("level").order_by("level"))

    if level:
        programs_query = programs_query.filter(level=level)

    total = programs_query.count()
    programs = []
    programs_data = []
    if include_programs:
        programs = list(
            programs_query.only(
                "id",
                "name",
                "code",
                "description",
                "blueprint_id",
                "blueprint__name",
                "level",
                "is_published",
                "created_at",
            ).order_by("-created_at")[(page - 1) * per_page : page * per_page]
        )
        program_ids = [program.id for program in programs]

        from apps.progression.models import Enrollment

        enrollment_counts = dict(
            Enrollment.objects.filter(program_id__in=program_ids)
            .values("program_id")
            .annotate(count=Count("id"))
            .values_list("program_id", "count")
        )

        programs_data = [
            {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "description": program.description or "",
                "blueprintName": program.blueprint.name if program.blueprint else None,
                "blueprintId": program.blueprint_id,
                "level": program.level or "",
                "isPublished": program.is_published,
                "enrollmentCount": enrollment_counts.get(program.id, 0),
                "createdAt": program.created_at.isoformat(),
            }
            for program in programs
        ]

    props = {}
    if include_programs:
        props["programs"] = programs_data
    if include_grouped_programs:
        props["groupedPrograms"] = _group_programs_by_level(programs_data)
    if include_blueprints:
        from apps.blueprints.models import AcademicBlueprint

        props["blueprints"] = cache.get_or_set(
            "admin_programs:blueprints",
            lambda: list(
                AcademicBlueprint.objects.all().values("id", "name").order_by("name")
            ),
            900,
        )
    if include_level_options:
        props["courseLevels"] = _build_level_options(level_options_data)
    if include_filters:
        props["filters"] = {
            "status": status,
            "blueprint": blueprint_id,
            "search": search,
            "level": level,
        }
    if include_pagination:
        props["pagination"] = _build_pagination(page, per_page, total)

    return render(
        request,
        "Admin/Programs/Index",
        props,
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
    from apps.curriculum.services import CoursePublishValidationService

    validation = CoursePublishValidationService().validate_for_publish(program)
    validation_errors = validation.get("errors", [])
    validation_messages = [
        error.get("message") or "Resolve validation issues before publishing."
        for error in validation_errors
    ]

    def _has_error(error_type):
        return any(error.get("type") == error_type for error in validation_errors)

    structural_error = _has_error("missing_content") or _has_error("missing_assessment")
    instructor_error = _has_error("missing_instructor")
    description_error = _has_error("missing_description")
    thumbnail_error = _has_error("missing_thumbnail")
    learning_outcomes_error = _has_error("missing_learning_outcomes")
    mode_error = _has_error("invalid_weight_sum")
    current_weight_total = validation.get("details", {}).get("total_assessment_weight")

    # Structure readiness report for frontend
    readiness = {
        "isReady": validation.get("is_valid", False),
        "errors": validation_messages,
        "checks": [
            {
                "label": "Structural Integrity",
                "passed": not structural_error,
                "error": (
                    "Add at least one lesson and one quiz or assignment before publishing."
                    if structural_error
                    else None
                ),
            },
            {
                "label": "Instructor Assignment",
                "passed": not instructor_error,
                "error": (
                    "Assign at least one instructor to this course before publishing."
                    if instructor_error
                    else None
                ),
            },
            {
                "label": "Metadata (Description)",
                "passed": not description_error,
                "error": (
                    "Add a clear course description for learners in the catalog."
                    if description_error
                    else None
                ),
            },
            {
                "label": "Metadata (Thumbnail)",
                "passed": not thumbnail_error,
                "error": (
                    "Upload a course thumbnail image so learners can identify this course."
                    if thumbnail_error
                    else None
                ),
            },
            {
                "label": "Metadata (What You'll Learn)",
                "passed": not learning_outcomes_error,
                "error": (
                    "Add what learners will learn before publishing this course."
                    if learning_outcomes_error
                    else None
                ),
            },
            {
                "label": "Assessment Weight",
                "passed": not mode_error,
                "error": (
                    (
                        f"Current total assessment weight is {current_weight_total}%. It must be exactly 100% before publishing."
                        if current_weight_total
                        else "Total assessment weight must be exactly 100% before publishing."
                    )
                    if mode_error
                    else None
                ),
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
                "level": program.level or "",
                "isPublished": program.is_published,
                "createdAt": program.created_at.isoformat(),
                "examBody": program.exam_body,
                "awardType": program.award_type,
                "assessmentMode": program.assessment_mode,
            },
            "stats": {
                "enrollmentCount": enrollment_count,
                "activeEnrollments": active_enrollments,
                "completedEnrollments": completed_enrollments,
                "nodeCount": node_count,
            },
            "instructors": instructors_data,
            "availableInstructors": _get_instructors_for_form(),
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

    from apps.progression.models import InstructorAssignment

    if request.method == "POST":
        data = get_post_data(request)
        cleaned, errors = _validate_program_setup_data(data)

        if errors:
            return render(
                request,
                "Admin/Programs/Form",
                _get_program_setup_form_props(errors=errors, form_data=data),
            )

        # Create program with exam body metadata
        program = Program.objects.create(
            blueprint_id=cleaned["blueprint_id"],
            name=cleaned["name"],
            code=cleaned["code"],
            description=cleaned["description"],
            preview_description=cleaned["preview_description"],
            is_published=False,
            is_featured=cleaned["is_featured"],
            lock_lessons_in_order=cleaned["lock_lessons_in_order"],
            level=cleaned["level"],
            duration_hours=cleaned["duration_hours"],
            video_hours=cleaned["video_hours"],
            exam_body=cleaned["exam_body"],
            qualification_family=cleaned["qualification_family"],
            award_type=cleaned["award_type"],
            assessment_mode=cleaned["assessment_mode"],
        )

        # Assign instructors
        instructor_ids = data.get("instructorIds", [])
        for instructor_id in instructor_ids:
            InstructorAssignment.objects.create(
                program=program,
                instructor_id=instructor_id,
                role="instructor",
            )

        return redirect(f"/instructor/programs/{program.id}/manage/?tab=settings")

    # GET - show create form
    return render(
        request,
        "Admin/Programs/Form",
        _get_program_setup_form_props(),
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
        data = get_post_data(request)
        cleaned, errors = _validate_program_setup_data(data, program=program)

        if errors:
            return render(
                request,
                "Admin/Programs/Form",
                _get_program_setup_form_props(
                    mode="edit",
                    program=program,
                    errors=errors,
                    form_data=data,
                    submit_url=f"/admin/programs/{program.id}/edit/",
                    cancel_url=f"/admin/programs/{program.id}/",
                ),
            )

        # Update program
        program.name = cleaned["name"]
        program.code = cleaned["code"]
        program.description = cleaned["description"]
        program.preview_description = cleaned["preview_description"]
        program.level = cleaned["level"]
        program.duration_hours = cleaned["duration_hours"]
        program.video_hours = cleaned["video_hours"]
        program.is_featured = cleaned["is_featured"]
        program.lock_lessons_in_order = cleaned["lock_lessons_in_order"]

        # Exam body metadata
        program.exam_body = cleaned["exam_body"]
        program.qualification_family = cleaned["qualification_family"]
        program.award_type = cleaned["award_type"]
        program.assessment_mode = cleaned["assessment_mode"]

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
        _get_program_setup_form_props(
            mode="edit",
            program=program,
            current_instructor_ids=current_instructors,
            submit_url=f"/admin/programs/{program.id}/edit/",
            cancel_url=f"/admin/programs/{program.id}/",
        ),
    )

@login_required
def admin_program_assign_instructors(request, program_id: int):
    """
    Quick assign instructors for a program.
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404
    from apps.progression.models import InstructorAssignment
    import json

    program = get_object_or_404(Program, pk=program_id)

    if request.method == "POST":
        instructor_ids = []
        if request.body:
            try:
                body = json.loads(request.body)
                instructor_ids = body.get("instructorIds", [])
            except json.JSONDecodeError:
                pass

        # Clear existing
        InstructorAssignment.objects.filter(program=program).delete()

        # Add new
        for instructor_id in instructor_ids:
            InstructorAssignment.objects.create(
                program=program,
                instructor_id=instructor_id,
                role="instructor",
            )
            
        messages.success(request, "Instructors assigned successfully")

    return redirect("core:admin.program", pk=program.id)



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

    from apps.curriculum.services import CoursePublishValidationService

    program = get_object_or_404(Program, pk=pk)

    # If we are TRYING to publish (currently False), run validation
    if not program.is_published:
        validation = CoursePublishValidationService().validate_for_publish(program)
        errors = validation.get("errors", [])

        if errors:
            # Block publishing
            for issue in errors:
                messages.error(
                    request,
                    issue.get("message") or "Resolve validation issues before publishing.",
                )
            return redirect("core:admin.program", pk=pk)

    # Proceed if valid or if unpublishing
    was_published = program.is_published
    program.is_published = not program.is_published
    program.save()

    _sync_program_publication_state(program, program.is_published)

    if was_published and not program.is_published:
        messages.success(request, f"Program '{program.name}' unpublished.")
    else:
        messages.success(request, f"Program '{program.name}' published successfully.")

    return redirect("core:admin.program", pk=pk)


def _sync_program_publication_state(program: Program, is_published: bool):
    """
    Keep publish state consistent across program-owned learning records.

    When a program is published/unpublished, curriculum visibility and the
    linked assessment records (quiz/assignment) should match immediately.
    """
    from apps.assessments.models import Assignment, Quiz
    from apps.curriculum.models import CurriculumNode

    CurriculumNode.objects.filter(program=program).update(is_published=is_published)
    Quiz.objects.filter(node__program=program).update(is_published=is_published)
    Assignment.objects.filter(program=program).update(is_published=is_published)


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
        "slug": program.slug or "",
        "level": program.level or "",
        "description": program.description or "",
        "previewDescription": program.preview_description or "",
        "durationHours": program.duration_hours,
        "videoHours": program.video_hours,
        "isFeatured": program.is_featured,
        "lockLessonsInOrder": program.lock_lessons_in_order,
        "blueprintId": program.blueprint_id,
        "blueprintName": program.blueprint.name if program.blueprint else None,
        "isPublished": program.is_published,
        # Exam body metadata
        "examBody": program.exam_body or "",
        "qualificationFamily": program.qualification_family or "",
        "awardType": program.award_type or "",
        "assessmentMode": program.assessment_mode or "",
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

    role = request.GET.get("role", "")
    status = request.GET.get("status", "")
    search = request.GET.get("search", "")
    try:
        page = max(int(request.GET.get("page", 1)), 1)
    except (TypeError, ValueError):
        page = 1
    per_page = 20
    include_users = should_render_inertia_prop(request, "users")
    include_filters = should_render_inertia_prop(request, "filters")
    include_pagination = should_render_inertia_prop(request, "pagination")

    users_query = User.objects.all()

    if role == "admin":
        users_query = users_query.filter(is_staff=True)
    elif role == "instructor":
        users_query = users_query.filter(groups__name="Instructors")
    elif role == "student":
        users_query = users_query.filter(is_staff=False).exclude(
            groups__name="Instructors"
        )
    if role in {"instructor", "student"}:
        users_query = users_query.distinct()

    if status == "active":
        users_query = users_query.filter(is_active=True)
    elif status == "inactive":
        users_query = users_query.filter(is_active=False)

    if search:
        users_query = users_query.filter(
            Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
        )

    total = users_query.count()
    users_data = []
    if include_users:
        users = list(
            users_query.only(
                "id",
                "email",
                "first_name",
                "last_name",
                "is_staff",
                "is_superuser",
                "is_active",
                "date_joined",
                "last_login",
            )
            .order_by("-date_joined")
            .prefetch_related("groups")[(page - 1) * per_page : page * per_page]
        )

        for user in users:
            group_names = {group.name for group in user.groups.all()}
            user_role = (
                "superadmin"
                if user.is_superuser
                else (
                    "admin"
                    if user.is_staff
                    else ("instructor" if "Instructors" in group_names else "student")
                )
            )
            users_data.append(
                {
                    "id": user.id,
                    "email": user.email,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "fullName": user.get_full_name() or user.email,
                    "role": user_role,
                    "isActive": user.is_active,
                    "dateJoined": user.date_joined.isoformat(),
                    "lastLogin": (
                        user.last_login.isoformat() if user.last_login else None
                    ),
                }
            )

    props = {}
    if include_users:
        props["users"] = users_data
    if include_filters:
        props["filters"] = {
            "role": role,
            "status": status,
            "search": search,
        }
    if include_pagination:
        props["pagination"] = _build_pagination(page, per_page, total)
    return render(
        request,
        "Admin/Users/Index",
        props,
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


def _get_program_setup_form_props(
    *,
    mode: str = "create",
    program: Program | None = None,
    errors: dict | None = None,
    form_data: dict | None = None,
    current_instructor_ids: list | None = None,
    layout_role: str = "admin",
    submit_url: str = "/admin/programs/create/",
    cancel_url: str = "/admin/programs/",
    show_instructor_assignment: bool = True,
) -> dict:
    from apps.platform.exam_body_registry import get_registry_for_frontend
    from apps.platform.models import PlatformSettings

    platform_settings = PlatformSettings.get_settings()

    return {
        "mode": mode,
        "program": _serialize_program(program) if program else None,
        "instructors": _get_instructors_for_form() if show_instructor_assignment else [],
        "courseLevels": _build_level_options(
            list(Program.objects.values("level").order_by("level"))
        ),
        "currentInstructorIds": current_instructor_ids or [],
        "examBodyRegistry": get_registry_for_frontend(),
        "deploymentMode": platform_settings.deployment_mode,
        "errors": errors or {},
        "formData": form_data or {},
        "layoutRole": layout_role,
        "submitUrl": submit_url,
        "cancelUrl": cancel_url,
        "showInstructorAssignment": show_instructor_assignment,
    }


def _validate_program_setup_data(data: dict, *, program: Program | None = None) -> tuple[dict, dict]:
    from apps.platform.models import PlatformSettings

    errors = {}
    name = str(data.get("name") or "").strip()
    code = str(data.get("code") or "").strip()
    platform_settings = PlatformSettings.get_settings()
    active_blueprint = platform_settings.active_blueprint

    def _to_bool(value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "on"}
        return bool(value)

    def _to_non_negative_int(field_name: str, label: str) -> int:
        raw_value = data.get(field_name)
        if raw_value in (None, ""):
            return 0
        try:
            value = int(raw_value)
        except (TypeError, ValueError):
            errors[field_name] = f"{label} must be a number."
            return 0
        if value < 0:
            errors[field_name] = f"{label} must be zero or more."
            return 0
        return value

    if not name:
        errors["name"] = "Name is required"

    if not code:
        errors["code"] = "Course code is required"
    else:
        duplicate_code = Program.objects.filter(code=code)
        if program:
            duplicate_code = duplicate_code.exclude(pk=program.pk)
        if duplicate_code.exists():
            errors["code"] = "A program with this code already exists."

    if program:
        blueprint_id = program.blueprint_id
    elif active_blueprint:
        blueprint_id = active_blueprint.id
    else:
        blueprint_id = None
        errors["_form"] = "No active academic blueprint is configured."

    return {
        "name": name,
        "code": code,
        "blueprint_id": blueprint_id,
        "description": data.get("description", ""),
        "preview_description": data.get("previewDescription") or data.get("preview_description") or "",
        "level": str(data.get("level") or "").strip(),
        "duration_hours": _to_non_negative_int("durationHours", "Course duration"),
        "video_hours": _to_non_negative_int("videoHours", "Video duration"),
        "is_featured": _to_bool(data.get("isFeatured")),
        "lock_lessons_in_order": _to_bool(
            data.get("lockLessonsInOrder", True),
        ),
        "exam_body": data.get("examBody") or None,
        "qualification_family": data.get("qualificationFamily") or None,
        "award_type": data.get("awardType") or None,
        "assessment_mode": data.get("assessmentMode") or None,
    }, errors


# =============================================================================
# Instructor Views
# =============================================================================


@login_required
def instructor_landing(request):
    """Instructor landing page - redirects to programs."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")
    return redirect("/instructor/programs/")


@login_required
def instructor_programs(request):
    """List programs assigned to this instructor."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    program_ids = get_instructor_program_ids(request.user)
    status = request.GET.get("status", "")
    level = request.GET.get("level", "")
    include_programs = should_render_inertia_prop(
        request, "programs", "groupedPrograms"
    )
    include_grouped_programs = should_render_inertia_prop(request, "groupedPrograms")
    include_level_options = should_render_inertia_prop(
        request, "courseLevels", "groupedPrograms"
    )
    include_filters = should_render_inertia_prop(request, "filters")

    programs_query = Program.objects.filter(id__in=program_ids).select_related(
        "blueprint"
    )
    if status == "published":
        programs_query = programs_query.filter(is_published=True)
    elif status == "draft":
        programs_query = programs_query.filter(is_published=False)

    level_options_data = list(programs_query.values("level").order_by("level"))

    if level:
        programs_query = programs_query.filter(level=level)

    programs_data = []
    if include_programs:
        programs = list(
            programs_query.only(
                "id",
                "name",
                "code",
                "description",
                "thumbnail",
                "category",
                "blueprint_id",
                "blueprint__name",
                "level",
                "is_published",
                "custom_pricing",
                "rating_average",
                "rating_count",
            ).order_by("name")
        )
        filtered_program_ids = [program.id for program in programs]

        from apps.progression.models import Enrollment

        enrollment_counts = dict(
            Enrollment.objects.filter(program_id__in=filtered_program_ids)
            .values("program_id")
            .annotate(count=Count("id"))
            .values_list("program_id", "count")
        )

        programs_data = [
            {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "description": program.description or "",
                "thumbnail": program.thumbnail.url if program.thumbnail else None,
                "category": program.category or "General",
                "blueprintName": program.blueprint.name if program.blueprint else None,
                "enrollmentCount": enrollment_counts.get(program.id, 0),
                "level": program.level or "",
                "isPublished": program.is_published,
                "price": (program.custom_pricing or {}).get("price", 0),
                "rating": float(program.rating_average or 0),
                "reviewCount": program.rating_count or 0,
            }
            for program in programs
        ]

    props = {}
    if include_programs:
        props["programs"] = programs_data
    if include_grouped_programs:
        props["groupedPrograms"] = _group_programs_by_level(programs_data)
    if include_level_options:
        props["courseLevels"] = _build_level_options(level_options_data)
    if include_filters:
        props["filters"] = {"status": status, "level": level}

    return render(
        request,
        "Instructor/Programs/Index",
        props,
    )


@login_required
def instructor_program_create(request):
    """Create a draft course and assign it to the creating instructor."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from apps.progression.models import InstructorAssignment

    if request.method == "POST":
        data = get_post_data(request)
        cleaned, errors = _validate_program_setup_data(data)

        if errors:
            return render(
                request,
                "Instructor/Programs/Create",
                _get_program_setup_form_props(
                    errors=errors,
                    form_data=data,
                    layout_role="instructor",
                    submit_url="/instructor/programs/create/",
                    cancel_url="/instructor/programs/",
                    show_instructor_assignment=False,
                ),
            )

        with transaction.atomic():
            program = Program.objects.create(
                blueprint_id=cleaned["blueprint_id"],
                name=cleaned["name"],
                code=cleaned["code"],
                description=cleaned["description"],
                preview_description=cleaned["preview_description"],
                is_published=False,
                level=cleaned["level"],
                duration_hours=cleaned["duration_hours"],
                video_hours=cleaned["video_hours"],
                lock_lessons_in_order=cleaned["lock_lessons_in_order"],
                exam_body=cleaned["exam_body"],
                qualification_family=cleaned["qualification_family"],
                award_type=cleaned["award_type"],
                assessment_mode=cleaned["assessment_mode"],
            )
            InstructorAssignment.objects.create(
                program=program,
                instructor=request.user,
                role="instructor",
                is_primary=True,
            )

        return redirect(f"/instructor/programs/{program.id}/manage/?tab=settings")

    return render(
        request,
        "Instructor/Programs/Create",
        _get_program_setup_form_props(
            layout_role="instructor",
            submit_url="/instructor/programs/create/",
            cancel_url="/instructor/programs/",
            show_instructor_assignment=False,
        ),
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
    from apps.notifications.services import NotificationService

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
        NotificationService.notify_enrollment_status_changed(enrollment, new_status)
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
    """Bridge legacy global gradebook endpoint to canonical progression route."""
    if not (is_instructor(request.user) or request.user.is_staff):
        return redirect("/dashboard/")

    requested_program_id = _safe_int(request.GET.get("program"))
    program_id = None

    if requested_program_id:
        if request.user.is_staff:
            exists = Program.objects.filter(pk=requested_program_id).exists()
            if exists:
                program_id = requested_program_id
        else:
            if requested_program_id in get_instructor_program_ids(request.user):
                program_id = requested_program_id

    if program_id is None:
        if request.user.is_staff:
            first_program = Program.objects.order_by("id").first()
            if first_program:
                program_id = first_program.id
        else:
            assigned_ids = get_instructor_program_ids(request.user)
            if assigned_ids:
                program_id = assigned_ids[0]

    if not program_id:
        messages.error(request, "No program available for gradebook")
        return redirect("/dashboard/")

    return redirect(f"/instructor/programs/{program_id}/gradebook/")


@login_required
def instructor_grade_entry(request, enrollment_id: int):
    """Bridge legacy grade entry endpoint to canonical progression student-gradebook view."""
    if not (is_instructor(request.user) or request.user.is_staff):
        return redirect("/dashboard/")

    from django.shortcuts import get_object_or_404

    from apps.progression.models import Enrollment

    enrollment = get_object_or_404(
        Enrollment.objects.select_related("program"), pk=enrollment_id
    )

    if not request.user.is_staff:
        program_ids = get_instructor_program_ids(request.user)
        if enrollment.program_id not in program_ids:
            messages.error(request, "Permission denied")
            return redirect("/dashboard/")

    return redirect(
        f"/instructor/programs/{enrollment.program_id}/gradebook/student/{enrollment.id}/"
    )


@login_required
def instructor_program_gradebook(request, pk: int):
    """Bridge legacy core program-gradebook endpoint to canonical progression view."""
    from apps.progression.views import (
        instructor_gradebook as progression_instructor_gradebook,
    )

    return progression_instructor_gradebook(request, pk)


@login_required
def instructor_program_gradebook_save(request, pk: int):
    """Bridge legacy core grade-save endpoint to canonical progression save view."""
    from apps.progression.views import (
        instructor_gradebook_save as progression_instructor_gradebook_save,
    )

    return progression_instructor_gradebook_save(request, pk)


# Note: instructor_content and instructor_content_edit functions removed
# Content editing is now handled by Course Builder via instructor_node_update


@login_required
def instructor_announcements_index(request):
    """
    List all announcements across instructor's programs.
    Uses the Announcement model (apps.progression).
    """
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from apps.progression.models import Announcement

    program_ids = get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids)

    announcements_qs = (
        Announcement.objects.filter(program_id__in=program_ids)
        .select_related("program", "author")
        .order_by("-is_pinned", "-created_at")
    )

    announcements = [
        {
            "id": a.id,
            "programId": a.program_id,
            "programName": a.program.name,
            "title": a.title,
            "message": a.content,
            "authorName": a.author.get_full_name() or a.author.email,
            "createdAt": a.created_at.isoformat(),
            "isPinned": a.is_pinned,
        }
        for a in announcements_qs
    ]

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
    Creates an Announcement model record and notifies enrolled students.
    """
    if not is_instructor(request.user):
        return redirect("/dashboard/")

    from apps.progression.models import Announcement

    program_ids = get_instructor_program_ids(request.user)
    programs = Program.objects.filter(id__in=program_ids)

    if request.method == "POST":
        data = get_post_data(request)
        program_id = data.get("programId")
        title = str(data.get("title", "")).strip()
        raw_message = str(data.get("message", "")).strip()
        message_text = strip_tags(raw_message).strip()

        if not program_id or not message_text:
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

        # Create Announcement record
        announcement = Announcement.objects.create(
            program=program,
            author=request.user,
            title=title or "Announcement",
            content=raw_message,
        )

        # Notify all actively enrolled students in-app
        from apps.notifications.services import NotificationService
        from apps.progression.models import Enrollment

        enrolled_users = User.objects.filter(
            id__in=Enrollment.objects.filter(
                program=program,
                status="active",
            ).values_list("user_id", flat=True)
        )
        if enrolled_users.exists():
            NotificationService.bulk_create(
                recipients=enrolled_users,
                notification_type="announcement",
                title=announcement.title,
                message=message_text[:200] + ("..." if len(message_text) > 200 else ""),
                action_url=f"/student/programs/{program.id}/",
                related_program_id=program.id,
            )
            for enrolled_user in enrolled_users:
                NotificationService.send_email_notification(
                    recipient=enrolled_user,
                    notification_type="announcement",
                    subject=f"New Announcement: {program.name}",
                    message=message_text[:500],
                )

        messages.success(request, "Announcement created successfully")
        return redirect("core:instructor.announcements")

    return render(
        request,
        "Instructor/Announcements/Create",
        {"programs": [{"id": p.id, "name": p.name} for p in programs]},
    )


@login_required
def instructor_announcement_delete(request, pk):
    """Delete an announcement. Instructor must own the program."""
    if not is_instructor(request.user) or request.method != "DELETE":
        return redirect("/dashboard/")

    from apps.progression.models import Announcement

    program_ids = get_instructor_program_ids(request.user)

    try:
        announcement = Announcement.objects.get(pk=pk, program_id__in=program_ids)
    except Announcement.DoesNotExist:
        messages.error(request, "Announcement not found")
        return redirect("core:instructor.announcements")

    announcement.delete()
    messages.success(request, "Announcement deleted")
    return redirect("core:instructor.announcements")


# =============================================================================
# Admin Announcements
# =============================================================================


@login_required
def admin_announcements_index(request):
    """List all announcements across all programs (admin view)."""
    if not request.user.is_staff:
        return redirect("/dashboard/")

    from apps.progression.models import Announcement

    announcements_qs = (
        Announcement.objects.all()
        .select_related("program", "author")
        .order_by("-is_pinned", "-created_at")
    )

    announcements = [
        {
            "id": a.id,
            "programId": a.program_id,
            "programName": a.program.name,
            "title": a.title,
            "message": a.content,
            "authorName": a.author.get_full_name() or a.author.email,
            "createdAt": a.created_at.isoformat(),
            "isPinned": a.is_pinned,
        }
        for a in announcements_qs
    ]

    programs = Program.objects.filter(is_published=True).values("id", "name")

    return render(
        request,
        "Admin/Announcements/Index",
        {
            "announcements": announcements,
            "programs": list(programs),
        },
    )


@login_required
def admin_announcement_create(request):
    """Create announcement for any program (admin view)."""
    if not request.user.is_staff:
        return redirect("/dashboard/")

    from apps.progression.models import Announcement

    programs = Program.objects.filter(is_published=True)

    if request.method == "POST":
        data = get_post_data(request)
        program_id = data.get("programId")
        title = str(data.get("title", "")).strip()
        raw_message = str(data.get("message", "")).strip()
        message_text = strip_tags(raw_message).strip()

        if not program_id or not message_text:
            messages.error(request, "Please select a course and enter a message")
            return render(
                request,
                "Admin/Announcements/Create",
                {"programs": [{"id": p.id, "name": p.name} for p in programs]},
            )

        try:
            program = Program.objects.get(pk=program_id)
        except Program.DoesNotExist:
            messages.error(request, "Program not found")
            return redirect("core:admin.announcements")

        announcement = Announcement.objects.create(
            program=program,
            author=request.user,
            title=title or "Announcement",
            content=raw_message,
        )

        # Notify enrolled students
        from apps.notifications.services import NotificationService
        from apps.progression.models import Enrollment

        enrolled_users = User.objects.filter(
            id__in=Enrollment.objects.filter(
                program=program,
                status="active",
            ).values_list("user_id", flat=True)
        )
        if enrolled_users.exists():
            NotificationService.bulk_create(
                recipients=enrolled_users,
                notification_type="announcement",
                title=announcement.title,
                message=message_text[:200] + ("..." if len(message_text) > 200 else ""),
                action_url=f"/student/programs/{program.id}/",
                related_program_id=program.id,
            )
            for enrolled_user in enrolled_users:
                NotificationService.send_email_notification(
                    recipient=enrolled_user,
                    notification_type="announcement",
                    subject=f"New Announcement: {program.name}",
                    message=message_text[:500],
                )

        messages.success(request, "Announcement created successfully")
        return redirect("core:admin.announcements")

    return render(
        request,
        "Admin/Announcements/Create",
        {"programs": [{"id": p.id, "name": p.name} for p in programs]},
    )


@login_required
def admin_announcement_delete(request, pk):
    """Delete any announcement (admin view)."""
    if not request.user.is_staff or request.method != "DELETE":
        return redirect("/dashboard/")

    from apps.progression.models import Announcement

    try:
        announcement = Announcement.objects.get(pk=pk)
    except Announcement.DoesNotExist:
        messages.error(request, "Announcement not found")
        return redirect("core:admin.announcements")

    announcement.delete()
    messages.success(request, "Announcement deleted")
    return redirect("core:admin.announcements")


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
    from apps.notifications.services import NotificationService

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

    NotificationService.notify_instructor_approved(profile.user)

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
    from apps.notifications.services import NotificationService

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

    NotificationService.notify_instructor_rejected(profile.user, reason=reason)

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
    from apps.notifications.services import NotificationService

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

    NotificationService.notify_instructor_unlocked(profile.user)

    messages.success(request, f"Application unlocked. The user can now resubmit.")
    return redirect("core:admin.instructor_applications")


# Note: instructor_quizzes, instructor_quiz_create, instructor_quiz_edit, and
# instructor_quiz_delete functions removed. Quiz management is now handled by
# Course Builder via AssessmentEditor and instructor_node_update.


# =============================================================================
# Quiz Taking Views (Student)
# =============================================================================


def _safe_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


ASSIGNMENT_MODES = {"submission_only", "question_only", "mixed"}
ASSIGNMENT_TYPED_RESPONSE_MODES = {"submission_text", "short_answer_question"}


def _normalize_submission_type(raw_value):
    normalized = str(raw_value or "").strip().lower()
    mapping = {
        "file": "file",
        "file_upload": "file",
        "text": "text",
        "text_entry": "text",
        "both": "both",
        "external_link": "text",
        "media_recording": "text",
    }
    return mapping.get(normalized, "file")


def _normalize_typed_response_mode(raw_value):
    normalized = str(raw_value or "").strip().lower()
    mapping = {
        "submission_text": "submission_text",
        "submission": "submission_text",
        "text_submission": "submission_text",
        "short_answer_question": "short_answer_question",
        "short_answer": "short_answer_question",
        "question": "short_answer_question",
    }
    return mapping.get(normalized, "submission_text")


def _normalize_assignment_mode(props):
    if not isinstance(props, dict):
        return "submission_only"

    explicit_mode = str(props.get("assignment_mode") or "").strip().lower()
    if explicit_mode in ASSIGNMENT_MODES:
        return explicit_mode

    questions = props.get("questions", [])
    has_questions = isinstance(questions, list) and len(questions) > 0
    return "mixed" if has_questions else "submission_only"


def _assignment_mode_requires_questions(mode):
    return mode in {"question_only", "mixed"}


def _assignment_mode_requires_submission(mode):
    return mode in {"submission_only", "mixed"}


def _assignment_requires_questions(props):
    mode = _normalize_assignment_mode(props)
    typed_response_mode = _normalize_typed_response_mode(
        (props or {}).get("typed_response_mode")
    )
    return mode in {"question_only", "mixed"} or (
        mode == "submission_only" and typed_response_mode == "short_answer_question"
    )


def _assignment_requires_submission(props):
    mode = _normalize_assignment_mode(props)
    typed_response_mode = _normalize_typed_response_mode(
        (props or {}).get("typed_response_mode")
    )
    return mode == "mixed" or (
        mode == "submission_only" and typed_response_mode == "submission_text"
    )


def _assignment_node_completion_state(node, enrollment):
    """Compute assignment-node completion predicates from official assessment results."""
    from apps.assessments.models import Assignment, Quiz

    props = node.properties if isinstance(node.properties, dict) else {}
    requires_submission = _assignment_requires_submission(props)
    requires_questions = _assignment_requires_questions(props)

    submission_passed = not requires_submission
    official_assignment_attempt = None

    if requires_submission:
        assignment_id = _safe_int(props.get("assignment_id"))
        assignment = (
            Assignment.objects.filter(pk=assignment_id).first()
            if assignment_id
            else None
        )
        if assignment:
            official_assignment_attempt = refresh_assignment_official_flags(
                enrollment,
                assignment,
            )
            submission_passed = assignment_attempt_passed(official_assignment_attempt)
        else:
            submission_passed = False

    question_passed = not requires_questions
    official_quiz_attempt = None

    if requires_questions:
        quiz_id = _safe_int(props.get("quiz_id"))
        quiz = Quiz.objects.filter(pk=quiz_id).first() if quiz_id else None
        if quiz:
            official_quiz_attempt = get_official_quiz_attempt(enrollment, quiz)
            question_passed = bool(
                official_quiz_attempt and official_quiz_attempt.passed is True
            )
        else:
            question_passed = False

    return {
        "submission_passed": submission_passed,
        "question_passed": question_passed,
        "is_complete": submission_passed and question_passed,
        "official_assignment_attempt": official_assignment_attempt,
        "official_quiz_attempt": official_quiz_attempt,
    }


def _quiz_attempt_deadline(quiz, attempt):
    time_limit_minutes = getattr(quiz, "time_limit_minutes", None)
    if not time_limit_minutes:
        return None
    return attempt.started_at + timezone.timedelta(minutes=time_limit_minutes)


def _is_quiz_attempt_expired(quiz, attempt, now=None) -> bool:
    deadline = _quiz_attempt_deadline(quiz, attempt)
    if not deadline:
        return False
    current_time = now or timezone.now()
    return current_time >= deadline


def _finalize_quiz_attempt(attempt, answers=None, submitted_at=None):
    if answers is not None and isinstance(answers, dict):
        attempt.answers = answers
    attempt.submitted_at = submitted_at or timezone.now()
    points_earned, points_possible, percentage, passed = attempt.calculate_score()
    attempt.points_earned = points_earned
    attempt.points_possible = points_possible
    attempt.score = percentage
    attempt.passed = passed
    attempt.save()
    return points_earned, points_possible, percentage, passed


def _normalize_question_text(value) -> str:
    return normalize_assessment_text(value)


def _resolve_in_progress_quiz_attempt(quiz, enrollment, create_if_missing=True):
    from apps.assessments.models import QuizAttempt

    with transaction.atomic():
        attempts_qs = QuizAttempt.objects.select_for_update().filter(
            enrollment=enrollment,
            quiz=quiz,
        )

        in_progress = (
            attempts_qs.filter(submitted_at__isnull=True)
            .order_by("-attempt_number")
            .first()
        )

        if in_progress and _is_quiz_attempt_expired(quiz, in_progress):
            _finalize_quiz_attempt(in_progress)
            in_progress = None

        submitted_attempts = attempts_qs.filter(submitted_at__isnull=False).count()

        if not in_progress:
            allowed, attempts_used, attempts_remaining = can_start_quiz_attempt(
                quiz,
                enrollment,
            )
            if not allowed:
                return None, attempts_used, attempts_remaining
            if create_if_missing:
                in_progress = QuizAttempt.objects.create(
                    enrollment=enrollment,
                    quiz=quiz,
                    attempt_number=submitted_attempts + 1,
                    started_at=timezone.now(),
                    runtime_state={},
                )
                attempts_used += 1
        else:
            attempts_used = submitted_attempts + 1

    return in_progress, attempts_used, max(0, quiz.max_attempts - attempts_used)


def _normalize_order_from_runtime(order_values, valid_ids: list[int]) -> list[int]:
    if not isinstance(order_values, list):
        order_values = []

    valid_set = set(valid_ids)
    normalized = []
    seen = set()
    for raw_value in order_values:
        parsed = _safe_int(raw_value)
        if parsed is None or parsed not in valid_set or parsed in seen:
            continue
        normalized.append(parsed)
        seen.add(parsed)

    for item_id in valid_ids:
        if item_id not in seen:
            normalized.append(item_id)
    return normalized


def _ensure_quiz_attempt_runtime_state(quiz, attempt) -> dict:
    import random

    runtime_state = (
        attempt.runtime_state.copy() if isinstance(attempt.runtime_state, dict) else {}
    )
    changed = not isinstance(attempt.runtime_state, dict)

    quiz_questions = list(
        quiz.questions.all().prefetch_related("options").order_by("position")
    )
    question_ids = [question.id for question in quiz_questions]

    normalized_question_order = _normalize_order_from_runtime(
        runtime_state.get("question_order"),
        question_ids,
    )
    if not runtime_state.get("question_order") and quiz.randomize_questions:
        random.shuffle(normalized_question_order)
    if runtime_state.get("question_order") != normalized_question_order:
        runtime_state["question_order"] = normalized_question_order
        changed = True

    existing_option_order = (
        runtime_state.get("option_order")
        if isinstance(runtime_state.get("option_order"), dict)
        else {}
    )
    normalized_option_order = {}
    for question in quiz_questions:
        if question.question_type not in {"mcq", "mcq_multi"}:
            continue
        option_ids = [
            option.id for option in question.options.all().order_by("position")
        ]
        if quiz.shuffle_options:
            ordered_ids = _normalize_order_from_runtime(
                existing_option_order.get(str(question.id)),
                option_ids,
            )
            if not existing_option_order.get(str(question.id)):
                random.shuffle(ordered_ids)
        else:
            ordered_ids = option_ids
        normalized_option_order[str(question.id)] = ordered_ids

    if existing_option_order != normalized_option_order:
        runtime_state["option_order"] = normalized_option_order
        changed = True

    max_index = max(0, len(normalized_question_order) - 1)
    current_index = _safe_int(runtime_state.get("current_question_index"))
    normalized_index = (
        0 if current_index is None else max(0, min(current_index, max_index))
    )
    if runtime_state.get("current_question_index") != normalized_index:
        runtime_state["current_question_index"] = normalized_index
        changed = True

    if changed:
        attempt.runtime_state = runtime_state
        attempt.save(update_fields=["runtime_state"])

    return runtime_state


def _serialize_quiz_questions_for_attempt(quiz, attempt, runtime_state=None) -> list:
    import random

    state = runtime_state if isinstance(runtime_state, dict) else {}
    option_order = (
        state.get("option_order") if isinstance(state.get("option_order"), dict) else {}
    )

    quiz_questions = list(
        quiz.questions.all()
        .prefetch_related(
            "options", "matching_pairs", "gap_answers", "image_matching_pairs"
        )
        .order_by("position")
    )
    questions_by_id = {question.id: question for question in quiz_questions}
    ordered_question_ids = _normalize_order_from_runtime(
        state.get("question_order"),
        [question.id for question in quiz_questions],
    )
    ordered_questions = [
        questions_by_id[qid] for qid in ordered_question_ids if qid in questions_by_id
    ]

    questions = []
    for q in ordered_questions:
        q_data = {
            "id": q.id,
            "type": q.question_type,
            "text": _normalize_question_text(q.text),
            "points": q.points,
        }

        if q.question_type in ["mcq", "mcq_multi"]:
            opts = list(q.options.all().order_by("position"))
            if quiz.shuffle_options:
                opts_by_id = {opt.id: opt for opt in opts}
                ordered_option_ids = _normalize_order_from_runtime(
                    option_order.get(str(q.id)),
                    [opt.id for opt in opts],
                )
                opts = [
                    opts_by_id[opt_id]
                    for opt_id in ordered_option_ids
                    if opt_id in opts_by_id
                ]
            q_data["options"] = [
                {"id": o.id, "text": o.text, "position": o.position} for o in opts
            ]

        elif q.question_type == "matching":
            q_data["pairs"] = [
                {"left_text": p.left_text, "right_text": p.right_text}
                for p in q.matching_pairs.all()
            ]

        elif q.question_type == "ordering":
            raw_items = q.answer_data.get("items", [])
            q_data["items"] = (
                list(raw_items) if isinstance(raw_items, (list, tuple)) else []
            )

        elif q.question_type == "image_matching":
            image_pairs = list(q.image_matching_pairs.all().order_by("position"))
            left_items = [
                {
                    "id": q.get_image_matching_item_id(pair.id, attempt.id, "left"),
                    "text": pair.question_text,
                    "image": pair.question_image,
                }
                for pair in image_pairs
            ]
            right_items = [
                {
                    "id": q.get_image_matching_item_id(pair.id, attempt.id, "right"),
                    "text": pair.answer_text,
                    "image": pair.answer_image,
                }
                for pair in image_pairs
            ]
            random.shuffle(right_items)
            q_data["left_items"] = left_items
            q_data["right_items"] = right_items

        questions.append(q_data)

    return questions


def _is_quiz_json_mode(request, data=None) -> bool:
    if str(request.GET.get("response") or "").strip().lower() == "json":
        return True
    if (
        isinstance(data, dict)
        and str(data.get("response") or "").strip().lower() == "json"
    ):
        return True
    return False


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
            .get(pk=quiz_id)
        )
    except Quiz.DoesNotExist:
        messages.error(request, "Quiz not found")
        return redirect("/dashboard/")

    if not quiz.is_published:
        node_props = (
            quiz.node.properties if isinstance(quiz.node.properties, dict) else {}
        )
        linked_quiz_id = _safe_int(node_props.get("quiz_id"))
        # Backward compatibility: some historical records kept quiz unpublished while
        # the linked curriculum node was already published and visible to students.
        if quiz.node.is_published and linked_quiz_id == quiz.id:
            quiz.is_published = True
            quiz.save(update_fields=["is_published"])
        else:
            messages.error(request, "Quiz is not available")
            return redirect("/dashboard/")

    # Check enrollment
    try:
        enrollment = Enrollment.objects.get(
            user=request.user,
            program=quiz.node.program,
            status__in=["active", "completed"],
        )
    except Enrollment.DoesNotExist:
        if _is_quiz_json_mode(request):
            return JsonResponse({"error": "Enrollment not found"}, status=403)
        messages.error(request, "You are not enrolled in this program")
        return redirect("/dashboard/")

    requested_enrollment_id = _safe_int(request.GET.get("enrollment_id"))
    requested_node_id = _safe_int(request.GET.get("node_id"))
    in_course_player_context = (
        requested_enrollment_id == enrollment.id and requested_node_id == quiz.node_id
    )
    wants_json = _is_quiz_json_mode(request)

    attempt, _, attempts_remaining = _resolve_in_progress_quiz_attempt(
        quiz,
        enrollment,
        create_if_missing=True,
    )

    if not attempt:
        has_passed_attempt = QuizAttempt.objects.filter(
            enrollment=enrollment,
            quiz=quiz,
            submitted_at__isnull=False,
            passed=True,
        ).exists()
        redirect_url = (
            f"/student/quiz/{quiz_id}/results/?enrollment_id={enrollment.id}&node_id={quiz.node_id}"
            if in_course_player_context
            else f"/student/quiz/{quiz_id}/results/"
        )
        if wants_json:
            return JsonResponse(
                {
                    "error": (
                        "retry_locked_after_pass"
                        if has_passed_attempt and not quiz.allow_retake_after_pass
                        else "max_attempts_reached"
                    ),
                    "attemptsRemaining": 0,
                    "redirectUrl": redirect_url,
                },
                status=409,
            )
        messages.error(request, "You have used all your attempts for this quiz")
        return redirect(redirect_url)

    node_props = quiz.node.properties if isinstance(quiz.node.properties, dict) else {}
    quiz_style = str(node_props.get("quiz_style") or "pagination").strip().lower()
    if quiz_style not in {"pagination", "single_page"}:
        quiz_style = "pagination"

    runtime_state = _ensure_quiz_attempt_runtime_state(quiz, attempt)
    questions = _serialize_quiz_questions_for_attempt(quiz, attempt, runtime_state)

    payload = {
        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "timeLimit": quiz.time_limit_minutes,
            "nodeTitle": quiz.node.title,
            "quizStyle": quiz_style,
        },
        "attempt": {
            "id": attempt.id,
            "attemptNumber": attempt.attempt_number,
            "startedAt": attempt.started_at.isoformat(),
            "answers": attempt.answers if isinstance(attempt.answers, dict) else {},
            "runtimeState": runtime_state,
        },
        "questions": questions,
        "attemptsRemaining": attempts_remaining,
        "coursePlayer": (
            {
                "sessionUrl": (
                    f"/student/programs/{enrollment.id}/session/{quiz.node_id}/"
                ),
                "enrollmentId": enrollment.id,
                "nodeId": quiz.node_id,
            }
            if in_course_player_context
            else None
        ),
    }

    if wants_json:
        return JsonResponse(payload)

    return render(request, "Student/Quiz/Take", payload)


@login_required
def student_quiz_submit(request, quiz_id: int):
    """
    Submit quiz answers and calculate score.
    """
    from apps.assessments.models import Quiz, QuizAttempt
    from apps.progression.models import Enrollment, NodeCompletion
    from apps.notifications.services import NotificationService

    if request.method != "POST":
        return redirect("core:student.quiz_start", quiz_id=quiz_id)

    data = get_post_data(request)
    wants_json = _is_quiz_json_mode(request, data)

    try:
        quiz = Quiz.objects.get(pk=quiz_id)
    except Quiz.DoesNotExist:
        if wants_json:
            return JsonResponse({"error": "Quiz not found"}, status=404)
        messages.error(request, "Quiz not found")
        return redirect("/dashboard/")

    try:
        enrollment = Enrollment.objects.get(
            user=request.user, program=quiz.node.program
        )
    except Enrollment.DoesNotExist:
        if wants_json:
            return JsonResponse({"error": "Enrollment not found"}, status=403)
        return redirect("/dashboard/")

    with transaction.atomic():
        attempt = (
            QuizAttempt.objects.select_for_update()
            .filter(
                enrollment=enrollment,
                quiz=quiz,
                submitted_at__isnull=True,
            )
            .order_by("-attempt_number")
            .first()
        )

        if not attempt:
            if wants_json:
                requested_enrollment_id = _safe_int(data.get("enrollment_id"))
                requested_node_id = _safe_int(data.get("node_id"))
                in_course_player_context = (
                    requested_enrollment_id == enrollment.id
                    and requested_node_id == quiz.node_id
                )
                return JsonResponse(
                    {
                        "error": "no_in_progress_attempt",
                        "redirectUrl": (
                            f"/student/quiz/{quiz_id}/?response=json&enrollment_id={enrollment.id}&node_id={quiz.node_id}"
                            if in_course_player_context
                            else f"/student/quiz/{quiz_id}/?response=json"
                        ),
                    },
                    status=409,
                )
            messages.error(request, "No quiz attempt in progress")
            return redirect("core:student.quiz_start", quiz_id=quiz_id)

        submitted_answers = data.get("answers", {})
        now = timezone.now()
        expired = _is_quiz_attempt_expired(quiz, attempt, now=now)

        incoming_runtime_state = data.get("runtime_state")
        if isinstance(incoming_runtime_state, dict):
            merged_runtime_state = (
                attempt.runtime_state.copy()
                if isinstance(attempt.runtime_state, dict)
                else {}
            )
            merged_runtime_state.update(incoming_runtime_state)
            max_index = max(0, quiz.questions.count() - 1)
            current_index = _safe_int(
                merged_runtime_state.get("current_question_index")
            )
            merged_runtime_state["current_question_index"] = (
                0 if current_index is None else max(0, min(current_index, max_index))
            )
            attempt.runtime_state = merged_runtime_state

        if expired:
            points_earned, points_possible, percentage, passed = _finalize_quiz_attempt(
                attempt,
                submitted_at=now,
            )
        else:
            points_earned, points_possible, percentage, passed = _finalize_quiz_attempt(
                attempt,
                answers=submitted_answers
                if isinstance(submitted_answers, dict)
                else {},
                submitted_at=now,
            )

        requested_enrollment_id = _safe_int(data.get("enrollment_id"))
        requested_node_id = _safe_int(data.get("node_id"))
        in_course_player_context = (
            requested_enrollment_id == enrollment.id
            and requested_node_id == quiz.node_id
        )
        has_passed_attempt = QuizAttempt.objects.filter(
            enrollment=enrollment,
            quiz=quiz,
            submitted_at__isnull=False,
            passed=True,
        ).exists()

        if passed is not None:
            NotificationService.notify_quiz_graded(attempt)

        if not wants_json and expired:
            messages.warning(
                request,
                "Time expired. Your quiz was submitted automatically using saved answers.",
            )
        elif not wants_json and passed is True:
            messages.success(
                request, f"Congratulations! You passed with {percentage}%!"
            )
        elif not wants_json and passed is False:
            messages.warning(
                request, f"You scored {percentage}%. Required: {quiz.pass_threshold}%"
            )
        elif not wants_json:
            messages.info(request, "Your quiz has been submitted for review.")

    redirect_url = f"/student/quiz/{quiz_id}/results/"
    next_node = None
    if in_course_player_context:
        lesson_type = str((quiz.node.properties or {}).get("lesson_type") or "").lower()
        node_type = str(quiz.node.node_type or "").lower()
        is_assignment_node = node_type == "assignment" or lesson_type == "assignment"
        is_quiz_node = node_type == "quiz" or lesson_type == "quiz"
        official_quiz_attempt = get_official_quiz_attempt(enrollment, quiz)
        has_official_quiz_pass = bool(
            official_quiz_attempt and official_quiz_attempt.passed is True
        )

        should_mark_complete = has_official_quiz_pass if is_quiz_node else True
        completion_type = "quiz_pass"
        if is_assignment_node:
            completion_state = _assignment_node_completion_state(quiz.node, enrollment)
            should_mark_complete = completion_state["is_complete"]
            completion_type = "manual"

        if (is_quiz_node or is_assignment_node) and not should_mark_complete:
            NodeCompletion.objects.filter(
                enrollment=enrollment,
                node=quiz.node,
            ).delete()

        if should_mark_complete:
            from apps.progression.services import ProgressionEngine

            ProgressionEngine().mark_complete(
                enrollment=enrollment,
                node=quiz.node,
                completion_type=completion_type,
            )

        redirect_url = f"/student/quiz/{quiz_id}/results/?enrollment_id={enrollment.id}&node_id={quiz.node_id}"
        try:
            from apps.progression.views import _get_sibling_navigation

            next_node = _get_sibling_navigation(quiz.node, enrollment.id).get("next")
        except Exception:
            next_node = None

    can_retry, _, attempts_remaining = can_start_quiz_attempt(
        quiz,
        enrollment,
    )

    if wants_json:
        return JsonResponse(
            {
                "attemptId": attempt.id,
                "attemptNumber": attempt.attempt_number,
                "maxAttempts": quiz.max_attempts,
                "score": float(percentage),
                "pointsEarned": float(points_earned),
                "pointsPossible": points_possible,
                "passed": passed,
                "expired": expired,
                "attemptsRemaining": attempts_remaining,
                "canRetry": can_retry,
                "passThreshold": quiz.pass_threshold,
                "nextNode": next_node,
                "redirectUrl": redirect_url,
            }
        )

    if in_course_player_context:
        return redirect(redirect_url)
    return redirect("core:student.quiz_results", quiz_id=quiz_id)


@login_required
def student_quiz_save(request, quiz_id: int):
    """
    Save in-progress quiz answers.
    """
    from apps.assessments.models import Quiz, QuizAttempt
    from apps.progression.models import Enrollment

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        quiz = Quiz.objects.select_related("node", "node__program").get(pk=quiz_id)
    except Quiz.DoesNotExist:
        return JsonResponse({"error": "Quiz not found"}, status=404)

    try:
        enrollment = Enrollment.objects.get(
            user=request.user,
            program=quiz.node.program,
            status__in=["active", "completed"],
        )
    except Enrollment.DoesNotExist:
        return JsonResponse({"error": "Enrollment not found"}, status=403)

    data = get_post_data(request)
    incoming_answers = data.get("answers", {})
    if not isinstance(incoming_answers, dict):
        incoming_answers = {}
    incoming_runtime_state = (
        data.get("runtime_state") if isinstance(data.get("runtime_state"), dict) else {}
    )

    requested_enrollment_id = _safe_int(data.get("enrollment_id"))
    requested_node_id = _safe_int(data.get("node_id"))
    in_course_player_context = (
        requested_enrollment_id == enrollment.id and requested_node_id == quiz.node_id
    )

    with transaction.atomic():
        attempts_qs = QuizAttempt.objects.select_for_update().filter(
            enrollment=enrollment,
            quiz=quiz,
        )
        attempt = (
            attempts_qs.filter(submitted_at__isnull=True)
            .order_by("-attempt_number")
            .first()
        )

        now = timezone.now()
        if attempt and _is_quiz_attempt_expired(quiz, attempt, now=now):
            _finalize_quiz_attempt(attempt, submitted_at=now)
            _, _, attempts_remaining = can_start_quiz_attempt(quiz, enrollment)
            return JsonResponse(
                {
                    "expired": True,
                    "saved": False,
                    "attemptsRemaining": attempts_remaining,
                    "redirectUrl": (
                        f"/student/quiz/{quiz_id}/results/?enrollment_id={enrollment.id}&node_id={quiz.node_id}"
                        if in_course_player_context
                        else f"/student/quiz/{quiz_id}/results/"
                    ),
                },
                status=409,
            )

        if not attempt:
            allowed, attempts_used, attempts_remaining = can_start_quiz_attempt(
                quiz,
                enrollment,
            )
            if not allowed:
                has_passed_attempt = QuizAttempt.objects.filter(
                    enrollment=enrollment,
                    quiz=quiz,
                    submitted_at__isnull=False,
                    passed=True,
                ).exists()
                return JsonResponse(
                    {
                        "error": (
                            "retry_locked_after_pass"
                            if has_passed_attempt and not quiz.allow_retake_after_pass
                            else "max_attempts_reached"
                        ),
                        "saved": False,
                        "attemptsRemaining": attempts_remaining,
                        "redirectUrl": (
                            f"/student/quiz/{quiz_id}/results/?enrollment_id={enrollment.id}&node_id={quiz.node_id}"
                            if in_course_player_context
                            else f"/student/quiz/{quiz_id}/results/"
                        ),
                    },
                    status=409,
                )
            attempt = QuizAttempt.objects.create(
                enrollment=enrollment,
                quiz=quiz,
                attempt_number=attempts_used + 1,
                started_at=now,
                runtime_state={},
            )

        runtime_state = _ensure_quiz_attempt_runtime_state(quiz, attempt)
        if incoming_runtime_state:
            runtime_state = (
                runtime_state.copy() if isinstance(runtime_state, dict) else {}
            )
            runtime_state.update(incoming_runtime_state)
        max_index = max(0, quiz.questions.count() - 1)
        current_index = _safe_int(runtime_state.get("current_question_index"))
        runtime_state["current_question_index"] = (
            0 if current_index is None else max(0, min(current_index, max_index))
        )

        attempt.answers = incoming_answers
        attempt.runtime_state = runtime_state
        attempt.save(update_fields=["answers", "runtime_state"])
        _, _, attempts_remaining = can_start_quiz_attempt(quiz, enrollment)

    return JsonResponse(
        {
            "saved": True,
            "attemptId": attempt.id,
            "attemptNumber": attempt.attempt_number,
            "attemptsRemaining": attempts_remaining,
            "runtimeState": attempt.runtime_state,
            "savedAt": timezone.now().isoformat(),
        }
    )


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

    requested_enrollment_id = _safe_int(request.GET.get("enrollment_id"))
    requested_node_id = _safe_int(request.GET.get("node_id"))
    in_course_player_context = (
        requested_enrollment_id == enrollment.id and requested_node_id == quiz.node_id
    )

    # When accessed from course player context, redirect to session URL so
    # results render inside the CoursePlayer layout (with sidebar/curriculum).
    if in_course_player_context:
        session_url = (
            f"/student/programs/{enrollment.id}/session/{quiz.node_id}/?show_results=1"
        )
        return redirect(session_url)

    next_node = None

    node_props = quiz.node.properties if isinstance(quiz.node.properties, dict) else {}
    show_correct_answer = bool(quiz.show_answers_after_submit)
    if "quiz_attempt_history" in node_props:
        show_attempt_history = _coerce_bool(
            node_props.get("quiz_attempt_history"), default=False
        )
    else:
        # Backwards compatibility for nodes saved before this property existed.
        show_attempt_history = True

    attempts = list(
        QuizAttempt.objects.filter(
            enrollment=enrollment, quiz=quiz, submitted_at__isnull=False
        ).order_by("-attempt_number")
    )
    official_attempt = get_official_quiz_attempt(enrollment, quiz)

    def _normalize_option_label(question, raw_value):
        token = str(raw_value).strip()
        options = list(question.options.all())
        for option in options:
            if str(option.id) == token or str(option.position) == token:
                return option.text
        return token

    def _format_student_answer(question, answer, attempt_id):
        if answer is None:
            return "Not answered"

        q_type = question.question_type
        if q_type in {"mcq", "true_false"}:
            option_label = _normalize_option_label(question, answer)
            if option_label != str(answer).strip():
                return option_label
            if q_type == "true_false":
                normalized = normalize_true_false_choice(answer)
                if normalized is not None:
                    return "True" if normalized else "False"
            return option_label

        if q_type == "mcq_multi":
            if not isinstance(answer, list):
                return str(answer)
            labels = [_normalize_option_label(question, value) for value in answer]
            return ", ".join(labels) if labels else "Not answered"

        if q_type == "short_answer":
            return str(answer).strip() or "Not answered"

        if q_type == "matching":
            if not isinstance(answer, dict):
                return str(answer)
            entries = [
                f"{str(left).strip()} -> {str(right).strip()}"
                for left, right in answer.items()
            ]
            return "; ".join(entries) if entries else "Not answered"

        if q_type == "ordering":
            if not isinstance(answer, list):
                return str(answer)
            return " -> ".join(
                str(item).strip() for item in answer if str(item).strip()
            )

        if q_type == "fill_blank":
            if not isinstance(answer, dict):
                return str(answer)
            entries = [
                f"Blank {str(index)}: {str(value).strip()}"
                for index, value in sorted(
                    answer.items(), key=lambda item: str(item[0])
                )
            ]
            return "; ".join(entries) if entries else "Not answered"

        if q_type == "image_matching":
            if not isinstance(answer, dict):
                return str(answer)
            pairs = list(question.image_matching_pairs.all().order_by("position"))
            right_labels = {
                question.get_image_matching_item_id(
                    pair.id, attempt_id, "right"
                ): pair.answer_text
                for pair in pairs
            }
            entries = []
            for pair in pairs:
                left_token = question.get_image_matching_item_id(
                    pair.id, attempt_id, "left"
                )
                submitted = answer.get(left_token)
                submitted_label = (
                    right_labels.get(str(submitted), "Unmatched")
                    if submitted is not None
                    else "Unmatched"
                )
                entries.append(f"{pair.question_text} -> {submitted_label}")
            return "; ".join(entries) if entries else "Not answered"

        return str(answer)

    def _format_correct_answer(question, attempt_id):
        q_type = question.question_type
        if q_type == "mcq":
            option = (
                question.options.filter(is_correct=True).order_by("position").first()
            )
            return option.text if option else "N/A"

        if q_type == "true_false":
            correct_bool = normalize_true_false_choice(
                question.answer_data.get("correct")
            )
            if correct_bool is None:
                return "N/A"
            return "True" if correct_bool else "False"

        if q_type == "mcq_multi":
            labels = list(
                question.options.filter(is_correct=True)
                .order_by("position")
                .values_list("text", flat=True)
            )
            return ", ".join(labels) if labels else "N/A"

        if q_type == "short_answer":
            keywords = question.answer_data.get("keywords", [])
            if not keywords:
                return "Manual review"
            return ", ".join(
                str(keyword).strip() for keyword in keywords if str(keyword).strip()
            )

        if q_type == "matching":
            entries = [
                f"{pair.left_text} -> {pair.right_text}"
                for pair in question.matching_pairs.all().order_by("position")
            ]
            return "; ".join(entries) if entries else "N/A"

        if q_type == "ordering":
            items = question.answer_data.get("items", [])
            if not isinstance(items, list):
                return "N/A"
            return " -> ".join(str(item).strip() for item in items if str(item).strip())

        if q_type == "fill_blank":
            entries = [
                f"Blank {gap.gap_index}: {' / '.join(gap.accepted_answers)}"
                for gap in question.gap_answers.all().order_by("gap_index")
            ]
            return "; ".join(entries) if entries else "N/A"

        if q_type == "image_matching":
            entries = [
                f"{pair.question_text} -> {pair.answer_text}"
                for pair in question.image_matching_pairs.all().order_by("position")
            ]
            return "; ".join(entries) if entries else "N/A"

        return "N/A"

    question_review = []
    review_attempt = official_attempt or (attempts[0] if attempts else None)
    if show_correct_answer and review_attempt:
        review_questions = quiz.questions.all().prefetch_related(
            "options",
            "matching_pairs",
            "gap_answers",
            "image_matching_pairs",
        )
        for question in review_questions:
            student_answer = review_attempt.answers.get(str(question.id))
            if student_answer is None:
                is_correct, points_earned = False, 0
            else:
                is_correct, points_earned = question.check_answer(
                    student_answer, attempt_id=review_attempt.id
                )

            question_review.append(
                {
                    "questionId": question.id,
                    "questionType": question.question_type,
                    "questionText": _normalize_question_text(question.text),
                    "studentAnswer": _format_student_answer(
                        question, student_answer, review_attempt.id
                    ),
                    "correctAnswer": _format_correct_answer(
                        question, review_attempt.id
                    ),
                    "isCorrect": is_correct,
                    "pointsEarned": float(points_earned) if points_earned is not None else 0,
                    "pointsPossible": question.points,
                }
            )

    can_retry, _, attempts_remaining = can_start_quiz_attempt(quiz, enrollment)

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
                "showCorrectAnswer": show_correct_answer,
                "showAttemptHistory": show_attempt_history,
                "retryUrl": (
                    f"/student/quiz/{quiz.id}/?enrollment_id={enrollment.id}&node_id={quiz.node_id}"
                    if in_course_player_context
                    else f"/student/quiz/{quiz.id}/"
                ),
            },
            "attempts": [
                {
                    "id": a.id,
                    "attemptNumber": a.attempt_number,
                    "score": float(a.score) if a.score is not None else None,
                    "pointsEarned": float(a.points_earned) if a.points_earned is not None else None,
                    "pointsPossible": a.points_possible,
                    "passed": a.passed,
                    "submittedAt": (
                        a.submitted_at.isoformat() if a.submitted_at else None
                    ),
                }
                for a in attempts
            ],
            "officialAttempt": (
                {
                    "id": official_attempt.id,
                    "attemptNumber": official_attempt.attempt_number,
                    "score": (
                        float(official_attempt.score)
                        if official_attempt.score is not None
                        else None
                    ),
                    "pointsEarned": float(official_attempt.points_earned) if official_attempt.points_earned is not None else None,
                    "pointsPossible": official_attempt.points_possible,
                    "passed": official_attempt.passed,
                    "submittedAt": (
                        official_attempt.submitted_at.isoformat()
                        if official_attempt.submitted_at
                        else None
                    ),
                }
                if official_attempt
                else None
            ),
            "questionReview": question_review,
            "attemptsRemaining": attempts_remaining,
            "canRetry": can_retry,
            "coursePlayer": (
                {
                    "sessionUrl": (
                        f"/student/programs/{enrollment.id}/session/{quiz.node_id}/"
                    ),
                    "nextNode": next_node,
                }
                if in_course_player_context
                else None
            ),
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
                filter=Q(submissions__is_official=True, submissions__passed=True),
            ),
            failed_count=Count(
                "submissions",
                filter=Q(submissions__is_official=True, submissions__passed=False),
            ),
            pending_count=Count(
                "submissions",
                filter=Q(submissions__status__in=["started", "submitted"]),
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
                "dueDate": (
                    assignment.due_date.isoformat() if assignment.due_date else None
                ),
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
                    "attemptNumber": s.attempt_number,
                    "isOfficial": bool(s.is_official),
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
    import os
    import uuid

    from django.conf import settings

    from apps.assessments.models import AssignmentSubmission
    from apps.assessments.models import AssignmentReviewMedia
    from apps.progression.models import InstructorAssignment
    from apps.notifications.services import NotificationService

    try:
        submission = (
            AssignmentSubmission.objects.select_related(
                "assignment", "assignment__program", "enrollment", "enrollment__user"
            )
            .prefetch_related(
                "media_assets",
                "review_media_assets",
            )
            .get(pk=submission_id)
        )
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

        review_media = []

        def _save_review_media(uploaded_file, media_type="file"):
            original_name = uploaded_file.name
            ext = (
                original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
            )
            if (
                submission.assignment.allowed_file_types
                and ext not in submission.assignment.allowed_file_types
            ):
                raise ValueError(f"File type .{ext} is not allowed")

            max_size_bytes = (
                int(submission.assignment.max_file_size_mb or 0) * 1024 * 1024
            )
            if (
                max_size_bytes > 0
                and int(getattr(uploaded_file, "size", 0) or 0) > max_size_bytes
            ):
                raise ValueError(
                    f"{original_name} exceeds the maximum size of "
                    f"{submission.assignment.max_file_size_mb} MB"
                )

            upload_dir = os.path.join(
                settings.MEDIA_ROOT,
                "review_media",
                str(submission.assignment.id),
                str(submission.id),
            )
            os.makedirs(upload_dir, exist_ok=True)
            unique_name = f"{uuid.uuid4().hex}_{original_name}"
            absolute_path = os.path.join(upload_dir, unique_name)

            with open(absolute_path, "wb+") as dest:
                for chunk in uploaded_file.chunks():
                    dest.write(chunk)

            relative_path = os.path.relpath(absolute_path, settings.MEDIA_ROOT)
            review_media.append(
                AssignmentReviewMedia(
                    submission=submission,
                    uploaded_by=request.user,
                    media_type=media_type,
                    file_name=original_name,
                    file_path=relative_path,
                    file_size=int(getattr(uploaded_file, "size", 0) or 0),
                    metadata={},
                )
            )

        try:
            for uploaded_file in request.FILES.getlist("review_attachments"):
                _save_review_media(uploaded_file, media_type="file")

            if "review_audio" in request.FILES:
                _save_review_media(request.FILES["review_audio"], media_type="audio")

            if "review_video" in request.FILES:
                _save_review_media(request.FILES["review_video"], media_type="video")
        except ValueError as exc:
            messages.error(request, str(exc))
            return redirect(
                "core:instructor.assignment_grade",
                submission_id=submission.id,
            )

        submission.score = float(data.get("score", 0))
        submission.feedback = data.get("feedback", "")
        submission.status = data.get("status", "graded")
        submission.graded_by = request.user
        submission.graded_at = timezone.now()

        if submission.status in {"graded", "returned"}:
            final_score = submission.get_final_score()
            if final_score is None:
                submission.passed = None
            else:
                submission.passed = float(final_score) >= float(
                    submission.assignment.pass_threshold
                )
        else:
            submission.passed = None
            submission.is_official = False

        submission.save()
        if review_media:
            AssignmentReviewMedia.objects.bulk_create(review_media)
        official_submission = refresh_assignment_official_flags(
            submission.enrollment,
            submission.assignment,
        )

        # Trigger progression check
        from apps.progression.services import ProgressionEngine

        engine = ProgressionEngine()
        engine.handle_assignment_grading(official_submission or submission)
        NotificationService.notify_assignment_graded(submission)

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
                "attemptNumber": submission.attempt_number,
                "studentName": submission.enrollment.user.get_full_name()
                or submission.enrollment.user.email,
                "studentEmail": submission.enrollment.user.email,
                "status": submission.status,
                "submittedAt": submission.submitted_at.isoformat(),
                "isLate": submission.is_late,
                "isOfficial": bool(submission.is_official),
                "filePath": submission.file_path,
                "fileName": submission.file_name,
                "textContent": submission.text_content,
                "score": float(submission.score)
                if submission.score is not None
                else None,
                "finalScore": submission.get_final_score(),
                "passed": submission.passed,
                "feedback": submission.feedback,
                "media": [
                    {
                        "id": media.id,
                        "type": media.media_type,
                        "name": media.file_name,
                        "path": media.file_path,
                        "size": media.file_size,
                    }
                    for media in submission.media_assets.all().order_by("created_at")
                ],
                "reviewMedia": [
                    {
                        "id": media.id,
                        "type": media.media_type,
                        "name": media.file_name,
                        "path": media.file_path,
                        "size": media.file_size,
                    }
                    for media in submission.review_media_assets.all().order_by(
                        "created_at"
                    )
                ],
            },
            "assignment": {
                "id": submission.assignment.id,
                "title": submission.assignment.title,
                "instructions": submission.assignment.instructions,
                "latePenalty": submission.assignment.late_penalty_percent,
                "passThreshold": submission.assignment.pass_threshold,
                "allowedFileTypes": submission.assignment.allowed_file_types,
                "maxFileSizeMb": submission.assignment.max_file_size_mb,
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

    # Get latest attempt per assignment for display.
    submissions = {}
    for submission in AssignmentSubmission.objects.filter(
        enrollment=enrollment,
        assignment__in=assignments,
    ).order_by("assignment_id", "-attempt_number"):
        submissions.setdefault(submission.assignment_id, submission)

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
                    "attemptsUsed": AssignmentSubmission.objects.filter(
                        enrollment=enrollment,
                        assignment=a,
                        submitted_at__isnull=False,
                    ).count(),
                    "submission": (
                        {
                            "id": submissions[a.id].id,
                            "attemptNumber": submissions[a.id].attempt_number,
                            "status": submissions[a.id].status,
                            "score": (
                                float(submissions[a.id].score)
                                if submissions[a.id].score
                                else None
                            ),
                            "submittedAt": submissions[a.id].submitted_at.isoformat(),
                        }
                        if a.id in submissions
                        else None
                    ),
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
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment

    try:
        assignment = Assignment.objects.select_related("program").get(pk=assignment_id)
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")

    try:
        enrollment = Enrollment.objects.get(
            user=request.user,
            program=assignment.program,
            status__in=["active", "completed"],
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "You are not enrolled in this program")
        return redirect("/dashboard/")

    requested_enrollment_id = _safe_int(request.GET.get("enrollment_id"))
    requested_node_id = _safe_int(request.GET.get("node_id"))

    course_player = None
    source_node = None
    if requested_enrollment_id == enrollment.id and requested_node_id:
        node = CurriculumNode.objects.filter(
            pk=requested_node_id,
            program=assignment.program,
            is_published=True,
        ).first()
        if (
            node
            and _safe_int((node.properties or {}).get("assignment_id")) == assignment.id
        ):
            source_node = node
            next_node = None
            try:
                from apps.progression.views import _get_sibling_navigation

                siblings = _get_sibling_navigation(node, enrollment.id)
                next_node = siblings.get("next")
            except Exception:
                next_node = None
            course_player = {
                "sessionUrl": f"/student/programs/{enrollment.id}/session/{node.id}/",
                "enrollmentId": enrollment.id,
                "nodeId": node.id,
                "nextNode": next_node,
            }

    if not assignment.is_published and source_node is None:
        messages.error(request, "This assignment is not available")
        return redirect("/dashboard/")

    if source_node is None:
        candidate_nodes = CurriculumNode.objects.filter(
            program=assignment.program,
            is_published=True,
        ).only("id", "node_type", "properties")
        for candidate in candidate_nodes:
            props = (
                candidate.properties if isinstance(candidate.properties, dict) else {}
            )
            if _safe_int(props.get("assignment_id")) == assignment.id:
                source_node = candidate
                break

    source_props = (
        source_node.properties
        if isinstance(getattr(source_node, "properties", None), dict)
        else {}
    )
    assessment_prompt = str(source_props.get("assessment_prompt") or "").strip()
    if not assessment_prompt:
        assessment_prompt = (
            str(assignment.instructions or "").strip() or assignment.title
        )
    typed_response_mode = _normalize_typed_response_mode(
        source_props.get("typed_response_mode")
    )
    assignment_mode = _normalize_assignment_mode(source_props)
    files = source_props.get("files", [])
    if not isinstance(files, list):
        files = []
    quiz_id = _safe_int(source_props.get("quiz_id"))

    attempts = list(
        AssignmentSubmission.objects.filter(
            enrollment=enrollment,
            assignment=assignment,
        )
        .prefetch_related("media_assets", "review_media_assets")
        .order_by("-attempt_number")
    )
    existing = attempts[0] if attempts else None
    official_attempt = refresh_assignment_official_flags(enrollment, assignment)
    max_attempts, attempts_used, attempts_remaining = get_assignment_attempts_remaining(
        enrollment,
        assignment,
        source_props,
    )

    def _serialize_attempt(attempt):
        return {
            "id": attempt.id,
            "attemptNumber": attempt.attempt_number,
            "status": attempt.status,
            "submittedAt": (
                attempt.submitted_at.isoformat() if attempt.submitted_at else None
            ),
            "isLate": bool(attempt.is_late),
            "fileName": attempt.file_name,
            "textContent": attempt.text_content,
            "score": float(attempt.score) if attempt.score is not None else None,
            "finalScore": attempt.get_final_score(),
            "passed": attempt.passed,
            "feedback": attempt.feedback,
            "isOfficial": bool(attempt.is_official),
            "media": [
                {
                    "id": media.id,
                    "type": media.media_type,
                    "name": media.file_name,
                    "path": media.file_path,
                    "size": media.file_size,
                    "metadata": media.metadata or {},
                }
                for media in attempt.media_assets.all().order_by("created_at")
            ],
            "reviewMedia": [
                {
                    "id": media.id,
                    "type": media.media_type,
                    "name": media.file_name,
                    "path": media.file_path,
                    "size": media.file_size,
                    "metadata": media.metadata or {},
                }
                for media in attempt.review_media_assets.all().order_by("created_at")
            ],
        }

    review_status = existing.status if existing else "not_started"

    return render(
        request,
        "Student/Assignments/View",
        {
            "assignment": {
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "assessmentPrompt": assessment_prompt,
                "instructions": assignment.instructions,
                "dueDate": (
                    assignment.due_date.isoformat() if assignment.due_date else None
                ),
                "weight": assignment.weight,
                "submissionType": assignment.submission_type,
                "typedResponseMode": typed_response_mode,
                "assignmentMode": assignment_mode,
                "quizId": quiz_id,
                "materials": files,
                "allowedFileTypes": assignment.allowed_file_types,
                "maxFileSizeMb": assignment.max_file_size_mb,
                "allowLateSubmission": assignment.allow_late_submission,
                "latePenalty": assignment.late_penalty_percent,
                "maxAttempts": max_attempts,
                "attemptsUsed": attempts_used,
                "attemptsRemaining": attempts_remaining,
                "programName": assignment.program.name,
            },
            "submission": (
                {
                    "id": existing.id,
                    "attemptNumber": existing.attempt_number,
                    "status": existing.status,
                    "submittedAt": (
                        existing.submitted_at.isoformat()
                        if existing.submitted_at
                        else None
                    ),
                    "isLate": existing.is_late,
                    "fileName": existing.file_name,
                    "textContent": existing.text_content,
                    "score": (
                        float(existing.score) if existing.score is not None else None
                    ),
                    "finalScore": existing.get_final_score(),
                    "passed": existing.passed,
                    "feedback": existing.feedback,
                    "isOfficial": existing.is_official,
                }
                if existing
                else None
            ),
            "attempts": [_serialize_attempt(attempt) for attempt in attempts],
            "maxAttempts": max_attempts,
            "attemptsRemaining": attempts_remaining,
            "officialAttempt": (
                _serialize_attempt(official_attempt) if official_attempt else None
            ),
            "reviewStatus": review_status,
            "coursePlayer": course_player,
        },
    )


@login_required
def student_assignment_submit(request, assignment_id: int):
    """
    Submit an assignment.
    """
    import os
    import uuid

    from apps.assessments.models import (
        Assignment,
        AssignmentSubmission,
        AssignmentSubmissionMedia,
    )
    from apps.curriculum.models import CurriculumNode
    from apps.progression.models import Enrollment, NodeCompletion

    if request.method != "POST":
        return redirect("core:student.assignment", assignment_id=assignment_id)

    try:
        assignment = Assignment.objects.select_related("program").get(pk=assignment_id)
    except Assignment.DoesNotExist:
        messages.error(request, "Assignment not found")
        return redirect("/dashboard/")

    try:
        enrollment = Enrollment.objects.get(
            user=request.user,
            program=assignment.program,
            status__in=["active", "completed"],
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "You are not enrolled in this program")
        return redirect("/dashboard/")

    requested_enrollment_id = _safe_int(request.POST.get("enrollment_id"))
    requested_node_id = _safe_int(request.POST.get("node_id"))
    context_node = None
    in_course_player_context = requested_enrollment_id == enrollment.id and bool(
        requested_node_id
    )
    if in_course_player_context:
        context_node = CurriculumNode.objects.filter(
            pk=requested_node_id,
            program=assignment.program,
            is_published=True,
        ).first()
        if context_node is None:
            in_course_player_context = False
        elif (
            _safe_int((context_node.properties or {}).get("assignment_id"))
            != assignment.id
        ):
            in_course_player_context = False
            context_node = None

    if not assignment.is_published and not (in_course_player_context and context_node):
        messages.error(request, "This assignment is not available")
        return redirect("/dashboard/")

    attempt_limit_props = (
        context_node.properties
        if context_node and isinstance(context_node.properties, dict)
        else {}
    )
    if not attempt_limit_props:
        source_nodes = CurriculumNode.objects.filter(
            program=assignment.program,
            is_published=True,
        ).only("properties")
        for source_node in source_nodes:
            source_props = (
                source_node.properties
                if isinstance(source_node.properties, dict)
                else {}
            )
            if _safe_int(source_props.get("assignment_id")) == assignment.id:
                attempt_limit_props = source_props
                break

    max_attempts, attempts_used, attempts_remaining = get_assignment_attempts_remaining(
        enrollment,
        assignment,
        attempt_limit_props,
    )
    if attempts_remaining is not None and attempts_remaining <= 0:
        messages.error(
            request, "You have used all allowed attempts for this assignment"
        )
        if in_course_player_context and context_node:
            return redirect(
                f"/student/programs/{enrollment.id}/session/{context_node.id}/"
            )
        return redirect("core:student.assignment", assignment_id=assignment_id)

    # Check due date
    is_late = False
    if assignment.due_date and timezone.now() > assignment.due_date:
        if not assignment.allow_late_submission:
            messages.error(request, "The submission deadline has passed")
            if in_course_player_context and context_node:
                return redirect(
                    f"/student/programs/{enrollment.id}/session/{context_node.id}/"
                )
            return redirect("core:student.assignment", assignment_id=assignment_id)
        is_late = True

    # Handle media uploads (files/audio/video) and persist metadata per attempt.
    file_path = None
    file_name = None
    uploaded_media = []

    def _save_uploaded_media(uploaded_file, media_type="file"):
        nonlocal file_path, file_name
        original_name = uploaded_file.name

        ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
        if assignment.allowed_file_types and ext not in assignment.allowed_file_types:
            raise ValueError(f"File type .{ext} is not allowed")

        max_size_bytes = int(assignment.max_file_size_mb or 0) * 1024 * 1024
        if (
            max_size_bytes > 0
            and int(getattr(uploaded_file, "size", 0) or 0) > max_size_bytes
        ):
            raise ValueError(
                f"{original_name} exceeds the maximum size of {assignment.max_file_size_mb} MB"
            )

        from django.conf import settings

        upload_dir = os.path.join(
            settings.MEDIA_ROOT,
            "submissions",
            str(assignment.id),
            str(enrollment.id),
        )
        os.makedirs(upload_dir, exist_ok=True)
        unique_name = f"{uuid.uuid4().hex}_{original_name}"
        absolute_path = os.path.join(upload_dir, unique_name)

        with open(absolute_path, "wb+") as dest:
            for chunk in uploaded_file.chunks():
                dest.write(chunk)

        relative_path = os.path.relpath(absolute_path, settings.MEDIA_ROOT)
        media_record = {
            "media_type": media_type,
            "file_name": original_name,
            "file_path": relative_path,
            "file_size": int(getattr(uploaded_file, "size", 0) or 0),
        }
        uploaded_media.append(media_record)

        if file_path is None:
            file_path = relative_path
            file_name = original_name

    try:
        if "file" in request.FILES:
            _save_uploaded_media(request.FILES["file"], media_type="file")

        for extra_file in request.FILES.getlist("attachments"):
            _save_uploaded_media(extra_file, media_type="file")

        if "audio" in request.FILES:
            _save_uploaded_media(request.FILES["audio"], media_type="audio")

        if "video" in request.FILES:
            _save_uploaded_media(request.FILES["video"], media_type="video")
    except ValueError as exc:
        messages.error(request, str(exc))
        if in_course_player_context and context_node:
            return redirect(
                f"/student/programs/{enrollment.id}/session/{context_node.id}/"
            )
        return redirect("core:student.assignment", assignment_id=assignment_id)

    # Get text content
    text_content = request.POST.get("text_content", "")
    if not uploaded_media and not str(text_content or "").strip():
        messages.error(
            request, "Add a response, file, or media attachment before submitting"
        )
        if in_course_player_context and context_node:
            return redirect(
                f"/student/programs/{enrollment.id}/session/{context_node.id}/"
            )
        return redirect("core:student.assignment", assignment_id=assignment_id)

    new_attempt = AssignmentSubmission.objects.create(
        enrollment=enrollment,
        assignment=assignment,
        attempt_number=attempts_used + 1,
        status="submitted",
        file_path=file_path,
        file_name=file_name,
        text_content=text_content,
        submitted_at=timezone.now(),
        is_late=is_late,
        is_official=False,
    )

    if uploaded_media:
        AssignmentSubmissionMedia.objects.bulk_create(
            [
                AssignmentSubmissionMedia(
                    submission=new_attempt,
                    media_type=item["media_type"],
                    file_name=item["file_name"],
                    file_path=item["file_path"],
                    file_size=item.get("file_size"),
                    metadata={},
                )
                for item in uploaded_media
            ]
        )

    refresh_assignment_official_flags(enrollment, assignment)
    messages.success(
        request, f"Assignment submitted (attempt #{new_attempt.attempt_number})"
    )

    if in_course_player_context and context_node:
        completion_state = _assignment_node_completion_state(context_node, enrollment)
        if completion_state["is_complete"]:
            from apps.progression.services import ProgressionEngine

            ProgressionEngine().mark_complete(
                enrollment=enrollment,
                node=context_node,
                completion_type="manual",
            )
        else:
            NodeCompletion.objects.filter(
                enrollment=enrollment,
                node=context_node,
            ).delete()

        return redirect(f"/student/programs/{enrollment.id}/session/{context_node.id}/")

    return redirect("core:student.assignment", assignment_id=assignment_id)


# =============================================================================
# Course Publication Views
# =============================================================================

@login_required
def instructor_program_validate(request, program_id: int):
    """
    Validate a program for publishing readiness.
    Returns JSON with errors, warnings, and details.
    """
    from django.http import JsonResponse
    from apps.curriculum.services import CoursePublishValidationService
    from apps.progression.models import InstructorAssignment

    try:
        program = Program.objects.get(pk=program_id)
    except Program.DoesNotExist:
        return JsonResponse({"error": "Program not found"}, status=404)

    # Verify instructor access
    if (
        not InstructorAssignment.objects.filter(
            instructor=request.user, program=program
        ).exists()
        and not request.user.is_staff
    ):
        return JsonResponse({"error": "Permission denied"}, status=403)

    # Run validation
    validator = CoursePublishValidationService()
    result = validator.validate_for_publish(program)

    return JsonResponse(result)


@login_required
def instructor_program_publish(request, program_id: int):
    """Publish a valid program managed by the requesting instructor."""
    from apps.curriculum.services import CoursePublishValidationService
    from apps.progression.models import InstructorAssignment

    if request.method != "POST":
        return redirect("core:instructor.program_manage", pk=program_id)

    try:
        with transaction.atomic():
            program = Program.objects.select_for_update().get(pk=program_id)

            if not (
                InstructorAssignment.objects.filter(
                    instructor=request.user, program=program
                ).exists()
                or request.user.is_staff
            ):
                return redirect("/dashboard/")

            validation = CoursePublishValidationService().validate_for_publish(program)
            if not validation["is_valid"]:
                for issue in validation["errors"]:
                    messages.error(
                        request,
                        issue.get("message") or "Resolve validation issues before publishing.",
                    )
                return redirect("core:instructor.program_manage", pk=program_id)

            if program.is_published:
                messages.info(request, f"'{program.name}' is already published.")
                return redirect("core:instructor.program_manage", pk=program_id)

            program.is_published = True
            program.save(update_fields=["is_published", "updated_at"])
            _sync_program_publication_state(program, True)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("/dashboard/")

    messages.success(request, f"'{program.name}' is now live for students!")
    return redirect("core:instructor.program_manage", pk=program_id)


@login_required
def instructor_program_unpublish(request, program_id: int):
    """Return a published program to draft state."""
    from apps.progression.models import InstructorAssignment

    if request.method != "POST":
        return redirect("core:instructor.program_manage", pk=program_id)

    try:
        with transaction.atomic():
            program = Program.objects.select_for_update().get(pk=program_id)

            if not (
                InstructorAssignment.objects.filter(
                    instructor=request.user, program=program
                ).exists()
                or request.user.is_staff
            ):
                return redirect("/dashboard/")

            if not program.is_published:
                messages.info(request, f"'{program.name}' is already a draft.")
                return redirect("core:instructor.program_manage", pk=program_id)

            program.is_published = False
            program.save(update_fields=["is_published", "updated_at"])
            _sync_program_publication_state(program, False)
    except Program.DoesNotExist:
        messages.error(request, "Program not found")
        return redirect("/dashboard/")

    messages.success(request, f"'{program.name}' is now a draft.")
    return redirect("core:instructor.program_manage", pk=program_id)


# =============================================================================
# Instructor Course Manager (MasterStudy-style)
# =============================================================================


def serialize_program_data(program):
    """
    Serialize program data for frontend consumption.
    Reduces code duplication across endpoints.
    """
    from apps.platform.exam_body_registry import get_registry_for_frontend
    from apps.platform.models import PlatformSettings
    from apps.progression.models import InstructorAssignment

    platform_settings = PlatformSettings.get_settings()
    platform_features = platform_settings.get_default_features_for_mode()
    if isinstance(platform_settings.features, dict):
        platform_features.update(platform_settings.features)
    builder_hierarchy = get_builder_hierarchy_or_default(
        program.blueprint.hierarchy_structure if program.blueprint else None,
        deployment_mode=platform_settings.deployment_mode,
    )
    level = (program.level or "").strip()
    prerequisite_program_ids = list(
        program.prerequisite_programs.values_list("id", flat=True)
    )
    available_prerequisites = [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "isPublished": p.is_published,
        }
        for p in Program.objects.exclude(pk=program.pk).order_by("name")[:200]
    ]
    assignments = list(
        InstructorAssignment.objects.filter(program=program)
        .select_related("instructor")
        .order_by("-is_primary", "assigned_at", "id")
    )
    owner_assignment = next((assignment for assignment in assignments if assignment.is_primary), None)
    if owner_assignment is None and assignments:
        owner_assignment = assignments[0]
    owner = owner_assignment.instructor if owner_assignment else None
    owner_id = owner.id if owner else None

    def _serialize_instructor(user):
        return {
            "id": user.id,
            "name": user.get_full_name() or user.username or user.email,
            "email": user.email,
        }

    co_instructors = [
        _serialize_instructor(assignment.instructor)
        for assignment in assignments
        if assignment.instructor_id != owner_id
    ]
    available_co_instructors = [
        _serialize_instructor(user)
        for user in User.objects.filter(groups__name="Instructors")
        .exclude(pk=owner_id)
        .order_by("first_name", "last_name", "email")[:200]
    ]
    certificate_enabled = bool(program.blueprint and program.blueprint.certificate_enabled)

    return {
        "program": {
            "id": program.id,
            "slug": program.slug,
            "publicUrl": _program_public_url(program),
            "name": program.name,
            "code": program.code,
            "description": program.description,
            "previewDescription": program.preview_description,
            "level": level,
            "category": program.category,
            "examBody": program.exam_body or "",
            "qualificationFamily": program.qualification_family or "",
            "awardType": program.award_type or "",
            "assessmentMode": program.assessment_mode or "",
            "thumbnail": program.thumbnail.url if program.thumbnail else None,
            "isPublished": program.is_published,
            "isFeatured": program.is_featured,
            "lockLessonsInOrder": program.lock_lessons_in_order,
            "durationHours": program.duration_hours,
            "videoHours": program.video_hours,
            "owner": _serialize_instructor(owner) if owner else None,
            "coInstructors": co_instructors,
            "certificateEnabled": certificate_enabled,
            "certificateLabel": (
                "Enabled by academic blueprint"
                if certificate_enabled
                else "Not enabled for this course blueprint"
            ),
            "whatYouLearn": program.what_you_learn_items or [],
            "whatYouLearnHtml": resolve_learning_outcomes_html(
                program.what_you_learn_html,
                program.what_you_learn_items,
            ),
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
            "prerequisitePassingPercent": program.prerequisite_passing_percent,
            "prerequisiteProgramIds": prerequisite_program_ids,
            "accessDurationDays": program.access_duration_days,
            "dripEnabled": program.drip_enabled,
            "dripMode": program.drip_mode,
            "ratingAverage": float(program.rating_average or 0),
            "ratingCount": program.rating_count,
            "taxonomy": {
                "level": level,
                "builderHierarchy": builder_hierarchy,
                "fullHierarchy": [level, builder_hierarchy[0], builder_hierarchy[1]],
            },
            "blueprint": (
                {
                    "name": program.blueprint.name if program.blueprint else "Default",
                    "hierarchy": builder_hierarchy,
                    "hierarchy_structure": builder_hierarchy,
                    "featureFlags": (
                        program.blueprint.get_effective_feature_flags()
                        if program.blueprint
                        else {
                            "quizzes": True,
                            "assignments": True,
                            "practicum": False,
                            "portfolio": False,
                            "gamification": False,
                        }
                    ),
                    "gradingType": (
                        (program.blueprint.grading_logic or {}).get("type", "weighted")
                        if program.blueprint
                        else "weighted"
                    ),
                }
                if program.blueprint
                else None
            ),
        },
        "availablePrerequisites": available_prerequisites,
        "availableCoInstructors": available_co_instructors,
        "examBodyRegistry": get_registry_for_frontend(),
        "platformFeatures": platform_features,
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
        .values(
            "id",
            "parent_id",
            "title",
            "node_type",
            "description",
            "properties",
            "position",
            "unlock_date",
            "unlock_after_days",
        )
    )

    logger.info(
        f"[CURRICULUM_TREE] Fetched {len(all_nodes)} nodes for program {program.id}"
    )

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

        logger.debug(
            f"[CURRICULUM_TREE] {'  ' * depth}Node {node_id}: '{node['title']}' with {len(children)} children"
        )

        return {
            "id": node_id,
            "title": node["title"],
            "type": node["node_type"],
            "description": node["description"],
            "properties": node["properties"],
            "position": node["position"],
            "unlockDate": node["unlock_date"].isoformat()
            if node["unlock_date"]
            else None,
            "unlockAfterDays": node["unlock_after_days"],
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
    if not (is_instructor(request.user) or request.user.is_staff):
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

    # Add question library data as Inertia props (no REST API needed)
    from apps.assessments.models import QuestionBankEntry
    from apps.assessments.serializers import QuestionSerializer

    library_entries = (
        QuestionBankEntry.objects.filter(bank__program=program)
        .select_related("bank", "question")
        .prefetch_related(
            "question__options",
            "question__matching_pairs",
            "question__gap_answers",
        )
        .order_by("-created_at")[:100]
    )

    response_data["questionLibrary"] = [
        {
            "id": entry.id,
            "question_type": entry.question.question_type,
            "question_data": QuestionSerializer(entry.question).data,
            "category": entry.category,
            "bank_name": entry.bank.name if entry.bank else None,
        }
        for entry in library_entries
    ]

    # Get unique categories (must query before slicing)
    all_entries_qs = QuestionBankEntry.objects.filter(bank__program=program)
    categories = list(all_entries_qs.values_list("category", flat=True).distinct())
    response_data["questionCategories"] = [c for c in categories if c]

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

    program = get_object_or_404(
        Program.objects.select_related("blueprint"), pk=program_id
    )

    # Error proofing: Validate blueprint configuration at use time
    if not program.blueprint:
        messages.error(request, "Program must have a blueprint configured")
        return redirect("core:instructor.program_manage", pk=program_id)

    blueprint_structure = program.blueprint.hierarchy_structure or []
    is_valid_hierarchy, hierarchy_error = validate_builder_hierarchy(
        blueprint_structure
    )

    # Course Builder taxonomy requires:
    # Tier 1 (Program.level) outside tree + 2 in-tree tiers (container/content)
    if not is_valid_hierarchy:
        messages.error(
            request,
            hierarchy_error
            or (
                "Blueprint must define exactly 2 hierarchy levels. "
                "Program level is configured separately."
            ),
        )
        return redirect("core:instructor.program_manage", pk=program_id)
    builder_structure = [str(label).strip() for label in blueprint_structure]

    try:
        parent = None
        if parent_id:
            parent = CurriculumNode.objects.filter(
                pk=parent_id, program_id=program_id
            ).first()
            if not parent:
                raise ValueError("Invalid parent node")

            current_depth = parent.get_depth()
            if current_depth + 1 >= len(builder_structure):
                raise ValueError("Maximum nesting depth reached")

            # All children use the blueprint hierarchy structure
            # Lesson types (video, text, quiz, assignment, live) are differentiated by properties.lesson_type
            node_type = builder_structure[current_depth + 1]
        else:
            # Root level nodes (containers) use the first item in blueprint structure
            node_type = builder_structure[0]

        # Enforce two-tier builder taxonomy validation (Level is admin-set, not in tree)
        # Reuse current_depth from line 4728 to avoid redundant get_depth() call
        depth = current_depth + 1 if parent else 0

        if depth > MAX_BUILDER_DEPTH:
            raise ValueError(
                f"Cannot create node at depth {depth}. "
                f"Maximum depth is {MAX_BUILDER_DEPTH}. "
                f"Hierarchy: {builder_structure[0]} → {builder_structure[1]}"
            )

        # Validate parent-child relationships
        if parent and depth > 0 and parent.get_depth() != 0:
            raise ValueError(
                f"Invalid parent. {builder_structure[1]} nodes must be children of "
                f"{builder_structure[0]} nodes (depth 0), not depth {parent.get_depth()} nodes."
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

        # Sync quiz payload immediately on creation so quiz_id exists for student flow.
        node_type_normalized = (node.node_type or "").lower()
        lesson_type_normalized = (
            (node.properties.get("lesson_type") or "").lower()
            if isinstance(node.properties, dict)
            else ""
        )
        if node_type_normalized == "quiz" or lesson_type_normalized == "quiz":
            questions_data = (
                node.properties.get("questions", [])
                if isinstance(node.properties, dict)
                else []
            )
            _sync_quiz_questions(node, questions_data)
        if (
            node_type_normalized == "assignment"
            or lesson_type_normalized == "assignment"
        ):
            _sync_assignment(node)

        # Use semantic labels in toasts to avoid blueprint label leakage
        # (e.g. container label "Course" for section creation).
        success_label = "Section" if parent is None else "Lesson"
        if node_type_normalized == "quiz" or lesson_type_normalized == "quiz":
            success_label = "Quiz"
        elif (
            node_type_normalized == "assignment"
            or lesson_type_normalized == "assignment"
        ):
            success_label = "Assignment"

        messages.success(
            request, f"{success_label} '{node.title}' created successfully"
        )

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
        messages.error(
            request,
            "Could not create this item right now. Please review the form and try again.",
        )
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
    from apps.assessments.models import (
        Question,
        QuestionGapAnswer,
        QuestionImageMatchingPair,
        QuestionMatchingPair,
        QuestionOption,
        Quiz,
    )
    from decimal import Decimal

    questions_data = questions_data if isinstance(questions_data, list) else []
    node_props = node.properties if isinstance(node.properties, dict) else {}

    def to_bool(value, default=False):
        if isinstance(value, bool):
            return value
        if value is None:
            return default
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"true", "1", "yes", "on"}:
                return True
            if normalized in {"false", "0", "no", "off", ""}:
                return False
        return bool(value)

    def to_int(value, default=0, minimum=None, maximum=None):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return default

        if minimum is not None and parsed < minimum:
            parsed = minimum
        if maximum is not None and parsed > maximum:
            parsed = maximum
        return parsed

    def to_optional_positive_int(value, maximum=None):
        if value is None or value == "":
            return None
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return None
        if parsed <= 0:
            return None
        if maximum is not None and parsed > maximum:
            parsed = maximum
        return parsed

    quiz_settings = {
        "description": str(node_props.get("description", "") or "").strip(),
        "pass_threshold": to_int(
            node_props.get("passing_grade"), default=70, minimum=0, maximum=100
        ),
        "weight": to_int(node_props.get("weight"), default=0, minimum=0, maximum=100),
        "time_limit_minutes": to_optional_positive_int(
            node_props.get("quiz_duration"), maximum=10080
        ),
        "max_attempts": to_int(
            node_props.get("max_attempts"), default=1, minimum=1, maximum=100
        ),
        "randomize_questions": to_bool(
            node_props.get("randomize_questions"), default=False
        ),
        "shuffle_options": to_bool(node_props.get("randomize_answers"), default=False),
        "show_answers_after_submit": to_bool(
            node_props.get("show_correct_answer"), default=True
        ),
        "allow_retake_after_pass": to_bool(
            node_props.get("retake_after_pass"), default=False
        ),
        # Retake penalties are intentionally disabled so quiz scores reflect
        # the learner's actual correct answers.
        "retake_penalty_percent": Decimal("0"),
    }

    # Get or create Quiz for this node
    quiz, created = Quiz.objects.get_or_create(
        node=node,
        defaults={
            "title": node.title,
            **quiz_settings,
        },
    )

    # Update quiz settings if not created
    if not created:
        quiz.title = node.title
        for field, value in quiz_settings.items():
            setattr(quiz, field, value)
        quiz.save(update_fields=["title", *quiz_settings.keys()])

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
            "multi_choice": "mcq_multi",
            "mcq_multi": "mcq_multi",
            "true_false": "true_false",
            "short_answer": "short_answer",
            "matching": "matching",
            "image_matching": "image_matching",
            "fill_blank": "fill_blank",
            "ordering": "ordering",
        }
        backend_type = type_mapping.get(question_type, question_type)

        question_text = _normalize_question_text(q_data.get("text", ""))

        def normalize_gaps(raw_gaps):
            if not isinstance(raw_gaps, list):
                return []
            normalized = []
            for gap_idx, gap in enumerate(raw_gaps):
                if isinstance(gap, dict):
                    index = gap.get("gap_index", gap_idx)
                    answers = gap.get("accepted_answers", [])
                    explanation = gap.get("explanation", "")
                else:
                    index = gap_idx
                    answers = []
                    explanation = ""
                if not isinstance(answers, list):
                    answers = []
                cleaned = [a for a in answers if str(a).strip()]
                normalized.append(
                    {
                        "gap_index": index,
                        "accepted_answers": cleaned,
                        "explanation": str(explanation or "").strip(),
                    }
                )
            return normalized

        def normalize_image_pairs(raw_pairs):
            if not isinstance(raw_pairs, list):
                return []
            normalized = []
            for pair_idx, pair in enumerate(raw_pairs):
                if not isinstance(pair, dict):
                    continue
                normalized.append(
                    {
                        "question_text": _normalize_question_text(
                            pair.get("question_text", "")
                        ),
                        "question_image": str(pair.get("question_image", "")).strip(),
                        "answer_text": _normalize_question_text(
                            pair.get("answer_text", "")
                        ),
                        "answer_image": str(pair.get("answer_image", "")).strip(),
                        "explanation": _normalize_question_text(
                            pair.get("explanation", "")
                        ),
                        "position": pair.get("position", pair_idx),
                    }
                )
            return normalized

        def normalize_matching_pairs(raw_pairs):
            if not isinstance(raw_pairs, list):
                return []
            normalized = []
            for pair_idx, pair in enumerate(raw_pairs):
                if not isinstance(pair, dict):
                    continue
                normalized.append(
                    {
                        "left_text": _normalize_question_text(
                            pair.get("left_text", "")
                        ),
                        "right_text": _normalize_question_text(
                            pair.get("right_text", "")
                        ),
                        "explanation": _normalize_question_text(
                            pair.get("explanation", "")
                        ),
                        "position": pair.get("position", pair_idx),
                    }
                )
            return normalized

        # Build answer_data based on question type
        answer_data = {}
        if backend_type == "mcq":
            answer_data = {
                "options": normalize_assessment_text_list(q_data.get("options", [])),
                "correct": q_data.get("correct", 0),
            }
        elif backend_type == "mcq_multi":
            answer_data = {
                "options": normalize_assessment_text_list(q_data.get("options", [])),
                "correct_indices": q_data.get("correct_indices", []),
            }
        elif backend_type == "true_false":
            answer_data = {
                "correct": normalize_true_false_choice(
                    q_data.get("correct"),
                    default=True,
                )
            }
        elif backend_type == "short_answer":
            answer_data = {
                "keywords": normalize_assessment_text_list(q_data.get("keywords", [])),
                "manual_grading": q_data.get("manual_grading", True),
            }
        elif backend_type == "ordering":
            raw_items = q_data.get("items", [])

            items = normalize_assessment_text_list(raw_items)
            raw_explanations = q_data.get("explanations", {})
            explanations = normalize_assessment_text_mapping(raw_explanations)

            answer_data = {
                "items": items,
                "explanations": explanations,
            }

        answer_data = normalize_question_answer_data(backend_type, answer_data)

        if db_id and db_id in existing_ids:
            # Update existing question
            Question.objects.filter(pk=db_id).update(
                text=question_text,
                question_type=backend_type,
                points=q_data.get("points", 1),
                position=idx,
                answer_data=answer_data,
            )
            processed_ids.add(db_id)

            # Handle MCQ options update
            if backend_type in ("mcq", "mcq_multi") and "options" in q_data:
                question = Question.objects.get(pk=db_id)
                question.options.all().delete()
                for opt_idx, opt_text in enumerate(q_data.get("options", [])):
                    QuestionOption.objects.create(
                        question=question,
                        text=_normalize_question_text(opt_text),
                        is_correct=(
                            (opt_idx == q_data.get("correct", 0))
                            if backend_type == "mcq"
                            else (
                                opt_idx in set(answer_data.get("correct_indices", []))
                            )
                        ),
                        position=opt_idx,
                    )

            if backend_type == "matching":
                question = Question.objects.get(pk=db_id)
                question.matching_pairs.all().delete()
                pairs_data = normalize_matching_pairs(q_data.get("pairs", []))
                for pair in pairs_data:
                    QuestionMatchingPair.objects.create(
                        question=question,
                        left_text=pair["left_text"],
                        right_text=pair["right_text"],
                        explanation=pair["explanation"],
                        position=pair["position"],
                    )

            if backend_type == "fill_blank":
                question = Question.objects.get(pk=db_id)
                question.gap_answers.all().delete()
                gaps_data = normalize_gaps(
                    q_data.get("gaps", q_data.get("gap_answers", []))
                )
                for gap in gaps_data:
                    QuestionGapAnswer.objects.create(
                        question=question,
                        gap_index=gap["gap_index"],
                        accepted_answers=gap["accepted_answers"],
                        explanation=gap["explanation"],
                    )

            if backend_type == "image_matching":
                question = Question.objects.get(pk=db_id)
                question.image_matching_pairs.all().delete()
                image_pairs = normalize_image_pairs(q_data.get("image_pairs", []))
                for pair in image_pairs:
                    QuestionImageMatchingPair.objects.create(
                        question=question,
                        question_text=pair["question_text"],
                        question_image=pair["question_image"],
                        answer_text=pair["answer_text"],
                        answer_image=pair["answer_image"],
                        explanation=pair["explanation"],
                        position=pair["position"],
                    )

            updated_questions.append({**q_data, "db_id": db_id})
        else:
            # Create new question
            new_question = Question.objects.create(
                quiz=quiz,
                text=question_text,
                question_type=backend_type,
                points=q_data.get("points", 1),
                position=idx,
                answer_data=answer_data,
            )
            processed_ids.add(new_question.id)

            # Create MCQ options
            if backend_type in ("mcq", "mcq_multi") and "options" in q_data:
                for opt_idx, opt_text in enumerate(q_data.get("options", [])):
                    QuestionOption.objects.create(
                        question=new_question,
                        text=_normalize_question_text(opt_text),
                        is_correct=(
                            (opt_idx == q_data.get("correct", 0))
                            if backend_type == "mcq"
                            else (
                                opt_idx in set(answer_data.get("correct_indices", []))
                            )
                        ),
                        position=opt_idx,
                    )

            if backend_type == "matching":
                pairs_data = normalize_matching_pairs(q_data.get("pairs", []))
                for pair in pairs_data:
                    QuestionMatchingPair.objects.create(
                        question=new_question,
                        left_text=pair["left_text"],
                        right_text=pair["right_text"],
                        explanation=pair["explanation"],
                        position=pair["position"],
                    )

            if backend_type == "fill_blank":
                gaps_data = normalize_gaps(
                    q_data.get("gaps", q_data.get("gap_answers", []))
                )
                for gap in gaps_data:
                    QuestionGapAnswer.objects.create(
                        question=new_question,
                        gap_index=gap["gap_index"],
                        accepted_answers=gap["accepted_answers"],
                        explanation=gap["explanation"],
                    )

            if backend_type == "image_matching":
                image_pairs = normalize_image_pairs(q_data.get("image_pairs", []))
                for pair in image_pairs:
                    QuestionImageMatchingPair.objects.create(
                        question=new_question,
                        question_text=pair["question_text"],
                        question_image=pair["question_image"],
                        answer_text=pair["answer_text"],
                        answer_image=pair["answer_image"],
                        explanation=pair["explanation"],
                        position=pair["position"],
                    )

            updated_questions.append({**q_data, "db_id": new_question.id})

    # Delete removed questions
    removed_ids = existing_ids - processed_ids
    if removed_ids:
        Question.objects.filter(id__in=removed_ids).delete()

    question_metadata_by_id = {}
    for q_data in updated_questions:
        db_id = _safe_int(q_data.get("db_id"))
        if not db_id:
            continue
        if q_data.get("generated_from_assessment_prompt") is True:
            question_metadata_by_id[db_id] = {"generated_from_assessment_prompt": True}

    # Rebuild properties from DB records (single source of truth).
    # This prevents stale/raw frontend data (e.g. <p> tags, corrupted options)
    # from persisting in node.properties across save cycles.
    db_questions = (
        quiz.questions.all()
        .prefetch_related(
            "options", "matching_pairs", "gap_answers", "image_matching_pairs"
        )
        .order_by("position")
    )
    rebuilt_questions = []
    for q in db_questions:
        q_entry = {
            "id": f"q_{q.id}",
            "db_id": q.id,
            "type": q.question_type,
            "text": q.text,  # Already normalized via _normalize_question_text
            "points": q.points,
        }
        q_entry.update(question_metadata_by_id.get(q.id, {}))

        if q.question_type in ("mcq", "mcq_multi"):
            opts = list(q.options.all().order_by("position"))
            q_entry["options"] = [o.text for o in opts]
            if q.question_type == "mcq":
                correct_opt = next((o for o in opts if o.is_correct), None)
                q_entry["correct"] = correct_opt.position if correct_opt else 0
            else:
                q_entry["correct_indices"] = [o.position for o in opts if o.is_correct]

        elif q.question_type == "true_false":
            q_entry["correct"] = true_false_choice_to_index(
                q.answer_data.get("correct"),
                default=0,
            )
            opts = list(q.options.all().order_by("position"))
            if opts:
                q_entry["options"] = [o.text for o in opts]

        elif q.question_type == "short_answer":
            q_entry["keywords"] = q.answer_data.get("keywords", [])
            q_entry["manual_grading"] = q.answer_data.get("manual_grading", True)

        elif q.question_type == "matching":
            pairs = list(q.matching_pairs.all().order_by("position"))
            q_entry["pairs"] = [
                {
                    "left_text": p.left_text,
                    "right_text": p.right_text,
                    "explanation": p.explanation,
                    "position": p.position,
                }
                for p in pairs
            ]

        elif q.question_type == "fill_blank":
            gaps = list(q.gap_answers.all().order_by("gap_index"))
            q_entry["gaps"] = [
                {
                    "gap_index": g.gap_index,
                    "accepted_answers": g.accepted_answers,
                    "explanation": g.explanation,
                }
                for g in gaps
            ]

        elif q.question_type == "ordering":
            q_entry["items"] = q.answer_data.get("items", [])
            q_entry["explanations"] = q.answer_data.get("explanations", {})

        elif q.question_type == "image_matching":
            img_pairs = list(q.image_matching_pairs.all().order_by("position"))
            q_entry["image_pairs"] = [
                {
                    "question_text": p.question_text,
                    "question_image": p.question_image,
                    "answer_text": p.answer_text,
                    "answer_image": p.answer_image,
                    "explanation": p.explanation,
                    "position": p.position,
                }
                for p in img_pairs
            ]

        rebuilt_questions.append(q_entry)

    if not isinstance(node.properties, dict):
        node.properties = {}
    node.properties["questions"] = rebuilt_questions
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

    props = node.properties.copy() if isinstance(node.properties, dict) else {}

    def to_int(value, default=0, minimum=None, maximum=None):
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return default
        if minimum is not None and parsed < minimum:
            parsed = minimum
        if maximum is not None and parsed > maximum:
            parsed = maximum
        return parsed

    assignment_mode = _normalize_assignment_mode(props)
    typed_response_mode = _normalize_typed_response_mode(
        props.get("typed_response_mode")
    )
    submission_type = _normalize_submission_type(props.get("submission_type"))
    assessment_prompt = str(props.get("assessment_prompt") or "").strip()
    if not assessment_prompt:
        from django.utils.html import strip_tags

        assessment_prompt = strip_tags(props.get("instructions", "") or "").strip()
    if not assessment_prompt:
        assessment_prompt = node.title

    if assignment_mode != "submission_only":
        typed_response_mode = "submission_text"

    allow_late_submission = (
        props.get("allow_late_submission")
        if "allow_late_submission" in props
        else props.get("allow_late", False)
    )
    allow_late_submission = bool(allow_late_submission)
    assignment_attempts = props.get("assignment_attempts")
    try:
        assignment_attempts = int(assignment_attempts)
        if assignment_attempts <= 0:
            assignment_attempts = None
    except (TypeError, ValueError):
        assignment_attempts = None

    pass_threshold = to_int(
        props.get("pass_threshold", props.get("passing_grade", 50)),
        default=50,
        minimum=0,
        maximum=100,
    )

    props["assignment_mode"] = assignment_mode
    props["typed_response_mode"] = typed_response_mode
    props["assessment_prompt"] = assessment_prompt
    props["submission_type"] = submission_type
    props["allow_late_submission"] = allow_late_submission
    props["assignment_attempts"] = assignment_attempts
    props["pass_threshold"] = pass_threshold

    assignment_id = _safe_int(props.get("assignment_id"))
    assignment = None
    if assignment_id:
        assignment = Assignment.objects.filter(
            pk=assignment_id, program=node.program
        ).first()
    if assignment is None:
        assignment = Assignment.objects.filter(
            program=node.program,
            title=node.title,
        ).first()

    if assignment is None:
        assignment = Assignment.objects.create(
            program=node.program,
            title=node.title,
            description=node.description or "",
            instructions=props.get("instructions", ""),
            weight=props.get("weight", 10),
            pass_threshold=pass_threshold,
            due_date=props.get("due_date"),
            allow_late_submission=allow_late_submission,
            late_penalty_percent=props.get("late_penalty", 0),
            submission_type=submission_type,
            allowed_file_types=props.get("allowed_file_types", ["pdf", "docx"]),
            max_file_size_mb=props.get("max_file_size_mb", 10),
        )
    else:
        assignment.title = node.title
        assignment.description = node.description or assignment.description
        assignment.instructions = props.get("instructions", assignment.instructions)
        assignment.weight = props.get("weight", assignment.weight)
        assignment.pass_threshold = pass_threshold
        assignment.due_date = props.get("due_date", assignment.due_date)
        assignment.allow_late_submission = allow_late_submission
        assignment.late_penalty_percent = props.get(
            "late_penalty", assignment.late_penalty_percent
        )
        assignment.submission_type = submission_type
        assignment.allowed_file_types = props.get(
            "allowed_file_types", assignment.allowed_file_types
        )
        assignment.max_file_size_mb = props.get(
            "max_file_size_mb", assignment.max_file_size_mb
        )
        assignment.save()

    # Store assignment link and canonical values in node properties.
    props["assignment_id"] = assignment.id
    # Auto-manage a single short-answer question when submission-only uses prompt typing.
    if (
        assignment_mode == "submission_only"
        and typed_response_mode == "short_answer_question"
    ):
        from django.utils.html import strip_tags

        prompt_text = strip_tags(assessment_prompt).strip() or node.title
        existing_generated = None
        raw_questions = props.get("questions", [])
        if isinstance(raw_questions, list):
            for question in raw_questions:
                if (
                    isinstance(question, dict)
                    and question.get("generated_from_assessment_prompt") is True
                    and str(question.get("type") or "").lower() == "short_answer"
                ):
                    existing_generated = question
                    break

        generated_question = {
            "id": (
                existing_generated.get("id")
                if isinstance(existing_generated, dict)
                else f"auto_prompt_{node.id}"
            ),
            "type": "short_answer",
            "text": prompt_text,
            "points": props.get("points", 1) or 1,
            "keywords": [],
            "manual_grading": True,
            "generated_from_assessment_prompt": True,
        }
        if isinstance(existing_generated, dict) and existing_generated.get("db_id"):
            generated_question["db_id"] = existing_generated.get("db_id")

        props["questions"] = [generated_question]
        props["question_banks"] = []
    elif assignment_mode == "submission_only":
        props["questions"] = []
        props["question_banks"] = []
        props.pop("quiz_id", None)

    node.properties = props
    node.save(update_fields=["properties"])

    # Question-enabled assignments use the same question engine as quizzes.
    questions_data = props.get("questions", [])
    has_questions = isinstance(questions_data, list) and len(questions_data) > 0
    if _assignment_requires_questions(props) and has_questions:
        _sync_quiz_questions(node, questions_data)


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

    # The Course Builder editor submits the full node properties object.
    # Treat it as canonical so removed fields do not linger invisibly.
    if "properties" in data:
        incoming_props = data.get("properties") or {}
        if isinstance(incoming_props, dict):
            node.properties = incoming_props

    node_props = node.properties if isinstance(node.properties, dict) else {}
    updated_lesson_type = str(node_props.get("lesson_type") or "").lower()
    if updated_lesson_type == "document":
        document = node_props.get("document")
        if not isinstance(document, dict):
            document = {}

        if not str(document.get("original_url") or "").strip():
            messages.error(
                request,
                "Document lesson requires a primary document upload before saving.",
            )
            return redirect("core:instructor.program_manage", pk=node.program_id)

        strict_completion = _coerce_bool(document.get("strict_completion"), True)
        if strict_completion:
            status = str(document.get("conversion_status") or "").lower()
            viewer_pdf_url = str(document.get("viewer_pdf_url") or "").strip()
            page_count = document.get("page_count")
            try:
                page_count = int(page_count)
            except (TypeError, ValueError):
                page_count = 0

            if status != "ready" or not viewer_pdf_url or page_count <= 0:
                messages.error(
                    request,
                    "Document lesson strict mode requires a converted document before saving.",
                )
                return redirect("core:instructor.program_manage", pk=node.program_id)

    node.save()

    # Sync quiz questions to proper database tables if this is a quiz node
    node_type = (node.node_type or "").lower()
    lesson_type = (node.properties.get("lesson_type") or "").lower()

    if node_type == "quiz" or lesson_type == "quiz":
        questions_data = node.properties.get("questions", [])
        _sync_quiz_questions(node, questions_data)

    # Sync assignment data to Assignment table
    if node_type == "assignment" or lesson_type == "assignment":
        _sync_assignment(node)

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
    Render the normal course page with unpublished content for its instructor.
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

    return public_program_detail(
        request,
        pk=pk,
        is_preview=True,
        builder_url=f"/instructor/programs/{pk}/manage/",
    )


@login_required
def instructor_node_reorder(request, program_id: int):
    """Reorder siblings within a parent (or root-level if no parent_id)."""
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

    data = get_post_data(request)
    ordered_ids = data.get("ordered_ids", [])
    parent_id = data.get("parent_id")  # Optional: reorder children of this parent

    # Validate parent exists if provided
    if parent_id:
        parent_exists = CurriculumNode.objects.filter(
            pk=parent_id, program_id=program_id
        ).exists()
        if not parent_exists:
            messages.error(request, "Invalid parent node")
            return redirect("core:instructor.program_manage", pk=program_id)

    # Constrain updates to the intended sibling set
    if parent_id:
        sibling_filter = {"program_id": program_id, "parent_id": parent_id}
    else:
        sibling_filter = {"program_id": program_id, "parent__isnull": True}

    for idx, node_id in enumerate(ordered_ids):
        # Update position for nodes in the specified parent context
        CurriculumNode.objects.filter(pk=node_id, **sibling_filter).update(position=idx)

    messages.success(request, "Order updated")
    return redirect("core:instructor.program_manage", pk=program_id)


@login_required
def instructor_program_update_settings(request, pk: int):
    """Update course builder tabs and Settings sub-sections."""
    if not (is_instructor(request.user) or request.user.is_staff) or request.method != "POST":
        return redirect("/dashboard/")

    from apps.progression.models import InstructorAssignment

    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program_id=pk
        ).exists()
        or request.user.is_staff
    ):
        return redirect("/dashboard/")

    from apps.curriculum.models import CurriculumNode

    program = Program.objects.get(pk=pk)
    data = get_post_data(request)
    files = request.FILES
    active_tab = str(data.get("tab") or request.GET.get("tab") or "").strip().lower()
    settings_section = str(
        data.get("section") or request.GET.get("section") or "main"
    ).strip().lower()
    valid_builder_tabs = {"settings", "pricing", "faq", "notice", "drip", "practicum"}
    valid_settings_sections = {"main", "access", "prerequisites", "files", "certificate"}

    def _redirect_to_builder():
        if active_tab == "settings" and settings_section in valid_settings_sections:
            return redirect(
                f"/instructor/programs/{pk}/manage/?tab=settings&section={settings_section}"
            )
        if active_tab in valid_builder_tabs:
            return redirect(f"/instructor/programs/{pk}/manage/?tab={active_tab}")
        return redirect("core:instructor.program_manage", pk=pk)

    def _to_bool(value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "on"}
        return bool(value)

    def _to_int(value):
        try:
            if value in (None, ""):
                return None
            return int(value)
        except (TypeError, ValueError):
            return None

    def _parse_unlock_date(value):
        if not value:
            return None
        if isinstance(value, datetime):
            return (
                value
                if timezone.is_aware(value)
                else timezone.make_aware(value, timezone.get_current_timezone())
            )
        parsed = parse_datetime(str(value))
        if parsed:
            return (
                parsed
                if timezone.is_aware(parsed)
                else timezone.make_aware(parsed, timezone.get_current_timezone())
            )
        parsed_date = parse_date(str(value))
        if parsed_date:
            return datetime.combine(
                parsed_date, datetime.min.time(), tzinfo=timezone.get_current_timezone()
            )
        return None

    def _normalize_custom_pricing(pricing_data):
        if not isinstance(pricing_data, dict):
            return {}

        normalized = {**pricing_data}

        def _to_non_negative_number(value, *, default=0, allow_none=False):
            if value in (None, ""):
                return None if allow_none else default
            try:
                numeric = float(value)
            except (TypeError, ValueError):
                return None if allow_none else default
            if numeric < 0:
                numeric = 0
            return numeric

        price = _to_non_negative_number(normalized.get("price"), default=0)
        original_price = _to_non_negative_number(
            normalized.get("original_price"),
            allow_none=True,
        )
        legacy_sale_price = _to_non_negative_number(
            normalized.get("sale_price"),
            allow_none=True,
        )

        if original_price is None and legacy_sale_price is not None:
            if price and legacy_sale_price < price:
                original_price = price
                price = legacy_sale_price
            else:
                original_price = legacy_sale_price

        normalized["price"] = price
        normalized["currency"] = str(normalized.get("currency") or "KES").upper()

        if original_price is None or original_price <= 0:
            normalized.pop("original_price", None)
        else:
            normalized["original_price"] = original_price

        normalized.pop("sale_price", None)
        return normalized

    def _program_depends_on(
        source_program_id: int, target_program_id: int, seen=None
    ) -> bool:
        if seen is None:
            seen = set()
        if source_program_id in seen:
            return False
        seen.add(source_program_id)

        from apps.core.models import Program as ProgramModel

        deps = ProgramModel.objects.filter(pk=source_program_id).values_list(
            "prerequisite_programs__id", flat=True
        )
        dep_ids = [dep_id for dep_id in deps if dep_id]
        if target_program_id in dep_ids:
            return True
        return any(
            _program_depends_on(dep_id, target_program_id, seen) for dep_id in dep_ids
        )

    # --- Settings tab: details, welcome content, thumbnail, resources ---
    if "name" in data:
        name_val = str(data.get("name", "")).strip()
        if not name_val:
            messages.error(request, "Program name is required.")
            return _redirect_to_builder()
        program.name = name_val

    if "code" in data:
        code_val = str(data.get("code", "")).strip() or None
        if not code_val:
            messages.error(request, "Program code is required.")
            return _redirect_to_builder()
        if Program.objects.filter(code=code_val).exclude(pk=program.pk).exists():
            messages.error(request, "A program with this code already exists.")
            return _redirect_to_builder()
        program.code = code_val

    if "category" in data:
        program.category = str(data.get("category", "")).strip() or None

    if "level" in data:
        selected_level = str(data.get("level") or "").strip()
        program.level = selected_level

    if "examBody" in data:
        program.exam_body = data.get("examBody") or None

    if "qualificationFamily" in data:
        program.qualification_family = data.get("qualificationFamily") or None

    if "awardType" in data:
        program.award_type = data.get("awardType") or None

    if "assessmentMode" in data:
        program.assessment_mode = data.get("assessmentMode") or None

    if "thumbnail" in files:
        program.thumbnail = files["thumbnail"]

    if "description" in data:
        program.description = str(data.get("description", "")).strip()

    if "preview_description" in data:
        program.preview_description = str(data.get("preview_description", "")).strip()

    if "duration_hours" in data:
        duration_hours = _to_int(data.get("duration_hours"))
        if duration_hours is None or duration_hours < 0:
            messages.error(request, "Course duration must be zero or more hours.")
            return _redirect_to_builder()
        program.duration_hours = duration_hours

    if "video_hours" in data:
        video_hours = _to_int(data.get("video_hours"))
        if video_hours is None or video_hours < 0:
            messages.error(request, "Video duration must be zero or more hours.")
            return _redirect_to_builder()
        program.video_hours = video_hours

    if "lock_lessons_in_order" in data:
        program.lock_lessons_in_order = _to_bool(data.get("lock_lessons_in_order"))

    if "is_featured" in data:
        if not request.user.is_staff:
            messages.error(request, "Only staff can feature courses.")
            return _redirect_to_builder()
        program.is_featured = _to_bool(data.get("is_featured"))

    if "whatYouLearn" in data:
        what_you_learn_raw = str(data.get("whatYouLearn", "")).strip()
        program.what_you_learn_html = what_you_learn_raw
        program.what_you_learn_items = extract_learning_outcome_items_from_html(
            what_you_learn_raw
        )

    # --- Pricing ---
    if "custom_pricing" in data:
        program.custom_pricing = _normalize_custom_pricing(data["custom_pricing"])

    # --- FAQ ---
    if "faq" in data:
        program.faq = data["faq"]

    # --- Notices ---
    if "notices" in data:
        program.notices = data["notices"]

    from apps.core.models import ProgramResource

    delete_resource_ids = data.get("deleteResourceIds", [])
    if delete_resource_ids is None:
        delete_resource_ids = []
    if not isinstance(delete_resource_ids, list):
        delete_resource_ids = [delete_resource_ids]

    normalized_delete_resource_ids = []
    for value in delete_resource_ids:
        parsed = _to_int(value)
        if parsed:
            normalized_delete_resource_ids.append(parsed)
    normalized_delete_resource_ids = list(dict.fromkeys(normalized_delete_resource_ids))

    material_files = []
    for key in files:
        if key == "materials" or key.startswith("materials["):
            material_files.extend(files.getlist(key))

    co_instructor_ids = data.get("co_instructor_ids", None)
    normalized_co_instructor_ids = None
    if co_instructor_ids is not None:
        if not isinstance(co_instructor_ids, list):
            co_instructor_ids = [co_instructor_ids]

        normalized_co_instructor_ids = []
        for value in co_instructor_ids:
            parsed = _to_int(value)
            if parsed:
                normalized_co_instructor_ids.append(parsed)
        normalized_co_instructor_ids = list(dict.fromkeys(normalized_co_instructor_ids))

    # --- Prerequisites ---
    prerequisite_ids = data.get("prerequisite_program_ids", [])
    if prerequisite_ids is None:
        prerequisite_ids = []
    if not isinstance(prerequisite_ids, list):
        prerequisite_ids = [prerequisite_ids]

    normalized_prerequisite_ids = []
    for value in prerequisite_ids:
        parsed = _to_int(value)
        if parsed:
            normalized_prerequisite_ids.append(parsed)
    normalized_prerequisite_ids = list(dict.fromkeys(normalized_prerequisite_ids))

    if pk in normalized_prerequisite_ids:
        messages.error(request, "A program cannot be a prerequisite of itself.")
        return _redirect_to_builder()

    for dep_id in normalized_prerequisite_ids:
        if _program_depends_on(dep_id, pk):
            messages.error(
                request,
                "Prerequisite cycle detected. Please remove cyclic dependencies.",
            )
            return _redirect_to_builder()

    access_duration_days = _to_int(data.get("access_duration_days"))
    if access_duration_days is not None and access_duration_days < 1:
        messages.error(request, "Access duration must be a positive number of days.")
        return _redirect_to_builder()

    drip_mode = (data.get("drip_mode") or "none").strip().lower()
    valid_drip_modes = {"none", "relative", "absolute", "mixed"}
    if drip_mode not in valid_drip_modes:
        messages.error(request, "Invalid drip mode.")
        return _redirect_to_builder()

    drip_schedule = data.get("drip_schedule", [])
    if drip_schedule is None:
        drip_schedule = []
    if not isinstance(drip_schedule, list):
        drip_schedule = []

    if "prerequisite_passing_percent" in data:
        raw_percent = data.get("prerequisite_passing_percent")
        try:
            prerequisite_passing_percent = int(raw_percent)
        except (TypeError, ValueError):
            messages.error(request, "Prerequisite passing percent must be a number.")
            return _redirect_to_builder()
        if prerequisite_passing_percent < 0 or prerequisite_passing_percent > 100:
            messages.error(
                request,
                "Prerequisite passing percent must be between 0 and 100.",
            )
            return _redirect_to_builder()
        program.prerequisite_passing_percent = prerequisite_passing_percent

    if "access_duration_days" in data:
        program.access_duration_days = access_duration_days
    if "drip_enabled" in data:
        program.drip_enabled = _to_bool(data.get("drip_enabled"))
    if "drip_mode" in data:
        program.drip_mode = drip_mode

    with transaction.atomic():
        program.save()

        if normalized_delete_resource_ids:
            resources_to_delete = ProgramResource.objects.filter(
                program=program,
                id__in=normalized_delete_resource_ids,
            )
            for resource in resources_to_delete:
                if resource.file:
                    resource.file.delete(save=False)
                resource.delete()

        for uploaded_file in material_files:
            ProgramResource.objects.create(
                program=program,
                file=uploaded_file,
                title=uploaded_file.name,
                resource_type="material",
            )

        if "prerequisite_program_ids" in data:
            valid_ids = list(
                Program.objects.filter(pk__in=normalized_prerequisite_ids)
                .exclude(pk=program.pk)
                .values_list("id", flat=True)
            )
            program.prerequisite_programs.set(valid_ids)

        if normalized_co_instructor_ids is not None:
            owner_assignment = (
                InstructorAssignment.objects.filter(program=program, is_primary=True)
                .select_related("instructor")
                .first()
            )
            if owner_assignment is None:
                owner_assignment = (
                    InstructorAssignment.objects.filter(program=program)
                    .select_related("instructor")
                    .order_by("assigned_at", "id")
                    .first()
                )

            owner_id = owner_assignment.instructor_id if owner_assignment else request.user.id
            if not request.user.is_staff and request.user.id == owner_id:
                normalized_co_instructor_ids = [
                    instructor_id
                    for instructor_id in normalized_co_instructor_ids
                    if instructor_id != request.user.id
                ]

            valid_instructor_ids = set(
                User.objects.filter(
                    id__in=normalized_co_instructor_ids,
                    groups__name="Instructors",
                )
                .exclude(pk=owner_id)
                .values_list("id", flat=True)
            )

            if owner_id:
                owner_assignment, _ = InstructorAssignment.objects.get_or_create(
                    program=program,
                    instructor_id=owner_id,
                    defaults={"role": "Primary Instructor", "is_primary": True},
                )
                if not owner_assignment.is_primary:
                    owner_assignment.is_primary = True
                    owner_assignment.role = owner_assignment.role or "Primary Instructor"
                    owner_assignment.save(update_fields=["is_primary", "role"])

            InstructorAssignment.objects.filter(
                program=program,
                is_primary=False,
            ).exclude(instructor_id__in=valid_instructor_ids).delete()

            for instructor_id in valid_instructor_ids:
                InstructorAssignment.objects.get_or_create(
                    program=program,
                    instructor_id=instructor_id,
                    defaults={"role": "Instructor", "is_primary": False},
                )

        if "drip_schedule" in data:
            updates = []
            for row in drip_schedule:
                if not isinstance(row, dict):
                    continue
                node_id = _to_int(row.get("node_id") or row.get("nodeId"))
                if not node_id:
                    continue
                unlock_after_days = _to_int(
                    row.get("unlock_after_days")
                    if "unlock_after_days" in row
                    else row.get("unlockAfterDays")
                )
                unlock_date = _parse_unlock_date(
                    row.get("unlock_date")
                    if "unlock_date" in row
                    else row.get("unlockDate")
                )

                node = CurriculumNode.objects.filter(pk=node_id, program_id=pk).first()
                if not node:
                    continue

                node.unlock_after_days = (
                    unlock_after_days
                    if unlock_after_days and unlock_after_days > 0
                    else None
                )
                node.unlock_date = unlock_date
                node.updated_at = timezone.now()
                updates.append(node)

            if updates:
                CurriculumNode.objects.bulk_update(
                    updates,
                    ["unlock_after_days", "unlock_date", "updated_at"],
                )

    messages.success(request, "Settings updated")
    return _redirect_to_builder()


@login_required
def instructor_quiz_image_upload(request, node_id: int):
    """
    Upload a quiz image (used by image-matching editor).
    Returns JSON with uploaded image URL.
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
    if not str(uploaded_file.content_type or "").startswith("image/"):
        return JsonResponse({"error": "Only image files are allowed"}, status=400)

    max_size = 10 * 1024 * 1024  # 10 MB
    if uploaded_file.size > max_size:
        return JsonResponse({"error": "Image exceeds 10MB limit"}, status=400)

    upload_dir = os.path.join(
        settings.MEDIA_ROOT, "quiz_images", str(node.program_id), str(node_id)
    )
    os.makedirs(upload_dir, exist_ok=True)

    ext = (
        uploaded_file.name.rsplit(".", 1)[-1].lower()
        if "." in uploaded_file.name
        else ""
    )
    unique_name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
    file_path = os.path.join(upload_dir, unique_name)

    with open(file_path, "wb+") as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    relative_path = f"quiz_images/{node.program_id}/{node_id}/{unique_name}"
    file_url = f"{settings.MEDIA_URL}{relative_path}"

    return JsonResponse(
        {
            "success": True,
            "image": {
                "name": uploaded_file.name,
                "url": file_url,
                "path": relative_path,
                "size": uploaded_file.size,
                "uploaded_at": timezone.now().isoformat(),
            },
        }
    )


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


def _delete_lesson_document_files(document: dict, exclude_paths=None):
    """Delete stored primary lesson document files (original and converted)."""
    import os

    from django.conf import settings

    exclude = set(exclude_paths or [])
    media_root = os.path.abspath(settings.MEDIA_ROOT)

    for key in ("original_path", "viewer_pdf_path"):
        rel_path = str((document or {}).get(key) or "").strip().lstrip("/")
        if not rel_path or rel_path in exclude:
            continue

        abs_path = os.path.abspath(os.path.join(media_root, rel_path))
        if not abs_path.startswith(media_root + os.sep):
            continue

        if os.path.exists(abs_path):
            os.remove(abs_path)


def _coerce_bool(value, default=False):
    """Coerce mixed bool/string values to boolean."""
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off", ""}:
            return False
    return bool(value)


def _extract_pdf_page_count(pdf_path: str) -> int:
    """Return total page count for a PDF file."""
    import fitz

    doc = fitz.open(pdf_path)
    try:
        return int(doc.page_count or 0)
    finally:
        doc.close()


def _convert_office_document_to_pdf(
    input_path: str, output_dir: str, timeout_seconds: int = 120
):
    """Convert DOCX/PPTX to PDF using headless LibreOffice."""
    import os
    import subprocess
    import time

    started = time.monotonic()
    command = [
        "soffice",
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        output_dir,
        input_path,
    ]
    result = subprocess.run(
        command,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=timeout_seconds,
    )

    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(detail or "LibreOffice conversion failed")

    stem = os.path.splitext(os.path.basename(input_path))[0]
    converted_path = os.path.join(output_dir, f"{stem}.pdf")
    if not os.path.exists(converted_path):
        raise RuntimeError("Converted PDF file was not produced")

    return converted_path, time.monotonic() - started


@login_required
def instructor_lesson_document_upload(request, node_id: int):
    """
    Upload/replace the primary document for a document lesson.
    Supports PDF, DOCX, PPTX; DOCX/PPTX are converted to tracked PDF.
    """
    import logging
    import os
    import uuid

    from django.conf import settings
    from django.db import transaction
    from django.http import JsonResponse

    logger = logging.getLogger(__name__)

    if not is_instructor(request.user) or request.method != "POST":
        return JsonResponse({"error": "Permission denied"}, status=403)

    from apps.curriculum.models import CurriculumNode

    program_ids = get_instructor_program_ids(request.user)
    try:
        node = CurriculumNode.objects.get(pk=node_id, program_id__in=program_ids)
    except CurriculumNode.DoesNotExist:
        return JsonResponse({"error": "Node not found"}, status=404)

    lesson_type = str((node.properties or {}).get("lesson_type") or "").lower()
    if lesson_type != "document":
        return JsonResponse(
            {"error": "Primary document uploads are only allowed for Document lessons"},
            status=400,
        )

    if "file" not in request.FILES:
        return JsonResponse({"error": "No file provided"}, status=400)

    uploaded_file = request.FILES["file"]
    file_name = uploaded_file.name or ""
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""

    allowed_extensions = {"pdf", "docx", "pptx"}
    if ext not in allowed_extensions:
        return JsonResponse(
            {"error": "Only PDF, DOCX, and PPTX files are supported"},
            status=400,
        )

    mime = str(uploaded_file.content_type or "").lower()
    allowed_mimes = {
        "pdf": {"application/pdf"},
        "docx": {
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
        },
        "pptx": {
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-powerpoint",
        },
    }
    if (
        mime
        and mime not in allowed_mimes.get(ext, set())
        and mime not in {"application/octet-stream", "binary/octet-stream"}
    ):
        return JsonResponse(
            {"error": f"Unexpected content type '{mime}' for .{ext} file"},
            status=400,
        )

    upload_dir = os.path.join(
        settings.MEDIA_ROOT, "lesson_documents", str(node.program_id), str(node_id)
    )
    os.makedirs(upload_dir, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}.{ext}"
    original_abs_path = os.path.join(upload_dir, unique_name)
    with open(original_abs_path, "wb+") as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    relative_original_path = (
        f"lesson_documents/{node.program_id}/{node_id}/{unique_name}"
    )
    original_url = f"{settings.MEDIA_URL}{relative_original_path}"

    old_document = (
        node.properties.get("document")
        if isinstance(node.properties, dict)
        and isinstance(node.properties.get("document"), dict)
        else None
    )
    strict_completion = _coerce_bool(
        (old_document or {}).get("strict_completion"),
        True,
    )

    viewer_abs_path = original_abs_path
    viewer_relative_path = relative_original_path
    viewer_url = original_url
    converted_at = timezone.now()

    try:
        if ext in {"docx", "pptx"}:
            converted_abs_path, duration_seconds = _convert_office_document_to_pdf(
                original_abs_path,
                upload_dir,
            )
            viewer_abs_path = converted_abs_path
            viewer_name = os.path.basename(converted_abs_path)
            viewer_relative_path = (
                f"lesson_documents/{node.program_id}/{node_id}/{viewer_name}"
            )
            viewer_url = f"{settings.MEDIA_URL}{viewer_relative_path}"
            converted_at = timezone.now()
            logger.info(
                "Document conversion succeeded for node_id=%s in %.2fs",
                node_id,
                duration_seconds,
            )

        page_count = _extract_pdf_page_count(viewer_abs_path)
        if page_count <= 0:
            raise RuntimeError("Converted PDF has no readable pages")

        fallback_mimes = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        }
        document_entry = {
            "id": uuid.uuid4().hex[:12],
            "original_name": uploaded_file.name,
            "original_ext": ext,
            "original_mime": uploaded_file.content_type or fallback_mimes.get(ext),
            "size": uploaded_file.size,
            "original_url": original_url,
            "original_path": relative_original_path,
            "viewer_pdf_url": viewer_url,
            "viewer_pdf_path": viewer_relative_path,
            "page_count": page_count,
            "conversion_status": "ready",
            "conversion_error": "",
            "strict_completion": strict_completion,
            "converted_at": converted_at.isoformat(),
        }
    except Exception as exc:
        logger.exception("Document processing failed for node_id=%s", node_id)
        _delete_lesson_document_files(
            {
                "original_path": relative_original_path,
                "viewer_pdf_path": viewer_relative_path,
            }
        )
        return JsonResponse(
            {
                "error": (
                    "We could not process this document. "
                    "Please confirm the file is valid and try again."
                )
            },
            status=400,
        )

    with transaction.atomic():
        props = node.properties.copy() if isinstance(node.properties, dict) else {}
        props["document"] = document_entry
        node.properties = props
        node.save(update_fields=["properties"])

    if old_document:
        _delete_lesson_document_files(
            old_document,
            exclude_paths={relative_original_path, viewer_relative_path},
        )

    return JsonResponse({"success": True, "document": document_entry})


@login_required
def instructor_lesson_document_delete(request, node_id: int):
    """Delete the primary document from a document lesson."""
    from django.http import JsonResponse

    if not is_instructor(request.user) or request.method != "POST":
        return JsonResponse({"error": "Permission denied"}, status=403)

    from apps.curriculum.models import CurriculumNode

    program_ids = get_instructor_program_ids(request.user)
    try:
        node = CurriculumNode.objects.get(pk=node_id, program_id__in=program_ids)
    except CurriculumNode.DoesNotExist:
        return JsonResponse({"error": "Node not found"}, status=404)

    document = (
        node.properties.get("document")
        if isinstance(node.properties, dict)
        and isinstance(node.properties.get("document"), dict)
        else None
    )

    if document:
        _delete_lesson_document_files(document)

    props = node.properties.copy() if isinstance(node.properties, dict) else {}
    props.pop("document", None)
    node.properties = props
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
        QuestionImageMatchingPair,
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
                explanation=pair.explanation,
                position=pair.position,
            )

        # Clone gap answers
        for gap in q.gap_answers.all():
            QuestionGapAnswer.objects.create(
                question=new_question,
                gap_index=gap.gap_index,
                accepted_answers=copy.deepcopy(gap.accepted_answers),
                explanation=gap.explanation,
            )

        # Clone image matching pairs
        for pair in q.image_matching_pairs.all():
            QuestionImageMatchingPair.objects.create(
                question=new_question,
                question_text=pair.question_text,
                question_image=pair.question_image,
                answer_text=pair.answer_text,
                answer_image=pair.answer_image,
                explanation=pair.explanation,
                position=pair.position,
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
        return redirect("core:instructor.program_manage", pk=program_id)

    # Verify access to target program
    if not (
        InstructorAssignment.objects.filter(
            instructor=request.user, program_id=program_id
        ).exists()
        or request.user.is_staff
    ):
        messages.error(request, "Permission denied")
        return redirect("core:instructor.program_manage", pk=program_id)

    data = get_post_data(request)
    source_ids = data.get("source_node_ids", [])
    target_section_id = data.get("target_section_id")

    if not source_ids or not target_section_id:
        messages.error(request, "Missing source_node_ids or target_section_id")
        return redirect("core:instructor.program_manage", pk=program_id)

    try:
        target_program = Program.objects.get(pk=program_id)
        target_section = CurriculumNode.objects.get(
            pk=target_section_id, program=target_program
        )
    except (Program.DoesNotExist, CurriculumNode.DoesNotExist):
        messages.error(request, "Invalid target program or section")
        return redirect("core:instructor.program_manage", pk=program_id)

    imported_count = 0
    for source_id in source_ids:
        try:
            source_node = CurriculumNode.objects.get(pk=source_id)
            _clone_node(source_node, target_section, target_program)
            imported_count += 1
        except CurriculumNode.DoesNotExist:
            continue  # Skip invalid source nodes

    messages.success(request, f"Imported {imported_count} item(s)")
    return redirect("core:instructor.program_manage", pk=program_id)


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
        .prefetch_related("posts__user")
        .order_by("-is_pinned", "-created_at")
    )

    instructor_ids = set(node.program.instructors.values_list("id", flat=True))

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
            "posts": [
                {
                    "id": post.id,
                    "content": post.content,
                    "created_at": post.created_at.isoformat(),
                    "author": post.user.get_full_name() or post.user.email,
                    "author_id": post.user.id,
                    "is_instructor": bool(post.user_id in instructor_ids),
                }
                for post in t.posts.all().order_by("created_at")
            ],
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
    from apps.notifications.services import NotificationService

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

    post =     DiscussionPost.objects.create(
        thread=thread,
        user=request.user,
        content=content,
    )
    NotificationService.notify_lesson_discussion_reply(post)

    messages.success(request, "Reply posted")
    return redirect(referer)


# ─── AIRADS College Public Pages ───

def airads_campuses(request):
    return render(request, "Public/Campuses")


def airads_courses(request):
    if _is_virtual_request(request):
        return airads_virtual_courses(request)
    return render(request, "Public/Courses")


def airads_campus_detail(request, slug):
    slug_to_component = {
        "eldoret": "Public/Eldoret",
        "bungoma": "Public/Bungoma",
        "kericho": "Public/Kericho",
        "kisumu": "Public/Kisumu",
        "lodwar": "Public/Lodwar",
        "maralal": "Public/Maralal",
        "nakuru": "Public/Nakuru",
    }
    component = slug_to_component.get(slug)
    if component is None:
        raise Http404("Campus not found")
    return render(request, component)


def _get_virtual_programs_payload() -> list[dict]:
    programs_query = Program.objects.filter(is_published=True).order_by("-created_at")

    programs_data = []
    for program in programs_query:
        programs_data.append({
            "id": program.id,
            "title": program.name,
            "description": program.description or "",
            "category": program.category or "",
            "level": program.level or "",
            "thumbnail": program.thumbnail.url if program.thumbnail else None,
            "rating": float(program.rating_average or 0),
            "review_count": program.rating_count,
            "price": program.custom_pricing.get("price", 0) if program.custom_pricing else 0,
            "school": {"name": program.category},
        })
    return programs_data


def airads_virtual_landing(request):
    return render(
        request,
        "Public/Virtual",
        {
            "programs": _get_virtual_programs_payload(),
            "siteContext": _build_site_context(request),
        },
    )


def airads_virtual_courses(request):
    """
    Virtual Campus Courses Catalog.
    Fetches all published programs and passes them to the VirtualCourses React component.
    """
    props = {
        "programs": _get_virtual_programs_payload(),
        "filters": {},
        "siteContext": _build_site_context(request),
    }

    return render(request, "Public/VirtualCourses", props)


def airads_schools(request):
    return render(request, "Public/Schools")


def airads_school_detail(request, slug):
    slug_to_component = {
        "engineering-ict": "Public/SchoolOfEngineeringICT",
        "hospitality-tourism": "Public/SchoolOfHospitalityTourism",
        "health-social": "Public/SchoolOfHealthSocial",
        "beauty-hairdressing": "Public/SchoolOfBeautyHairdressing",
        "media": "Public/SchoolOfMedia",
        "tvet-cdacc-courses": "Public/TvetCdaccCourses",
        "kasneb-courses": "Public/KasnebCourses",
        "nita-courses": "Public/NitaCourses",
        "icm-courses": "Public/IcmCourses",
        "professional-short-courses": "Public/ProfessionalShortCourses",
        "computer-packages": "Public/ComputerPackages",
        "driving-school": "Public/DrivingSchool",
    }
    component = slug_to_component.get(slug, "Public/NotFound")
    return render(request, component)


def airads_news(request):
    return render(request, "Public/News")


def airads_events(request):
    return render(request, "Public/Events")


def airads_students_portal(request):
    return render(request, "Public/StudentsPortal")


def airads_admissions(request):
    return render(request, "Public/Admissions")


def airads_application_procedure(request):
    return render(request, "Public/ApplicationProcedure")


def airads_application_form(request):
    return render(request, "Public/ApplicationForm")


def _get_application_form_options(study_mode: str) -> dict:
    campuses = Campus.objects.filter(is_active=True)
    if study_mode == AdmissionApplication.STUDY_MODE_VIRTUAL:
        campuses = campuses.filter(campus_type=Campus.CAMPUS_TYPE_VIRTUAL)
    else:
        campuses = campuses.filter(campus_type=Campus.CAMPUS_TYPE_PHYSICAL)

    programs = Program.objects.filter(is_published=True).order_by("name")

    return {
        "campuses": [
            {
                "id": campus.id,
                "name": campus.name,
                "slug": campus.slug,
                "type": campus.campus_type,
            }
            for campus in campuses.order_by("name")
        ],
        "programmes": [
            {
                "id": program.id,
                "name": program.name,
                "level": program.level,
                "category": program.category or "",
            }
            for program in programs
        ],
        "educationLevels": [
            "KCPE",
            "KCSE",
            "Artisan Certificate",
            "Certificate",
            "Diploma",
            "Other",
        ],
        "intakes": [
            "January 2026",
            "May 2026",
            "September 2026",
            "Next Available Intake",
        ],
    }


def _render_application_apply(request, forced_study_mode: str | None = None):
    study_mode = forced_study_mode or getattr(
        request,
        "default_study_mode",
        AdmissionApplication.STUDY_MODE_ON_CAMPUS,
    )
    if study_mode not in {
        AdmissionApplication.STUDY_MODE_ON_CAMPUS,
        AdmissionApplication.STUDY_MODE_VIRTUAL,
    }:
        study_mode = AdmissionApplication.STUDY_MODE_ON_CAMPUS

    is_virtual = study_mode == AdmissionApplication.STUDY_MODE_VIRTUAL
    options = _get_application_form_options(study_mode)
    application_context = {
        "studyMode": study_mode,
        "isVirtual": is_virtual,
        "lockedCampus": "Virtual Campus" if is_virtual else None,
        "source": "virtual_subdomain" if is_virtual else "main_website",
        "submitUrl": "/apply/submit/" if is_virtual else "/admissions/apply/submit/",
    }
    return render(
        request,
        "Public/ApplicationApply",
        {
            **options,
            "applicationContext": application_context,
            "siteContext": _build_site_context(request),
        },
    )


def airads_application_apply(request):
    return _render_application_apply(request)


def airads_virtual_application_apply(request):
    if not _is_virtual_request(request):
        return redirect(f"{_virtual_base_url()}/apply/")
    return _render_application_apply(
        request,
        forced_study_mode=AdmissionApplication.STUDY_MODE_VIRTUAL,
    )


def _clean_admission_value(data: dict, key: str) -> str:
    value = data.get(key, "")
    if value is None:
        return ""
    return str(value).strip()


def _redirect_after_application(request, study_mode: str):
    if study_mode == AdmissionApplication.STUDY_MODE_VIRTUAL:
        return redirect("/apply/")
    return redirect("core:airads.application_apply")


def airads_application_submit(request):
    if request.method != "POST":
        return redirect("core:airads.application_apply")

    if request.path.startswith("/apply/") and not _is_virtual_request(request):
        return redirect(f"{_virtual_base_url()}/apply/")

    data = get_post_data(request)
    is_virtual = _is_virtual_request(request)
    study_mode = (
        AdmissionApplication.STUDY_MODE_VIRTUAL
        if is_virtual
        else AdmissionApplication.STUDY_MODE_ON_CAMPUS
    )
    required_fields = {
        "fullName": "Full name",
        "phone": "Phone number",
    }
    if not is_virtual:
        required_fields["preferredCampus"] = "Preferred campus"
    if not (
        _clean_admission_value(data, "programId")
        or _clean_admission_value(data, "preferredProgramme")
    ):
        required_fields["preferredProgramme"] = "Preferred programme"

    missing_fields = [
        label for key, label in required_fields.items() if not _clean_admission_value(data, key)
    ]

    campus = None
    if is_virtual:
        campus = Campus.objects.filter(
            slug="virtual",
            campus_type=Campus.CAMPUS_TYPE_VIRTUAL,
            is_active=True,
        ).first()
        if campus is None:
            messages.error(request, "Virtual Campus is not configured yet.")
            return _redirect_after_application(request, study_mode)
    else:
        campus_id = _clean_admission_value(data, "campusId")
        preferred_campus_name = _clean_admission_value(data, "preferredCampus")
        campus_query = Campus.objects.filter(
            campus_type=Campus.CAMPUS_TYPE_PHYSICAL,
            is_active=True,
        )
        if campus_id:
            campus = campus_query.filter(id=campus_id).first()
        if campus is None and preferred_campus_name:
            campus = campus_query.filter(name=preferred_campus_name).first()
        if campus is None and "Preferred campus" not in missing_fields:
            missing_fields.append("Preferred campus")

    program = None
    program_id = _clean_admission_value(data, "programId")
    if program_id and program_id.isdigit():
        program = Program.objects.filter(id=program_id, is_published=True).first()
        if program is None and "Preferred programme" not in missing_fields:
            missing_fields.append("Preferred programme")

    if missing_fields:
        messages.error(
            request,
            f"Please complete: {', '.join(missing_fields)}.",
        )
        return _redirect_after_application(request, study_mode)

    preferred_programme = (
        program.name if program else _clean_admission_value(data, "preferredProgramme")
    )
    preferred_campus = campus.name if campus else _clean_admission_value(data, "preferredCampus")

    AdmissionApplication.objects.create(
        full_name=_clean_admission_value(data, "fullName"),
        phone=_clean_admission_value(data, "phone"),
        whatsapp=_clean_admission_value(data, "whatsapp"),
        email=_clean_admission_value(data, "email").lower(),
        study_mode=study_mode,
        campus=campus,
        program=program,
        preferred_campus=preferred_campus,
        preferred_programme=preferred_programme,
        intake=_clean_admission_value(data, "intake"),
        education_level=_clean_admission_value(data, "educationLevel"),
        message=_clean_admission_value(data, "message"),
        source="virtual_subdomain" if is_virtual else "main_website",
    )
    messages.success(
        request,
        "Your application has been received. Our admissions team will contact you soon.",
    )
    return _redirect_after_application(request, study_mode)


def airads_career_guide(request):
    return render(request, "Public/CareerGuide")


def airads_mission(request):
    return render(request, "Public/Mission")


def airads_history(request):
    return render(request, "Public/History")


def airads_study(request):
    return render(request, "Public/StudyAirads")


def airads_upload(request):
    return render(request, "Public/Upload")
