"""
Student Portal views - Dashboard, Programs, Sessions, and Progress.
Requirements: 1.1-1.6, 2.1-2.5, 3.1-3.7, 4.1-4.7
"""

from typing import Optional
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from inertia import render

from apps.core.models import Program, User
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, NodeCompletion
from apps.assessments.models import AssessmentResult
from apps.practicum.models import PracticumSubmission, SubmissionReview, Rubric
from apps.certifications.models import Certificate


# =============================================================================
# Dashboard View
# =============================================================================


@login_required
def student_dashboard(request):
    """
    Student dashboard with enrollments, activity, and deadlines.
    Requirements: 1.1, 1.2, 1.3, 1.4
    """
    user = request.user

    # Get active enrollments with progress
    enrollments = Enrollment.objects.filter(
        user=user, status__in=["active", "completed"]
    ).select_related("program", "program__blueprint")

    enrollment_data = []
    for enrollment in enrollments:
        total_nodes = _get_completable_nodes_count(enrollment.program)
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
                "enrolledAt": enrollment.enrolled_at.isoformat(),
            }
        )

    # Get recent activity (last 10 completions)
    recent_completions = (
        NodeCompletion.objects.filter(enrollment__user=user)
        .select_related("node", "enrollment__program")
        .order_by("-completed_at")[:10]
    )

    recent_activity = [
        {
            "id": c.id,
            "nodeTitle": c.node.title,
            "programName": c.enrollment.program.name,
            "completedAt": c.completed_at.isoformat(),
            "type": c.completion_type,
        }
        for c in recent_completions
    ]

    # Upcoming deadlines (placeholder - would come from assessments)
    upcoming_deadlines = []

    return render(
        request,
        "Student/Dashboard",
        {
            "enrollments": enrollment_data,
            "recentActivity": recent_activity,
            "upcomingDeadlines": upcoming_deadlines,
        },
    )


# =============================================================================
# Program Views
# =============================================================================


@login_required
def program_list(request):
    """
    List all enrolled programs with filtering.
    Requirements: 2.1, 2.2, 2.3, 2.5
    """
    user = request.user
    status_filter = request.GET.get("status", "")

    enrollments = Enrollment.objects.filter(user=user).select_related(
        "program", "program__blueprint"
    )

    if status_filter:
        enrollments = enrollments.filter(status=status_filter)

    enrollment_data = []
    for enrollment in enrollments:
        total_nodes = _get_completable_nodes_count(enrollment.program)
        completed_nodes = enrollment.completions.count()
        progress = (completed_nodes / total_nodes * 100) if total_nodes > 0 else 0

        enrollment_data.append(
            {
                "id": enrollment.id,
                "programId": enrollment.program.id,
                "programName": enrollment.program.name,
                "programCode": enrollment.program.code or "",
                "description": enrollment.program.description or "",
                "progressPercent": round(progress, 1),
                "status": enrollment.status,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
            }
        )

    return render(
        request,
        "Student/Programs/Index",
        {
            "enrollments": enrollment_data,
            "filters": {"status": status_filter},
            "statusOptions": [
                {"value": "", "label": "All"},
                {"value": "active", "label": "Active"},
                {"value": "completed", "label": "Completed"},
                {"value": "withdrawn", "label": "Withdrawn"},
            ],
        },
    )


@login_required
def program_view(request, pk: int):
    """
    View program with curriculum tree.
    Requirements: 3.1, 3.2, 3.3
    """
    enrollment = get_object_or_404(
        Enrollment.objects.select_related("program", "program__blueprint"),
        pk=pk,
        user=request.user,
    )
    program = enrollment.program

    # Get curriculum tree
    root_nodes = (
        CurriculumNode.objects.filter(
            program=program, parent__isnull=True, is_published=True
        )
        .prefetch_related("children")
        .order_by("position")
    )

    # Get all completions for this enrollment
    completions = list(enrollment.completions.values_list("node_id", flat=True))

    # Build curriculum tree
    curriculum_tree = _build_curriculum_tree(root_nodes, completions, enrollment)

    # Get hierarchy labels from blueprint
    hierarchy_labels = []
    if program.blueprint:
        hierarchy_labels = program.blueprint.hierarchy_structure or []

    # Calculate progress
    total_nodes = _get_completable_nodes_count(program)
    completed_count = len(completions)
    progress = (completed_count / total_nodes * 100) if total_nodes > 0 else 0

    return render(
        request,
        "Student/Programs/Show",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "description": program.description or "",
            },
            "enrollment": {
                "id": enrollment.id,
                "status": enrollment.status,
                "progressPercent": round(progress, 1),
            },
            "curriculumTree": curriculum_tree,
            "completions": completions,
            "hierarchyLabels": hierarchy_labels,
        },
    )


# =============================================================================
# Session Viewer
# =============================================================================


@login_required
def session_viewer(request, pk: int, node_id: int):
    """
    View session content and handle mark-as-complete.
    Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
    """
    enrollment = get_object_or_404(
        Enrollment.objects.select_related("program"), pk=pk, user=request.user
    )
    node = get_object_or_404(CurriculumNode, pk=node_id, program=enrollment.program)

    # Handle mark as complete POST
    if request.method == "POST" and request.POST.get("mark_complete"):
        NodeCompletion.objects.get_or_create(
            enrollment=enrollment,
            node=node,
            defaults={
                "completion_type": "view",
                "completed_at": timezone.now(),
            },
        )

    # Check if completed
    is_completed = NodeCompletion.objects.filter(
        enrollment=enrollment, node=node
    ).exists()

    # Check unlock status
    unlock_status = _check_unlock_status(enrollment, node)

    # Get breadcrumbs
    breadcrumbs = _get_breadcrumbs(node, enrollment.id)

    # Get siblings for navigation
    siblings = _get_sibling_navigation(node, enrollment.id)

    # Get content from properties
    content_html = node.properties.get("content_html", "")

    return render(
        request,
        "Student/Session",
        {
            "node": {
                "id": node.id,
                "title": node.title,
                "nodeType": node.node_type,
                "contentHtml": content_html,
                "description": node.description or "",
            },
            "enrollment": {
                "id": enrollment.id,
                "programId": enrollment.program.id,
                "programName": enrollment.program.name,
            },
            "isCompleted": is_completed,
            "isLocked": not unlock_status["is_unlocked"],
            "lockReason": unlock_status.get("reason"),
            "breadcrumbs": breadcrumbs,
            "siblings": siblings,
        },
    )


# =============================================================================
# Helper Functions
# =============================================================================


def _get_completable_nodes_count(program: Program) -> int:
    """Count nodes that can be completed (leaf nodes or nodes with completion rules)."""
    return CurriculumNode.objects.filter(
        program=program, is_published=True, children__isnull=True  # Leaf nodes
    ).count()


def _build_curriculum_tree(nodes, completions: list, enrollment: Enrollment) -> list:
    """Build curriculum tree with completion status."""
    result = []
    for node in nodes:
        children = node.children.filter(is_published=True).order_by("position")

        node_data = {
            "id": node.id,
            "title": node.title,
            "nodeType": node.node_type,
            "code": node.code or "",
            "isCompleted": node.id in completions,
            "isLocked": False,  # Simplified - would check prerequisites
            "hasChildren": children.exists(),
            "children": (
                _build_curriculum_tree(children, completions, enrollment)
                if children
                else []
            ),
            "url": f"/student/programs/{enrollment.id}/session/{node.id}/",
        }
        result.append(node_data)

    return result


def _check_unlock_status(enrollment: Enrollment, node: CurriculumNode) -> dict:
    """Check if a node is unlocked based on prerequisites and sequential rules."""
    completion_rules = node.completion_rules or {}

    # Check prerequisites
    prerequisites = completion_rules.get("prerequisites", [])
    if prerequisites:
        completed_ids = set(enrollment.completions.values_list("node_id", flat=True))
        missing = [p for p in prerequisites if p not in completed_ids]
        if missing:
            return {
                "is_unlocked": False,
                "reason": "Complete prerequisites first",
            }

    # Check sequential completion
    if completion_rules.get("sequential", False) and node.parent:
        siblings = node.parent.children.filter(
            is_published=True, position__lt=node.position
        )
        completed_ids = set(enrollment.completions.values_list("node_id", flat=True))
        for sibling in siblings:
            if sibling.id not in completed_ids:
                return {
                    "is_unlocked": False,
                    "reason": f'Complete "{sibling.title}" first',
                }

    return {"is_unlocked": True}


def _get_breadcrumbs(node: CurriculumNode, enrollment_id: int) -> list:
    """Generate breadcrumb navigation for a node."""
    breadcrumbs = []
    ancestors = node.get_ancestors()

    for ancestor in ancestors:
        breadcrumbs.append(
            {
                "id": ancestor.id,
                "title": ancestor.title,
                "url": f"/student/programs/{enrollment_id}/session/{ancestor.id}/",
            }
        )

    # Add current node
    breadcrumbs.append(
        {
            "id": node.id,
            "title": node.title,
            "url": f"/student/programs/{enrollment_id}/session/{node.id}/",
        }
    )

    return breadcrumbs


def _get_sibling_navigation(node: CurriculumNode, enrollment_id: int) -> dict:
    """Get previous and next sibling nodes for navigation."""
    result = {"prev": None, "next": None}

    if node.parent:
        siblings = list(
            node.parent.children.filter(is_published=True).order_by("position")
        )

        try:
            current_index = next(i for i, s in enumerate(siblings) if s.id == node.id)

            if current_index > 0:
                prev_node = siblings[current_index - 1]
                result["prev"] = {
                    "id": prev_node.id,
                    "title": prev_node.title,
                    "url": f"/student/programs/{enrollment_id}/session/{prev_node.id}/",
                }

            if current_index < len(siblings) - 1:
                next_node = siblings[current_index + 1]
                result["next"] = {
                    "id": next_node.id,
                    "title": next_node.title,
                    "url": f"/student/programs/{enrollment_id}/session/{next_node.id}/",
                }
        except StopIteration:
            pass

    return result


# =============================================================================
# Assessment Results View
# =============================================================================


@login_required
def assessment_results(request):
    """
    View assessment results with filtering and pagination.
    Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
    """
    user = request.user
    program_filter = request.GET.get("program", "")
    status_filter = request.GET.get("status", "")
    page = int(request.GET.get("page", 1))
    per_page = 20

    # Get user's enrollments for filtering
    user_enrollments = Enrollment.objects.filter(user=user).select_related("program")
    enrollment_ids = list(user_enrollments.values_list("id", flat=True))

    # Get published results only
    results = AssessmentResult.objects.filter(
        enrollment_id__in=enrollment_ids,
        is_published=True,
    ).select_related("enrollment__program", "node")

    # Apply filters
    if program_filter:
        results = results.filter(enrollment__program_id=program_filter)

    if status_filter:
        # Filter by status in result_data JSON
        results = results.filter(result_data__status=status_filter)

    # Order by most recent
    results = results.order_by("-published_at", "-created_at")

    # Pagination
    total_count = results.count()
    total_pages = (total_count + per_page - 1) // per_page
    offset = (page - 1) * per_page
    results = results[offset : offset + per_page]

    # Build results data
    results_data = []
    for result in results:
        result_data = result.result_data or {}
        results_data.append(
            {
                "id": result.id,
                "nodeTitle": result.node.title,
                "nodeType": result.node.node_type,
                "programName": result.enrollment.program.name,
                "programId": result.enrollment.program.id,
                "total": result_data.get("total"),
                "status": result_data.get("status"),
                "letterGrade": result_data.get("letter_grade"),
                "components": result_data.get("components", {}),
                "lecturerComments": result.lecturer_comments,
                "publishedAt": (
                    result.published_at.isoformat() if result.published_at else None
                ),
            }
        )

    # Build program options for filter
    program_options = [{"value": "", "label": "All Programs"}]
    for enrollment in user_enrollments:
        program_options.append(
            {
                "value": str(enrollment.program.id),
                "label": enrollment.program.name,
            }
        )

    return render(
        request,
        "Student/Assessments",
        {
            "results": results_data,
            "pagination": {
                "page": page,
                "perPage": per_page,
                "totalCount": total_count,
                "totalPages": total_pages,
                "hasNext": page < total_pages,
                "hasPrev": page > 1,
            },
            "filters": {
                "program": program_filter,
                "status": status_filter,
            },
            "programOptions": program_options,
            "statusOptions": [
                {"value": "", "label": "All Statuses"},
                {"value": "Pass", "label": "Pass"},
                {"value": "Fail", "label": "Fail"},
                {"value": "Competent", "label": "Competent"},
                {"value": "Not Yet Competent", "label": "Not Yet Competent"},
            ],
        },
    )


# =============================================================================
# Practicum Views
# =============================================================================


@login_required
def practicum_history(request):
    """
    View practicum submission history with filtering.
    Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
    """
    user = request.user
    program_filter = request.GET.get("program", "")
    status_filter = request.GET.get("status", "")
    page = int(request.GET.get("page", 1))
    per_page = 20

    # Get user's enrollments
    user_enrollments = Enrollment.objects.filter(user=user).select_related("program")
    enrollment_ids = list(user_enrollments.values_list("id", flat=True))

    # Get submissions
    submissions = (
        PracticumSubmission.objects.filter(
            enrollment_id__in=enrollment_ids,
        )
        .select_related("enrollment__program", "node")
        .prefetch_related("reviews")
    )

    # Apply filters
    if program_filter:
        submissions = submissions.filter(enrollment__program_id=program_filter)

    if status_filter:
        submissions = submissions.filter(status=status_filter)

    # Order by most recent
    submissions = submissions.order_by("-submitted_at")

    # Pagination
    total_count = submissions.count()
    total_pages = (total_count + per_page - 1) // per_page
    offset = (page - 1) * per_page
    submissions = submissions[offset : offset + per_page]

    # Build submissions data
    submissions_data = []
    for submission in submissions:
        # Get latest review if any
        latest_review = submission.reviews.order_by("-reviewed_at").first()
        review_data = None
        if latest_review:
            review_data = {
                "status": latest_review.status,
                "comments": latest_review.comments,
                "totalScore": (
                    float(latest_review.total_score)
                    if latest_review.total_score
                    else None
                ),
                "dimensionScores": latest_review.dimension_scores,
                "reviewedAt": latest_review.reviewed_at.isoformat(),
            }

        submissions_data.append(
            {
                "id": submission.id,
                "nodeTitle": submission.node.title,
                "nodeType": submission.node.node_type,
                "programName": submission.enrollment.program.name,
                "programId": submission.enrollment.program.id,
                "version": submission.version,
                "status": submission.status,
                "fileType": submission.file_type,
                "fileSize": submission.file_size,
                "submittedAt": submission.submitted_at.isoformat(),
                "review": review_data,
            }
        )

    # Build program options for filter
    program_options = [{"value": "", "label": "All Programs"}]
    for enrollment in user_enrollments:
        program_options.append(
            {
                "value": str(enrollment.program.id),
                "label": enrollment.program.name,
            }
        )

    return render(
        request,
        "Student/Practicum/Index",
        {
            "submissions": submissions_data,
            "pagination": {
                "page": page,
                "perPage": per_page,
                "totalCount": total_count,
                "totalPages": total_pages,
                "hasNext": page < total_pages,
                "hasPrev": page > 1,
            },
            "filters": {
                "program": program_filter,
                "status": status_filter,
            },
            "programOptions": program_options,
            "statusOptions": [
                {"value": "", "label": "All Statuses"},
                {"value": "pending", "label": "Pending"},
                {"value": "approved", "label": "Approved"},
                {"value": "revision_required", "label": "Revision Required"},
                {"value": "rejected", "label": "Rejected"},
            ],
        },
    )


@login_required
def practicum_upload(request, pk: int, node_id: int):
    """
    View practicum upload page with node config and rubric.
    Requirements: 6.1, 6.5, 6.6, 6.7
    """
    enrollment = get_object_or_404(
        Enrollment.objects.select_related("program"), pk=pk, user=request.user
    )
    node = get_object_or_404(CurriculumNode, pk=node_id, program=enrollment.program)

    # Get node practicum configuration from properties
    practicum_config = node.properties.get("practicum", {})
    allowed_types = practicum_config.get("allowed_types", ["mp3", "mp4", "pdf"])
    max_size_mb = practicum_config.get("max_size_mb", 100)
    rubric_id = practicum_config.get("rubric_id")

    # Get rubric if configured
    rubric_data = None
    if rubric_id:
        try:
            rubric = Rubric.objects.get(pk=rubric_id)
            rubric_data = {
                "id": rubric.id,
                "name": rubric.name,
                "description": rubric.description,
                "dimensions": rubric.dimensions,
                "maxScore": rubric.max_score,
            }
        except Rubric.DoesNotExist:
            pass

    # Get current submission status
    current_submission = (
        PracticumSubmission.objects.filter(enrollment=enrollment, node=node)
        .order_by("-version")
        .first()
    )

    submission_data = None
    if current_submission:
        submission_data = {
            "id": current_submission.id,
            "version": current_submission.version,
            "status": current_submission.status,
            "fileType": current_submission.file_type,
            "fileSize": current_submission.file_size,
            "submittedAt": current_submission.submitted_at.isoformat(),
        }

    return render(
        request,
        "Student/Practicum/Upload",
        {
            "node": {
                "id": node.id,
                "title": node.title,
                "nodeType": node.node_type,
                "description": node.description or "",
            },
            "enrollment": {
                "id": enrollment.id,
                "programId": enrollment.program.id,
                "programName": enrollment.program.name,
            },
            "config": {
                "allowedTypes": allowed_types,
                "maxSizeMb": max_size_mb,
            },
            "rubric": rubric_data,
            "currentSubmission": submission_data,
        },
    )


# =============================================================================
# Certificates View
# =============================================================================


@login_required
def certificates_list(request):
    """
    View all certificates earned by the student.
    Requirements: 8.1, 8.2, 8.5, 8.6
    """
    user = request.user

    # Get user's enrollments
    enrollment_ids = list(
        Enrollment.objects.filter(user=user).values_list("id", flat=True)
    )

    # Get certificates
    certificates = (
        Certificate.objects.filter(
            enrollment_id__in=enrollment_ids,
        )
        .select_related("enrollment__program")
        .order_by("-issue_date")
    )

    certificates_data = []
    for cert in certificates:
        certificates_data.append(
            {
                "id": cert.id,
                "serialNumber": cert.serial_number,
                "programTitle": cert.program_title,
                "studentName": cert.student_name,
                "completionDate": cert.completion_date.isoformat(),
                "issueDate": cert.issue_date.isoformat(),
                "isRevoked": cert.is_revoked,
                "revocationReason": cert.revocation_reason if cert.is_revoked else None,
                "verificationUrl": cert.get_verification_url(),
            }
        )

    return render(
        request,
        "Student/Certificates",
        {
            "certificates": certificates_data,
        },
    )


# =============================================================================
# Profile View
# =============================================================================


@login_required
def profile_settings(request):
    """
    View and update profile settings.
    Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
    """
    user = request.user
    errors = {}

    if request.method == "POST":
        action = request.POST.get("action", "update_profile")

        if action == "update_profile":
            # Update name and phone only
            first_name = request.POST.get("first_name", "").strip()
            last_name = request.POST.get("last_name", "").strip()
            phone = request.POST.get("phone", "").strip()

            if not first_name:
                errors["first_name"] = "First name is required"
            if not last_name:
                errors["last_name"] = "Last name is required"

            if not errors:
                user.first_name = first_name
                user.last_name = last_name
                if hasattr(user, "phone"):
                    user.phone = phone
                user.save()

                return render(
                    request,
                    "Student/Profile",
                    {
                        "user": _serialize_user(user),
                        "success": "Profile updated successfully",
                    },
                )

        elif action == "change_password":
            current_password = request.POST.get("current_password", "")
            new_password = request.POST.get("new_password", "")
            confirm_password = request.POST.get("confirm_password", "")

            # Verify current password
            if not user.check_password(current_password):
                errors["current_password"] = "Current password is incorrect"
            elif len(new_password) < 8:
                errors["new_password"] = "Password must be at least 8 characters"
            elif new_password != confirm_password:
                errors["confirm_password"] = "Passwords do not match"

            if not errors:
                user.set_password(new_password)
                user.save()

                return render(
                    request,
                    "Student/Profile",
                    {
                        "user": _serialize_user(user),
                        "success": "Password changed successfully",
                    },
                )

    return render(
        request,
        "Student/Profile",
        {
            "user": _serialize_user(user),
            "errors": errors,
        },
    )


def _serialize_user(user: User) -> dict:
    """Serialize user for Inertia props."""
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "phone": getattr(user, "phone", ""),
    }


# _serialize_tenant removed - no longer needed in single-tenant mode


# =============================================================================
# Instructor Dashboard Views
# =============================================================================

from apps.progression.models import InstructorAssignment
import json


def _is_instructor(user) -> bool:
    """Check if user is an instructor."""
    return (
        hasattr(user, "groups") and user.groups.filter(name="Instructors").exists()
    ) or user.instructor_assignments.exists()


def _get_instructor_programs(user):
    """Get programs assigned to instructor."""
    return Program.objects.filter(
        instructor_assignments__instructor=user
    ).select_related("blueprint")


@login_required
def instructor_dashboard(request):
    """
    Instructor dashboard with stats, recent submissions, and deadlines.
    Requirements: FR-1.1, FR-1.2, FR-1.3
    """
    user = request.user

    # Get assigned programs
    programs = _get_instructor_programs(user)
    program_ids = list(programs.values_list("id", flat=True))

    # Calculate stats
    total_students = Enrollment.objects.filter(
        program_id__in=program_ids, status="active"
    ).count()

    pending_reviews = PracticumSubmission.objects.filter(
        enrollment__program_id__in=program_ids, status="pending"
    ).count()

    # Calculate completion rate
    total_enrollments = Enrollment.objects.filter(program_id__in=program_ids).count()
    completed_enrollments = Enrollment.objects.filter(
        program_id__in=program_ids, status="completed"
    ).count()
    completion_rate = (
        (completed_enrollments / total_enrollments * 100)
        if total_enrollments > 0
        else 0
    )

    # Get recent submissions (last 7 days, pending)
    from datetime import timedelta

    seven_days_ago = timezone.now() - timedelta(days=7)

    recent_submissions = (
        PracticumSubmission.objects.filter(
            enrollment__program_id__in=program_ids,
            status="pending",
            submitted_at__gte=seven_days_ago,
        )
        .select_related("enrollment__user", "enrollment__program", "node")
        .order_by("-submitted_at")[:10]
    )

    submissions_data = [
        {
            "id": s.id,
            "studentName": s.enrollment.user.get_full_name() or s.enrollment.user.email,
            "programName": s.enrollment.program.name,
            "nodeTitle": s.node.title,
            "submittedAt": s.submitted_at.isoformat(),
            "type": s.file_type,
        }
        for s in recent_submissions
    ]

    # Upcoming deadlines (placeholder - would come from assessment configs)
    upcoming_deadlines = []

    return render(
        request,
        "Instructor/Dashboard",
        {
            "stats": {
                "programCount": programs.count(),
                "totalStudents": total_students,
                "pendingReviews": pending_reviews,
                "completionRate": round(completion_rate, 1),
            },
            "recentSubmissions": submissions_data,
            "upcomingDeadlines": upcoming_deadlines,
        },
    )


@login_required
def instructor_programs(request):
    """
    List programs assigned to instructor.
    Requirements: FR-2.1, FR-2.2
    """
    user = request.user
    programs = _get_instructor_programs(user)

    programs_data = []
    for program in programs:
        # Get enrollment stats
        enrollments = Enrollment.objects.filter(program=program)
        total = enrollments.count()
        active = enrollments.filter(status="active").count()
        completed = enrollments.filter(status="completed").count()
        completion_rate = (completed / total * 100) if total > 0 else 0

        programs_data.append(
            {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "blueprintName": (
                    program.blueprint.name if program.blueprint else "No Blueprint"
                ),
                "enrollmentCount": total,
                "activeStudents": active,
                "completionRate": round(completion_rate, 1),
            }
        )

    return render(
        request,
        "Instructor/Programs/Index",
        {
            "programs": programs_data,
        },
    )


@login_required
def instructor_program_detail(request, pk: int):
    """
    View program detail with curriculum and stats.
    Requirements: FR-2.3
    """
    user = request.user

    # Verify instructor has access to this program
    assignment = get_object_or_404(InstructorAssignment, instructor=user, program_id=pk)
    program = assignment.program

    # Get curriculum tree
    root_nodes = (
        CurriculumNode.objects.filter(
            program=program, parent__isnull=True, is_published=True
        )
        .prefetch_related("children")
        .order_by("position")
    )

    # Build curriculum tree with completion stats
    curriculum_tree = _build_instructor_curriculum_tree(root_nodes, program)

    # Get hierarchy labels from blueprint
    hierarchy_labels = []
    if program.blueprint:
        hierarchy_labels = program.blueprint.hierarchy_structure or []

    # Calculate stats
    enrollments = Enrollment.objects.filter(program=program)
    total = enrollments.count()
    active = enrollments.filter(status="active").count()
    completed = enrollments.filter(status="completed").count()

    # Average progress
    total_progress = 0
    for enrollment in enrollments.filter(status="active"):
        total_nodes = _get_completable_nodes_count(program)
        completed_nodes = enrollment.completions.count()
        if total_nodes > 0:
            total_progress += completed_nodes / total_nodes * 100
    avg_progress = (total_progress / active) if active > 0 else 0

    return render(
        request,
        "Instructor/Programs/Show",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "description": program.description or "",
                "blueprint": {
                    "id": program.blueprint.id if program.blueprint else None,
                    "name": (
                        program.blueprint.name if program.blueprint else "No Blueprint"
                    ),
                    "hierarchyLabels": hierarchy_labels,
                    "gradingConfig": (
                        program.blueprint.grading_logic if program.blueprint else {}
                    ),
                },
            },
            "stats": {
                "totalEnrollments": total,
                "activeStudents": active,
                "completedStudents": completed,
                "averageProgress": round(avg_progress, 1),
            },
            "curriculum": curriculum_tree,
        },
    )


def _build_instructor_curriculum_tree(nodes, program) -> list:
    """Build curriculum tree with completion stats for instructor view."""
    result = []
    for node in nodes:
        children = node.children.filter(is_published=True).order_by("position")

        # Get completion count for this node
        completion_count = NodeCompletion.objects.filter(
            node=node, enrollment__program=program
        ).count()

        total_enrollments = Enrollment.objects.filter(
            program=program, status="active"
        ).count()

        node_data = {
            "id": node.id,
            "title": node.title,
            "nodeType": node.node_type,
            "code": node.code or "",
            "completionCount": completion_count,
            "totalStudents": total_enrollments,
            "hasChildren": children.exists(),
            "children": (
                _build_instructor_curriculum_tree(children, program) if children else []
            ),
        }
        result.append(node_data)

    return result


@login_required
def instructor_students(request, pk: int):
    """
    List students enrolled in a program.
    Requirements: FR-3.1, FR-3.3, FR-3.4
    """
    user = request.user

    # Verify instructor has access
    assignment = get_object_or_404(InstructorAssignment, instructor=user, program_id=pk)
    program = assignment.program

    # Get filters
    status_filter = request.GET.get("status", "")
    search = request.GET.get("search", "")
    page = int(request.GET.get("page", 1))
    per_page = 20

    # Query enrollments
    enrollments = Enrollment.objects.filter(program=program).select_related("user")

    if status_filter:
        enrollments = enrollments.filter(status=status_filter)

    if search:
        enrollments = enrollments.filter(
            Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
            | Q(user__email__icontains=search)
        )

    enrollments = enrollments.order_by("-enrolled_at")

    # Pagination
    total_count = enrollments.count()
    total_pages = (total_count + per_page - 1) // per_page
    offset = (page - 1) * per_page
    enrollments = enrollments[offset : offset + per_page]

    # Build student data with progress
    total_nodes = _get_completable_nodes_count(program)
    students_data = []

    for enrollment in enrollments:
        completed_nodes = enrollment.completions.count()
        progress = (completed_nodes / total_nodes * 100) if total_nodes > 0 else 0

        # Get last activity
        last_completion = enrollment.completions.order_by("-completed_at").first()

        students_data.append(
            {
                "id": enrollment.user.id,
                "enrollmentId": enrollment.id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "email": enrollment.user.email,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
                "progress": round(progress, 1),
                "status": enrollment.status,
                "lastActivity": (
                    last_completion.completed_at.isoformat()
                    if last_completion
                    else None
                ),
            }
        )

    return render(
        request,
        "Instructor/Students/Index",
        {
            "program": {"id": program.id, "name": program.name},
            "students": {
                "results": students_data,
                "pagination": {
                    "page": page,
                    "perPage": per_page,
                    "totalCount": total_count,
                    "totalPages": total_pages,
                    "hasNext": page < total_pages,
                    "hasPrev": page > 1,
                },
            },
            "filters": {
                "status": status_filter,
                "search": search,
            },
        },
    )


@login_required
def instructor_student_detail(request, pk: int, enrollment_id: int):
    """
    View individual student progress.
    Requirements: FR-3.2
    """
    user = request.user

    # Verify instructor has access
    assignment = get_object_or_404(InstructorAssignment, instructor=user, program_id=pk)
    program = assignment.program

    # Get enrollment
    enrollment = get_object_or_404(
        Enrollment.objects.select_related("user", "program"),
        pk=enrollment_id,
        program=program,
    )

    # Get curriculum tree with completion status
    root_nodes = (
        CurriculumNode.objects.filter(
            program=program, parent__isnull=True, is_published=True
        )
        .prefetch_related("children")
        .order_by("position")
    )

    completions = list(enrollment.completions.values_list("node_id", flat=True))
    curriculum_tree = _build_curriculum_tree(root_nodes, completions, enrollment)

    # Calculate progress
    total_nodes = _get_completable_nodes_count(program)
    completed_count = len(completions)
    progress = (completed_count / total_nodes * 100) if total_nodes > 0 else 0

    # Get assessment results
    assessment_results = (
        AssessmentResult.objects.filter(enrollment=enrollment)
        .select_related("node")
        .order_by("-created_at")
    )

    results_data = [
        {
            "id": r.id,
            "nodeTitle": r.node.title,
            "total": r.result_data.get("total") if r.result_data else None,
            "status": r.result_data.get("status") if r.result_data else None,
            "isPublished": r.is_published,
            "createdAt": r.created_at.isoformat(),
        }
        for r in assessment_results
    ]

    # Get practicum submissions
    submissions = (
        PracticumSubmission.objects.filter(enrollment=enrollment)
        .select_related("node")
        .order_by("-submitted_at")
    )

    submissions_data = [
        {
            "id": s.id,
            "nodeTitle": s.node.title,
            "status": s.status,
            "version": s.version,
            "submittedAt": s.submitted_at.isoformat(),
        }
        for s in submissions
    ]

    return render(
        request,
        "Instructor/Students/Show",
        {
            "program": {"id": program.id, "name": program.name},
            "student": {
                "id": enrollment.user.id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "email": enrollment.user.email,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
            },
            "progress": {
                "overall": round(progress, 1),
                "completedNodes": completed_count,
                "totalNodes": total_nodes,
            },
            "curriculum": curriculum_tree,
            "assessmentResults": results_data,
            "practicumSubmissions": submissions_data,
        },
    )


@login_required
def instructor_gradebook(request, pk: int):
    """
    View gradebook for a program.
    Requirements: FR-4.1
    """
    user = request.user

    # Verify instructor has access
    assignment = get_object_or_404(InstructorAssignment, instructor=user, program_id=pk)
    program = assignment.program

    # Get grading config from blueprint
    grading_config = {}
    if program.blueprint:
        grading_config = program.blueprint.grading_logic or {}

    # Get all active enrollments with grades
    enrollments = (
        Enrollment.objects.filter(program=program, status__in=["active", "completed"])
        .select_related("user")
        .order_by("user__last_name", "user__first_name")
    )

    students_data = []
    for enrollment in enrollments:
        # Get assessment result for this enrollment (program-level)
        result = AssessmentResult.objects.filter(
            enrollment=enrollment,
            node__parent__isnull=True,  # Root node = program level
        ).first()

        grades = {}
        if result and result.result_data:
            grades = {
                "components": result.result_data.get("components", {}),
                "total": result.result_data.get("total"),
                "status": result.result_data.get("status"),
                "letterGrade": result.result_data.get("letter_grade"),
            }

        students_data.append(
            {
                "enrollmentId": enrollment.id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "email": enrollment.user.email,
                "grades": grades,
                "isPublished": result.is_published if result else False,
            }
        )

    return render(
        request,
        "Instructor/Gradebook",
        {
            "program": {"id": program.id, "name": program.name},
            "gradingConfig": grading_config,
            "students": students_data,
        },
    )


@login_required
def instructor_gradebook_save(request, pk: int):
    """
    Save grades for a program.
    Requirements: FR-4.4
    """
    if request.method != "POST":
        return redirect("progression:instructor.gradebook", pk=pk)

    user = request.user

    # Verify instructor has access
    assignment = get_object_or_404(InstructorAssignment, instructor=user, program_id=pk)
    program = assignment.program

    # Parse grades from request
    from apps.core.views import _get_post_data

    data = _get_post_data(request)
    grades = data.get("grades", {})

    # Get or create root node for program-level grades
    root_node = CurriculumNode.objects.filter(
        program=program, parent__isnull=True
    ).first()

    if not root_node:
        # Create a virtual root node if none exists
        root_node = CurriculumNode.objects.create(
            program=program, title=program.name, node_type="Program", position=0
        )

    # Update grades for each enrollment
    for enrollment_id, grade_data in grades.items():
        try:
            enrollment = Enrollment.objects.get(pk=enrollment_id, program=program)

            # Calculate total based on grading config
            grading_config = (
                program.blueprint.grading_logic if program.blueprint else {}
            )
            components = grade_data.get("components", {})

            total = 0
            if grading_config.get("mode") == "summative":
                # Weighted sum
                for comp in grading_config.get("components", []):
                    key = comp.get("key")
                    weight = comp.get("weight", 0)
                    score = float(components.get(key, 0) or 0)
                    total += score * weight
            else:
                # Simple average or sum
                scores = [float(v) for v in components.values() if v]
                total = sum(scores) / len(scores) if scores else 0

            # Determine status
            pass_mark = grading_config.get("pass_mark", 40)
            status = "Pass" if total >= pass_mark else "Fail"

            # Update or create result
            result_data = {
                "components": components,
                "total": round(total, 2),
                "status": status,
            }

            AssessmentResult.objects.update_or_create(
                enrollment=enrollment,
                node=root_node,
                defaults={
                    "result_data": result_data,
                    "graded_by": user,
                },
            )
        except (Enrollment.DoesNotExist, ValueError):
            continue

    return redirect("progression:instructor.gradebook", pk=pk)


@login_required
def instructor_gradebook_publish(request, pk: int):
    """
    Publish grades for a program.
    Requirements: FR-4.5
    """
    if request.method != "POST":
        return redirect("progression:instructor.gradebook", pk=pk)

    user = request.user

    # Verify instructor has access
    assignment = get_object_or_404(InstructorAssignment, instructor=user, program_id=pk)
    program = assignment.program

    # Publish all unpublished results
    AssessmentResult.objects.filter(
        enrollment__program=program, is_published=False
    ).update(is_published=True, published_at=timezone.now())

    return redirect("progression:instructor.gradebook", pk=pk)


@login_required
def instructor_practicum_list(request):
    """
    List practicum submissions for review.
    Requirements: FR-5.1
    """
    user = request.user

    # Get instructor's programs
    program_ids = list(
        InstructorAssignment.objects.filter(instructor=user).values_list(
            "program_id", flat=True
        )
    )

    # Get filters
    status_filter = request.GET.get("status", "pending")
    program_filter = request.GET.get("program", "")
    page = int(request.GET.get("page", 1))
    per_page = 20

    # Query submissions
    submissions = PracticumSubmission.objects.filter(
        enrollment__program_id__in=program_ids
    ).select_related("enrollment__user", "enrollment__program", "node")

    if status_filter:
        submissions = submissions.filter(status=status_filter)

    if program_filter:
        submissions = submissions.filter(enrollment__program_id=program_filter)

    submissions = submissions.order_by("-submitted_at")

    # Pagination
    total_count = submissions.count()
    total_pages = (total_count + per_page - 1) // per_page
    offset = (page - 1) * per_page
    submissions = submissions[offset : offset + per_page]

    submissions_data = [
        {
            "id": s.id,
            "studentName": s.enrollment.user.get_full_name() or s.enrollment.user.email,
            "programName": s.enrollment.program.name,
            "programId": s.enrollment.program.id,
            "nodeTitle": s.node.title,
            "submittedAt": s.submitted_at.isoformat(),
            "type": s.file_type,
            "status": s.status,
        }
        for s in submissions
    ]

    # Get programs for filter
    programs = Program.objects.filter(id__in=program_ids).values("id", "name")

    return render(
        request,
        "Instructor/Practicum/Index",
        {
            "submissions": {
                "results": submissions_data,
                "pagination": {
                    "page": page,
                    "perPage": per_page,
                    "totalCount": total_count,
                    "totalPages": total_pages,
                    "hasNext": page < total_pages,
                    "hasPrev": page > 1,
                },
            },
            "filters": {
                "status": status_filter,
                "program": program_filter,
            },
            "programs": list(programs),
        },
    )


@login_required
def instructor_practicum_review(request, pk: int):
    """
    Review a practicum submission.
    Requirements: FR-5.4, FR-5.5, FR-5.6
    """
    user = request.user

    # Get submission
    submission = get_object_or_404(
        PracticumSubmission.objects.select_related(
            "enrollment__user", "enrollment__program", "node"
        ),
        pk=pk,
    )

    # Verify instructor has access to this program
    if not InstructorAssignment.objects.filter(
        instructor=user, program=submission.enrollment.program
    ).exists():
        return redirect("progression:instructor.practicum")

    # Handle POST - submit review
    if request.method == "POST":
        from apps.core.views import _get_post_data

        data = _get_post_data(request)

        status = data.get("status", "approved")
        comments = data.get("comments", "")
        dimension_scores = data.get("dimensionScores", {})

        # Calculate total score if rubric used
        total_score = None
        rubric_id = submission.node.properties.get("practicum", {}).get("rubric_id")
        if rubric_id and dimension_scores:
            try:
                rubric = Rubric.objects.get(pk=rubric_id)
                total_score = rubric.calculate_score(dimension_scores)
            except Rubric.DoesNotExist:
                pass

        # Create review
        SubmissionReview.objects.create(
            submission=submission,
            reviewer=user,
            status=status,
            dimension_scores=dimension_scores if dimension_scores else None,
            total_score=total_score,
            comments=comments,
            reviewed_at=timezone.now(),
        )

        # Update submission status
        submission.status = status
        submission.save()

        # If approved, mark node as complete
        if status == "approved":
            NodeCompletion.objects.get_or_create(
                enrollment=submission.enrollment,
                node=submission.node,
                defaults={
                    "completion_type": "upload",
                    "completed_at": timezone.now(),
                },
            )

        return redirect("progression:instructor.practicum")

    # Get rubric if configured
    rubric_data = None
    rubric_id = submission.node.properties.get("practicum", {}).get("rubric_id")
    if rubric_id:
        try:
            rubric = Rubric.objects.get(pk=rubric_id)
            rubric_data = {
                "id": rubric.id,
                "name": rubric.name,
                "description": rubric.description,
                "dimensions": rubric.dimensions,
                "maxScore": rubric.max_score,
            }
        except Rubric.DoesNotExist:
            pass

    # Get previous submissions for history
    previous_submissions = (
        PracticumSubmission.objects.filter(
            enrollment=submission.enrollment,
            node=submission.node,
            version__lt=submission.version,
        )
        .prefetch_related("reviews")
        .order_by("-version")
    )

    history = []
    for prev in previous_submissions:
        review = prev.reviews.order_by("-reviewed_at").first()
        history.append(
            {
                "id": prev.id,
                "version": prev.version,
                "status": prev.status,
                "submittedAt": prev.submitted_at.isoformat(),
                "review": (
                    {
                        "status": review.status,
                        "comments": review.comments,
                        "totalScore": (
                            float(review.total_score) if review.total_score else None
                        ),
                        "reviewedAt": review.reviewed_at.isoformat(),
                    }
                    if review
                    else None
                ),
            }
        )

    # Get existing review if any
    existing_review = submission.reviews.order_by("-reviewed_at").first()
    existing_review_data = None
    if existing_review:
        existing_review_data = {
            "status": existing_review.status,
            "comments": existing_review.comments,
            "dimensionScores": existing_review.dimension_scores,
            "totalScore": (
                float(existing_review.total_score)
                if existing_review.total_score
                else None
            ),
            "reviewedAt": existing_review.reviewed_at.isoformat(),
        }

    # Generate signed URL for media
    file_url = submission.get_signed_url()

    return render(
        request,
        "Instructor/Practicum/Review",
        {
            "submission": {
                "id": submission.id,
                "studentName": submission.enrollment.user.get_full_name()
                or submission.enrollment.user.email,
                "programName": submission.enrollment.program.name,
                "nodeTitle": submission.node.title,
                "submittedAt": submission.submitted_at.isoformat(),
                "type": submission.file_type,
                "fileUrl": file_url,
                "notes": (
                    submission.metadata.get("notes", "") if submission.metadata else ""
                ),
            },
            "rubric": rubric_data,
            "previousSubmissions": history,
            "existingReview": existing_review_data,
        },
    )


# =============================================================================
# Admin Enrollment Management Views
# =============================================================================


def _require_admin(user) -> bool:
    """Check if user is admin or superadmin."""
    return user.is_staff or user.is_superuser


def _get_post_data(request) -> dict:
    """Get POST data from request, handling both form-encoded and JSON."""
    import json

    if request.POST:
        return request.POST
    if request.body:
        try:
            return json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            pass
    return {}


@login_required
def admin_enrollments(request):
    """
    List all enrollments.
    Requirements: FR-6.1
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    # Get filter params
    program_id = request.GET.get("program", "")
    status = request.GET.get("status", "")
    search = request.GET.get("search", "")
    page = int(request.GET.get("page", 1))
    per_page = 20

    # Build query (single-tenant: all enrollments)
    enrollments_query = Enrollment.objects.all().select_related("user", "program")

    if program_id:
        enrollments_query = enrollments_query.filter(program_id=program_id)

    if status:
        enrollments_query = enrollments_query.filter(status=status)

    if search:
        enrollments_query = enrollments_query.filter(
            Q(user__email__icontains=search)
            | Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
        )

    # Count and paginate
    total = enrollments_query.count()
    enrollments_query = enrollments_query.order_by("-enrolled_at")
    enrollments = enrollments_query[(page - 1) * per_page : page * per_page]

    enrollments_data = []
    for e in enrollments:
        # Calculate progress
        total_nodes = _get_completable_nodes_count(e.program)
        completed_nodes = e.completions.count()
        progress = (completed_nodes / total_nodes * 100) if total_nodes > 0 else 0

        enrollments_data.append(
            {
                "id": e.id,
                "userId": e.user.id,
                "userName": e.user.get_full_name() or e.user.email,
                "userEmail": e.user.email,
                "programId": e.program.id,
                "programName": e.program.name,
                "status": e.status,
                "progressPercent": round(progress, 1),
                "enrolledAt": e.enrolled_at.isoformat(),
                "completedAt": e.completed_at.isoformat() if e.completed_at else None,
            }
        )

    # Get programs for filter dropdown
    programs = Program.objects.all().values("id", "name")

    return render(
        request,
        "Admin/Enrollments/Index",
        {
            "enrollments": enrollments_data,
            "programs": list(programs),
            "filters": {
                "program": program_id,
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
def admin_enrollment_create(request):
    """
    Create a new enrollment.
    Requirements: FR-6.2
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    if request.method == "POST":
        data = _get_post_data(request)
        errors = {}

        user_id = data.get("userId")
        program_id = data.get("programId")

        if not user_id:
            errors["userId"] = "User is required"
        if not program_id:
            errors["programId"] = "Program is required"

        # Check for existing enrollment
        if user_id and program_id:
            if Enrollment.objects.filter(
                user_id=user_id, program_id=program_id
            ).exists():
                errors["_form"] = "User is already enrolled in this program"

        if errors:
            return render(
                request,
                "Admin/Enrollments/Create",
                {
                    "programs": _get_programs_for_enrollment(),
                    "students": _get_students_for_enrollment(),
                    "errors": errors,
                    "formData": data,
                },
            )

        # Create enrollment
        enrollment = Enrollment.objects.create(
            user_id=user_id,
            program_id=program_id,
            status="active",
            enrolled_at=timezone.now(),
        )

        return redirect("progression:admin.enrollments")

    return render(
        request,
        "Admin/Enrollments/Create",
        {
            "programs": _get_programs_for_enrollment(),
            "students": _get_students_for_enrollment(),
        },
    )


@login_required
def admin_enrollment_bulk(request):
    """
    Bulk enroll students.
    Requirements: FR-6.3
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    if request.method == "POST":
        data = _get_post_data(request)
        program_id = data.get("programId")
        user_ids = data.get("userIds", [])

        if not program_id or not user_ids:
            return render(
                request,
                "Admin/Enrollments/Bulk",
                {
                    "programs": _get_programs_for_enrollment(),
                    "students": _get_students_for_enrollment(),
                    "errors": {"_form": "Program and at least one student required"},
                },
            )

        # Create enrollments
        created = 0
        skipped = 0
        for user_id in user_ids:
            if not Enrollment.objects.filter(
                user_id=user_id, program_id=program_id
            ).exists():
                Enrollment.objects.create(
                    user_id=user_id,
                    program_id=program_id,
                    status="active",
                    enrolled_at=timezone.now(),
                )
                created += 1
            else:
                skipped += 1

        return redirect("progression:admin.enrollments")

    return render(
        request,
        "Admin/Enrollments/Bulk",
        {
            "programs": _get_programs_for_enrollment(),
            "students": _get_students_for_enrollment(),
        },
    )


@login_required
def admin_enrollment_withdraw(request, pk: int):
    """
    Withdraw a student from a program.
    Requirements: FR-6.4
    """
    if not _require_admin(request.user):
        return redirect("/dashboard/")

    if request.method != "POST":
        return redirect("progression:admin.enrollments")

    enrollment = get_object_or_404(Enrollment, pk=pk)

    enrollment.status = "withdrawn"
    enrollment.save()

    return redirect("progression:admin.enrollments")


def _get_programs_for_enrollment() -> list:
    """Get published programs for enrollment dropdown."""
    programs = Program.objects.filter(is_published=True).order_by("name")
    return [{"id": p.id, "name": p.name} for p in programs]


def _get_students_for_enrollment() -> list:
    """Get students for enrollment dropdown."""
    students = (
        User.objects.filter(is_staff=False)
        .exclude(groups__name="Instructors")
        .order_by("first_name", "last_name")
    )
    return [
        {
            "id": u.id,
            "name": u.get_full_name() or u.email,
            "email": u.email,
        }
        for u in students
    ]
