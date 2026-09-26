"""
Access rules for the AI connector.

The connector never widens what a person can already do in the course builder:
administrators reach every course, instructors reach only the courses they are
assigned to, and everyone else reaches nothing. Every check reads current
database state, so removed assignments or disabled accounts take effect on the
next request.
"""

from django.conf import settings

from apps.core.models import Program
from apps.core.utils import is_instructor

READ_SCOPE = "courses:read"
WRITE_SCOPE = "courses:write"


class ConnectorError(Exception):
    """An actionable error returned to the AI client instead of a stack trace."""


class AccessDenied(ConnectorError):
    pass


def connector_enabled() -> bool:
    return bool(getattr(settings, "AI_CONNECTOR_ENABLED", False))


def can_use_connector(user) -> bool:
    return bool(
        user is not None
        and getattr(user, "is_authenticated", False)
        and user.is_active
        and is_instructor(user)
    )


def accessible_programs(user):
    """Return the courses this user may author, as a queryset."""
    if not can_use_connector(user):
        return Program.objects.none()
    if user.is_staff or user.is_superuser:
        return Program.objects.all()
    return Program.objects.filter(instructor_assignments__instructor=user).distinct()


def get_program_for_user(user, program_id) -> Program:
    """Return a course the user may author, or raise without revealing whether it exists."""
    try:
        program_id = int(program_id)
    except (TypeError, ValueError):
        raise AccessDenied("Course IDs are whole numbers. Use search_courses to find one.")
    program = (
        accessible_programs(user).select_related("blueprint").filter(pk=program_id).first()
    )
    if program is None:
        raise AccessDenied(
            f"Course {program_id} was not found among the courses you can manage."
        )
    return program


def token_scopes(token) -> set[str]:
    return set(str(getattr(token, "scope", "") or "").split())


def require_scope(token, scope: str) -> None:
    if scope not in token_scopes(token):
        if scope == WRITE_SCOPE:
            raise AccessDenied(
                "This connection can read courses but was not authorized to save "
                "changes. Disconnect and reconnect the app, then allow course changes."
            )
        raise AccessDenied(f"This connection is missing the {scope} permission.")
