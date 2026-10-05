from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.db.models import Count, Q

from apps.certifications.models import Certificate, CertificateEligibility
from apps.commerce.models import Order
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, InstructorAssignment, NodeCompletion

from .registry import (
    MAX_SYNC_REPORT_ROWS,
    ReportColumn,
    ReportDefinition,
    ReportResult,
    register_report,
)
from .utils import (
    display_datetime,
    display_money,
    parse_date_boundary,
    parse_positive_int_filter,
    selected_numeric_ids,
)


def _apply_selected_ids(queryset, selected_ids: list[str]):
    if not selected_ids:
        return queryset
    numeric_ids = selected_numeric_ids(selected_ids)
    return queryset.filter(id__in=numeric_ids) if numeric_ids else queryset.none()


def _selected_prefixed_ids(selected_ids: list[str], prefix: str) -> list[int]:
    marker = f"{prefix}-"
    prefixed_ids = []
    for value in selected_ids:
        token = str(value).strip()
        if token.startswith(marker) and token[len(marker) :].isdigit():
            prefixed_ids.append(int(token[len(marker) :]))
    return prefixed_ids


def _program_filter(filters: dict) -> int | None:
    return parse_positive_int_filter(
        filters.get("program") or filters.get("programId"),
        "program",
    )


def _apply_date_filters(queryset, field_name: str, filters: dict):
    date_from = parse_date_boundary(filters.get("date_from") or filters.get("from"))
    date_to = parse_date_boundary(
        filters.get("date_to") or filters.get("to"),
        end_of_day=True,
    )
    if date_from:
        queryset = queryset.filter(**{f"{field_name}__gte": date_from})
    if date_to:
        queryset = queryset.filter(**{f"{field_name}__lte": date_to})
    return queryset


def _truncate_sequence(items):
    total_count = len(items)
    return items[:MAX_SYNC_REPORT_ROWS], total_count, total_count > MAX_SYNC_REPORT_ROWS


def _limit_queryset(queryset):
    total_count = queryset.count()
    return (
        list(queryset[:MAX_SYNC_REPORT_ROWS]),
        total_count,
        total_count > MAX_SYNC_REPORT_ROWS,
    )


def _user_role(user) -> str:
    group_names = {group.name for group in user.groups.all()}
    if user.is_superuser:
        return "Super Admin"
    if user.is_staff:
        return "Admin"
    if "Instructors" in group_names:
        return "Instructor"
    return "Student"


def _progress_maps(enrollments: list[Enrollment]):
    program_ids = [enrollment.program_id for enrollment in enrollments]
    enrollment_ids = [enrollment.id for enrollment in enrollments]
    total_nodes = dict(
        CurriculumNode.objects.filter(
            program_id__in=program_ids,
            is_published=True,
            children__isnull=True,
        )
        .values("program_id")
        .annotate(count=Count("id"))
        .values_list("program_id", "count")
    )
    completed_nodes = dict(
        NodeCompletion.objects.filter(enrollment_id__in=enrollment_ids)
        .values("enrollment_id")
        .annotate(count=Count("id"))
        .values_list("enrollment_id", "count")
    )
    return total_nodes, completed_nodes


def _enrollment_progress(enrollment: Enrollment, total_nodes: dict, completed_nodes: dict):
    total = total_nodes.get(enrollment.program_id, 0)
    completed = completed_nodes.get(enrollment.id, 0)
    return round((completed / total * 100) if total else 0, 1)


USER_COLUMNS = (
    ReportColumn("id", "ID"),
    ReportColumn("name", "Name"),
    ReportColumn("email", "Email"),
    ReportColumn("role", "Role"),
    ReportColumn("status", "Status"),
    ReportColumn("dateJoined", "Joined"),
    ReportColumn("lastLogin", "Last Login"),
)


def build_admin_users_report(request, filters: dict, selected_ids: list[str]):
    User = get_user_model()
    role = filters.get("role", "")
    status = filters.get("status", "")
    search = filters.get("search", "")

    queryset = User.objects.all().prefetch_related("groups")
    if role == "admin":
        queryset = queryset.filter(is_staff=True)
    elif role == "instructor":
        queryset = queryset.filter(groups__name="Instructors").distinct()
    elif role == "student":
        queryset = queryset.filter(is_staff=False).exclude(groups__name="Instructors")

    if status == "active":
        queryset = queryset.filter(is_active=True)
    elif status == "inactive":
        queryset = queryset.filter(is_active=False)

    if search:
        queryset = queryset.filter(
            Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
        )

    queryset = _apply_date_filters(queryset, "date_joined", filters)
    queryset = _apply_selected_ids(queryset, selected_ids).order_by("-date_joined", "id")
    users, total_count, is_truncated = _limit_queryset(queryset)

    rows = [
        {
            "id": user.id,
            "name": user.get_full_name() or user.email or user.username,
            "email": user.email,
            "role": _user_role(user),
            "status": "Active" if user.is_active else "Inactive",
            "dateJoined": display_datetime(user.date_joined),
            "lastLogin": display_datetime(user.last_login),
        }
        for user in users
    ]

    return ReportResult(
        title="Users Report",
        columns=list(USER_COLUMNS),
        rows=rows,
        filters={
            "Role": role or "All",
            "Status": status or "All",
            "Search": search or "None",
        },
        summary={"Total matching users": total_count},
        total_count=total_count,
        is_truncated=is_truncated,
    )


ENROLLMENT_COLUMNS = (
    ReportColumn("id", "ID"),
    ReportColumn("student", "Student"),
    ReportColumn("email", "Email"),
    ReportColumn("program", "Program"),
    ReportColumn("status", "Status"),
    ReportColumn("progress", "Progress", align="right"),
    ReportColumn("enrolledAt", "Enrolled"),
    ReportColumn("completedAt", "Completed"),
)


def _filtered_enrollments(filters: dict, selected_ids: list[str]):
    program_id = parse_positive_int_filter(filters.get("program"), "program")
    status = filters.get("status", "")
    search = filters.get("search", "")
    queryset = Enrollment.objects.select_related("user", "program")
    if program_id:
        queryset = queryset.filter(program_id=program_id)
    if status:
        queryset = queryset.filter(status=status)
    if search:
        queryset = queryset.filter(
            Q(user__email__icontains=search)
            | Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
        )
    queryset = _apply_date_filters(queryset, "enrolled_at", filters)
    return _apply_selected_ids(queryset, selected_ids)


def build_admin_enrollments_report(request, filters: dict, selected_ids: list[str]):
    queryset = _filtered_enrollments(filters, selected_ids).order_by("-enrolled_at", "id")
    enrollments, total_count, is_truncated = _limit_queryset(queryset)
    total_nodes, completed_nodes = _progress_maps(enrollments)

    rows = [
        {
            "id": enrollment.id,
            "student": enrollment.user.get_full_name() or enrollment.user.email,
            "email": enrollment.user.email,
            "program": enrollment.program.name,
            "status": enrollment.status.title(),
            "progress": f"{_enrollment_progress(enrollment, total_nodes, completed_nodes)}%",
            "enrolledAt": display_datetime(enrollment.enrolled_at),
            "completedAt": display_datetime(enrollment.completed_at),
        }
        for enrollment in enrollments
    ]
    program_label = "All"
    program_id = parse_positive_int_filter(filters.get("program"), "program")
    if program_id:
        program = Program.objects.filter(pk=program_id).first()
        program_label = program.name if program else str(program_id)

    return ReportResult(
        title="Enrollments Report",
        columns=list(ENROLLMENT_COLUMNS),
        rows=rows,
        filters={
            "Program": program_label,
            "Status": filters.get("status") or "All",
            "Search": filters.get("search") or "None",
        },
        summary={"Total matching enrollments": total_count},
        orientation="landscape",
        total_count=total_count,
        is_truncated=is_truncated,
    )


CERTIFICATE_COLUMNS = (
    ReportColumn("serialNumber", "Serial"),
    ReportColumn("student", "Student"),
    ReportColumn("email", "Email"),
    ReportColumn("program", "Program"),
    ReportColumn("queueStatus", "Queue"),
    ReportColumn("certificateStatus", "Certificate"),
    ReportColumn("completionDate", "Completed"),
    ReportColumn("issuedAt", "Issued"),
)


def build_admin_certificates_report(request, filters: dict, selected_ids: list[str]):
    status = filters.get("status", "")
    search = str(filters.get("search") or "").lower()
    certificate_ids = selected_numeric_ids(selected_ids)
    queue_ids = _selected_prefixed_ids(selected_ids, "queue")
    rows = []

    certificates = (
        Certificate.objects.select_related("enrollment__user", "enrollment__program")
        .order_by("-issue_date", "-id")
    )
    if selected_ids:
        certificates = (
            certificates.filter(id__in=certificate_ids)
            if certificate_ids
            else certificates.none()
        )

    issued_enrollment_ids = set()
    for cert in certificates:
        issued_enrollment_ids.add(cert.enrollment_id)
        rows.append(
            {
                "id": cert.id,
                "serialNumber": cert.serial_number,
                "student": cert.student_name,
                "email": cert.enrollment.user.email if cert.enrollment_id else "",
                "program": cert.program_title,
                "queueStatus": "Released",
                "certificateStatus": "Revoked" if cert.is_revoked else "Issued",
                "completionDate": display_datetime(cert.completion_date),
                "issuedAt": display_datetime(cert.issue_date),
                "_status": "revoked" if cert.is_revoked else "released",
            }
        )

    queue_records = CertificateEligibility.objects.select_related(
        "enrollment__user",
        "enrollment__program",
        "certificate",
    ).exclude(enrollment_id__in=issued_enrollment_ids)
    if selected_ids:
        queue_records = (
            queue_records.filter(id__in=queue_ids) if queue_ids else queue_records.none()
        )
    for record in queue_records:
        rows.append(
            {
                "id": f"queue-{record.id}",
                "serialNumber": (
                    record.certificate.serial_number
                    if record.certificate_id
                    else f"QUEUE-{record.enrollment_id}"
                ),
                "student": record.enrollment.user.get_full_name()
                or record.enrollment.user.email,
                "email": record.enrollment.user.email,
                "program": record.enrollment.program.name,
                "queueStatus": record.get_status_display(),
                "certificateStatus": "Pending" if record.status == "pending" else "-",
                "completionDate": display_datetime(record.enrollment.completed_at),
                "issuedAt": display_datetime(record.released_at),
                "_status": record.status,
            }
        )

    if status:
        rows = [row for row in rows if row.get("_status") == status]
    if search:
        rows = [
            row
            for row in rows
            if search
            in " ".join(
                str(row.get(key) or "").lower()
                for key in ("serialNumber", "student", "email", "program")
            )
        ]

    rows, total_count, is_truncated = _truncate_sequence(rows)
    for row in rows:
        row.pop("_status", None)

    return ReportResult(
        title="Certificates Report",
        columns=list(CERTIFICATE_COLUMNS),
        rows=rows,
        filters={
            "Status": status or "All",
            "Search": filters.get("search") or "None",
        },
        summary={"Total matching certificate records": total_count},
        orientation="landscape",
        total_count=total_count,
        is_truncated=is_truncated,
    )


ORDER_COLUMNS = (
    ReportColumn("reference", "Reference"),
    ReportColumn("user", "User"),
    ReportColumn("items", "Items"),
    ReportColumn("status", "Status"),
    ReportColumn("provider", "Provider"),
    ReportColumn("total", "Total", align="right"),
    ReportColumn("refunded", "Refunded", align="right"),
    ReportColumn("paidAt", "Paid"),
    ReportColumn("createdAt", "Created"),
)


PROGRAM_COLUMNS = (
    ReportColumn("id", "ID"),
    ReportColumn("code", "Code"),
    ReportColumn("name", "Program"),
    ReportColumn("level", "Level"),
    ReportColumn("category", "Category"),
    ReportColumn("blueprint", "Blueprint"),
    ReportColumn("status", "Status"),
    ReportColumn("featured", "Featured"),
    ReportColumn("enrollments", "Enrollments", align="right"),
    ReportColumn("instructors", "Instructors"),
    ReportColumn("createdAt", "Created"),
)


def build_admin_programs_report(request, filters: dict, selected_ids: list[str]):
    status = filters.get("status", "")
    search = filters.get("search", "")
    level = filters.get("level", "")
    blueprint_id = parse_positive_int_filter(filters.get("blueprint"), "blueprint")

    queryset = (
        Program.objects.select_related("blueprint")
        .prefetch_related("instructor_assignments__instructor")
        .annotate(enrollment_count=Count("enrollments", distinct=True))
    )

    if status == "published":
        queryset = queryset.filter(is_published=True)
    elif status == "draft":
        queryset = queryset.filter(is_published=False)
    if blueprint_id:
        queryset = queryset.filter(blueprint_id=blueprint_id)
    if level:
        queryset = queryset.filter(level=level)
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search)
            | Q(code__icontains=search)
            | Q(category__icontains=search)
        )

    queryset = _apply_selected_ids(queryset, selected_ids).order_by("-created_at", "id")
    programs, total_count, is_truncated = _limit_queryset(queryset)

    rows = []
    for program in programs:
        instructor_names = [
            assignment.instructor.get_full_name()
            or assignment.instructor.email
            or assignment.instructor.username
            for assignment in program.instructor_assignments.all()
        ]
        rows.append(
            {
                "id": program.id,
                "code": program.code or "-",
                "name": program.name,
                "level": program.level or "-",
                "category": program.category or "-",
                "blueprint": program.blueprint.name if program.blueprint else "-",
                "status": "Published" if program.is_published else "Draft",
                "featured": "Yes" if program.is_featured else "No",
                "enrollments": program.enrollment_count,
                "instructors": ", ".join(instructor_names) if instructor_names else "-",
                "createdAt": display_datetime(program.created_at),
            }
        )

    blueprint_label = "All"
    if blueprint_id:
        blueprint_label = (
            programs[0].blueprint.name
            if programs and programs[0].blueprint_id == blueprint_id and programs[0].blueprint
            else str(blueprint_id)
        )

    return ReportResult(
        title="Programs Listing",
        columns=list(PROGRAM_COLUMNS),
        rows=rows,
        filters={
            "Status": status or "All",
            "Level": level or "All",
            "Blueprint": blueprint_label,
            "Search": search or "None",
        },
        summary={"Total matching programs": total_count},
        orientation="landscape",
        total_count=total_count,
        is_truncated=is_truncated,
    )


def _filtered_orders(filters: dict, selected_ids: list[str]):
    queryset = (
        Order.objects.select_related("user")
        .prefetch_related("items", "refunds")
        .order_by("-created_at", "-id")
    )
    if filters.get("status"):
        queryset = queryset.filter(status=filters["status"])
    if filters.get("provider"):
        queryset = queryset.filter(provider=filters["provider"])
    if filters.get("search"):
        search = filters["search"]
        queryset = queryset.filter(
            Q(reference__icontains=search)
            | Q(provider_reference__icontains=search)
            | Q(user__email__icontains=search)
            | Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
        )
    queryset = _apply_date_filters(queryset, "created_at", filters)
    return _apply_selected_ids(queryset, selected_ids)


def _order_rows(orders):
    rows = []
    for order in orders:
        item_names = [item.program_name for item in order.items.all()]
        rows.append(
            {
                "id": order.id,
                "reference": order.reference,
                "user": order.user.get_full_name() or order.user.email,
                "items": ", ".join(item_names) if item_names else "-",
                "status": order.get_status_display(),
                "provider": order.get_provider_display(),
                "total": display_money(order.total_minor, order.currency),
                "refunded": display_money(order.refunded_minor, order.currency),
                "paidAt": display_datetime(order.paid_at),
                "createdAt": display_datetime(order.created_at),
            }
        )
    return rows


def build_admin_orders_report(request, filters: dict, selected_ids: list[str]):
    queryset = _filtered_orders(filters, selected_ids)
    orders, total_count, is_truncated = _limit_queryset(queryset)
    return ReportResult(
        title="Orders Report",
        columns=list(ORDER_COLUMNS),
        rows=_order_rows(orders),
        filters={
            "Status": filters.get("status") or "All",
            "Provider": filters.get("provider") or "All",
            "Search": filters.get("search") or "None",
        },
        summary={"Total matching orders": total_count},
        orientation="landscape",
        total_count=total_count,
        is_truncated=is_truncated,
    )


def _instructor_program_ids(user):
    if user.is_staff or user.is_superuser:
        return list(Program.objects.values_list("id", flat=True))
    return list(
        InstructorAssignment.objects.filter(instructor=user).values_list(
            "program_id",
            flat=True,
        )
    )


def _ensure_instructor_program_access(user, program_id: str | int):
    program = Program.objects.filter(pk=program_id).first()
    if not program:
        raise PermissionDenied("Program not found.")
    if user.is_staff or user.is_superuser:
        return program
    has_access = InstructorAssignment.objects.filter(
        instructor=user,
        program=program,
    ).exists()
    if not has_access:
        raise PermissionDenied("You do not have access to this program report.")
    return program


def build_instructor_roster_report(request, filters: dict, selected_ids: list[str]):
    program_id = _program_filter(filters)
    program_ids = _instructor_program_ids(request.user)
    queryset = Enrollment.objects.select_related("user", "program").filter(
        program_id__in=program_ids
    )
    selected_program = None
    if program_id:
        selected_program = _ensure_instructor_program_access(request.user, program_id)
        queryset = queryset.filter(program=selected_program)
    if filters.get("status"):
        queryset = queryset.filter(status=filters["status"])
    if filters.get("search"):
        search = filters["search"]
        queryset = queryset.filter(
            Q(user__email__icontains=search)
            | Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
        )
    queryset = _apply_selected_ids(queryset, selected_ids).order_by(
        "program__name",
        "user__last_name",
        "user__first_name",
    )
    enrollments, total_count, is_truncated = _limit_queryset(queryset)
    total_nodes, completed_nodes = _progress_maps(enrollments)

    rows = [
        {
            "id": enrollment.id,
            "student": enrollment.user.get_full_name() or enrollment.user.email,
            "email": enrollment.user.email,
            "program": enrollment.program.name,
            "status": enrollment.status.title(),
            "progress": f"{_enrollment_progress(enrollment, total_nodes, completed_nodes)}%",
            "enrolledAt": display_datetime(enrollment.enrolled_at),
            "completedAt": display_datetime(enrollment.completed_at),
        }
        for enrollment in enrollments
    ]

    return ReportResult(
        title="Class List Report",
        columns=list(ENROLLMENT_COLUMNS),
        rows=rows,
        filters={
            "Program": selected_program.name if selected_program else "All assigned programs",
            "Status": filters.get("status") or "All",
            "Search": filters.get("search") or "None",
        },
        summary={"Total matching students": total_count},
        orientation="landscape",
        total_count=total_count,
        is_truncated=is_truncated,
    )


def build_instructor_gradebook_report(request, filters: dict, selected_ids: list[str]):
    from apps.certifications.models import CertificateEligibility
    from apps.progression.views import (
        _build_gradebook_attempt_maps,
        _calculate_gradebook_totals,
        _resolve_gradebook_columns,
    )

    program_id = _program_filter(filters)
    if not program_id:
        raise PermissionDenied("Select a program before printing the gradebook.")
    program = _ensure_instructor_program_access(request.user, program_id)
    grading_config = program.blueprint.grading_logic if program.blueprint else {}
    queryset = Enrollment.objects.filter(
        program=program,
        status__in=["active", "completed"],
    ).select_related("user")
    queryset = _apply_selected_ids(queryset, selected_ids).order_by(
        "user__last_name",
        "user__first_name",
    )
    enrollments, total_count, is_truncated = _limit_queryset(queryset)

    quizzes, assignments = _resolve_gradebook_columns(program)
    official_quiz_map, official_assignment_map, latest_assignment_map = (
        _build_gradebook_attempt_maps(
            [enrollment.id for enrollment in enrollments],
            [quiz["id"] for quiz in quizzes],
            [assignment["id"] for assignment in assignments],
        )
    )
    eligibility_by_enrollment = {
        record.enrollment_id: record
        for record in CertificateEligibility.objects.filter(
            enrollment_id__in=[enrollment.id for enrollment in enrollments]
        ).only("enrollment_id", "status")
    }

    columns = [
        ReportColumn("student", "Student"),
        ReportColumn("email", "Email"),
    ]
    columns.extend(
        ReportColumn(f"quiz_{quiz['id']}", quiz["title"], align="right")
        for quiz in quizzes
    )
    columns.extend(
        ReportColumn(f"assignment_{assignment['id']}", assignment["title"], align="right")
        for assignment in assignments
    )
    columns.extend(
        [
            ReportColumn("overall", "Overall", align="right"),
            ReportColumn("status", "Status"),
            ReportColumn("letterGrade", "Grade"),
            ReportColumn("certificate", "Certificate"),
        ]
    )

    rows = []
    for enrollment in enrollments:
        quiz_scores = []
        row = {
            "id": enrollment.id,
            "student": enrollment.user.get_full_name() or enrollment.user.email,
            "email": enrollment.user.email,
        }
        for quiz in quizzes:
            attempt = official_quiz_map.get((enrollment.id, quiz["id"]))
            score = float(attempt.score) if attempt and attempt.score is not None else None
            quiz_scores.append(
                {
                    "quizId": quiz["id"],
                    "score": score,
                    "passed": bool(attempt.passed) if attempt is not None else None,
                    "attemptNumber": attempt.attempt_number if attempt else None,
                }
            )
            row[f"quiz_{quiz['id']}"] = f"{score}%" if score is not None else "-"

        assignment_scores = []
        for assignment in assignments:
            official_attempt = official_assignment_map.get(
                (enrollment.id, assignment["id"])
            )
            latest_attempt = latest_assignment_map.get((enrollment.id, assignment["id"]))
            if official_attempt:
                score = official_attempt.get_final_score()
                status = official_attempt.status
                passed = official_attempt.passed
                is_late = bool(official_attempt.is_late)
                attempt_number = official_attempt.attempt_number
                is_official = True
            elif latest_attempt:
                score = None
                status = latest_attempt.status
                passed = None
                is_late = bool(latest_attempt.is_late)
                attempt_number = latest_attempt.attempt_number
                is_official = False
            else:
                score = None
                status = "not_submitted"
                passed = None
                is_late = False
                attempt_number = None
                is_official = False
            assignment_scores.append(
                {
                    "assignmentId": assignment["id"],
                    "weight": assignment["weight"],
                    "score": score,
                    "passed": passed,
                    "status": status,
                    "isLate": is_late,
                    "attemptNumber": attempt_number,
                    "isOfficial": is_official,
                }
            )
            row[f"assignment_{assignment['id']}"] = (
                f"{round(float(score), 2)}%"
                if score is not None
                else status.replace("_", " ").title()
            )

        calculated = _calculate_gradebook_totals(
            grading_config,
            quizzes,
            assignments,
            quiz_scores,
            assignment_scores,
        )
        eligibility = eligibility_by_enrollment.get(enrollment.id)
        row["overall"] = (
            f"{calculated['total']}%" if calculated.get("total") is not None else "-"
        )
        row["status"] = calculated.get("status") or "-"
        row["letterGrade"] = calculated.get("letter_grade") or "-"
        row["certificate"] = eligibility.status.title() if eligibility else "Ineligible"
        rows.append(row)

    return ReportResult(
        title=f"{program.name} Assessment Gradebook",
        columns=columns,
        rows=rows,
        filters={"Program": program.name},
        summary={"Total matching students": total_count},
        orientation="landscape",
        total_count=total_count,
        is_truncated=is_truncated,
    )


STUDENT_PROGRESS_COLUMNS = (
    ReportColumn("program", "Program"),
    ReportColumn("status", "Status"),
    ReportColumn("progress", "Progress", align="right"),
    ReportColumn("overall", "Overall", align="right"),
    ReportColumn("resultStatus", "Result"),
    ReportColumn("certificate", "Certificate"),
    ReportColumn("enrolledAt", "Enrolled"),
    ReportColumn("completedAt", "Completed"),
)


def build_student_progress_report(request, filters: dict, selected_ids: list[str]):
    queryset = Enrollment.objects.select_related("program").filter(user=request.user)
    program_id = parse_positive_int_filter(filters.get("program"), "program")
    if program_id:
        queryset = queryset.filter(program_id=program_id)
    if filters.get("status"):
        queryset = queryset.filter(status=filters["status"])
    queryset = _apply_selected_ids(queryset, selected_ids).order_by("-enrolled_at", "id")
    enrollments, total_count, is_truncated = _limit_queryset(queryset)
    total_nodes, completed_nodes = _progress_maps(enrollments)
    from apps.assessments.models import AssessmentResult

    result_by_enrollment = {}
    for result in (
        AssessmentResult.objects.filter(
            enrollment_id__in=[enrollment.id for enrollment in enrollments],
            is_published=True,
        )
        .select_related("node")
        .order_by("enrollment_id", "-published_at", "-updated_at")
    ):
        result_by_enrollment.setdefault(result.enrollment_id, result)
    eligibility_by_enrollment = {
        record.enrollment_id: record
        for record in CertificateEligibility.objects.filter(
            enrollment_id__in=[enrollment.id for enrollment in enrollments]
        )
    }
    rows = []
    for enrollment in enrollments:
        result = result_by_enrollment.get(enrollment.id)
        eligibility = eligibility_by_enrollment.get(enrollment.id)
        rows.append(
            {
                "id": enrollment.id,
                "program": enrollment.program.name,
                "status": enrollment.status.title(),
                "progress": f"{_enrollment_progress(enrollment, total_nodes, completed_nodes)}%",
                "overall": f"{result.get_total()}%" if result and result.get_total() is not None else "-",
                "resultStatus": result.get_status() if result else "-",
                "certificate": eligibility.status.title() if eligibility else "Ineligible",
                "enrolledAt": display_datetime(enrollment.enrolled_at),
                "completedAt": display_datetime(enrollment.completed_at),
            }
        )

    return ReportResult(
        title="My Progress Report",
        columns=list(STUDENT_PROGRESS_COLUMNS),
        rows=rows,
        filters={
            "Program": filters.get("program") or "All",
            "Status": filters.get("status") or "All",
        },
        summary={"Total matching enrollments": total_count},
        orientation="landscape",
        total_count=total_count,
        is_truncated=is_truncated,
    )


def build_student_orders_report(request, filters: dict, selected_ids: list[str]):
    queryset = _filtered_orders(filters, selected_ids).filter(user=request.user)
    orders, total_count, is_truncated = _limit_queryset(queryset)
    return ReportResult(
        title="My Orders Report",
        columns=list(ORDER_COLUMNS),
        rows=_order_rows(orders),
        filters={
            "Status": filters.get("status") or "All",
            "Provider": filters.get("provider") or "All",
        },
        summary={"Total matching orders": total_count},
        orientation="landscape",
        total_count=total_count,
        is_truncated=is_truncated,
    )


register_report(
    ReportDefinition(
        id="admin.users",
        title="Users",
        scope="admin",
        roles=("admin",),
        columns=USER_COLUMNS,
        builder=build_admin_users_report,
        description="User directory by role, status, search, and date joined.",
    )
)
register_report(
    ReportDefinition(
        id="admin.enrollments",
        title="Enrollments",
        scope="admin",
        roles=("admin",),
        columns=ENROLLMENT_COLUMNS,
        builder=build_admin_enrollments_report,
        description="Enrollment register by program, student, status, and progress.",
        orientation="landscape",
    )
)
register_report(
    ReportDefinition(
        id="admin.certificates",
        title="Certificates",
        scope="admin",
        roles=("admin",),
        columns=CERTIFICATE_COLUMNS,
        builder=build_admin_certificates_report,
        description="Issued certificates and certificate eligibility queue.",
        orientation="landscape",
    )
)
register_report(
    ReportDefinition(
        id="admin.programs",
        title="Programs Listing",
        scope="admin",
        roles=("admin",),
        columns=PROGRAM_COLUMNS,
        builder=build_admin_programs_report,
        description="Program catalog by status, level, blueprint, search, enrollments, and instructors.",
        orientation="landscape",
    )
)
register_report(
    ReportDefinition(
        id="admin.orders",
        title="Orders",
        scope="admin",
        roles=("admin",),
        columns=ORDER_COLUMNS,
        builder=build_admin_orders_report,
        description="Commerce orders by status, provider, date, and search.",
        orientation="landscape",
    )
)
register_report(
    ReportDefinition(
        id="instructor.roster",
        title="Class List",
        scope="instructor",
        roles=("admin", "instructor"),
        columns=ENROLLMENT_COLUMNS,
        builder=build_instructor_roster_report,
        description="Class list for assigned programs.",
        orientation="landscape",
    )
)
register_report(
    ReportDefinition(
        id="instructor.gradebook",
        title="Assessment Gradebook",
        scope="instructor",
        roles=("admin", "instructor"),
        columns=(),
        builder=build_instructor_gradebook_report,
        description="Assessment gradebook with quiz, assignment, overall, and certificate status.",
        orientation="landscape",
    )
)
register_report(
    ReportDefinition(
        id="student.progress",
        title="My Progress",
        scope="student",
        roles=("student",),
        columns=STUDENT_PROGRESS_COLUMNS,
        builder=build_student_progress_report,
        description="Student-owned enrollment progress and published result summary.",
        orientation="landscape",
    )
)
register_report(
    ReportDefinition(
        id="student.orders",
        title="My Orders",
        scope="student",
        roles=("student",),
        columns=ORDER_COLUMNS,
        builder=build_student_orders_report,
        description="Student-owned order history and receipt summary.",
        orientation="landscape",
    )
)
