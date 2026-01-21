import json
from django.core.exceptions import PermissionDenied

def get_post_data(request) -> dict:
    """
    Get POST data from request, handling both form-encoded and JSON data.
    Inertia.js sends data as JSON, so we need to parse request.body.
    """
    # First try request.POST (form-encoded data)
    if request.POST:
        return request.POST.dict()

    # If empty, try parsing JSON from request.body (Inertia sends JSON)
    if request.body:
        try:
            return json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            # In a real API we might want to raise a 400 here,
            # but for now we return empty dict to avoid crashing
            return {}

    return {}

def is_instructor(user) -> bool:
    """Check if user is instructor (or higher)."""
    if not user.is_authenticated:
        return False
    if user.is_superuser or user.is_staff:
        return True
    return hasattr(user, "groups") and user.groups.filter(name="Instructors").exists()

def get_instructor_program_ids(user) -> list:
    """Get list of program IDs assigned to this instructor.
    Superusers/staff get access to all programs.
    """
    if user.is_superuser or user.is_staff:
        from apps.core.models import Program
        return list(Program.objects.values_list("id", flat=True))
    
    from apps.progression.models import InstructorAssignment
    return list(InstructorAssignment.objects.filter(instructor=user).values_list("program_id", flat=True))

def require_instructor(user):
    """
    Raise PermissionDenied if user is not an instructor.
    Useful for direct checks in views.
    """

from typing import Optional
from .models import User

def is_admin(user) -> bool:
    """Check if user is admin or superadmin."""
    if not user.is_authenticated:
        return False
    return user.is_staff or user.is_superuser


def is_superadmin(user) -> bool:
    """Check if user is a superadmin (platform owner, not just client admin).
    
    Superadmins have is_superuser=True and can manage blueprints, presets,
    and platform-wide settings. Client admins (is_staff=True only) cannot
    modify blueprints as that would break the academic structure.
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
        "name": user.get_full_name() or user.email,
        "avatar": None,  # TODO: Add avatar
    }

