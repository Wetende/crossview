import json
from typing import Optional, Set

from django.core.exceptions import PermissionDenied
from django.http import RawPostDataException

from .models import User


def _coerce_post_querydict(post_data) -> dict:
    data = {}
    for key, values in post_data.lists():
        if len(values) == 1:
            value = values[0]
            if isinstance(value, str):
                stripped = value.strip()
                if stripped.startswith("[") or stripped.startswith("{"):
                    try:
                        data[key] = json.loads(stripped)
                        continue
                    except (json.JSONDecodeError, ValueError):
                        pass
            data[key] = value
        else:
            data[key] = values
    return data


def get_post_data(request) -> dict:
    """
    Get POST data from request, handling both form-encoded and JSON data.

    Inertia.js commonly sends JSON payloads, but some forms in the app still
    submit form-encoded data.
    """
    content_type = str(getattr(request, "content_type", "") or "")
    is_form_submission = any(
        form_content_type in content_type
        for form_content_type in (
            "application/x-www-form-urlencoded",
            "multipart/form-data",
        )
    )

    if is_form_submission:
        return _coerce_post_querydict(request.POST) if request.POST else {}

    try:
        body = request.body
    except RawPostDataException:
        return _coerce_post_querydict(request.POST) if request.POST else {}

    if body:
        body_stripped = body.lstrip()

        if "application/json" in content_type or body_stripped.startswith(
            (b"{", b"[")
        ):
            try:
                return json.loads(body)
            except (json.JSONDecodeError, ValueError):
                pass

    if request.POST:
        return _coerce_post_querydict(request.POST)

    return {}


def get_requested_inertia_props(request) -> Optional[Set[str]]:
    """
    Return the set of requested partial props for an Inertia partial reload.

    Returns ``None`` for non-partial requests so callers can treat that as
    "compute everything".
    """
    partial_data = request.META.get("HTTP_X_INERTIA_PARTIAL_DATA", "")
    if not partial_data:
        return None
    return {part.strip() for part in partial_data.split(",") if part.strip()}


def should_render_inertia_prop(request, *prop_names: str) -> bool:
    """
    Check whether any of the given prop names were requested by a partial reload.
    """
    requested_props = get_requested_inertia_props(request)
    if requested_props is None:
        return True
    return any(prop_name in requested_props for prop_name in prop_names)


def is_instructor(user) -> bool:
    """Check if user is instructor (or higher)."""
    if not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    return hasattr(user, "groups") and user.groups.filter(name="Instructors").exists()


def get_instructor_program_ids(user) -> list:
    """
    Get list of program IDs assigned to this instructor.

    Superusers and staff get access to all programs.
    """
    if user.is_superuser or user.is_staff:
        from apps.core.models import Program

        return list(Program.objects.values_list("id", flat=True))

    from apps.progression.models import InstructorAssignment

    return list(
        InstructorAssignment.objects.filter(instructor=user).values_list(
            "program_id", flat=True
        )
    )


def require_instructor(user):
    """Raise PermissionDenied if user is not an instructor."""
    if not is_instructor(user):
        raise PermissionDenied("Instructor access is required.")


def is_admin(user) -> bool:
    """Check if user is admin or superadmin."""
    if not user.is_authenticated:
        return False
    return user.is_staff or user.is_superuser


def is_superadmin(user) -> bool:
    """
    Check if user is a superadmin (platform owner, not just client admin).
    """
    if not user.is_authenticated:
        return False
    return user.is_superuser


def get_client_ip(request) -> Optional[str]:
    """Extract client IP from request."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def serialize_user(user: User) -> dict:
    """Serialize user for frontend."""
    return {
        "id": user.id,
        "email": user.email,
        "first_name": getattr(user, 'first_name', ''),
        "last_name": getattr(user, 'last_name', ''),
        "phone": getattr(user, 'phone', ''),
        "name": user.get_full_name() or user.email,
        "avatar": None,
    }
