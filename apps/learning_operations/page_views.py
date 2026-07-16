from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import Http404
from django.views.decorators.csrf import ensure_csrf_cookie
from inertia import render

from apps.core.api_permissions import get_object_in_instructor_scope
from apps.core.models import Program
from apps.progression.models import Enrollment

from .learner_management import get_invitation_by_token
from .selectors import get_program_learners, serialize_enrollment_operations


@login_required
def instructor_course_students(request, program_id):
    program = get_object_in_instructor_scope(
        Program.objects.all(), request.user, "id", pk=program_id
    )
    search = str(request.GET.get("search") or "").strip()
    state = str(request.GET.get("status") or "").strip()
    try:
        page = max(1, int(request.GET.get("page") or 1))
    except (TypeError, ValueError):
        page = 1
    per_page = 20
    rows = get_program_learners(program, state=state or None, search=search or None)
    start = (page - 1) * per_page
    return render(
        request,
        "Instructor/Students/Index",
        {
            "program": {"id": program.id, "name": program.name},
            "students": {
                "results": [
                    {**row, "progress": row["progressPercent"]}
                    for row in rows[start : start + per_page]
                ],
                "pagination": {
                    "page": page,
                    "perPage": per_page,
                    "totalCount": len(rows),
                },
            },
            "filters": {"search": search, "status": state},
        },
    )


@login_required
def instructor_course_learner(request, program_id, enrollment_id):
    program = get_object_in_instructor_scope(
        Program.objects.all(), request.user, "id", pk=program_id
    )
    try:
        enrollment = Enrollment.objects.select_related(
            "user", "program", "learning_activity"
        ).get(pk=enrollment_id, program=program)
    except Enrollment.DoesNotExist as exc:
        raise Http404("Learner not found.") from exc
    operations = serialize_enrollment_operations(enrollment)
    return render(
        request,
        "Instructor/Students/Operations",
        {
            "program": {"id": program.id, "name": program.name},
            "learner": {
                "enrollmentId": enrollment.id,
                "name": enrollment.user.get_full_name() or enrollment.user.email,
                "email": enrollment.user.email,
                "status": enrollment.status,
                "enrolledAt": enrollment.enrolled_at.isoformat(),
                "grades": enrollment.grades or {},
                **operations,
            },
        },
    )


@ensure_csrf_cookie
def course_invitation_page(request, token):
    try:
        invitation = get_invitation_by_token(token)
    except ValidationError:
        return render(
            request,
            "Enrollments/InvitationAccept",
            {"invitation": None, "token": token},
        )
    User = get_user_model()
    account_exists = User.objects.filter(email__iexact=invitation.email).exists()
    return render(
        request,
        "Enrollments/InvitationAccept",
        {
            "token": token,
            "invitation": {
                "email": invitation.email,
                "program": {
                    "id": invitation.program_id,
                    "name": invitation.program.name,
                },
                "expiresAt": invitation.expires_at.isoformat(),
                "accountExists": account_exists,
            },
        },
    )
