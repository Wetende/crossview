"""
Student Portal views - Dashboard, Programs, Sessions, and Progress.
Requirements: 1.1-1.6, 2.1-2.5, 3.1-3.7, 4.1-4.7
"""

from typing import Optional
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from inertia import render

from apps.core.models import Program, User
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, NodeCompletion, InstructorAssignment
from apps.content.models import ContentBlock
from apps.assessments.models import AssessmentResult
from apps.assessments.models import Rubric
from apps.assessments.grading_rules import (
    component_aliases,
    component_config_key,
    evaluate_result,
    normalize_component_key,
    normalize_grading_type,
    normalize_weight,
)
from apps.assessments.official_results import (
    assignment_attempt_passed,
    can_start_quiz_attempt,
    get_official_assignment_attempt,
    get_official_quiz_attempt,
)
from apps.practicum.models import PracticumSubmission, SubmissionReview
from apps.certifications.models import Certificate, CertificateEligibility
from apps.progression.services import ProgressionEngine
from apps.core.utils import serialize_user, should_render_inertia_prop
from apps.notifications.services import NotificationService


def _get_instructor_accessible_program(user, program_id: int) -> Optional[Program]:
    """Return program when user is staff or assigned instructor; otherwise None."""
    if user.is_staff:
        return Program.objects.filter(pk=program_id).first()

    assignment = (
        InstructorAssignment.objects.filter(
            instructor=user,
            program_id=program_id,
        )
        .select_related("program")
        .first()
    )
    return assignment.program if assignment else None


def _get_primary_instructor_payload(program: Program) -> Optional[dict]:
    """Return a stable instructor payload for student messaging shortcuts."""
    assignment = (
        InstructorAssignment.objects.filter(program=program)
        .select_related("instructor")
        .order_by("-is_primary", "assigned_at", "id")
        .first()
    )
    instructor = assignment.instructor if assignment else program.instructors.first()
    if not instructor:
        return None
    return {
        "id": instructor.id,
        "name": instructor.get_full_name() or instructor.email,
        "email": instructor.email,
    }


def _normalize_assignment_mode(props: dict) -> str:
    if not isinstance(props, dict):
        return "submission_only"

    explicit_mode = str(props.get("assignment_mode") or "").strip().lower()
    if explicit_mode in {"submission_only", "question_only", "mixed"}:
        return explicit_mode

    questions = props.get("questions", [])
    return (
        "mixed"
        if isinstance(questions, list) and len(questions) > 0
        else "submission_only"
    )


def _safe_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _assignment_mode_requires_questions(mode: str) -> bool:
    return mode in {"question_only", "mixed"}


def _assignment_mode_requires_submission(mode: str) -> bool:
    return mode in {"submission_only", "mixed"}


def _normalize_typed_response_mode(raw_value) -> str:
    normalized = str(raw_value or "").strip().lower()
    if normalized == "short_answer_question":
        return "short_answer_question"
    return "submission_text"


def _assignment_requires_questions(props: dict) -> bool:
    mode = _normalize_assignment_mode(props)
    typed = _normalize_typed_response_mode((props or {}).get("typed_response_mode"))
    return mode in {"question_only", "mixed"} or (
        mode == "submission_only" and typed == "short_answer_question"
    )


def _assignment_requires_submission(props: dict) -> bool:
    mode = _normalize_assignment_mode(props)
    typed = _normalize_typed_response_mode((props or {}).get("typed_response_mode"))
    return mode == "mixed" or (mode == "submission_only" and typed == "submission_text")


def _record_inline_quiz_attempt(
    enrollment: Enrollment,
    node: CurriculumNode,
    answers,
) -> Optional[dict]:
    """
    Persist inline quiz answers into QuizAttempt so instructor review has a full trail.
    Returns a summary dict when recorded, else None.
    """
    from apps.assessments.models import Quiz, QuizAttempt

    props = node.properties if isinstance(node.properties, dict) else {}
    quiz_id = props.get("quiz_id")
    if not quiz_id or not isinstance(answers, dict):
        return None

    try:
        quiz = Quiz.objects.get(pk=quiz_id)
    except Quiz.DoesNotExist:
        return None

    in_progress = QuizAttempt.objects.filter(
        enrollment=enrollment,
        quiz=quiz,
        submitted_at__isnull=True,
    ).first()

    if in_progress:
        attempt = in_progress
    else:
        allowed, _, _ = can_start_quiz_attempt(quiz, enrollment)
        if not allowed:
            return None
        submitted_attempts = QuizAttempt.objects.filter(
            enrollment=enrollment,
            quiz=quiz,
            submitted_at__isnull=False,
        ).count()
        attempt = QuizAttempt.objects.create(
            enrollment=enrollment,
            quiz=quiz,
            attempt_number=submitted_attempts + 1,
            started_at=timezone.now(),
        )

    attempt.answers = answers
    attempt.submitted_at = timezone.now()
    points_earned, points_possible, percentage, passed = attempt.calculate_score()
    attempt.points_earned = points_earned
    attempt.points_possible = points_possible
    attempt.score = percentage
    attempt.passed = passed
    attempt.save()

    return {
        "id": attempt.id,
        "score": float(percentage),
        "passed": passed,
        "attempt_number": attempt.attempt_number,
    }


def _serialize_quiz_questions_for_course_player(quiz) -> list:
    questions_payload = []

    for question in quiz.questions.all().order_by("position"):
        answer_data = question.answer_data or {}
        question_payload = {
            "id": question.id,
            "question_type": question.question_type,
            "text": question.text,
            "points": question.points,
            "answer_data": answer_data,
        }

        if question.question_type in {"mcq", "mcq_multi"}:
            question_payload["options"] = [
                {
                    "id": option.id,
                    "text": option.text,
                    "is_correct": option.is_correct,
                    "position": option.position,
                }
                for option in question.options.all().order_by("position")
            ]

        if question.question_type == "matching":
            question_payload["pairs"] = [
                {
                    "left_text": pair.left_text,
                    "right_text": pair.right_text,
                    "explanation": pair.explanation,
                }
                for pair in question.matching_pairs.all().order_by("position")
            ]

        if question.question_type == "fill_blank":
            question_payload["gaps"] = [
                {
                    "gap_index": gap.gap_index,
                    "accepted_answers": gap.accepted_answers,
                    "explanation": gap.explanation,
                }
                for gap in question.gap_answers.all().order_by("gap_index")
            ]

        if question.question_type == "image_matching":
            question_payload["image_pairs"] = [
                {
                    "left_id": f"left_{pair.id}",
                    "right_id": f"right_{pair.id}",
                    "question_text": pair.question_text,
                    "question_image": pair.question_image,
                    "answer_text": pair.answer_text,
                    "answer_image": pair.answer_image,
                }
                for pair in question.image_matching_pairs.all().order_by("position")
            ]

        questions_payload.append(question_payload)

    return questions_payload


def _hydrate_assessment_node_properties(node: CurriculumNode) -> dict:
    props = node.properties.copy() if isinstance(node.properties, dict) else {}

    node_type = str(node.node_type or "").lower()
    lesson_type = str(props.get("lesson_type") or "").lower()
    is_assignment = node_type == "assignment" or lesson_type == "assignment"
    is_quiz = node_type == "quiz" or lesson_type == "quiz"
    includes_questions = is_quiz or (
        is_assignment and _assignment_requires_questions(props)
    )

    if not includes_questions:
        return props

    existing_questions = props.get("questions")
    if isinstance(existing_questions, list) and len(existing_questions) > 0:
        return props

    quiz_id = _safe_int(props.get("quiz_id"))
    if not quiz_id:
        return props

    from apps.assessments.models import Quiz

    try:
        quiz = Quiz.objects.prefetch_related(
            "questions__options",
            "questions__matching_pairs",
            "questions__gap_answers",
            "questions__image_matching_pairs",
        ).get(pk=quiz_id)
    except Quiz.DoesNotExist:
        return props

    props["questions"] = _serialize_quiz_questions_for_course_player(quiz)
    return props


def _build_quiz_results_for_node(node: CurriculumNode, enrollment) -> Optional[dict]:
    """
    Build quiz results payload for a node so the CoursePlayer can render
    results inline (score card, question review, retry button).
    Returns None if the node has no linked quiz or no submitted attempts.
    """
    from apps.assessments.models import Quiz, QuizAttempt
    from apps.core.views import _normalize_question_text, _coerce_bool

    props = node.properties if isinstance(node.properties, dict) else {}
    quiz_id = _safe_int(props.get("quiz_id"))
    if not quiz_id:
        return None

    try:
        quiz = Quiz.objects.get(pk=quiz_id)
    except Quiz.DoesNotExist:
        return None

    attempts = list(
        QuizAttempt.objects.filter(
            enrollment=enrollment, quiz=quiz, submitted_at__isnull=False
        ).order_by("-attempt_number")
    )

    if not attempts:
        return None

    show_correct_answer = bool(quiz.show_answers_after_submit)
    if "quiz_attempt_history" in props:
        show_attempt_history = _coerce_bool(
            props.get("quiz_attempt_history"), default=False
        )
    else:
        show_attempt_history = True

    # Build question review
    question_review = []
    official_attempt = get_official_quiz_attempt(enrollment, quiz)
    review_attempt = official_attempt or attempts[0]

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

            # Format student answer for display
            if student_answer is None:
                student_display = "Not answered"
            elif question.question_type in {"mcq", "true_false"}:
                token = str(student_answer).strip()
                student_display = token
                for opt in question.options.all():
                    if str(opt.id) == token or str(opt.position) == token:
                        student_display = opt.text
                        break
            elif question.question_type == "mcq_multi" and isinstance(
                student_answer, list
            ):
                labels = []
                for val in student_answer:
                    token = str(val).strip()
                    label = token
                    for opt in question.options.all():
                        if str(opt.id) == token or str(opt.position) == token:
                            label = opt.text
                            break
                    labels.append(label)
                student_display = ", ".join(labels) if labels else "Not answered"
            else:
                student_display = str(student_answer)

            # Format correct answer for display
            q_type = question.question_type
            if q_type == "mcq":
                opt = (
                    question.options.filter(is_correct=True)
                    .order_by("position")
                    .first()
                )
                correct_display = opt.text if opt else "N/A"
            elif q_type == "true_false":
                correct_val = (question.answer_data or {}).get("correct")
                if isinstance(correct_val, bool):
                    correct_display = "True" if correct_val else "False"
                elif isinstance(correct_val, str):
                    correct_display = (
                        "True"
                        if correct_val.strip().lower() in {"true", "1", "yes"}
                        else "False"
                    )
                else:
                    correct_display = "N/A"
            elif q_type == "mcq_multi":
                labels = list(
                    question.options.filter(is_correct=True)
                    .order_by("position")
                    .values_list("text", flat=True)
                )
                correct_display = ", ".join(labels) if labels else "N/A"
            elif q_type == "short_answer":
                keywords = (question.answer_data or {}).get("keywords", [])
                correct_display = (
                    ", ".join(str(k).strip() for k in keywords if str(k).strip())
                    if keywords
                    else "Manual review"
                )
            else:
                correct_display = "N/A"

            question_review.append(
                {
                    "questionId": question.id,
                    "questionType": question.question_type,
                    "questionText": _normalize_question_text(question.text),
                    "studentAnswer": student_display,
                    "correctAnswer": correct_display,
                    "isCorrect": is_correct,
                    "pointsEarned": float(points_earned) if points_earned is not None else 0,
                    "pointsPossible": question.points,
                }
            )

    can_retry, _, attempts_remaining = can_start_quiz_attempt(quiz, enrollment)

    return {
        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
            "passThreshold": quiz.pass_threshold,
            "maxAttempts": quiz.max_attempts,
            "nodeTitle": node.title,
            "showCorrectAnswer": show_correct_answer,
            "showAttemptHistory": show_attempt_history,
            "retryUrl": (
                f"/student/quiz/{quiz.id}/"
                f"?enrollment_id={enrollment.id}&node_id={node.id}"
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
                "submittedAt": (a.submitted_at.isoformat() if a.submitted_at else None),
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
    }


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
    ).select_related("program")

    enrollment_data = []
    for enrollment in enrollments:
        total_nodes = _get_completable_nodes_count(enrollment.program)
        completed_nodes = enrollment.completions.count()
        progress = (completed_nodes / total_nodes * 100) if total_nodes > 0 else 0
        effective_status = _reconcile_enrollment_status(enrollment, progress)

        enrollment_data.append(
            {
                "id": enrollment.id,
                "programId": enrollment.program.id,
                "programName": enrollment.program.name,
                "programCode": enrollment.program.code or "",
                "progressPercent": round(progress, 1),
                "status": effective_status,
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
    include_enrollments = should_render_inertia_prop(request, "enrollments")
    include_filters = should_render_inertia_prop(request, "filters")
    include_status_options = should_render_inertia_prop(request, "statusOptions")

    enrollments = Enrollment.objects.filter(user=user).select_related("program")

    enrollment_data = []
    if include_enrollments:
        enrollments = list(
            enrollments.only(
                "id",
                "program_id",
                "program__id",
                "program__name",
                "program__code",
                "program__description",
                "program__thumbnail",
                "program__category",
                "program__duration_hours",
                "program__badge_type",
                "status",
                "enrolled_at",
                "completed_at",
            )
        )
        program_ids = [enrollment.program_id for enrollment in enrollments]
        program_counts = _get_completable_node_counts(program_ids)

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

        completion_counts = _get_completion_counts(
            [enrollment.id for enrollment in enrollments]
        )
        primary_assignments = (
            InstructorAssignment.objects.filter(program_id__in=program_ids)
            .select_related("instructor")
            .order_by("program_id", "-is_primary", "assigned_at", "id")
        )
        instructor_by_program = {}
        for assignment in primary_assignments:
            if assignment.program_id not in instructor_by_program:
                instructor = assignment.instructor
                instructor_by_program[assignment.program_id] = {
                    "id": instructor.id,
                    "name": instructor.get_full_name() or instructor.email,
                    "email": instructor.email,
                }

        for enrollment in enrollments:
            total_nodes = program_counts.get(enrollment.program_id, 0)
            completed_nodes = completion_counts.get(enrollment.id, 0)
            progress = (completed_nodes / total_nodes * 100) if total_nodes > 0 else 0
            effective_status = _reconcile_enrollment_status(enrollment, progress)

            stats = stats_by_program_id.get(
                enrollment.program.id, {"lesson_count": 0, "duration_minutes": 0}
            )
            duration_hours = (
                round(stats["duration_minutes"] / 60.0, 1)
                if stats["duration_minutes"]
                else 0
            )
            lesson_count = stats["lesson_count"]

            enrollment_data.append(
                {
                    "id": enrollment.id,
                    "programId": enrollment.program.id,
                    "programName": enrollment.program.name,
                    "programCode": enrollment.program.code or "",
                    "description": enrollment.program.description or "",
                    "progressPercent": round(progress, 1),
                    "status": effective_status,
                    "enrolledAt": enrollment.enrolled_at.isoformat(),
                    "thumbnail": (
                        enrollment.program.thumbnail.url
                        if enrollment.program.thumbnail
                        else None
                    ),
                    "category": enrollment.program.category or "",
                    "durationHours": duration_hours,
                    "lectureCount": lesson_count,
                    "badgeType": enrollment.program.badge_type,
                    "instructor": instructor_by_program.get(enrollment.program_id),
                }
            )

    props = {}
    if include_enrollments:
        props["enrollments"] = enrollment_data
    if include_filters:
        props["filters"] = {"status": status_filter}
    if include_status_options:
        props["statusOptions"] = [
            {"value": "", "label": "All"},
            {"value": "active", "label": "Active"},
            {"value": "completed", "label": "Completed"},
            {"value": "withdrawn", "label": "Withdrawn"},
        ]
    return render(
        request,
        "Student/Programs/Index",
        props,
    )


@login_required
def program_view(request, pk: int):
    """
    View program - redirects to course player with first available lesson.
    Requirements: 3.1, 3.2, 3.3
    """
    enrollment = get_object_or_404(
        Enrollment.objects.select_related("program"),
        program_id=pk,
        user=request.user,
    )
    program = enrollment.program

    # Get all completions for this enrollment
    completions = list(enrollment.completions.values_list("node_id", flat=True))
    completions_set = set(completions)

    # Get unlock status map
    engine = ProgressionEngine()
    unlock_statuses = engine.get_unlock_status(enrollment)
    status_map = {s["node_id"]: s for s in unlock_statuses}

    # Find the first available lesson (incomplete and unlocked leaf node)
    def find_first_available_node(nodes):
        """Recursively find first incomplete, unlocked leaf node."""
        for node in nodes:
            children = node.children.filter(is_published=True).order_by("position")
            if children.exists():
                # It's a section, recurse into children
                result = find_first_available_node(children)
                if result:
                    return result
            else:
                # It's a leaf node (lesson/quiz/assignment)
                node_status = status_map.get(node.id, {})
                is_locked = node_status.get("status") == "locked"
                is_completed = node.id in completions_set

                # Return first unlocked node (preferring incomplete)
                if not is_locked and not is_completed:
                    return node
        return None

    def find_first_leaf_node(nodes):
        """Recursively find the first leaf node regardless of status."""
        for node in nodes:
            children = node.children.filter(is_published=True).order_by("position")
            if children.exists():
                result = find_first_leaf_node(children)
                if result:
                    return result
            else:
                return node
        return None

    # Get root nodes
    root_nodes = (
        CurriculumNode.objects.filter(
            program=program, parent__isnull=True, is_published=True
        )
        .prefetch_related("children")
        .order_by("position")
    )

    # Find target node: first incomplete unlocked, or first leaf if all complete
    target_node = find_first_available_node(root_nodes)
    if not target_node:
        target_node = find_first_leaf_node(root_nodes)

    # If we found a lesson, render the course player
    if target_node:
        # Reuse session_viewer logic to render course player
        return _render_course_player(
            request, enrollment, target_node, completions, status_map
        )

    # Fallback: If no lessons exist, show an empty state in course player
    curriculum_tree = _build_curriculum_tree(
        root_nodes, completions, enrollment, status_map
    )

    total_nodes = _get_completable_nodes_count(program)
    progress = (len(completions) / total_nodes * 100) if total_nodes > 0 else 0
    primary_instructor = _get_primary_instructor_payload(program)

    return render(
        request,
        "Student/CoursePlayer",
        {
            "node": None,
            "program": {
                "id": program.id,
                "name": program.name,
            },
            "instructor": primary_instructor,
            "enrollment": {
                "id": enrollment.id,
                "progressPercent": round(progress, 1),
            },
            "curriculum": curriculum_tree,
            "prevNode": None,
            "nextNode": None,
            "progress": round(progress, 1),
            "isCompleted": False,
            "isLocked": False,
            "lockReason": None,
            "status": "unlocked",
            "unlocksAt": None,
        },
    )


def _render_course_player(request, enrollment, node, completions, status_map):
    """
    Helper to render the course player with a specific node.
    Extracted to share logic between program_view and session_viewer.
    """
    program = enrollment.program

    # Check if completed
    is_completed = node.id in completions

    # Check unlock status
    unlock_status = _check_unlock_status(enrollment, node)

    # Hydrate properties for assessment nodes so quiz/assignment question paths render inline.
    node_properties = _hydrate_assessment_node_properties(node)

    # Get content from properties
    content_html = node_properties.get("content_html", "")

    # Get curriculum tree for Sidebar
    root_nodes = (
        CurriculumNode.objects.filter(
            program=program, parent__isnull=True, is_published=True
        )
        .prefetch_related("children")
        .order_by("position")
    )

    curriculum_tree = _build_curriculum_tree(
        root_nodes, completions, enrollment, status_map
    )

    # Get content blocks
    blocks = ContentBlock.objects.filter(node=node).order_by("position")
    blocks_data = [{"id": b.id, "type": b.block_type, "data": b.data} for b in blocks]

    # Get siblings for navigation
    siblings = _get_sibling_navigation(node, enrollment.id)

    # Calculate progress
    total_nodes = _get_completable_nodes_count(program)
    progress = (len(completions) / total_nodes * 100) if total_nodes > 0 else 0
    primary_instructor = _get_primary_instructor_payload(program)

    return render(
        request,
        "Student/CoursePlayer",
        {
            "node": {
                "id": node.id,
                "title": node.title,
                "type": node.node_type,
                "properties": node_properties,
                "contentHtml": content_html,
                "description": node.description or "",
                "blocks": blocks_data,
            },
            "program": {
                "id": program.id,
                "name": program.name,
            },
            "instructor": primary_instructor,
            "enrollment": {
                "id": enrollment.id,
                "progressPercent": round(progress, 1),
            },
            "curriculum": curriculum_tree,
            "prevNode": siblings.get("prev"),
            "nextNode": siblings.get("next"),
            "progress": round(progress, 1),
            "isCompleted": is_completed,
            "isLocked": not unlock_status["is_unlocked"],
            "status": "completed"
            if is_completed
            else ("unlocked" if unlock_status.get("is_unlocked") else "locked"),
            "lockReason": unlock_status.get("lock_reason"),
            "lockReasonText": unlock_status.get("reason"),
            "unlocksAt": unlock_status.get("unlocks_at"),
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
    engine = ProgressionEngine()

    # Check if node is unlocked before allowing access
    unlock_status = _check_unlock_status(enrollment, node)
    if not unlock_status.get("is_unlocked", True):
        # Node is locked - redirect to program view (shows first available lesson)
        return redirect("progression:student.program", pk=enrollment.program_id)

    # Handle mark as complete POST
    if request.method == "POST":
        data = _get_post_data(request)
        if data.get("mark_complete"):
            props = node.properties if isinstance(node.properties, dict) else {}
            node_type = str(node.node_type or "").lower()
            lesson_type = str(props.get("lesson_type") or "").lower()
            is_assignment = node_type == "assignment" or lesson_type == "assignment"
            is_quiz = node_type == "quiz" or lesson_type == "quiz"

            quiz_answers = data.get("quiz_answers")
            recorded_quiz_attempt = None
            if isinstance(quiz_answers, dict):
                recorded_quiz_attempt = _record_inline_quiz_attempt(
                    enrollment,
                    node,
                    quiz_answers,
                )

            should_mark_complete = True
            completion_type = "view"

            if is_assignment:
                from apps.assessments.models import Assignment, Quiz

                assignment_id = _safe_int(props.get("assignment_id"))
                quiz_id = _safe_int(props.get("quiz_id"))
                assignment = (
                    Assignment.objects.filter(pk=assignment_id).first()
                    if assignment_id
                    else None
                )
                quiz = Quiz.objects.filter(pk=quiz_id).first() if quiz_id else None
                typed_response_mode = _normalize_typed_response_mode(
                    props.get("typed_response_mode")
                )

                official_assignment = (
                    get_official_assignment_attempt(enrollment, assignment)
                    if assignment
                    else None
                )
                official_quiz = (
                    get_official_quiz_attempt(enrollment, quiz) if quiz else None
                )

                has_submission = assignment_attempt_passed(official_assignment)
                has_question_attempt = bool(
                    official_quiz
                    and (
                        official_quiz.passed is True
                        or (
                            typed_response_mode == "short_answer_question"
                            and official_quiz.submitted_at is not None
                        )
                    )
                )

                if _assignment_requires_submission(
                    props
                ) and _assignment_requires_questions(props):
                    should_mark_complete = has_submission and has_question_attempt
                    completion_type = "manual"
                elif _assignment_requires_submission(props):
                    should_mark_complete = has_submission
                    completion_type = "upload"
                else:
                    should_mark_complete = has_question_attempt
                    completion_type = "quiz_pass"
            elif is_quiz and isinstance(quiz_answers, dict):
                quiz_id = _safe_int(props.get("quiz_id"))
                if quiz_id:
                    from apps.assessments.models import Quiz

                    quiz = Quiz.objects.filter(pk=quiz_id).first()
                    official_quiz_attempt = (
                        get_official_quiz_attempt(enrollment, quiz) if quiz else None
                    )
                    should_mark_complete = bool(
                        official_quiz_attempt and official_quiz_attempt.passed is True
                    )
                else:
                    should_mark_complete = False
                completion_type = "quiz_pass"
            elif is_quiz:
                quiz_id = _safe_int(props.get("quiz_id"))
                if quiz_id:
                    from apps.assessments.models import Quiz

                    quiz = Quiz.objects.filter(pk=quiz_id).first()
                    official_quiz_attempt = (
                        get_official_quiz_attempt(enrollment, quiz) if quiz else None
                    )
                    should_mark_complete = bool(
                        official_quiz_attempt and official_quiz_attempt.passed is True
                    )
                else:
                    should_mark_complete = False
                completion_type = "quiz_pass"

            if is_quiz:
                quiz_id = _safe_int(props.get("quiz_id"))
                if quiz_id:
                    from apps.assessments.models import Quiz

                    quiz = Quiz.objects.filter(pk=quiz_id).first()
                    official_quiz_attempt = (
                        get_official_quiz_attempt(enrollment, quiz) if quiz else None
                    )
                    has_passed_quiz_attempt = bool(
                        official_quiz_attempt and official_quiz_attempt.passed is True
                    )
                else:
                    has_passed_quiz_attempt = False
                if not has_passed_quiz_attempt:
                    NodeCompletion.objects.filter(
                        enrollment=enrollment,
                        node=node,
                    ).delete()

            if should_mark_complete:
                engine.mark_complete(
                    enrollment=enrollment,
                    node=node,
                    completion_type=completion_type,
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

    # Hydrate properties for assessment nodes so quiz/assignment question paths render inline.
    node_properties = _hydrate_assessment_node_properties(node)

    # Get content from properties
    content_html = node_properties.get("content_html", "")

    # Get curriculum tree for Sidebar
    root_nodes = (
        CurriculumNode.objects.filter(
            program=enrollment.program, parent__isnull=True, is_published=True
        )
        .prefetch_related("children")
        .order_by("position")
    )
    completions = list(enrollment.completions.values_list("node_id", flat=True))
    # Get unlock status map for sidebar
    unlock_statuses = engine.get_unlock_status(enrollment)
    status_map = {s["node_id"]: s for s in unlock_statuses}

    curriculum_tree = _build_curriculum_tree(
        root_nodes, completions, enrollment, status_map
    )

    # Calculate progress
    total_nodes = _get_completable_nodes_count(enrollment.program)
    completed_count = len(completions)
    progress = (completed_count / total_nodes * 100) if total_nodes > 0 else 0

    # Get content blocks
    blocks = ContentBlock.objects.filter(node=node).order_by("position")
    blocks_data = [{"id": b.id, "type": b.block_type, "data": b.data} for b in blocks]

    # Get discussions for this node
    from apps.discussions.models import DiscussionThread

    discussions_qs = (
        DiscussionThread.objects.filter(node=node)
        .select_related("user")
        .prefetch_related("posts__user")
        .order_by("-is_pinned", "-created_at")
    )
    discussions_data = [
        {
            "id": thread.id,
            "title": thread.title,
            "content": thread.content,
            "isPinned": thread.is_pinned,
            "isLocked": thread.is_locked,
            "createdAt": thread.created_at.isoformat(),
            "user": {
                "id": thread.user.id,
                "name": thread.user.get_full_name() or thread.user.email,
            },
            "posts": [
                {
                    "id": post.id,
                    "content": post.content,
                    "createdAt": post.created_at.isoformat(),
                    "user": {
                        "id": post.user.id,
                        "name": post.user.get_full_name() or post.user.email,
                    },
                }
                for post in thread.posts.all()
            ],
        }
        for thread in discussions_qs
    ]

    # Get notes for this student/node
    from .models import StudentNote

    notes_qs = StudentNote.objects.filter(enrollment=enrollment, node=node).order_by(
        "-created_at"
    )
    notes_data = [
        {
            "id": note.id,
            "content": note.content,
            "videoTimestamp": note.video_timestamp,
            "createdAt": note.created_at.isoformat(),
        }
        for note in notes_qs
    ]

    # Inject quiz results data when redirected from quiz results page
    if request.GET.get("show_results") == "1":
        quiz_results = _build_quiz_results_for_node(node, enrollment)
        if quiz_results:
            node_properties["quizResults"] = quiz_results

    return render(
        request,
        "Student/CoursePlayer",
        {
            "node": {
                "id": node.id,
                "title": node.title,
                "type": node.node_type,
                "properties": node_properties,
                "contentHtml": content_html,
                "description": node.description or "",
                "blocks": blocks_data,
            },
            "program": {
                "id": enrollment.program.id,
                "name": enrollment.program.name,
            },
            "enrollment": {
                "id": enrollment.id,
                "progressPercent": round(progress, 1),
            },
            "curriculum": curriculum_tree,
            "prevNode": siblings.get("prev"),
            "nextNode": siblings.get("next"),
            "progress": round(progress, 1),
            "isCompleted": is_completed,
            "isLocked": not unlock_status["is_unlocked"],
            "status": "completed"
            if is_completed
            else ("unlocked" if unlock_status.get("is_unlocked") else "locked"),
            "lockReason": unlock_status.get("lock_reason"),
            "lockReasonText": unlock_status.get("reason"),
            "unlocksAt": unlock_status.get("unlocks_at"),
            "discussions": discussions_data,
            "notes": notes_data,
        },
    )


@login_required
def session_discussion_post(request, pk: int, node_id: int):
    """
    POST: Create a new discussion thread or reply for a node.
    If thread_id is provided, creates a reply post in that thread.
    Otherwise creates a new top-level thread.
    """
    if request.method != "POST":
        return redirect("progression:student.session", pk=pk, node_id=node_id)

    from apps.discussions.models import DiscussionPost, DiscussionThread
    from apps.notifications.services import NotificationService

    enrollment = (
        Enrollment.objects.select_related("program")
        .filter(pk=pk, user=request.user)
        .first()
    )
    if not enrollment:
        messages.error(
            request,
            "We could not find your enrollment for this lesson. Please reopen the course and try again.",
        )
        return redirect("progression:student.programs")

    node = CurriculumNode.objects.filter(
        id=node_id,
        program=enrollment.program,
        is_published=True,
    ).first()
    if not node:
        messages.error(
            request,
            "This lesson is no longer available for discussion.",
        )
        return redirect("progression:student.program", pk=enrollment.pk)

    content = request.POST.get("content", "").strip()
    if not content:
        messages.error(request, "Discussion content cannot be empty.")
        return redirect("progression:student.session", pk=pk, node_id=node_id)

    if len(content) > 5000:
        messages.error(request, "Discussion content is too long (max 5000 characters).")
        return redirect("progression:student.session", pk=pk, node_id=node_id)

    thread_id = request.POST.get("thread_id") or request.POST.get("thread")
    parent_id = request.POST.get("parent_id")
    title = request.POST.get("title", "").strip()

    if thread_id:
        thread = get_object_or_404(
            DiscussionThread.objects.select_related("node", "user"),
            id=thread_id,
            node=node,
        )

        if thread.is_locked:
            messages.error(request, "This discussion is locked.")
            return redirect("progression:student.session", pk=pk, node_id=node_id)

        parent = None
        if parent_id:
            parent = DiscussionPost.objects.filter(
                id=parent_id,
                thread=thread,
            ).first()

        post = DiscussionPost.objects.create(
            thread=thread,
            user=request.user,
            content=content,
            parent=parent,
        )
        NotificationService.notify_lesson_discussion_reply(post)
    else:
        # Create a new discussion thread
        if not title:
            base = " ".join(content.split())
            title = base[:72] + ("..." if len(base) > 72 else "")

        thread = DiscussionThread.objects.create(
            node=node,
            user=request.user,
            title=title,
            content=content,
        )
        NotificationService.notify_lesson_discussion_comment(
            thread=thread,
            actor=request.user,
        )

    return redirect("progression:student.session", pk=pk, node_id=node_id)


@login_required
def session_note_create(request, pk: int, node_id: int):
    """
    POST: Create a new student note for a node.
    """
    if request.method != "POST":
        return redirect("progression:student.session", pk=pk, node_id=node_id)

    from .models import StudentNote

    enrollment = (
        Enrollment.objects.select_related("program")
        .filter(pk=pk, user=request.user)
        .first()
    )
    if not enrollment:
        messages.error(
            request,
            "We could not find your enrollment for this lesson. Please reopen the course and try again.",
        )
        return redirect("progression:student.programs")

    node = CurriculumNode.objects.filter(
        id=node_id,
        program=enrollment.program,
        is_published=True,
    ).first()
    if not node:
        messages.error(
            request,
            "This lesson is no longer available for notes.",
        )
        return redirect("progression:student.program", pk=enrollment.pk)

    content = request.POST.get("content", "").strip()
    if not content:
        messages.error(request, "Note content cannot be empty.")
        return redirect("progression:student.session", pk=pk, node_id=node_id)

    if len(content) > 3000:
        messages.error(request, "Note content is too long (max 3000 characters).")
        return redirect("progression:student.session", pk=pk, node_id=node_id)

    # Get optional video timestamp
    timestamp = request.POST.get("video_timestamp")
    video_timestamp = int(timestamp) if timestamp and timestamp.isdigit() else None

    StudentNote.objects.create(
        enrollment=enrollment,
        node=node,
        content=content,
        video_timestamp=video_timestamp,
    )

    return redirect("progression:student.session", pk=pk, node_id=node_id)


@login_required
def session_note_delete(request, pk: int, node_id: int, note_id: int):
    """
    POST/DELETE: Delete a student note.
    """
    from .models import StudentNote

    enrollment = Enrollment.objects.filter(pk=pk, user=request.user).first()
    if not enrollment:
        messages.error(
            request,
            "We could not find your enrollment for this lesson. Please reopen the course and try again.",
        )
        return redirect("progression:student.programs")

    note = StudentNote.objects.filter(
        id=note_id,
        enrollment=enrollment,
        node_id=node_id,
    ).first()
    if not note:
        messages.error(request, "That note could not be found or was already removed.")
        return redirect("progression:student.session", pk=pk, node_id=node_id)

    note.delete()

    return redirect("progression:student.session", pk=pk, node_id=node_id)


# =============================================================================
# Helper Functions
# =============================================================================


def _get_completable_nodes_count(program: Program) -> int:
    """Count nodes that can be completed (leaf nodes or nodes with completion rules)."""
    return CurriculumNode.objects.filter(
        program=program,
        is_published=True,
        children__isnull=True,  # Leaf nodes
    ).count()


def _get_completable_node_counts(program_ids: list[int]) -> dict[int, int]:
    """Return leaf-node counts keyed by program ID."""
    if not program_ids:
        return {}
    return dict(
        CurriculumNode.objects.filter(
            program_id__in=program_ids,
            is_published=True,
            children__isnull=True,
        )
        .values("program_id")
        .annotate(count=Count("id"))
        .values_list("program_id", "count")
    )


def _get_lesson_counts(program_ids: list[int]) -> dict[int, int]:
    """Return leaf-node counts excluding quizzes and assignments."""
    if not program_ids:
        return {}
    return dict(
        CurriculumNode.objects.filter(
            program_id__in=program_ids,
            is_published=True,
            children__isnull=True,
        )
        .exclude(properties__has_key="quiz_id")
        .exclude(properties__has_key="assignment_id")
        .values("program_id")
        .annotate(count=Count("id"))
        .values_list("program_id", "count")
    )


def _get_completion_counts(enrollment_ids: list[int]) -> dict[int, int]:
    """Return completion counts keyed by enrollment ID."""
    if not enrollment_ids:
        return {}
    return dict(
        NodeCompletion.objects.filter(enrollment_id__in=enrollment_ids)
        .values("enrollment_id")
        .annotate(count=Count("id"))
        .values_list("enrollment_id", "count")
    )


def _reconcile_enrollment_status(enrollment: Enrollment, progress: float) -> str:
    """
    Keep active/completed enrollment status in sync with computed progress.

    This prevents stale states where status='completed' but progress is below 100%.
    """
    if enrollment.status not in {"active", "completed"}:
        return enrollment.status

    target_status = "completed" if progress >= 100 else "active"
    if enrollment.status != target_status:
        enrollment.status = target_status
        enrollment.completed_at = (
            timezone.now() if target_status == "completed" else None
        )
        enrollment.save(update_fields=["status", "completed_at", "updated_at"])

    return target_status


def _build_curriculum_tree(
    nodes,
    completions: list,
    enrollment: Enrollment,
    status_map: Optional[dict] = None,
    last_attempts_by_quiz_id: Optional[dict] = None,
) -> list:
    """Build curriculum tree with completion and unlock status."""
    result = []
    status_map = status_map or {}

    if last_attempts_by_quiz_id is None:
        # Build a single lookup map to avoid per-node queries.
        # Note: this may include quiz attempts for quiz nodes not in the passed
        # `nodes` subtree, but keeps runtime predictable and query count low.
        from apps.assessments.models import QuizAttempt

        quiz_ids = set()
        for node_type, props in CurriculumNode.objects.filter(
            program=enrollment.program,
            is_published=True,
        ).values_list("node_type", "properties"):
            if not isinstance(props, dict):
                continue
            normalized_node_type = str(node_type or "").lower()
            lesson_type = str(props.get("lesson_type") or "").lower()
            is_assignment = (
                normalized_node_type == "assignment" or lesson_type == "assignment"
            )
            is_quiz = normalized_node_type == "quiz" or lesson_type == "quiz"
            includes_questions = is_quiz or (
                is_assignment and _assignment_requires_questions(props)
            )
            if not includes_questions:
                continue
            quiz_id = _safe_int(props.get("quiz_id"))
            if quiz_id:
                quiz_ids.add(quiz_id)

        last_attempts_by_quiz_id = {}
        if quiz_ids:
            attempts = QuizAttempt.objects.filter(
                enrollment=enrollment,
                quiz_id__in=quiz_ids,
                submitted_at__isnull=False,
            ).values(
                "quiz_id",
                "attempt_number",
                "score",
                "passed",
                "submitted_at",
            )

            for attempt in attempts:
                quiz_id = attempt["quiz_id"]
                score = float(attempt["score"] or 0)
                summary = last_attempts_by_quiz_id.setdefault(quiz_id, {})
                current_last = summary.get("lastAttempt")
                current_best = summary.get("bestAttempt")

                normalized_attempt = {
                    "number": attempt["attempt_number"],
                    "score": score,
                    "passed": attempt["passed"],
                    "completedAt": (
                        attempt["submitted_at"].isoformat()
                        if attempt["submitted_at"]
                        else None
                    ),
                }

                if (
                    current_last is None
                    or normalized_attempt["number"] > current_last["number"]
                ):
                    summary["lastAttempt"] = normalized_attempt

                if (
                    current_best is None
                    or normalized_attempt["score"] > current_best["score"]
                    or (
                        normalized_attempt["score"] == current_best["score"]
                        and normalized_attempt["number"] > current_best["number"]
                    )
                ):
                    summary["bestAttempt"] = normalized_attempt

    for node in nodes:
        children_qs = node.children.filter(is_published=True).order_by("position")
        children = list(children_qs)
        has_children = len(children) > 0

        node_status = status_map.get(node.id, {})
        status_key = node_status.get("status", "locked")  # default locked if unknown
        is_locked = status_key == "locked"

        # Override isLocked if completed (safeguard)
        is_completed = node.id in completions
        if is_completed:
            is_locked = False

        node_data = {
            "id": node.id,
            "title": node.title,
            "nodeType": node.node_type,
            "code": node.code or "",
            "status": "completed" if is_completed else status_key,
            "isCompleted": is_completed,
            "isLocked": is_locked,
            "lockReason": node_status.get("lock_reason"),
            "unlocksAt": node_status.get("unlocks_at"),
            "hasChildren": has_children,
            "children": (
                _build_curriculum_tree(
                    children,
                    completions,
                    enrollment,
                    status_map,
                    last_attempts_by_quiz_id,
                )
                if has_children
                else []
            ),
            "url": f"/student/programs/{enrollment.id}/session/{node.id}/",
            "properties": node.properties or {},
        }

        # Add lastAttempt for question-enabled assessment nodes
        node_props = node.properties if isinstance(node.properties, dict) else {}
        node_type_normalized = str(node.node_type or "").lower()
        lesson_type = str(node_props.get("lesson_type") or "").lower()
        is_assignment = (
            node_type_normalized == "assignment" or lesson_type == "assignment"
        )
        is_quiz = node_type_normalized == "quiz" or lesson_type == "quiz"
        includes_questions = is_quiz or (
            is_assignment and _assignment_requires_questions(node_props)
        )
        if includes_questions:
            quiz_id = _safe_int(node_props.get("quiz_id"))
            if quiz_id and quiz_id in last_attempts_by_quiz_id:
                attempt_summary = last_attempts_by_quiz_id[quiz_id]
                if attempt_summary.get("lastAttempt"):
                    node_data["lastAttempt"] = attempt_summary["lastAttempt"]
                if attempt_summary.get("bestAttempt"):
                    node_data["bestAttempt"] = attempt_summary["bestAttempt"]

        result.append(node_data)

    return result


def _check_unlock_status(enrollment: Enrollment, node: CurriculumNode) -> dict:
    """Compatibility wrapper backed by ProgressionEngine access decisions."""
    engine = ProgressionEngine()
    result = engine.can_access(enrollment, node)

    lock_reason_map = {
        "sequential": "Complete earlier content first",
        "prerequisite": "Complete prerequisites first",
        "scheduled": "Scheduled content is not yet available",
        "drip": "This content unlocks later",
        "expired": "Enrollment access has expired",
        "enrollment_required": "Enrollment is required to access this content",
    }

    return {
        "is_unlocked": result.can_access,
        "reason": lock_reason_map.get(result.lock_reason),
        "lock_reason": result.lock_reason,
        "unlocks_at": result.unlocks_at.isoformat() if result.unlocks_at else None,
    }


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


def _quiz_node_has_passed_attempt(node: CurriculumNode, enrollment_id: int) -> bool:
    """Return True when the enrollment has a passed submitted attempt for this quiz node."""
    props = node.properties if isinstance(node.properties, dict) else {}
    node_type = str(node.node_type or "").lower()
    lesson_type = str(props.get("lesson_type") or "").lower()
    is_quiz = node_type == "quiz" or lesson_type == "quiz"
    if not is_quiz:
        return True

    quiz_id = _safe_int(props.get("quiz_id"))
    if not quiz_id:
        return False

    from apps.assessments.models import QuizAttempt

    return QuizAttempt.objects.filter(
        enrollment_id=enrollment_id,
        quiz_id=quiz_id,
        submitted_at__isnull=False,
        passed=True,
    ).exists()


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
                if _quiz_node_has_passed_attempt(node, enrollment_id):
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
def student_assignments(request):
    from apps.core.views import _get_student_dashboard_data

    dashboard_data = _get_student_dashboard_data(request.user)
    return render(
        request,
        "Dashboard/Assignments",
        {"assignments": dashboard_data.get("assignments", [])},
    )


@login_required
def student_quizzes(request):
    from apps.core.views import _get_student_dashboard_data

    dashboard_data = _get_student_dashboard_data(request.user)
    return render(
        request,
        "Dashboard/Quizzes",
        {"quizzes": dashboard_data.get("quizzes", [])},
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
    try:
        page = max(int(request.GET.get("page", 1)), 1)
    except (TypeError, ValueError):
        page = 1
    per_page = 20
    include_submissions = should_render_inertia_prop(request, "submissions")
    include_pagination = should_render_inertia_prop(request, "pagination")
    include_filters = should_render_inertia_prop(request, "filters")
    include_program_options = should_render_inertia_prop(request, "programOptions")
    include_status_options = should_render_inertia_prop(request, "statusOptions")

    user_enrollments = Enrollment.objects.filter(user=user).select_related("program")
    enrollment_ids = list(user_enrollments.values_list("id", flat=True))

    submissions = (
        PracticumSubmission.objects.filter(
            enrollment_id__in=enrollment_ids,
        )
        .select_related("enrollment__program", "node")
        .prefetch_related(
            Prefetch(
                "reviews",
                queryset=SubmissionReview.objects.order_by("-reviewed_at"),
                to_attr="ordered_reviews",
            )
        )
    )

    if program_filter:
        submissions = submissions.filter(enrollment__program_id=program_filter)

    if status_filter:
        submissions = submissions.filter(status=status_filter)

    submissions = submissions.order_by("-submitted_at")

    total_count = submissions.count()
    total_pages = (total_count + per_page - 1) // per_page
    offset = (page - 1) * per_page
    submissions = submissions[offset : offset + per_page]

    submissions_data = []
    if include_submissions:
        for submission in submissions:
            latest_review = (
                submission.ordered_reviews[0] if submission.ordered_reviews else None
            )
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

    props = {}
    if include_submissions:
        props["submissions"] = submissions_data
    if include_pagination:
        props["pagination"] = {
            "page": page,
            "perPage": per_page,
            "totalCount": total_count,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrev": page > 1,
        }
    if include_filters:
        props["filters"] = {
            "program": program_filter,
            "status": status_filter,
        }
    if include_program_options:
        program_options = [{"value": "", "label": "All Programs"}]
        for enrollment in user_enrollments:
            program_options.append(
                {
                    "value": str(enrollment.program.id),
                    "label": enrollment.program.name,
                }
            )
        props["programOptions"] = program_options
    if include_status_options:
        props["statusOptions"] = [
            {"value": "", "label": "All Statuses"},
            {"value": "pending", "label": "Pending"},
            {"value": "approved", "label": "Approved"},
            {"value": "revision_required", "label": "Revision Required"},
            {"value": "rejected", "label": "Rejected"},
        ]
    return render(
        request,
        "Student/Practicum/Index",
        props,
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

    certificates = (
        Certificate.objects.filter(
            enrollment_id__in=enrollment_ids,
        )
        .select_related("enrollment__program")
        .order_by("-issue_date")
    )

    eligibility_records = {
        record.enrollment_id: record
        for record in CertificateEligibility.objects.filter(
            enrollment_id__in=enrollment_ids,
        ).select_related("enrollment__program", "enrollment__user", "certificate")
    }

    certificates_data = []
    for cert in certificates:
        queue_status = "released"
        queue_record = eligibility_records.get(cert.enrollment_id)
        if queue_record is not None:
            queue_status = queue_record.status

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
                "downloadUrl": cert.get_signed_download_url(),
                "queueStatus": queue_status,
                "isPendingRelease": queue_status == "pending",
            }
        )

    issued_enrollment_ids = {
        cert.enrollment_id for cert in certificates if cert.enrollment_id is not None
    }

    for enrollment_id in enrollment_ids:
        if enrollment_id in issued_enrollment_ids:
            continue

        record = eligibility_records.get(enrollment_id)
        if not record:
            continue

        program_title = record.enrollment.program.name
        student_name = (
            record.enrollment.user.get_full_name() or record.enrollment.user.email
        )

        certificates_data.append(
            {
                "id": f"queue-{record.id}",
                "serialNumber": None,
                "programTitle": program_title,
                "studentName": student_name,
                "completionDate": (
                    record.enrollment.completed_at.isoformat()
                    if record.enrollment.completed_at
                    else None
                ),
                "issueDate": None,
                "isRevoked": False,
                "revocationReason": None,
                "verificationUrl": None,
                "downloadUrl": None,
                "queueStatus": record.status,
                "isPendingRelease": record.status == "pending",
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
        post_data = _get_post_data(request)
        action = post_data.get("action", "update_profile")

        if action == "update_profile":
            # Update name and phone only
            first_name = str(post_data.get("first_name", "")).strip()
            last_name = str(post_data.get("last_name", "")).strip()
            phone = str(post_data.get("phone", "")).strip()

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
                        "user": serialize_user(user),
                        "success": "Profile updated successfully",
                    },
                )

        elif action == "change_password":
            current_password = post_data.get("current_password", "")
            new_password = post_data.get("new_password", "")
            confirm_password = post_data.get("confirm_password", "")

            # Verify current password
            if not user.check_password(current_password):
                errors["current_password"] = "Current password is incorrect"
            elif len(new_password) < 8:
                errors["new_password"] = "Password must be at least 8 characters"
            elif new_password == current_password:
                errors["new_password"] = (
                    "New password cannot be the same as the current password"
                )
            elif new_password != confirm_password:
                errors["confirm_password"] = "Passwords do not match"

            if not errors:
                user.set_password(new_password)
                user.save()

                # Keep the user logged in after password change (Industry Standard)
                from django.contrib.auth import update_session_auth_hash

                update_session_auth_hash(request, user)

                return render(
                    request,
                    "Student/Profile",
                    {
                        "user": serialize_user(user),
                        "success": "Password changed successfully",
                    },
                )

    return render(
        request,
        "Student/Profile",
        {
            "user": serialize_user(user),
            "errors": errors,
        },
    )


# _serialize_tenant removed - no longer needed in single-tenant mode


# =============================================================================
# Instructor Dashboard Views
# =============================================================================


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
    programs = list(_get_instructor_programs(user))
    program_ids = [p.id for p in programs]

    # Calculate lesson stats (excluding assessments) from CurriculumNode
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
            stats_by_program_id[program_id]["duration_minutes"] += max(0, minutes_int)

    def _minutes_to_hours(total_minutes: int) -> float:
        if not total_minutes:
            return 0
        return round(total_minutes / 60.0, 1)

    programs_data = []
    for program in programs:
        # Get enrollment stats
        enrollments = Enrollment.objects.filter(program=program)
        total = enrollments.count()
        active = enrollments.filter(status="active").count()
        completed = enrollments.filter(status="completed").count()
        completion_rate = (completed / total * 100) if total > 0 else 0

        # Get thumbnail URL
        thumbnail_url = program.thumbnail.url if program.thumbnail else None

        # Get price from custom_pricing
        price_data = program.custom_pricing or {}

        # Get calculated stats
        stats = stats_by_program_id[program.id]
        duration_hours = _minutes_to_hours(stats["duration_minutes"])

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
                # New display fields for ProgramManageCard
                "thumbnail": thumbnail_url,
                "category": program.category or "",
                "isPublished": program.is_published,
                "lectureCount": stats["lesson_count"],
                "durationHours": duration_hours,
                "price": price_data.get("price", 0),
                "originalPrice": price_data.get("original_price"),
                "rating": 4.5,  # TODO: Calculate from reviews
                "reviewCount": 0,  # TODO: Count reviews
                "viewCount": total,  # Using enrollment count as views
                "badgeType": program.badge_type,
                "updatedAt": program.updated_at.isoformat()
                if program.updated_at
                else None,
            }
        )

    # Get status filter
    status_filter = request.GET.get("status", "")

    return render(
        request,
        "Instructor/Programs/Index",
        {
            "programs": programs_data,
            "filters": {"status": status_filter},
        },
    )


@login_required
def instructor_program_detail(request, pk: int):
    """
    View program detail with curriculum and stats.
    Requirements: FR-2.3
    """
    user = request.user

    # Verify instructor/staff has access to this program
    program = _get_instructor_accessible_program(user, pk)
    if not program:
        messages.error(request, "You do not have access to this program.")
        return redirect("progression:instructor.programs")

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

    # Verify instructor/staff has access
    program = _get_instructor_accessible_program(user, pk)
    if not program:
        messages.error(request, "You do not have access to this program.")
        return redirect("progression:instructor.programs")

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

    # Verify instructor/staff has access
    program = _get_instructor_accessible_program(user, pk)
    if not program:
        messages.error(request, "You do not have access to this program.")
        return redirect("progression:instructor.programs")

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

    # Using the standard curriculum tree builder for detailed view
    # This might need a specialized builder if instructor needs to see more details
    # For now, reusing the student-facing one but could be adapted
    status_map = {}  # Instructors see everything as accessible
    curriculum_tree = _build_curriculum_tree(
        root_nodes, completions, enrollment, status_map
    )

    # Get activity log
    activity_log = (
        NodeCompletion.objects.filter(enrollment=enrollment)
        .select_related("node")
        .order_by("-completed_at")
    )

    activity_data = [
        {
            "id": log.id,
            "nodeTitle": log.node.title,
            "type": log.completion_type,
            "completedAt": log.completed_at.isoformat(),
        }
        for log in activity_log
    ]

    return render(
        request,
        "Instructor/Students/Detail",
        {
            "program": {"id": program.id, "name": program.name},
            "student": {
                "id": enrollment.user.id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "email": enrollment.user.email,
                "status": enrollment.status,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
            },
            "curriculum": curriculum_tree,
            "activity": activity_data,
        },
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


def _get_or_create_program_root_node(program: Program) -> CurriculumNode:
    root_node = CurriculumNode.objects.filter(
        program=program,
        parent__isnull=True,
    ).first()
    if root_node:
        return root_node

    hierarchy = []
    if program.blueprint and isinstance(program.blueprint.hierarchy_structure, list):
        hierarchy = [
            str(label).strip()
            for label in program.blueprint.hierarchy_structure
            if str(label).strip()
        ]

    root_node_type = hierarchy[0] if hierarchy else "Section"

    return CurriculumNode.objects.create(
        program=program,
        title=program.name,
        node_type=root_node_type,
        position=0,
    )


def _resolve_gradebook_columns(program: Program) -> tuple[list[dict], list[dict]]:
    from apps.assessments.models import Assignment, Quiz

    quiz_ids: list[int] = []
    assignment_ids: list[int] = []

    assessment_nodes = CurriculumNode.objects.filter(
        program=program,
        is_published=True,
    ).only("id", "title", "node_type", "properties")

    for node in assessment_nodes:
        props = node.properties if isinstance(node.properties, dict) else {}
        node_type = str(node.node_type or "").lower()
        lesson_type = str(props.get("lesson_type") or "").lower()
        is_assignment = node_type == "assignment" or lesson_type == "assignment"
        is_quiz = node_type == "quiz" or lesson_type == "quiz"

        quiz_id = _safe_int(props.get("quiz_id"))
        assignment_id = _safe_int(props.get("assignment_id"))

        if (
            is_quiz or (is_assignment and _assignment_requires_questions(props))
        ) and quiz_id:
            if quiz_id not in quiz_ids:
                quiz_ids.append(quiz_id)

        if is_assignment and _assignment_requires_submission(props) and assignment_id:
            if assignment_id not in assignment_ids:
                assignment_ids.append(assignment_id)

    quizzes_by_id = {
        quiz.id: quiz
        for quiz in Quiz.objects.filter(id__in=quiz_ids).only(
            "id",
            "title",
            "pass_threshold",
            "max_attempts",
            "allow_retake_after_pass",
        )
    }
    assignments_by_id = {
        assignment.id: assignment
        for assignment in Assignment.objects.filter(id__in=assignment_ids).only(
            "id",
            "title",
            "weight",
            "pass_threshold",
        )
    }

    quizzes = []
    for quiz_id in quiz_ids:
        quiz = quizzes_by_id.get(quiz_id)
        if not quiz:
            continue
        quizzes.append(
            {
                "id": quiz.id,
                "title": quiz.title,
                "passThreshold": quiz.pass_threshold,
                "maxAttempts": quiz.max_attempts,
                "allowRetakeAfterPass": bool(quiz.allow_retake_after_pass),
            }
        )

    assignments = []
    for assignment_id in assignment_ids:
        assignment = assignments_by_id.get(assignment_id)
        if not assignment:
            continue
        assignments.append(
            {
                "id": assignment.id,
                "title": assignment.title,
                "weight": assignment.weight,
                "passThreshold": assignment.pass_threshold,
            }
        )

    return quizzes, assignments


def _build_gradebook_attempt_maps(
    enrollment_ids: list[int],
    quiz_ids: list[int],
    assignment_ids: list[int],
):
    from apps.assessments.models import AssignmentSubmission, QuizAttempt

    official_quiz_map: dict[tuple[int, int], QuizAttempt] = {}
    if enrollment_ids and quiz_ids:
        quiz_attempts = QuizAttempt.objects.filter(
            enrollment_id__in=enrollment_ids,
            quiz_id__in=quiz_ids,
            submitted_at__isnull=False,
        ).order_by("enrollment_id", "quiz_id", "-score", "-attempt_number")
        for attempt in quiz_attempts:
            key = (attempt.enrollment_id, attempt.quiz_id)
            official_quiz_map.setdefault(key, attempt)

    official_assignment_map: dict[tuple[int, int], AssignmentSubmission] = {}
    latest_assignment_map: dict[tuple[int, int], AssignmentSubmission] = {}
    if enrollment_ids and assignment_ids:
        official_assignment_attempts = AssignmentSubmission.objects.filter(
            enrollment_id__in=enrollment_ids,
            assignment_id__in=assignment_ids,
            status__in=["graded", "returned"],
            score__isnull=False,
        ).order_by("enrollment_id", "assignment_id", "-score", "-attempt_number")
        for attempt in official_assignment_attempts:
            key = (attempt.enrollment_id, attempt.assignment_id)
            official_assignment_map.setdefault(key, attempt)

        latest_assignment_attempts = AssignmentSubmission.objects.filter(
            enrollment_id__in=enrollment_ids,
            assignment_id__in=assignment_ids,
        ).order_by("enrollment_id", "assignment_id", "-attempt_number")
        for attempt in latest_assignment_attempts:
            key = (attempt.enrollment_id, attempt.assignment_id)
            latest_assignment_map.setdefault(key, attempt)

    return official_quiz_map, official_assignment_map, latest_assignment_map


def _gradebook_letter_grade(total: float | None, grading_config: dict) -> Optional[str]:
    if total is None:
        return None

    grading_type = normalize_grading_type(grading_config)
    if grading_type not in {"weighted", "percentage", "pass_fail"}:
        return None

    custom_scale = grading_config.get("letter_scale") or grading_config.get(
        "letter_grades"
    )
    if isinstance(custom_scale, list):
        for item in custom_scale:
            if not isinstance(item, dict):
                continue
            label = str(item.get("letter") or item.get("grade") or "").strip()
            min_score = item.get("min")
            if min_score in (None, ""):
                continue
            try:
                threshold = float(str(min_score))
            except (TypeError, ValueError):
                continue
            if label and total >= threshold:
                return label

    if total >= 80:
        return "A"
    if total >= 70:
        return "B"
    if total >= 60:
        return "C"
    if total >= 50:
        return "D"
    return "F"


def _coerce_gradebook_entry_pass(entry: dict, grading_type: str) -> Optional[bool]:
    passed = entry.get("passed")
    if passed is not None:
        return bool(passed)

    score = entry.get("score")
    threshold = entry.get("passThreshold")
    if score is None or threshold is None:
        return None

    try:
        numeric_score = float(score)
        numeric_threshold = float(threshold)
    except (TypeError, ValueError):
        return None

    if grading_type in {"competency", "checklist"}:
        return numeric_score >= 100.0
    return numeric_score >= numeric_threshold


def _gradebook_entry_label(passed: Optional[bool], grading_type: str) -> Optional[str]:
    if passed is None:
        return None
    if grading_type == "competency":
        return "Competent" if passed else "Not Yet Competent"
    return "Pass" if passed else "Fail"


def _build_gradebook_entries(
    quizzes: list[dict],
    assignments: list[dict],
    quiz_scores: list[dict],
    assignment_scores: list[dict],
    grading_type: str,
) -> list[dict]:
    quiz_meta = {quiz["id"]: quiz for quiz in quizzes}
    assignment_meta = {assignment["id"]: assignment for assignment in assignments}
    entries: list[dict] = []

    for score_item in quiz_scores:
        score = score_item.get("score")
        if score is None:
            continue
        quiz = quiz_meta.get(score_item.get("quizId"), {})
        title = str(quiz.get("title") or f"Quiz {score_item.get('quizId')}").strip()
        normalized_title = normalize_component_key(title)
        tokens = {token for token in normalized_title.split("_") if token}
        entry = {
            "kind": "quiz",
            "title": title,
            "normalizedTitle": normalized_title,
            "tokens": tokens,
            "score": float(score),
            "passThreshold": quiz.get("passThreshold"),
            "passed": score_item.get("passed"),
        }
        entry["passed"] = _coerce_gradebook_entry_pass(entry, grading_type)
        entries.append(entry)

    for score_item in assignment_scores:
        score = score_item.get("score")
        if score is None:
            continue
        assignment = assignment_meta.get(score_item.get("assignmentId"), {})
        title = str(
            assignment.get("title") or f"Assignment {score_item.get('assignmentId')}"
        ).strip()
        normalized_title = normalize_component_key(title)
        tokens = {token for token in normalized_title.split("_") if token}
        entry = {
            "kind": "assignment",
            "title": title,
            "normalizedTitle": normalized_title,
            "tokens": tokens,
            "score": float(score),
            "passThreshold": assignment.get("passThreshold"),
            "weight": float(assignment.get("weight") or 0),
            "passed": score_item.get("passed"),
        }
        entry["passed"] = _coerce_gradebook_entry_pass(entry, grading_type)
        entries.append(entry)

    return entries


def _match_gradebook_entries(entries: list[dict], aliases: set[str]) -> list[dict]:
    matched: list[dict] = []
    for entry in entries:
        normalized_title = entry.get("normalizedTitle") or ""
        tokens = entry.get("tokens") or set()
        if normalized_title in aliases or tokens.intersection(aliases):
            matched.append(entry)
            continue
        if any(alias and f"_{alias}_" in f"_{normalized_title}_" for alias in aliases):
            matched.append(entry)
    return matched


def _average_gradebook_scores(entries: list[dict]) -> Optional[float]:
    numeric_scores = [
        float(entry["score"]) for entry in entries if entry.get("score") is not None
    ]
    if not numeric_scores:
        return None
    return round(sum(numeric_scores) / len(numeric_scores), 2)


def _build_gradebook_component_scores(
    grading_config: dict,
    entries: list[dict],
    generic_values: dict[str, Optional[float]],
    grading_type: str,
) -> dict:
    configured_components = grading_config.get("components")
    component_scores: dict = {}

    if isinstance(configured_components, list):
        for component in configured_components:
            if not isinstance(component, dict):
                continue
            component_key = component_config_key(component) or "Component"
            aliases = component_aliases(component)
            matched = _match_gradebook_entries(entries, aliases)

            value = None
            if grading_type in {"competency", "checklist"}:
                flags = [
                    entry["passed"]
                    for entry in matched
                    if entry.get("passed") is not None
                ]
                if flags:
                    value = _gradebook_entry_label(
                        all(flags) if grading_type == "competency" else all(flags),
                        grading_type,
                    )
            else:
                value = _average_gradebook_scores(matched)

            if value is None:
                for alias in aliases:
                    if alias in generic_values and generic_values[alias] is not None:
                        value = generic_values[alias]
                        break

            if value is not None:
                component_scores[component_key] = value

    if component_scores:
        return component_scores

    if grading_type in {"competency", "checklist"}:
        for entry in entries:
            label = _gradebook_entry_label(entry.get("passed"), grading_type)
            if label is not None:
                component_scores[entry["title"]] = label
        return component_scores

    for entry in entries:
        if entry.get("score") is not None:
            component_scores[entry["title"]] = round(float(entry["score"]), 2)

    if component_scores:
        return component_scores

    if generic_values.get("overall") is not None:
        component_scores["overall"] = generic_values["overall"]
    return component_scores


def _calculate_competency_like_total(
    component_scores: dict,
    entries: list[dict],
) -> Optional[float]:
    flags = [entry["passed"] for entry in entries if entry.get("passed") is not None]

    if not flags:
        for value in component_scores.values():
            normalized = normalize_component_key(value)
            if normalized in {"competent", "pass", "passed"}:
                flags.append(True)
            elif normalized in {"not_yet_competent", "fail", "failed"}:
                flags.append(False)

    if not flags:
        return None

    return round((sum(1 for flag in flags if flag) / len(flags)) * 100, 2)


def _calculate_gradebook_totals(
    grading_config: dict,
    quizzes: list[dict],
    assignments: list[dict],
    quiz_scores: list[dict],
    assignment_scores: list[dict],
) -> dict:
    grading_type = normalize_grading_type(grading_config)

    quiz_values = [
        float(item["score"]) for item in quiz_scores if item.get("score") is not None
    ]
    assignment_values = [
        (float(item["score"]), float(item.get("weight") or 0))
        for item in assignment_scores
        if item.get("score") is not None
    ]

    quiz_average = (sum(quiz_values) / len(quiz_values)) if quiz_values else None

    weighted_assignment_total = 0.0
    weighted_assignment_weight = 0.0
    plain_assignment_values = []
    for score, weight in assignment_values:
        plain_assignment_values.append(score)
        if weight > 0:
            weighted_assignment_total += score * weight
            weighted_assignment_weight += weight

    if weighted_assignment_weight > 0:
        assignment_average = weighted_assignment_total / weighted_assignment_weight
    elif plain_assignment_values:
        assignment_average = sum(plain_assignment_values) / len(plain_assignment_values)
    else:
        assignment_average = None

    combined_values = quiz_values + plain_assignment_values
    aggregate_average = (
        sum(combined_values) / len(combined_values) if combined_values else None
    )

    component_values = {
        "quizzes": quiz_average,
        "quiz": quiz_average,
        "quiz_average": quiz_average,
        "assignments": assignment_average,
        "assignment": assignment_average,
        "assignment_average": assignment_average,
        "overall": aggregate_average,
        "overall_average": aggregate_average,
    }

    entries = _build_gradebook_entries(
        quizzes,
        assignments,
        quiz_scores,
        assignment_scores,
        grading_type,
    )
    component_scores = _build_gradebook_component_scores(
        grading_config,
        entries,
        component_values,
        grading_type,
    )

    total = aggregate_average
    if grading_type == "weighted":
        weighted_total = 0.0
        seen_component = False
        for component in grading_config.get("components", []):
            if not isinstance(component, dict):
                continue
            component_key = component_config_key(component)
            component_score = component_scores.get(component_key)
            if component_score is None:
                aliases = component_aliases(component)
                for alias in aliases:
                    if component_values.get(alias) is not None:
                        component_score = component_values[alias]
                        break
            if component_score is None:
                continue
            try:
                numeric_score = float(component_score)
            except (TypeError, ValueError):
                continue
            weighted_total += numeric_score * normalize_weight(
                component.get("weight", 0)
            )
            seen_component = True
        if seen_component:
            total = weighted_total
    elif grading_type in {"competency", "checklist"}:
        total = _calculate_competency_like_total(component_scores, entries)

    if total is not None:
        total = round(float(total), 2)

    evaluation = evaluate_result(
        {
            "components": component_scores,
            "total": total,
        },
        grading_config,
    )
    status = evaluation.get("status")

    return {
        "components": component_scores,
        "total": total,
        "status": status,
        "letter_grade": _gradebook_letter_grade(total, grading_config),
    }


def _build_program_gradebook_payload(
    program: Program, enrollments, grading_config: dict
):
    from apps.certifications.models import CertificateEligibility

    quizzes, assignments = _resolve_gradebook_columns(program)

    enrollment_ids = [enrollment.id for enrollment in enrollments]
    quiz_ids = [quiz["id"] for quiz in quizzes]
    assignment_ids = [assignment["id"] for assignment in assignments]

    official_quiz_map, official_assignment_map, latest_assignment_map = (
        _build_gradebook_attempt_maps(enrollment_ids, quiz_ids, assignment_ids)
    )

    root_node = _get_or_create_program_root_node(program)
    existing_results = {
        result.enrollment_id: result
        for result in AssessmentResult.objects.filter(
            enrollment_id__in=enrollment_ids,
            node=root_node,
        )
    }
    eligibility_by_enrollment = {
        record.enrollment_id: record
        for record in CertificateEligibility.objects.filter(
            enrollment_id__in=enrollment_ids,
        ).only("enrollment_id", "status", "eligible_at", "released_at")
    }

    students_data = []
    calculated_results = {}

    for enrollment in enrollments:
        quiz_scores = []
        for quiz in quizzes:
            official_attempt = official_quiz_map.get((enrollment.id, quiz["id"]))
            quiz_scores.append(
                {
                    "quizId": quiz["id"],
                    "score": (
                        float(official_attempt.score)
                        if official_attempt and official_attempt.score is not None
                        else None
                    ),
                    "passed": (
                        bool(official_attempt.passed)
                        if official_attempt is not None
                        else None
                    ),
                    "attemptNumber": (
                        official_attempt.attempt_number
                        if official_attempt is not None
                        else None
                    ),
                }
            )

        assignment_scores = []
        for assignment in assignments:
            official_attempt = official_assignment_map.get(
                (enrollment.id, assignment["id"])
            )
            latest_attempt = latest_assignment_map.get(
                (enrollment.id, assignment["id"])
            )

            if official_attempt is not None:
                assignment_scores.append(
                    {
                        "assignmentId": assignment["id"],
                        "weight": assignment["weight"],
                        "score": official_attempt.get_final_score(),
                        "passed": official_attempt.passed,
                        "status": official_attempt.status,
                        "isLate": bool(official_attempt.is_late),
                        "attemptNumber": official_attempt.attempt_number,
                        "isOfficial": True,
                    }
                )
            elif latest_attempt is not None:
                assignment_scores.append(
                    {
                        "assignmentId": assignment["id"],
                        "weight": assignment["weight"],
                        "score": None,
                        "passed": None,
                        "status": latest_attempt.status,
                        "isLate": bool(latest_attempt.is_late),
                        "attemptNumber": latest_attempt.attempt_number,
                        "isOfficial": False,
                    }
                )
            else:
                assignment_scores.append(
                    {
                        "assignmentId": assignment["id"],
                        "weight": assignment["weight"],
                        "score": None,
                        "passed": None,
                        "status": "not_submitted",
                        "isLate": False,
                        "attemptNumber": None,
                        "isOfficial": False,
                    }
                )

        calculated = _calculate_gradebook_totals(
            grading_config,
            quizzes,
            assignments,
            quiz_scores,
            assignment_scores,
        )
        calculated_results[enrollment.id] = calculated

        existing_result = existing_results.get(enrollment.id)
        eligibility = eligibility_by_enrollment.get(enrollment.id)

        students_data.append(
            {
                "enrollmentId": enrollment.id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "email": enrollment.user.email,
                "quizScores": quiz_scores,
                "assignmentScores": assignment_scores,
                "overallScore": calculated.get("total"),
                "status": calculated.get("status"),
                "letterGrade": calculated.get("letter_grade"),
                "grades": calculated,
                "isPublished": existing_result.is_published
                if existing_result
                else False,
                "certificateQueueStatus": (
                    eligibility.status if eligibility is not None else "ineligible"
                ),
                "certificateEligibleAt": (
                    eligibility.eligible_at.isoformat()
                    if eligibility is not None and eligibility.eligible_at
                    else None
                ),
            }
        )

    return {
        "rootNode": root_node,
        "quizzes": quizzes,
        "assignments": assignments,
        "students": students_data,
        "calculatedResults": calculated_results,
    }


@login_required
def instructor_gradebook(request, pk: int):
    """
    View gradebook for a program.
    Requirements: FR-4.1
    """
    user = request.user

    # Verify instructor/staff has access
    program = _get_instructor_accessible_program(user, pk)
    if not program:
        messages.error(request, "You do not have access to this gradebook.")
        return redirect("progression:instructor.programs")

    # Get grading config from blueprint
    grading_config: dict = {}
    if program.blueprint:
        grading_config = program.blueprint.grading_logic or {}

    # Get all active enrollments with derived grades
    enrollments = (
        Enrollment.objects.filter(program=program, status__in=["active", "completed"])
        .select_related("user")
        .order_by("user__last_name", "user__first_name")
    )

    payload = _build_program_gradebook_payload(
        program, list(enrollments), grading_config
    )

    return render(
        request,
        "Instructor/Gradebook",
        {
            "program": {"id": program.id, "name": program.name},
            "gradingConfig": grading_config,
            "quizzes": payload["quizzes"],
            "assignments": payload["assignments"],
            "students": payload["students"],
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

    # Verify instructor/staff has access
    program = _get_instructor_accessible_program(user, pk)
    if not program:
        messages.error(request, "You do not have access to this gradebook.")
        return redirect("progression:instructor.programs")

    data = _get_post_data(request)
    requested_ids = {
        _safe_int(enrollment_id) for enrollment_id in (data.get("grades") or {}).keys()
    }
    requested_ids.discard(None)

    grading_config = program.blueprint.grading_logic if program.blueprint else {}
    enrollments = list(
        Enrollment.objects.filter(program=program, status__in=["active", "completed"])
        .select_related("user")
        .order_by("user__last_name", "user__first_name")
    )
    if requested_ids:
        enrollments = [e for e in enrollments if e.id in requested_ids]

    payload = _build_program_gradebook_payload(program, enrollments, grading_config)
    root_node = payload["rootNode"]
    from apps.certifications.services import CertificateEligibilityService

    eligibility_service = CertificateEligibilityService()

    for enrollment in enrollments:
        result_data = payload["calculatedResults"].get(enrollment.id)
        if not result_data:
            continue

        AssessmentResult.objects.update_or_create(
            enrollment=enrollment,
            node=root_node,
            defaults={
                "result_data": result_data,
                "graded_by": user,
            },
        )
        eligibility_service.refresh_enrollment(enrollment)

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

    # Verify instructor/staff has access
    program = _get_instructor_accessible_program(user, pk)
    if not program:
        messages.error(request, "You do not have access to this gradebook.")
        return redirect("progression:instructor.programs")

    grading_config = program.blueprint.grading_logic if program.blueprint else {}
    enrollments = list(
        Enrollment.objects.filter(program=program, status__in=["active", "completed"])
        .select_related("user")
        .order_by("user__last_name", "user__first_name")
    )
    payload = _build_program_gradebook_payload(program, enrollments, grading_config)
    root_node = payload["rootNode"]
    from apps.certifications.services import CertificateEligibilityService

    eligibility_service = CertificateEligibilityService()

    for enrollment in enrollments:
        result_data = payload["calculatedResults"].get(enrollment.id)
        if not result_data:
            continue
        AssessmentResult.objects.update_or_create(
            enrollment=enrollment,
            node=root_node,
            defaults={
                "result_data": result_data,
                "graded_by": user,
            },
        )
        eligibility_service.refresh_enrollment(enrollment)

    # Collect enrollments whose grades are about to be published
    enrollment_ids = list(
        AssessmentResult.objects.filter(
            enrollment__program=program,
            node=root_node,
            is_published=False,
        )
        .values_list("enrollment_id", flat=True)
        .distinct()
    )

    # Publish all unpublished results
    AssessmentResult.objects.filter(
        enrollment__program=program,
        node=root_node,
        is_published=False,
    ).update(is_published=True, published_at=timezone.now())

    if enrollment_ids:
        enrollments = Enrollment.objects.filter(id__in=enrollment_ids).select_related(
            "user", "program"
        )
        for enrollment in enrollments:
            NotificationService.notify_grade_published(enrollment)

    return redirect("progression:instructor.gradebook", pk=pk)


@login_required
def instructor_gradebook_student(request, pk: int, enrollment_id: int):
    """
    View individual student's progress with detailed quiz answers.
    Used by instructors to review quiz attempts and see per-question results.
    """
    user = request.user

    # Verify instructor/staff has access
    program = _get_instructor_accessible_program(user, pk)
    if not program:
        messages.error(request, "You do not have access to this gradebook.")
        return redirect("progression:instructor.programs")

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
    status_map = {}  # Instructors see everything as accessible
    curriculum_tree = _build_curriculum_tree(
        root_nodes, completions, enrollment, status_map
    )

    # Get all assessment attempts/submissions for this student in this program
    from apps.assessments.models import AssignmentSubmission, QuizAttempt

    quiz_attempts_data = {}
    assignment_submissions_data = {}

    question_nodes = []
    assignment_submission_nodes = {}
    assessment_nodes = CurriculumNode.objects.filter(
        program=program,
        is_published=True,
    ).only("id", "node_type", "properties")

    for assessment_node in assessment_nodes:
        props = (
            assessment_node.properties
            if isinstance(assessment_node.properties, dict)
            else {}
        )
        node_type = str(assessment_node.node_type or "").lower()
        lesson_type = str(props.get("lesson_type") or "").lower()
        is_assignment = node_type == "assignment" or lesson_type == "assignment"
        is_quiz = node_type == "quiz" or lesson_type == "quiz"
        quiz_id = _safe_int(props.get("quiz_id"))
        assignment_id = _safe_int(props.get("assignment_id"))

        if is_quiz or (is_assignment and _assignment_requires_questions(props)):
            if quiz_id:
                question_nodes.append((assessment_node.id, quiz_id))

        if is_assignment and _assignment_requires_submission(props) and assignment_id:
            assignment_submission_nodes[assessment_node.id] = assignment_id

    for node_id, quiz_id in question_nodes:
        if not quiz_id:
            continue

        attempts = (
            QuizAttempt.objects.filter(enrollment=enrollment, quiz_id=quiz_id)
            .select_related("quiz")
            .prefetch_related(
                "quiz__questions",
                "quiz__questions__options",
                "quiz__questions__matching_pairs",
                "quiz__questions__gap_answers",
                "quiz__questions__image_matching_pairs",
            )
            .order_by("-attempt_number")
        )

        attempts_list = []
        for attempt in attempts:
            # Build per-question results
            question_results = []
            questions_data = []

            def _serialize_correct_answer(question):
                q_type = question.question_type
                answer_data = question.answer_data or {}

                if q_type == "mcq":
                    option = (
                        question.options.filter(is_correct=True)
                        .order_by("position")
                        .first()
                    )
                    return option.position if option else answer_data.get("correct")

                if q_type == "mcq_multi":
                    correct_positions = list(
                        question.options.filter(is_correct=True)
                        .order_by("position")
                        .values_list("position", flat=True)
                    )
                    return correct_positions or answer_data.get("correct_indices", [])

                if q_type == "true_false":
                    return answer_data.get("correct")

                if q_type == "short_answer":
                    return answer_data.get("keywords", [])

                if q_type == "matching":
                    return {
                        pair.left_text: pair.right_text
                        for pair in question.matching_pairs.all().order_by("position")
                    }

                if q_type == "ordering":
                    return answer_data.get("items") or answer_data.get(
                        "correct_order", []
                    )

                if q_type == "fill_blank":
                    return [
                        " / ".join(gap.accepted_answers)
                        for gap in question.gap_answers.all().order_by("gap_index")
                    ]

                if q_type == "image_matching":
                    # Left item token -> right item token for correct mapping.
                    return {
                        question.get_image_matching_item_id(
                            pair.id, attempt.id, "left"
                        ): question.get_image_matching_item_id(
                            pair.id, attempt.id, "right"
                        )
                        for pair in question.image_matching_pairs.all().order_by(
                            "position"
                        )
                    }

                return None

            for question in attempt.quiz.questions.all().order_by("position"):
                student_answer = attempt.answers.get(str(question.id))
                is_correct, points = (
                    question.check_answer(student_answer, attempt_id=attempt.id)
                    if student_answer is not None
                    else (False, 0)
                )
                correct_answer = _serialize_correct_answer(question)

                question_results.append(
                    {
                        "questionId": question.id,
                        "isCorrect": is_correct if is_correct is not None else False,
                        "correctAnswer": correct_answer,
                        "pointsEarned": float(points) if points is not None else 0,
                    }
                )

                questions_data.append(
                    {
                        "id": question.id,
                        "text": question.text,
                        "type": question.question_type,
                        "options": list(
                            question.options.all()
                            .order_by("position")
                            .values_list("text", flat=True)
                        ),
                        "points": question.points,
                        "explanation": (question.answer_data or {}).get(
                            "explanation", ""
                        ),
                        "orderingExplanations": (question.answer_data or {}).get(
                            "explanations", {}
                        ),
                        "matchingExplanations": {
                            pair.left_text: pair.explanation
                            for pair in question.matching_pairs.all().order_by(
                                "position"
                            )
                            if pair.explanation
                        },
                        "fillBlankExplanations": {
                            str(gap.gap_index): gap.explanation
                            for gap in question.gap_answers.all().order_by("gap_index")
                            if gap.explanation
                        },
                        "correctAnswer": correct_answer,
                    }
                )

            attempts_list.append(
                {
                    "id": attempt.id,
                    "attemptNumber": attempt.attempt_number,
                    "score": float(attempt.score) if attempt.score else 0,
                    "passed": attempt.passed,
                    "completedAt": attempt.submitted_at.isoformat()
                    if attempt.submitted_at
                    else None,
                    "answers": attempt.answers,
                    "questionResults": question_results,
                }
            )

            if attempts_list:
                quiz_attempts_data[node_id] = attempts_list
            # Also include questions data with first attempt for display
            if attempts_list:
                quiz_attempts_data[f"{node_id}_questions"] = questions_data

    assignment_ids = list(set(assignment_submission_nodes.values()))
    if assignment_ids:
        submissions_by_assignment_id: dict[int, AssignmentSubmission] = {}
        submission_qs = AssignmentSubmission.objects.filter(
            enrollment=enrollment,
            assignment_id__in=assignment_ids,
        ).order_by("assignment_id", "-is_official", "-score", "-attempt_number")
        for submission in submission_qs:
            submissions_by_assignment_id.setdefault(
                submission.assignment_id, submission
            )

        for node_id, assignment_id in assignment_submission_nodes.items():
            submission = submissions_by_assignment_id.get(assignment_id)
            if submission is None:
                assignment_submissions_data[node_id] = {
                    "assignmentId": assignment_id,
                    "submitted": False,
                }
                continue

            assignment_submissions_data[node_id] = {
                "assignmentId": assignment_id,
                "submitted": True,
                "status": submission.status,
                "attemptNumber": submission.attempt_number,
                "isOfficial": bool(submission.is_official),
                "submittedAt": (
                    submission.submitted_at.isoformat()
                    if submission.submitted_at
                    else None
                ),
                "isLate": bool(submission.is_late),
                "fileName": submission.file_name,
                "hasText": bool((submission.text_content or "").strip()),
                "score": float(submission.score)
                if submission.score is not None
                else None,
                "passed": submission.passed,
                "feedback": submission.feedback or "",
            }

    # Flatten questions into the attempts dict with node ID as key
    # Add questions to each node in curriculum for display
    def attach_questions_to_curriculum(nodes):
        for node in nodes:
            node_id = node.get("id")
            questions_key = f"{node_id}_questions"
            if questions_key in quiz_attempts_data:
                node["questions"] = quiz_attempts_data.pop(questions_key)
            if node.get("children"):
                attach_questions_to_curriculum(node["children"])

    attach_questions_to_curriculum(curriculum_tree)

    # Calculate progress stats
    total_nodes = _get_completable_nodes_count(program)
    completed_count = len(completions)
    progress = (completed_count / total_nodes * 100) if total_nodes > 0 else 0

    # Get quiz/assignment stats
    quiz_count = (
        CurriculumNode.objects.filter(
            program=program,
            is_published=True,
        )
        .filter(Q(node_type="quiz") | Q(properties__lesson_type="quiz"))
        .count()
    )
    assignment_count = (
        CurriculumNode.objects.filter(
            program=program,
            is_published=True,
        )
        .filter(Q(node_type="assignment") | Q(properties__lesson_type="assignment"))
        .count()
    )

    quizzes_passed = (
        QuizAttempt.objects.filter(enrollment=enrollment, passed=True)
        .values("quiz_id")
        .distinct()
        .count()
    )
    assignments_submitted = sum(
        1 for data in assignment_submissions_data.values() if data.get("submitted")
    )
    assignments_passed = sum(
        1 for data in assignment_submissions_data.values() if data.get("passed") is True
    )

    return render(
        request,
        "Gradebook/StudentProgress",
        {
            "program": {"id": program.id, "name": program.name},
            "student": {
                "id": enrollment.user.id,
                "enrollmentId": enrollment.id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "email": enrollment.user.email,
                "status": enrollment.status,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
                "overallProgress": round(progress, 1),
                "completedCount": completed_count,
                "totalNodes": total_nodes,
                "quizzesPassed": quizzes_passed,
                "quizzesTotal": quiz_count,
                "assignmentsPassed": assignments_passed,
                "assignmentsTotal": assignment_count,
            },
            "curriculum": curriculum_tree,
            "quizAttempts": quiz_attempts_data,
            "assignmentSubmissions": assignment_submissions_data,
        },
    )


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
        review = SubmissionReview.objects.create(
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
            ProgressionEngine().mark_complete(
                enrollment=submission.enrollment,
                node=submission.node,
                completion_type="upload",
                metadata={
                    "source": "instructor_practicum_review",
                    "review_id": review.id,
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

    program_id = request.GET.get("program", "")
    status = request.GET.get("status", "")
    search = request.GET.get("search", "")
    try:
        page = max(int(request.GET.get("page", 1)), 1)
    except (TypeError, ValueError):
        page = 1
    per_page = 20
    include_enrollments = should_render_inertia_prop(request, "enrollments")
    include_programs = should_render_inertia_prop(request, "programs")
    include_filters = should_render_inertia_prop(request, "filters")
    include_pagination = should_render_inertia_prop(request, "pagination")

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

    total = enrollments_query.count()
    enrollments_data = []
    if include_enrollments:
        enrollments = list(
            enrollments_query.only(
                "id",
                "user_id",
                "user__id",
                "user__email",
                "user__first_name",
                "user__last_name",
                "program_id",
                "program__id",
                "program__name",
                "status",
                "enrolled_at",
                "completed_at",
            ).order_by("-enrolled_at")[(page - 1) * per_page : page * per_page]
        )
        program_counts = _get_completable_node_counts(
            [enrollment.program_id for enrollment in enrollments]
        )
        completion_counts = _get_completion_counts(
            [enrollment.id for enrollment in enrollments]
        )

        for enrollment in enrollments:
            total_nodes = program_counts.get(enrollment.program_id, 0)
            completed_nodes = completion_counts.get(enrollment.id, 0)
            progress = (completed_nodes / total_nodes * 100) if total_nodes > 0 else 0

            enrollments_data.append(
                {
                    "id": enrollment.id,
                    "userId": enrollment.user.id,
                    "userName": enrollment.user.get_full_name()
                    or enrollment.user.email,
                    "userEmail": enrollment.user.email,
                    "programId": enrollment.program.id,
                    "programName": enrollment.program.name,
                    "status": enrollment.status,
                    "progressPercent": round(progress, 1),
                    "enrolledAt": enrollment.enrolled_at.isoformat(),
                    "completedAt": (
                        enrollment.completed_at.isoformat()
                        if enrollment.completed_at
                        else None
                    ),
                }
            )

    props = {}
    if include_enrollments:
        props["enrollments"] = enrollments_data
    if include_programs:
        props["programs"] = cache.get_or_set(
            "admin_enrollments:programs",
            lambda: list(Program.objects.order_by("name").values("id", "name")),
            900,
        )
    if include_filters:
        props["filters"] = {
            "program": program_id,
            "status": status,
            "search": search,
        }
    if include_pagination:
        props["pagination"] = {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        }
    return render(
        request,
        "Admin/Enrollments/Index",
        props,
    )


def _reconcile_enrollment_request(user_id, program_id, reviewed_by):
    """
    If a pending EnrollmentRequest exists for this user/program,
    mark it as approved so it disappears from instructor/admin pending-request views.
    Only touches pending requests — rejected/history states are left unchanged.
    """
    from apps.progression.models import EnrollmentRequest

    try:
        pending_request = EnrollmentRequest.objects.get(
            user_id=user_id,
            program_id=program_id,
            status="pending",
        )
        pending_request.status = "approved"
        pending_request.reviewed_by = reviewed_by
        pending_request.reviewed_at = timezone.now()
        pending_request.save(update_fields=["status", "reviewed_by", "reviewed_at"])
    except EnrollmentRequest.DoesNotExist:
        pass


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
        NotificationService.notify_enrollment_confirmed(enrollment)

        # Reconcile any pending enrollment request
        _reconcile_enrollment_request(user_id, program_id, reviewed_by=request.user)

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
                enrollment = Enrollment.objects.create(
                    user_id=user_id,
                    program_id=program_id,
                    status="active",
                    enrolled_at=timezone.now(),
                )
                NotificationService.notify_enrollment_confirmed(enrollment)
                # Reconcile any pending enrollment request
                _reconcile_enrollment_request(
                    user_id, program_id, reviewed_by=request.user
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
    NotificationService.notify_enrollment_status_changed(enrollment, "withdrawn")

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


# =============================================================================
# Self-Enrollment Views
# =============================================================================


@login_required
def student_enroll_request(request, pk: int):
    """
    Handle student self-enrollment request.
    Behavior depends on enrollment_mode feature flag:
    - 'open': Direct enrollment
    - 'instructor_approval': Create pending request
    - 'admin_approval': Create pending request
    """
    from apps.platform.models import PlatformSettings
    from apps.progression.models import EnrollmentRequest
    from django.contrib import messages

    user = request.user
    program = get_object_or_404(Program, pk=pk, is_published=True)

    # Check if already enrolled
    if Enrollment.objects.filter(user=user, program=program).exists():
        messages.info(request, "You are already enrolled in this program.")
        return redirect("progression:student.program", pk=pk)

    # Check if pending request exists
    if EnrollmentRequest.objects.filter(
        user=user, program=program, status="pending"
    ).exists():
        messages.info(request, "Your enrollment request is pending approval.")
        return redirect("core:programs")

    # Get enrollment mode from platform settings
    settings = PlatformSettings.get_settings()
    enrollment_mode = settings.features.get(
        "enrollment_mode",
        settings.get_default_features_for_mode().get(
            "enrollment_mode", "instructor_approval"
        ),
    )

    if request.method == "POST":
        import json

        data = {}
        if request.body:
            try:
                data = json.loads(request.body)
            except (json.JSONDecodeError, ValueError):
                data = request.POST.dict()

        message = data.get("message", "")

        if enrollment_mode == "open":
            # Direct enrollment
            enrollment = Enrollment.objects.create(
                user=user,
                program=program,
                status="active",
                enrolled_at=timezone.now(),
            )
            NotificationService.notify_enrollment_confirmed(enrollment)
            messages.success(request, f"Successfully enrolled in {program.name}!")
            return redirect("progression:student.program", pk=pk)
        else:
            # Create pending request
            enrollment_request = EnrollmentRequest.objects.create(
                user=user,
                program=program,
                status="pending",
                message=message,
            )

            # Notify reviewers of the new request
            if enrollment_mode == "instructor_approval":
                reviewers = User.objects.filter(
                    id__in=InstructorAssignment.objects.filter(
                        program=program
                    ).values_list("instructor_id", flat=True)
                )
                review_action_url = (
                    f"/instructor/programs/{program.id}/enrollment-requests/"
                )
            else:
                # admin_approval mode
                reviewers = User.objects.filter(is_staff=True, is_active=True)
                review_action_url = "/admin/enrollments/"

            if reviewers.exists():
                NotificationService.notify_enrollment_requested(
                    enrollment_request,
                    reviewers,
                    action_url=review_action_url,
                )
            messages.success(
                request,
                f"Your enrollment request for {program.name} has been submitted for approval.",
            )
            return redirect("core:programs")

    # GET - show enrollment form (for approval modes)
    return render(
        request,
        "Public/EnrollRequest",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "code": program.code or "",
                "description": program.description or "",
            },
            "enrollmentMode": enrollment_mode,
        },
    )


@login_required
def instructor_enrollment_requests(request, pk: int):
    """
    List pending enrollment requests for a program.
    """
    from apps.progression.models import EnrollmentRequest, InstructorAssignment

    user = request.user

    # Verify access (assigned instructor or staff)
    if user.is_staff:
        program = get_object_or_404(Program, pk=pk)
    else:
        assignment = (
            InstructorAssignment.objects.filter(
                instructor=user,
                program_id=pk,
            )
            .select_related("program")
            .first()
        )
        if not assignment:
            messages.error(
                request,
                "You do not have access to enrollment requests for this program.",
            )
            return redirect("progression:instructor.programs")
        program = assignment.program

    # Get filter params
    status_filter = request.GET.get("status", "pending")
    page = int(request.GET.get("page", 1))
    per_page = 20

    # Query requests
    requests_query = EnrollmentRequest.objects.filter(program=program).select_related(
        "user"
    )

    if status_filter:
        requests_query = requests_query.filter(status=status_filter)

    requests_query = requests_query.order_by("-created_at")

    # Pagination
    total_count = requests_query.count()
    total_pages = (total_count + per_page - 1) // per_page
    offset = (page - 1) * per_page
    requests = requests_query[offset : offset + per_page]

    requests_data = [
        {
            "id": r.id,
            "studentName": r.user.get_full_name() or r.user.email,
            "studentEmail": r.user.email,
            "message": r.message,
            "status": r.status,
            "createdAt": r.created_at.isoformat(),
            "reviewedAt": r.reviewed_at.isoformat() if r.reviewed_at else None,
        }
        for r in requests
    ]

    return render(
        request,
        "Instructor/EnrollmentRequests/Index",
        {
            "program": {"id": program.id, "name": program.name},
            "requests": {
                "results": requests_data,
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
            },
        },
    )


@login_required
def instructor_enrollment_request_approve(request, pk: int, request_id: int):
    """
    Approve an enrollment request.
    """
    from apps.progression.models import EnrollmentRequest, InstructorAssignment
    from django.contrib import messages

    if request.method != "POST":
        return redirect("progression:instructor.enrollment_requests", pk=pk)

    user = request.user

    # Verify access (assigned instructor or staff)
    has_access = (
        user.is_staff
        or InstructorAssignment.objects.filter(
            instructor=user,
            program_id=pk,
        ).exists()
    )
    if not has_access:
        messages.error(
            request,
            "You do not have permission to review enrollment requests for this program.",
        )
        return redirect("progression:instructor.programs")

    # Get request
    enrollment_request = get_object_or_404(
        EnrollmentRequest, pk=request_id, program_id=pk, status="pending"
    )

    # Create enrollment
    enrollment = Enrollment.objects.create(
        user=enrollment_request.user,
        program=enrollment_request.program,
        status="active",
        enrolled_at=timezone.now(),
    )
    NotificationService.notify_enrollment_approved(enrollment)

    # Update request
    enrollment_request.status = "approved"
    enrollment_request.reviewed_by = user
    enrollment_request.reviewed_at = timezone.now()
    enrollment_request.save()

    messages.success(
        request,
        f"Approved enrollment for {enrollment_request.user.get_full_name() or enrollment_request.user.email}",
    )

    return redirect("progression:instructor.enrollment_requests", pk=pk)


@login_required
def instructor_enrollment_request_reject(request, pk: int, request_id: int):
    """
    Reject an enrollment request.
    """
    from apps.progression.models import EnrollmentRequest, InstructorAssignment
    from django.contrib import messages
    import json

    if request.method != "POST":
        return redirect("progression:instructor.enrollment_requests", pk=pk)

    user = request.user

    # Verify access (assigned instructor or staff)
    has_access = (
        user.is_staff
        or InstructorAssignment.objects.filter(
            instructor=user,
            program_id=pk,
        ).exists()
    )
    if not has_access:
        messages.error(
            request,
            "You do not have permission to review enrollment requests for this program.",
        )
        return redirect("progression:instructor.programs")

    # Get request
    enrollment_request = get_object_or_404(
        EnrollmentRequest, pk=request_id, program_id=pk, status="pending"
    )

    # Get rejection notes
    data = {}
    if request.body:
        try:
            data = json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            data = request.POST.dict()

    # Update request
    enrollment_request.status = "rejected"
    enrollment_request.reviewed_by = user
    enrollment_request.reviewed_at = timezone.now()
    enrollment_request.reviewer_notes = data.get("notes", "")
    enrollment_request.save()

    NotificationService.notify_enrollment_rejected(
        enrollment_request,
        reason=enrollment_request.reviewer_notes,
    )

    messages.info(
        request,
        f"Rejected enrollment for {enrollment_request.user.get_full_name() or enrollment_request.user.email}",
    )

    return redirect("progression:instructor.enrollment_requests", pk=pk)
