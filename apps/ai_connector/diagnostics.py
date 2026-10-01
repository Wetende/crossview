"""Evidence-backed course health and learner activity for connected AI clients."""

from collections import Counter

from django.conf import settings
from django.db.models import Count

from apps.learning_operations.selectors import get_engagement_matrix, get_program_learner_detail
from apps.learning_operations.services import classify_enrollment
from apps.learning_operations.models import EnrollmentLearningActivity
from apps.progression.models import Enrollment
from apps.platform.models import PlatformSettings
from apps.platform.policy import get_platform_capabilities
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode

from .access import AccessDenied, ConnectorError, get_program_for_user
from .content import Links
from .reading import _page_bounds, check_course_readiness


def course_health(user, links: Links, course_id) -> dict:
    """Combine platform readiness findings with recorded learner states."""
    program = get_program_for_user(user, course_id)
    readiness = check_course_readiness(user, links, program.id)
    enrollments = Enrollment.objects.filter(program=program).select_related("learning_activity")
    states = Counter(classify_enrollment(row) for row in enrollments)
    from apps.learning_operations.selectors import get_instructor_workload
    from apps.learning_operations.models import CourseDeliveryProfile
    delivery = CourseDeliveryProfile.objects.filter(program=program).first()
    return {
        "course_id": program.id,
        "title": program.name,
        "is_published": program.is_published,
        "builder_url": links.builder(program.id),
        "readiness": readiness,
        "enrollment_count": sum(states.values()),
        "learner_states": dict(states),
        "pending_instructor_workload": get_instructor_workload([program.id]),
        "delivery_mode": delivery.delivery_mode if delivery else None,
        "activity_basis": (
            "LMS-recorded enrollment learning activity. 'not_started' means no "
            "recorded learning activity at least 3 days after enrollment; "
            "'stalled' means 7-29 days since the last recorded activity; "
            "'inactive' means 30 or more days. Missing activity data does not "
            "prove the learner never opened the course."
        ),
        "scope_note": (
            "These are course-level facts, not a diagnosis of server uptime, "
            "payment processing, email delivery or video playback."
        ),
    }


def lms_configuration(user) -> dict:
    """Non-secret deployment configuration relevant to troubleshooting."""
    if not (user.is_active and (user.is_staff or user.is_superuser)):
        raise AccessDenied("Only an LMS administrator can inspect deployment configuration.")
    platform = PlatformSettings.objects.filter(pk=1).select_related("active_blueprint").first()
    blueprint = platform.active_blueprint if platform else None
    return {
        "platform_settings_configured": platform is not None,
        "deployment_mode": platform.deployment_mode if platform else None,
        "active_blueprint": (
            {"id": blueprint.id, "name": blueprint.name, "structure_labels": blueprint.hierarchy_structure}
            if blueprint else None
        ),
        "configured_capabilities": get_platform_capabilities(),
        "course_counts": {
            "total": Program.objects.count(),
            "published": Program.objects.filter(is_published=True).count(),
        },
        "ai_connector_enabled": bool(getattr(settings, "AI_CONNECTOR_ENABLED", False)),
        "expanded_tools_enabled": bool(getattr(settings, "AI_CONNECTOR_V2_ENABLED", False)),
        "note": (
            "Missing platform settings may block course creation. This reports "
            "configuration and database counts, not live uptime, "
            "logs, external provider status, video playback or email delivery."
        ),
    }


def course_learners(user, links: Links, course_id, *, state="", page=1, page_size=20) -> dict:
    program = get_program_for_user(user, course_id)
    page, page_size = _page_bounds(page, page_size)
    state = str(state or "").strip().lower()
    allowed_states = {"", "new", "not_started", "active", "stalled", "inactive", "expired", "completed", "withdrawn", "suspended"}
    if state not in allowed_states:
        raise ConnectorError(f"Unknown learner state {state!r}.")
    queryset = Enrollment.objects.filter(program=program).select_related(
        "user", "learning_activity",
    ).annotate(completed_count=Count("completions")).order_by("-enrolled_at", "-id")
    if state:
        rows = [row for row in queryset if classify_enrollment(row) == state]
        total = len(rows)
    else:
        rows = queryset
        total = queryset.count()
    start = (page - 1) * page_size
    total_nodes = CurriculumNode.objects.filter(
        program=program, is_published=True, children__isnull=True,
    ).count()
    items = []
    for row in rows[start : start + page_size]:
        try:
            activity = row.learning_activity
        except EnrollmentLearningActivity.DoesNotExist:
            activity = None
        completed = row.completed_count
        items.append({
            "enrollment_id": row.id,
            "user_id": row.user_id,
            "name": row.user.get_full_name() or row.user.email,
            "email": row.user.email,
            "status": row.status,
            "learner_state": classify_enrollment(row),
            "enrolled_at": row.enrolled_at.isoformat(),
            "last_activity_at": activity.last_activity_at.isoformat() if activity and activity.last_activity_at else None,
            "last_activity_source": activity.last_source if activity else "",
            "completed_nodes": completed,
            "total_nodes": total_nodes,
            "progress_percent": round(completed / total_nodes * 100, 1) if total_nodes else 0,
            "learner_url": (
                f"{links.base}/instructor/programs/{program.id}/students/{row.id}/"
            ),
        })
    return {
        "course_id": program.id,
        "state_filter": state or None,
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "has_more": start + page_size < total,
        "privacy_note": "Student information is private; use only for this authorized course task.",
    }


def learner_detail(user, links: Links, course_id, enrollment_id, *, curriculum_offset=0, curriculum_limit=25):
    program = get_program_for_user(user, course_id)
    try:
        enrollment_id = int(enrollment_id)
        curriculum_offset = max(int(curriculum_offset), 0)
        curriculum_limit = min(max(int(curriculum_limit), 1), 50)
    except (TypeError, ValueError):
        raise ConnectorError("Enrollment ID and pagination values must be whole numbers.")
    enrollment = Enrollment.objects.filter(program=program, pk=enrollment_id).select_related(
        "user", "program", "learning_activity",
    ).first()
    if enrollment is None:
        raise ConnectorError("That enrollment was not found in this course.")
    result = get_program_learner_detail(
        enrollment, curriculum_offset=curriculum_offset, curriculum_limit=curriculum_limit,
    )
    # The learner-activity scope is not consent to read unpublished grade data.
    result.pop("grades", None)
    result["course_id"] = program.id
    result["learner_url"] = f"{links.base}/instructor/programs/{program.id}/students/{enrollment.id}/"
    result["privacy_note"] = "This learner's details are private; do not share them with other learners."
    return result


def engagement_matrix(user, links: Links, course_id, *, enrollment_offset=0, node_offset=0, limit=25):
    program = get_program_for_user(user, course_id)
    try:
        enrollment_offset = max(int(enrollment_offset), 0)
        node_offset = max(int(node_offset), 0)
        limit = min(max(int(limit), 1), 25)
    except (TypeError, ValueError):
        raise ConnectorError("Pagination values must be whole numbers.")
    result = get_engagement_matrix(
        program, enrollment_offset=enrollment_offset, enrollment_limit=limit,
        node_offset=node_offset, node_limit=limit,
    )
    return {
        "course_id": program.id,
        "matrix": result,
        "note": "Cells reflect recorded completions and quiz attempts, not every page visit.",
        "builder_url": links.builder(program.id),
    }
