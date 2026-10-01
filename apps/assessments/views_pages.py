"""Question library pages for instructors and administrators."""

from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.shortcuts import redirect
from inertia import render

from apps.core.models import Program
from apps.core.utils import get_instructor_program_ids, is_admin, is_instructor

from .question_bank_access import manageable_question_banks, visible_question_banks
from .question_bank_service import QuestionBankService
from .serializers import QuestionBankSerializer


def _serialized_banks(request, banks):
    return QuestionBankSerializer(banks, many=True, context={"request": request}).data


@login_required
def instructor_question_library(request):
    """Every bank the instructor can use, with their questions."""
    if not is_instructor(request.user):
        return redirect("/dashboard/")
    programs = Program.objects.filter(
        id__in=get_instructor_program_ids(request.user)
    ).order_by("name")
    return render(
        request,
        "Instructor/QuestionLibrary/Index",
        {
            "banks": _serialized_banks(
                request, visible_question_banks(request.user, include_archived=True)
            ),
            "programs": [{"id": program.id, "name": program.name} for program in programs],
            "categories": QuestionBankService().list_categories(request.user),
            "canCreateShared": is_admin(request.user),
            "role": "admin" if is_admin(request.user) else "instructor",
            "filters": {
                "bank": request.GET.get("bank") or None,
                "query": request.GET.get("q") or "",
            },
        },
    )


@login_required
def admin_question_banks(request):
    """Shared banks, plus every other bank an administrator may promote."""
    if not is_admin(request.user):
        return redirect("/dashboard/")
    banks = manageable_question_banks(request.user).annotate(
        pool_count=Count("quiz_pools", distinct=True)
    )
    return render(
        request,
        "Admin/QuestionBanks/Index",
        {
            "banks": _serialized_banks(request, banks),
            "poolCounts": {str(bank.id): bank.pool_count for bank in banks},
            "categories": QuestionBankService().list_categories(request.user),
            "tab": request.GET.get("tab") or "shared",
        },
    )
