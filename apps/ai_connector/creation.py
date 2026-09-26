"""Previewed, atomic creation of unpublished LMS courses."""

import json
import logging
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.core.models import Program
from apps.core.views import _default_custom_pricing_for_program_data, _validate_program_setup_data
from apps.platform.models import PlatformSettings
from apps.progression.models import InstructorAssignment

from .access import AccessDenied, ConnectorError, WRITE_SCOPE, can_use_connector, get_program_for_user, require_scope
from .changes import _client_name, _finish, _load_own_change, _require_same_client
from .content import Links
from .models import CourseChange
from .operations import (
    MAX_BODY_HTML, MAX_DESCRIPTION_HTML, _apply_create_module, _apply_create_quiz,
    _apply_create_text_lesson, _duration, _html, _text,
)
from .questions import describe, normalize_question_list
from .sanitize import plain_text

logger = logging.getLogger(__name__)

MAX_MODULES = 20
MAX_ITEMS = 100
MAX_COURSE_PAYLOAD_BYTES = 2_000_000


def creation_options(user) -> dict:
    if not can_use_connector(user):
        raise AccessDenied("This account cannot create LMS courses.")
    platform = PlatformSettings.objects.filter(pk=1).select_related("active_blueprint").first()
    if platform is None:
        raise ConnectorError("LMS platform settings are not configured yet.")
    blueprint = platform.active_blueprint
    return {
        "categories": platform.get_program_categories(),
        "levels": platform.get_course_levels(),
        "active_blueprint": (
            {"id": blueprint.id, "name": blueprint.name, "structure_labels": blueprint.hierarchy_structure}
            if blueprint else None
        ),
        "note": "New courses are unpublished; no connector tool publishes or deletes them.",
    }


def _normalize_course(raw):
    if not isinstance(raw, dict):
        raise ConnectorError("Course must be an object.")
    allowed_course_fields = {
        "title", "code", "category", "level", "description_html",
        "learning_outcomes", "modules",
    }
    unknown = set(raw) - allowed_course_fields
    if unknown:
        raise ConnectorError(f"Unsupported new-course fields: {', '.join(sorted(unknown))}.")
    title = _text(raw, "title", 255, required=True, min_length=3)
    code = _text(raw, "code", 50, required=True)
    description = _html(raw, "description_html", MAX_DESCRIPTION_HTML)
    outcomes = raw.get("learning_outcomes") or []
    if not isinstance(outcomes, list) or len(outcomes) > 30:
        raise ConnectorError("learning_outcomes must be a list of at most 30 items.")
    outcomes = [plain_text(item) for item in outcomes]
    if any(not item or len(item) > 300 for item in outcomes):
        raise ConnectorError("Each learning outcome must contain 1-300 plain-text characters.")
    modules = raw.get("modules") or []
    if not isinstance(modules, list) or len(modules) > MAX_MODULES:
        raise ConnectorError(f"Provide at most {MAX_MODULES} modules.")
    normalized_modules = []
    item_count = 0
    for module in modules:
        if not isinstance(module, dict):
            raise ConnectorError("Each module must be an object.")
        unknown = set(module) - {"title", "description", "items"}
        if unknown:
            raise ConnectorError(f"Unsupported module fields: {', '.join(sorted(unknown))}.")
        items = module.get("items") or []
        if not isinstance(items, list):
            raise ConnectorError("Module items must be a list.")
        item_count += len(items)
        if item_count > MAX_ITEMS:
            raise ConnectorError(f"A course may contain at most {MAX_ITEMS} initial items.")
        normalized_items = []
        for item in items:
            if not isinstance(item, dict):
                raise ConnectorError("Each item must be an object.")
            kind = item.get("type")
            if kind == "text_lesson":
                unknown = set(item) - {"type", "title", "body_html", "duration", "description"}
                if unknown:
                    raise ConnectorError(f"Unsupported text-lesson fields: {', '.join(sorted(unknown))}.")
                normalized_items.append({
                    "type": kind,
                    "title": _text(item, "title", 255, required=True, min_length=3),
                    "body_html": _html(item, "body_html", MAX_BODY_HTML, required=True),
                    "duration": _duration(item),
                    "description": _text(item, "description", 1000) or "",
                })
            elif kind == "quiz":
                unknown = set(item) - {"type", "title", "description", "questions"}
                if unknown:
                    raise ConnectorError(f"Unsupported quiz fields: {', '.join(sorted(unknown))}.")
                normalized_items.append({
                    "type": kind,
                    "title": _text(item, "title", 100, required=True, min_length=5),
                    "description": _text(item, "description", 2000) or "",
                    "questions": normalize_question_list(item.get("questions")),
                })
            else:
                raise ConnectorError("Initial items support text_lesson and quiz only.")
        normalized_modules.append({
            "title": _text(module, "title", 255, required=True, min_length=3),
            "description": _text(module, "description", 1000) or "",
            "items": normalized_items,
        })
    normalized = {
        "title": title, "code": code, "category": _text(raw, "category", 100) or "",
        "level": _text(raw, "level", 100) or "",
        "description_html": description or "", "learning_outcomes": outcomes,
        "modules": normalized_modules,
    }
    if len(json.dumps(normalized, ensure_ascii=False).encode("utf-8")) > MAX_COURSE_PAYLOAD_BYTES:
        raise ConnectorError("The new-course preview is too large; split authoring into smaller confirmed changes.")
    return normalized


def _setup_data(course):
    return {
        "name": course["title"], "code": course["code"], "category": course["category"],
        "level": course["level"], "description": course["description_html"],
        "previewDescription": plain_text(course["description_html"])[:1000],
        "lockLessonsInOrder": True,
    }


def _validated_setup(course):
    cleaned, errors = _validate_program_setup_data(_setup_data(course))
    if errors:
        raise ConnectorError("Course setup is invalid: " + "; ".join(f"{key}: {value}" for key, value in errors.items()))
    from apps.core.taxonomy import validate_builder_hierarchy
    blueprint = PlatformSettings.get_settings().active_blueprint
    valid, reason = validate_builder_hierarchy(blueprint.hierarchy_structure if blueprint else None)
    if not valid:
        raise ConnectorError(f"The active course blueprint cannot support a two-level builder: {reason}")
    return cleaned


def prepare_course(*, user, token, links: Links, course):
    require_scope(token, WRITE_SCOPE)
    if not can_use_connector(user):
        raise AccessDenied("This account cannot create LMS courses.")
    normalized = _normalize_course(course)
    cleaned = _validated_setup(normalized)
    preview = {
        **normalized,
        "modules": [
            {**module, "items": [
                {**item, "questions": [describe(q) for q in item["questions"]]}
                if item["type"] == "quiz" else item for item in module["items"]
            ]}
            for module in normalized["modules"]
        ],
    }
    change = CourseChange.objects.create(
        user=user, user_email=user.email or "", kind="course_create",
        program_code=normalized["code"],
        application=getattr(token, "application", None), client_name=_client_name(token),
        summary=f"Create unpublished course {normalized['title']}",
        operations=[{"op": "create_course", "course": normalized}],
        preview=preview, target_versions={"blueprint_id": cleaned["blueprint_id"]},
        expires_at=timezone.now() + timedelta(hours=getattr(settings, "AI_CONNECTOR_CHANGE_TTL_HOURS", 24)),
    )
    return {
        "change_id": str(change.id), "status": change.status,
        "preview": preview, "is_published": False,
        "note": "Nothing has been saved. Show the complete preview and ask for explicit confirmation before applying.",
        "expires_at": change.expires_at.isoformat(),
    }


def _create_course(user, course, cleaned, links):
    program = Program.objects.create(
        blueprint_id=cleaned["blueprint_id"], name=cleaned["name"], code=cleaned["code"],
        category=cleaned["category"], description=cleaned["description"],
        preview_description=cleaned["preview_description"], level=cleaned["level"],
        lock_lessons_in_order=True, is_published=False,
        custom_pricing=_default_custom_pricing_for_program_data(cleaned),
    )
    if not user.is_staff and not user.is_superuser:
        InstructorAssignment.objects.create(program=program, instructor=user, role="instructor", is_primary=True)
    if course["learning_outcomes"]:
        from apps.core.learning_outcomes import resolve_learning_outcomes_html
        program.what_you_learn_html = resolve_learning_outcomes_html("", course["learning_outcomes"])
        program.save(update_fields=["what_you_learn_html", "what_you_learn_items", "updated_at"])
    for module in course["modules"]:
        result = _apply_create_module(program, {"title": module["title"], "description": module["description"]}, links)
        module_id = result["id"]
        for item in module["items"]:
            if item["type"] == "text_lesson":
                _apply_create_text_lesson(program, {"module_id": module_id, **item}, links)
            else:
                _apply_create_quiz(program, {"module_id": module_id, **item}, links)
    return program


def apply_course(*, user, token, links: Links, change_id):
    require_scope(token, WRITE_SCOPE)
    error = None
    with transaction.atomic():
        change = _load_own_change(user, change_id, lock=True)
        _require_same_client(change, token)
        if change.kind != "course_create":
            raise ConnectorError("This is not a prepared new-course change.")
        if change.status == CourseChange.Status.APPLIED:
            if not can_use_connector(user):
                raise AccessDenied("You no longer have LMS connector access.")
            get_program_for_user(user, change.program_id)
            return {"change_id": str(change.id), "status": "applied", **change.result, "replayed": True}
        if change.status != CourseChange.Status.PREPARED:
            raise ConnectorError(f"This change is {change.status}; prepare a fresh preview.")
        if change.expires_at <= timezone.now():
            error = "The preview expired. Prepare a new course preview."
            _finish(change, CourseChange.Status.EXPIRED, error=error)
        elif not can_use_connector(user):
            error = "Your account can no longer create courses."
            _finish(change, CourseChange.Status.REJECTED, error=error)
        else:
            course = change.operations[0]["course"]
            try:
                cleaned = _validated_setup(course)
                if cleaned["blueprint_id"] != change.target_versions["blueprint_id"]:
                    raise ConnectorError("The active course blueprint changed; prepare a fresh preview.")
                with transaction.atomic():
                    program = _create_course(user, course, cleaned, links)
            except (ConnectorError, IntegrityError) as exc:
                error = f"Nothing was created: {exc}. Prepare a fresh preview."
                _finish(change, CourseChange.Status.STALE, error=error)
            except Exception:
                logger.exception("AI connector new-course change %s failed", change.id)
                error = "The course could not be created; nothing was saved."
                _finish(change, CourseChange.Status.FAILED, error=error)
            else:
                change.program = program
                change.save(update_fields=["program"])
                _finish(change, CourseChange.Status.APPLIED, token=token, result={
                    "course": {"id": program.id, "code": program.code, "title": program.name, "is_published": False},
                    "links": {"builder": links.builder(program.id), "preview": links.preview(program.id)},
                    "message": "Created an unpublished course; you can edit it further in the LMS.",
                })
    if error:
        raise ConnectorError(error)
    return {"change_id": str(change.id), "status": "applied", **change.result}
