from django.core.exceptions import ValidationError
from django.http import Http404
from rest_framework import permissions

from apps.core.utils import get_instructor_program_ids, is_instructor


class IsInstructorOrStaff(permissions.BasePermission):
    """Require an authenticated instructor, staff user, or superuser."""

    message = "Instructor access is required."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and is_instructor(user))


def scope_queryset_to_instructor_programs(queryset, user, program_lookup: str):
    """
    Restrict a queryset to the programs the instructor can access.
    """
    return queryset.filter(**{f"{program_lookup}__in": get_instructor_program_ids(user)})


def get_object_in_instructor_scope(queryset, user, program_lookup: str, **lookup):
    """
    Fetch a single object from a queryset already scoped to the instructor's programs.
    """
    scoped_queryset = scope_queryset_to_instructor_programs(
        queryset,
        user,
        program_lookup,
    )
    try:
        return scoped_queryset.get(**lookup)
    except (queryset.model.DoesNotExist, TypeError, ValueError, ValidationError) as exc:
        raise Http404("Not found.") from exc
