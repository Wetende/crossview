"""Who can see, use, edit and delete question banks and their entries.

Course banks belong to one course and are shared by its instructors.
Instructor libraries belong to their owner and work in every course they
teach. Shared banks are managed by administrators and usable by every
instructor.
"""

from __future__ import annotations

from django.db.models import Count, Q
from django.http import Http404

from apps.core.utils import get_instructor_program_ids, is_admin
from apps.core.utils import is_instructor as _user_is_instructor

from .models import QuestionBank, QuestionBankEntry


def _cached(user, attribute, compute):
    # Permission checks run once per bank or entry in a listing; remember the
    # answers on the user object, which lives for one request.
    value = getattr(user, attribute, None)
    if value is None:
        value = compute()
        try:
            setattr(user, attribute, value)
        except AttributeError:
            pass
    return value


def is_instructor(user) -> bool:
    return _cached(user, "_question_bank_is_instructor", lambda: _user_is_instructor(user))


def _program_ids(user):
    return _cached(
        user,
        "_question_bank_program_ids",
        lambda: frozenset(get_instructor_program_ids(user)),
    )


def _bank_filter(user, *, program=None, prefix=""):
    course = QuestionBank.SCOPE_COURSE
    program_ids = _program_ids(user)
    if program is not None:
        program_ids = [program.pk] if program.pk in program_ids else []
    return (
        Q(**{f"{prefix}scope": QuestionBank.SCOPE_INSTITUTION})
        | Q(**{f"{prefix}scope": QuestionBank.SCOPE_INSTRUCTOR, f"{prefix}owner": user})
        | Q(**{f"{prefix}scope": course, f"{prefix}program_id__in": program_ids})
    )


def _with_counts(queryset):
    return (
        queryset.select_related("program", "owner")
        .annotate(entries_count_annotated=Count("entries"))
        .order_by("scope", "name", "id")
    )


def visible_question_banks(user, *, program=None, include_archived=False):
    """Banks the user may pick from, optionally for use in one course."""
    if not is_instructor(user):
        return QuestionBank.objects.none()
    queryset = QuestionBank.objects.filter(_bank_filter(user, program=program))
    if not include_archived:
        queryset = queryset.filter(is_archived=False)
    return _with_counts(queryset)


def manageable_question_banks(user):
    """Every bank for administrators; otherwise the user's visible banks."""
    if is_admin(user):
        return _with_counts(QuestionBank.objects.all())
    return visible_question_banks(user, include_archived=True)


def can_create_bank(user, scope, program=None) -> bool:
    if not is_instructor(user):
        return False
    if scope == QuestionBank.SCOPE_COURSE:
        return program is not None and program.pk in _program_ids(user)
    if scope == QuestionBank.SCOPE_INSTRUCTOR:
        return True
    if scope == QuestionBank.SCOPE_INSTITUTION:
        return is_admin(user)
    return False


def can_use_bank(user, bank, *, program=None) -> bool:
    """Whether the user may copy from or draw pools from the bank."""
    return visible_question_banks(user, program=program).filter(pk=bank.pk).exists()


def can_edit_bank(user, bank) -> bool:
    if not is_instructor(user):
        return False
    if is_admin(user):
        return True
    if bank.scope == QuestionBank.SCOPE_COURSE:
        return bank.program_id in _program_ids(user)
    if bank.scope == QuestionBank.SCOPE_INSTRUCTOR:
        return bank.owner_id == user.pk
    return False


def can_delete_bank(user, bank) -> bool:
    if is_admin(user):
        return True
    if not is_instructor(user) or bank.scope == QuestionBank.SCOPE_INSTITUTION:
        return False
    return bank.owner_id == user.pk


def can_edit_entry(user, entry) -> bool:
    if entry.bank_id:
        return can_edit_bank(user, entry.bank)
    return is_admin(user) or (is_instructor(user) and entry.owner_id == user.pk)


def can_delete_entry(user, entry) -> bool:
    if is_admin(user):
        return True
    if not is_instructor(user):
        return False
    if entry.bank_id and entry.bank.scope == QuestionBank.SCOPE_INSTITUTION:
        return False
    return entry.owner_id == user.pk


def get_visible_bank_or_404(user, bank_id, *, program=None, include_archived=False):
    try:
        bank_id = int(bank_id)
    except (TypeError, ValueError):
        raise Http404("Question bank not found.")
    bank = (
        visible_question_banks(user, program=program, include_archived=include_archived)
        .filter(pk=bank_id)
        .first()
    )
    if bank is None:
        raise Http404("Question bank not found.")
    return bank


def visible_entries(user, *, program=None, include_archived=False):
    """Bank entries the user may see: those in visible banks plus their own loose entries."""
    if not is_instructor(user):
        return QuestionBankEntry.objects.none()
    in_visible_bank = _bank_filter(user, program=program, prefix="bank__")
    if not include_archived:
        in_visible_bank &= Q(bank__is_archived=False)
    return QuestionBankEntry.objects.filter(
        in_visible_bank | Q(bank__isnull=True, owner=user)
    ).select_related("bank", "owner", "question")
