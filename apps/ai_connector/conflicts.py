"""
Stop course-builder saves from silently overwriting changes saved through an AI app.

The builder saves whole objects (a lesson's full properties, a quiz's full
question list, the whole course settings form). If an editor was opened before
an AI change was applied, saving it would undo that change. Editors send the
version they loaded; a save is refused when an AI change touching the same
item was applied after that version.

Only AI changes are considered, so a person's own overlapping autosaves and
uploads never conflict with each other.
"""

from django.db import transaction
from django.utils.dateparse import parse_datetime

from .models import CourseChange

EDIT_CONFLICT_TAG = "edit-conflict"
EDIT_CONFLICT_MESSAGE = (
    "This was changed through a connected AI app after you opened it, so your "
    "latest edit was not saved. Reload the page to see the current version."
)
NODE_FIELDS = ("module_id", "lesson_id", "quiz_lesson_id")


def changed_by_ai_since(program_id, since, *, node_id=None, course_fields=False) -> bool:
    """Whether an applied AI change touched the node or course fields after ``since``."""
    moment = parse_datetime(str(since or ""))
    if moment is None or program_id is None:
        return False
    applied = CourseChange.objects.filter(
        program_id=program_id,
        status=CourseChange.Status.APPLIED,
        applied_at__gt=moment,
    ).values_list("operations", flat=True)
    for operations in applied:
        for operation in operations:
            if course_fields and operation.get("op") == "update_course":
                return True
            if node_id is not None and any(operation.get(field) == node_id for field in NODE_FIELDS):
                return True
    return False


def save_unless_changed_by_ai(instance, expected_version, *, program_id, node_id=None, course_fields=False) -> bool:
    """
    Save ``instance`` unless an AI change made it stale; return whether it saved.

    The row lock makes the check and the save atomic with respect to an AI
    change, which locks the same rows before checking its own versions.
    """
    with transaction.atomic():
        type(instance).objects.select_for_update().only("pk").get(pk=instance.pk)
        if changed_by_ai_since(program_id, expected_version, node_id=node_id, course_fields=course_fields):
            return False
        instance.save()
    return True
