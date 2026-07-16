from collections import defaultdict
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone

from apps.assessments.models import Assignment, AssignmentSubmission, QuizAttempt
from apps.commerce.models import OrderItem, Refund, RefundItem
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


def serialize_enrollment_operations(enrollment, total_nodes=None):
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
    return {
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
            str(enrollment.id): serialize_enrollment_operations(enrollment)
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
    rows = []
    for enrollment in enrollments.order_by("-enrolled_at"):
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
                **operations,
            }
        )
    return rows


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

