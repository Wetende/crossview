from collections import defaultdict
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone

from apps.assessments.models import (
    AssessmentResult,
    Assignment,
    AssignmentSubmission,
    QuizAttempt,
)
from apps.commerce.models import (
    OrderItem,
    ProgramRevenueShare,
    Refund,
    RefundItem,
    SettlementParty,
)
from apps.core.models import Program
from apps.core.utils import get_instructor_program_ids
from apps.curriculum.models import CurriculumNode
from apps.practicum.models import PracticumSubmission
from apps.progression.models import Enrollment, NodeCompletion

from .models import EnrollmentLearningActivity, ManualQuizGrade
from .services import classify_enrollment, get_course_delivery_profile


def get_upcoming_deadlines_for_enrollments(enrollments, now=None):
    now = now or timezone.now()
    enrollments = list(enrollments)
    enrollment_by_program = {item.program_id: item for item in enrollments}
    program_ids = list(enrollment_by_program)
    submissions = {
        (item.enrollment_id, item.assignment_id): item
        for item in AssignmentSubmission.objects.filter(
            enrollment__in=enrollments,
            status__in=["submitted", "graded"],
        ).order_by("enrollment_id", "assignment_id", "-attempt_number")
    }
    deadlines = []
    for assignment in Assignment.objects.filter(
        program_id__in=program_ids,
        is_published=True,
        due_date__isnull=False,
        due_date__gte=now,
    ).select_related("program"):
        enrollment = enrollment_by_program[assignment.program_id]
        if (enrollment.id, assignment.id) in submissions:
            continue
        deadlines.append(
            {
                "type": "assignment",
                "id": assignment.id,
                "title": assignment.title,
                "programId": assignment.program_id,
                "programName": assignment.program.name,
                "dueAt": assignment.due_date.isoformat(),
            }
        )
    for enrollment in enrollments:
        if enrollment.expires_at and enrollment.expires_at >= now:
            deadlines.append(
                {
                    "type": "access_expiry",
                    "id": enrollment.id,
                    "title": "Course access expires",
                    "programId": enrollment.program_id,
                    "programName": enrollment.program.name,
                    "dueAt": enrollment.expires_at.isoformat(),
                }
            )
    return sorted(deadlines, key=lambda item: item["dueAt"])


def get_enrollment_attention(enrollment, *, now=None):
    """Return the learner's most urgent actionable course condition."""
    from .reminders import build_contextual_reminder_candidates

    candidate = build_contextual_reminder_candidates([enrollment], now=now).get(
        enrollment.id
    )
    if not candidate:
        return None
    return {**candidate["condition"], "message": candidate["message"]}


def serialize_enrollment_operations(enrollment, total_nodes=None, include_gamification=False):
    total_nodes = total_nodes if total_nodes is not None else CurriculumNode.objects.filter(
        program=enrollment.program,
        is_published=True,
        children__isnull=True,
    ).count()
    completed = enrollment.completions.count()
    progress = completed / total_nodes * 100 if total_nodes else 0
    try:
        activity = enrollment.learning_activity
    except EnrollmentLearningActivity.DoesNotExist:
        activity = None
    result = {
        "learnerState": classify_enrollment(enrollment),
        "startedAt": activity.started_at.isoformat() if activity and activity.started_at else None,
        "lastActivity": (
            activity.last_activity_at.isoformat()
            if activity and activity.last_activity_at
            else None
        ),
        "lastActivitySource": activity.last_source if activity else "",
        "progressPercent": round(progress, 1),
        "completedNodes": completed,
        "totalNodes": total_nodes,
        "expiresAt": enrollment.expires_at.isoformat() if enrollment.expires_at else None,
    }
    if include_gamification:
        from apps.progression.gamification import serialize_gamification

        result["gamification"] = serialize_gamification(enrollment)
    return result


def get_student_operations(user):
    enrollments = list(
        Enrollment.objects.filter(
            user=user,
            status__in=["active", "completed"],
        ).select_related("program", "learning_activity")
    )
    return {
        "upcomingDeadlines": get_upcoming_deadlines_for_enrollments(enrollments),
        "enrollmentOperations": {
            str(enrollment.id): serialize_enrollment_operations(
                enrollment, include_gamification=True
            )
            for enrollment in enrollments
        },
    }


def get_instructor_workload(program_ids):
    program_ids = list(program_ids)
    assignment_count = AssignmentSubmission.objects.filter(
        assignment__program_id__in=program_ids,
        status="submitted",
    ).count()
    practicum_count = PracticumSubmission.objects.filter(
        enrollment__program_id__in=program_ids,
        status="pending",
    ).count()
    pending_attempts = QuizAttempt.objects.filter(
        quiz__node__program_id__in=program_ids,
        submitted_at__isnull=False,
        passed__isnull=True,
    ).distinct()
    manual_count = pending_attempts.count()
    return {
        "assignments": assignment_count,
        "practicum": practicum_count,
        "manualQuizzes": manual_count,
        "total": assignment_count + practicum_count + manual_count,
    }


def get_program_learners(program, state=None, search=None):
    enrollments = Enrollment.objects.filter(program=program).select_related(
        "user", "program", "learning_activity"
    )
    if search:
        enrollments = enrollments.filter(
            Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
            | Q(user__email__icontains=search)
        )
    total_nodes = CurriculumNode.objects.filter(
        program=program,
        is_published=True,
        children__isnull=True,
    ).count()
    ordered_enrollments = list(enrollments.order_by("-enrolled_at"))
    from .reminders import build_contextual_reminder_candidates

    reminder_candidates = build_contextual_reminder_candidates(ordered_enrollments)
    rows = []
    for enrollment in ordered_enrollments:
        operations = serialize_enrollment_operations(enrollment, total_nodes)
        if state and operations["learnerState"] != state:
            continue
        rows.append(
            {
                "enrollmentId": enrollment.id,
                "userId": enrollment.user_id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "email": enrollment.user.email,
                "status": enrollment.status,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
                "attention": (
                    reminder_candidates[enrollment.id]["condition"]
                    if enrollment.id in reminder_candidates
                    else None
                ),
                **operations,
            }
        )
    return rows


def get_program_learner_summary(program):
    states = [
        classify_enrollment(enrollment)
        for enrollment in Enrollment.objects.filter(program=program).select_related(
            "learning_activity"
        )
    ]
    return {
        "total": len(states),
        "needsAttention": sum(
            state in {"not_started", "stalled", "inactive"} for state in states
        ),
        "completed": sum(state == "completed" for state in states),
    }


def get_program_learner_detail(
    enrollment,
    *,
    curriculum_offset=0,
    curriculum_limit=25,
):
    nodes = CurriculumNode.objects.filter(
        program=enrollment.program,
        is_published=True,
        children__isnull=True,
    ).order_by("position", "id")
    total_nodes = nodes.count()
    completed_by_node = {
        completion.node_id: completion
        for completion in NodeCompletion.objects.filter(
            enrollment=enrollment,
            node__in=nodes,
        ).select_related("node")
    }
    operations = serialize_enrollment_operations(enrollment, total_nodes)
    current_node = nodes.exclude(id__in=completed_by_node).first()

    recent_activity = [
        {
            "type": "lesson_completion",
            "title": completion.node.title,
            "occurredAt": completion.completed_at.isoformat(),
            "detail": completion.get_completion_type_display(),
        }
        for completion in sorted(
            completed_by_node.values(),
            key=lambda item: item.completed_at,
            reverse=True,
        )[:10]
    ]

    published_results = list(
        AssessmentResult.objects.filter(
            enrollment=enrollment,
            is_published=True,
        )
        .select_related("node")
        .order_by("node__position", "node_id")
    )
    published_grades = [
        {
            "id": result.id,
            "type": "assessment",
            "title": result.node.title,
            "score": result.get_total(),
            "status": result.get_status(),
            "letterGrade": result.get_letter_grade(),
            "publishedAt": (
                result.published_at.isoformat() if result.published_at else None
            ),
        }
        for result in published_results
    ]
    feedback = [
        {
            "id": f"assessment-{result.id}",
            "type": "assessment",
            "title": result.node.title,
            "message": result.lecturer_comments,
            "publishedAt": (
                result.published_at.isoformat() if result.published_at else None
            ),
        }
        for result in published_results
        if result.lecturer_comments
    ]
    assignment_submissions = (
        AssignmentSubmission.objects.filter(
            enrollment=enrollment,
            status__in=["graded", "returned"],
        )
        .select_related("assignment")
        .order_by("assignment_id", "-attempt_number")
    )
    seen_assignments = set()
    for submission in assignment_submissions:
        if submission.assignment_id in seen_assignments:
            continue
        seen_assignments.add(submission.assignment_id)
        published_grades.append(
            {
                "id": submission.id,
                "type": "assignment",
                "title": submission.assignment.title,
                "score": float(submission.score) if submission.score is not None else None,
                "status": "Pass" if submission.passed else "Fail" if submission.passed is False else None,
                "letterGrade": None,
                "publishedAt": (
                    submission.graded_at.isoformat() if submission.graded_at else None
                ),
            }
        )
        if submission.feedback:
            feedback.append(
                {
                    "id": f"assignment-{submission.id}",
                    "type": "assignment",
                    "title": submission.assignment.title,
                    "message": submission.feedback,
                    "publishedAt": (
                        submission.graded_at.isoformat()
                        if submission.graded_at
                        else None
                    ),
                }
            )

    page_nodes = list(
        nodes[curriculum_offset : curriculum_offset + curriculum_limit]
    )
    curriculum_results = [
        {
            "nodeId": node.id,
            "title": node.title,
            "type": node.node_type,
            "completed": node.id in completed_by_node,
            "completedAt": (
                completed_by_node[node.id].completed_at.isoformat()
                if node.id in completed_by_node
                else None
            ),
        }
        for node in page_nodes
    ]
    return {
        "enrollmentId": enrollment.id,
        "userId": enrollment.user_id,
        "name": enrollment.user.get_full_name() or enrollment.user.email,
        "email": enrollment.user.email,
        "status": enrollment.status,
        "enrolledAt": enrollment.enrolled_at.isoformat(),
        "grades": enrollment.grades or {},
        **operations,
        "attention": get_enrollment_attention(enrollment),
        "upcomingDeadlines": get_upcoming_deadlines_for_enrollments([enrollment]),
        "recentActivity": recent_activity,
        "publishedGrades": published_grades,
        "feedback": feedback,
        "currentPosition": (
            {
                "nodeId": current_node.id,
                "title": current_node.title,
                "type": current_node.node_type,
            }
            if current_node
            else None
        ),
        "curriculumProgress": {
            "results": curriculum_results,
            "pagination": {
                "offset": curriculum_offset,
                "limit": curriculum_limit,
                "total": total_nodes,
                "hasMore": curriculum_offset + curriculum_limit < total_nodes,
            },
        },
    }


def get_engagement_matrix(program, enrollment_offset=0, enrollment_limit=25, node_offset=0, node_limit=25):
    enrollments = list(
        Enrollment.objects.filter(program=program)
        .select_related("user", "learning_activity")
        .order_by("user__last_name", "user__first_name", "id")[
            enrollment_offset : enrollment_offset + enrollment_limit
        ]
    )
    nodes = list(
        CurriculumNode.objects.filter(
            program=program,
            is_published=True,
            children__isnull=True,
        ).order_by("position", "id")[node_offset : node_offset + node_limit]
    )
    completion_pairs = set(
        NodeCompletion.objects.filter(
            enrollment__in=enrollments,
            node__in=nodes,
        ).values_list("enrollment_id", "node_id")
    )
    quiz_attempts = {
        (attempt.enrollment_id, attempt.quiz.node_id): attempt
        for attempt in QuizAttempt.objects.filter(
            enrollment__in=enrollments,
            quiz__node__in=nodes,
            submitted_at__isnull=False,
        )
        .select_related("quiz__node")
        .order_by("enrollment_id", "quiz__node_id", "-attempt_number")
    }
    rows = []
    for enrollment in enrollments:
        cells = []
        for node in nodes:
            status = "completed" if (enrollment.id, node.id) in completion_pairs else "not_started"
            attempt = quiz_attempts.get((enrollment.id, node.id))
            if attempt:
                status = "passed" if attempt.passed else "failed" if attempt.passed is False else "in_progress"
            cells.append({"nodeId": node.id, "status": status})
        rows.append(
            {
                "enrollmentId": enrollment.id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "learnerState": classify_enrollment(enrollment),
                "cells": cells,
            }
        )
    return {
        "nodes": [
            {"id": node.id, "title": node.title, "type": node.node_type}
            for node in nodes
        ],
        "rows": rows,
        "enrollmentOffset": enrollment_offset,
        "nodeOffset": node_offset,
    }


def get_program_revenue(program):
    paid_items = OrderItem.objects.filter(
        program=program,
        status__in=[OrderItem.STATUS_PAID, OrderItem.STATUS_REFUNDED],
    )
    refund_items = RefundItem.objects.filter(
        order_item__program=program,
        refund__status=Refund.STATUS_PROCESSED,
        status=RefundItem.STATUS_PROCESSED,
    )
    by_currency = defaultdict(lambda: {"grossMinor": 0, "refundMinor": 0, "orders": 0})
    for row in paid_items.values("currency").annotate(
        gross=Sum("amount_minor"),
        orders=Count("order_id", distinct=True),
    ):
        bucket = by_currency[row["currency"]]
        bucket["grossMinor"] = row["gross"] or 0
        bucket["orders"] = row["orders"] or 0
    for row in refund_items.values("order_item__currency").annotate(refunds=Sum("amount_minor")):
        by_currency[row["order_item__currency"]]["refundMinor"] = row["refunds"] or 0
    return [
        {
            "currency": currency,
            **values,
            "netMinor": values["grossMinor"] - values["refundMinor"],
        }
        for currency, values in sorted(by_currency.items())
    ]


def get_instructor_revenue(user):
    programs = list(
        Program.objects.filter(id__in=get_instructor_program_ids(user)).order_by(
            "name"
        )
    )
    shares = ProgramRevenueShare.objects.filter(
        program__in=programs,
        active=True,
        settlement_party__active=True,
        settlement_party__party_type=SettlementParty.TYPE_INSTRUCTOR,
    ).select_related("settlement_party")
    if not (user.is_staff or user.is_superuser):
        shares = shares.filter(settlement_party__user=user)
    shares_by_program = defaultdict(list)
    for share in shares:
        shares_by_program[share.program_id].append(share)

    program_ids = [program.id for program in programs]
    totals = defaultdict(
        lambda: {"grossMinor": 0, "refundMinor": 0, "netMinor": 0, "orders": 0}
    )
    paid_items = OrderItem.objects.filter(
        program_id__in=program_ids,
        status__in=[OrderItem.STATUS_PAID, OrderItem.STATUS_REFUNDED],
    )
    for row in paid_items.values("currency").annotate(
        gross=Sum("amount_minor"),
        orders=Count("order_id", distinct=True),
    ):
        bucket = totals[row["currency"]]
        bucket["grossMinor"] = row["gross"] or 0
        bucket["orders"] = row["orders"] or 0
    for row in (
        RefundItem.objects.filter(
            order_item__program_id__in=program_ids,
            refund__status=Refund.STATUS_PROCESSED,
            status=RefundItem.STATUS_PROCESSED,
        )
        .values("order_item__currency")
        .annotate(refunds=Sum("amount_minor"))
    ):
        totals[row["order_item__currency"]]["refundMinor"] = row["refunds"] or 0
    for values in totals.values():
        values["netMinor"] = values["grossMinor"] - values["refundMinor"]

    course_rows = []
    for program in programs:
        currencies = get_program_revenue(program)
        course = {
            "programId": program.id,
            "programName": program.name,
            "programCode": program.code or "",
            "currencies": currencies,
        }
        configured_shares = shares_by_program.get(program.id, [])
        if configured_shares:
            course["instructorShares"] = [
                {
                    "settlementPartyId": share.settlement_party_id,
                    "displayName": share.settlement_party.display_name,
                    "shareBps": share.share_bps,
                    "estimatedByCurrency": [
                        {
                            "currency": row["currency"],
                            "netMinor": row["netMinor"] * share.share_bps // 10000,
                        }
                        for row in currencies
                    ],
                }
                for share in configured_shares
            ]
        course_rows.append(course)

    return {
        "currencies": [
            {"currency": currency, **values}
            for currency, values in sorted(totals.items())
        ],
        "courses": course_rows,
    }


def get_program_operations_summary(program):
    rows = get_program_learners(program)
    states = defaultdict(int)
    for row in rows:
        states[row["learnerState"]] += 1
    return {
        "programId": program.id,
        "deliveryMode": get_course_delivery_profile(program).delivery_mode,
        "learners": {"total": len(rows), "byState": dict(states)},
        "workload": get_instructor_workload([program.id]),
        "revenue": get_program_revenue(program),
    }
