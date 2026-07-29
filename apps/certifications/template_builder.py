"""Application services for the visual certificate template builder."""

from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from decimal import Decimal, InvalidOperation
from uuid import uuid4

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from apps.certifications.models import (
    CertificateTemplate,
    CertificateTemplateVersion,
)


ALLOWED_ELEMENT_TYPES = {
    "text",
    "dynamic_text",
    "image",
    "signature",
    "line",
    "shape",
    "qr_code",
}
ALLOWED_ORIENTATIONS = {
    CertificateTemplateVersion.Orientation.LANDSCAPE,
    CertificateTemplateVersion.Orientation.PORTRAIT,
}
PAGE_SIZES = {
    CertificateTemplateVersion.Orientation.LANDSCAPE: (Decimal("297"), Decimal("210")),
    CertificateTemplateVersion.Orientation.PORTRAIT: (Decimal("210"), Decimal("297")),
}
MAX_ELEMENTS = 100
MAX_LAYOUT_BYTES = 250_000


def can_manage_templates(user) -> bool:
    """Return whether a user can access the first admin-only builder release."""
    return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))


def require_template_manager(user) -> None:
    if not can_manage_templates(user):
        raise PermissionDenied("You do not have permission to manage certificate templates.")


def require_viewable_template(template: CertificateTemplate, user) -> None:
    require_template_manager(user)
    if (
        template.visibility == CertificateTemplate.Visibility.SYSTEM
        or template.owner_id == user.id
        or user.is_superuser
    ):
        return
    raise PermissionDenied("You do not have permission to view this certificate template.")


def require_editable_template(template: CertificateTemplate, user) -> None:
    """Protect system starters and enforce template ownership boundaries."""
    require_template_manager(user)
    if template.is_starter or template.visibility == CertificateTemplate.Visibility.SYSTEM:
        raise PermissionDenied("System starter templates must be copied before editing.")
    if template.owner_id and template.owner_id != user.id and not user.is_superuser:
        raise PermissionDenied("You do not have permission to edit this certificate template.")


def blank_layout(width_mm=Decimal("297"), height_mm=Decimal("210")) -> dict:
    page_width = float(width_mm)
    page_height = float(height_mm)
    content_width = round(page_width * 0.7, 3)
    content_x = round((page_width - content_width) / 2, 3)
    return {
        "schemaVersion": 1,
        "background": {
            "color": "#ffffff",
            "image": None,
        },
        "safeAreaMm": 10,
        "theme": {
            "accent": "#3157d5",
            "border": "#3157d5",
        },
        "elements": [
            {
                "id": f"student-{uuid4().hex[:10]}",
                "type": "dynamic_text",
                "x": content_x,
                "y": round(page_height * 0.34, 3),
                "width": content_width,
                "height": round(page_height * 0.12, 3),
                "rotation": 0,
                "locked": False,
                "hidden": False,
                "zIndex": 1,
                "content": "{{student_name}}",
                "styles": {
                    "fontFamily": "Albert Sans",
                    "fontSize": 30,
                    "fontWeight": 700,
                    "color": "#172033",
                    "textAlign": "center",
                    "lineHeight": 1.2,
                    "letterSpacing": 0,
                },
            },
            {
                "id": f"course-{uuid4().hex[:10]}",
                "type": "dynamic_text",
                "x": content_x,
                "y": round(page_height * 0.55, 3),
                "width": content_width,
                "height": round(page_height * 0.085, 3),
                "rotation": 0,
                "locked": False,
                "hidden": False,
                "zIndex": 2,
                "content": "{{program_title}}",
                "styles": {
                    "fontFamily": "Albert Sans",
                    "fontSize": 20,
                    "fontWeight": 600,
                    "color": "#3157d5",
                    "textAlign": "center",
                    "lineHeight": 1.2,
                    "letterSpacing": 0,
                },
            },
        ],
    }


def _number(value, field_name: str, *, minimum=None, maximum=None) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError, InvalidOperation) as exc:
        raise ValidationError({field_name: "Must be a number."}) from exc
    if minimum is not None and parsed < minimum:
        raise ValidationError({field_name: f"Must be at least {minimum}."})
    if maximum is not None and parsed > maximum:
        raise ValidationError({field_name: f"Must be no more than {maximum}."})
    return round(parsed, 3)


def validate_layout(layout: dict, *, width_mm, height_mm) -> dict:
    """Validate and normalize the bounded JSON document used by the builder."""
    if not isinstance(layout, dict):
        raise ValidationError({"layout": "Layout must be an object."})
    try:
        encoded = json.dumps(layout, separators=(",", ":"), sort_keys=True)
    except (TypeError, ValueError) as exc:
        raise ValidationError({"layout": "Layout must contain valid JSON values."}) from exc
    if len(encoded.encode("utf-8")) > MAX_LAYOUT_BYTES:
        raise ValidationError({"layout": "Layout is too large."})

    elements = layout.get("elements", [])
    if not isinstance(elements, list):
        raise ValidationError({"layout": "Elements must be a list."})
    if len(elements) > MAX_ELEMENTS:
        raise ValidationError({"layout": f"A certificate can contain up to {MAX_ELEMENTS} elements."})

    page_width = float(width_mm)
    page_height = float(height_mm)
    normalized_elements = []
    seen_ids = set()
    for index, raw in enumerate(elements):
        if not isinstance(raw, dict):
            raise ValidationError({"layout": f"Element {index + 1} must be an object."})
        element_id = str(raw.get("id") or "").strip()
        if not element_id or len(element_id) > 100 or element_id in seen_ids:
            raise ValidationError({"layout": f"Element {index + 1} has an invalid or duplicate ID."})
        seen_ids.add(element_id)

        element_type = str(raw.get("type") or "").strip()
        if element_type not in ALLOWED_ELEMENT_TYPES:
            raise ValidationError({"layout": f"Element {index + 1} has an unsupported type."})

        width = _number(raw.get("width"), "width", minimum=1, maximum=page_width)
        height = _number(raw.get("height"), "height", minimum=1, maximum=page_height)
        x = _number(raw.get("x"), "x", minimum=0, maximum=page_width - width)
        y = _number(raw.get("y"), "y", minimum=0, maximum=page_height - height)
        rotation = _number(raw.get("rotation", 0), "rotation", minimum=-360, maximum=360)
        content = str(raw.get("content") or "")[:2000]
        styles = raw.get("styles") if isinstance(raw.get("styles"), dict) else {}

        normalized = deepcopy(raw)
        normalized.update(
            {
                "id": element_id,
                "type": element_type,
                "x": x,
                "y": y,
                "width": width,
                "height": height,
                "rotation": rotation,
                "locked": bool(raw.get("locked", False)),
                "hidden": bool(raw.get("hidden", False)),
                "zIndex": int(raw.get("zIndex", index + 1)),
                "content": content,
                "styles": styles,
            }
        )
        normalized_elements.append(normalized)

    background = layout.get("background")
    if not isinstance(background, dict):
        background = {"color": "#ffffff", "image": None}

    normalized_layout = deepcopy(layout)
    normalized_layout.update(
        {
            "schemaVersion": 1,
            "background": {
                "color": str(background.get("color") or "#ffffff")[:50],
                "image": background.get("image"),
            },
            "safeAreaMm": _number(
                layout.get("safeAreaMm", 10),
                "safeAreaMm",
                minimum=0,
                maximum=min(page_width, page_height) / 3,
            ),
            "elements": normalized_elements,
        }
    )
    return normalized_layout


def serialize_template(template: CertificateTemplate) -> dict:
    version = template.current_version
    metadata = template.metadata or {}
    return {
        "id": template.id,
        "name": template.name,
        "description": metadata.get("description", ""),
        "status": template.status,
        "visibility": template.visibility,
        "isStarter": template.is_starter,
        "sourceTemplateId": template.source_template_id,
        "updatedAt": template.updated_at.isoformat(),
        "version": version.version_number if version else None,
        "orientation": version.orientation if version else None,
        "widthMm": float(version.width_mm) if version else None,
        "heightMm": float(version.height_mm) if version else None,
        "layout": version.layout if version else None,
    }


@transaction.atomic
def create_blank_template(*, name: str, orientation: str, user) -> CertificateTemplate:
    require_template_manager(user)
    name = str(name or "").strip()[:255]
    if not name:
        raise ValidationError({"name": "Enter a template name."})
    if orientation not in ALLOWED_ORIENTATIONS:
        raise ValidationError({"orientation": "Choose portrait or landscape."})
    width_mm, height_mm = PAGE_SIZES[orientation]
    template = CertificateTemplate.objects.create(
        name=name,
        owner=user,
        visibility=CertificateTemplate.Visibility.PRIVATE,
        status=CertificateTemplate.Status.DRAFT,
        current_version_number=1,
        metadata={"description": "Custom certificate template"},
    )
    CertificateTemplateVersion.objects.create(
        template=template,
        version_number=1,
        orientation=orientation,
        width_mm=width_mm,
        height_mm=height_mm,
        layout=validate_layout(
            blank_layout(width_mm, height_mm),
            width_mm=width_mm,
            height_mm=height_mm,
        ),
        created_by=user,
    )
    return template


@transaction.atomic
def clone_template(*, source: CertificateTemplate, name: str, user) -> CertificateTemplate:
    require_template_manager(user)
    source_version = source.current_version
    if source_version is None:
        raise ValidationError({"template": "This template has no visual layout to copy."})
    clone_name = str(name or f"{source.name} copy").strip()[:255]
    if not clone_name:
        raise ValidationError({"name": "Enter a template name."})
    template = CertificateTemplate.objects.create(
        name=clone_name,
        owner=user,
        visibility=CertificateTemplate.Visibility.PRIVATE,
        status=CertificateTemplate.Status.DRAFT,
        source_template=source,
        current_version_number=1,
        metadata={
            "description": (source.metadata or {}).get("description", ""),
        },
    )
    CertificateTemplateVersion.objects.create(
        template=template,
        version_number=1,
        orientation=source_version.orientation,
        width_mm=source_version.width_mm,
        height_mm=source_version.height_mm,
        layout=deepcopy(source_version.layout),
        created_by=user,
    )
    return template


@transaction.atomic
def save_template(*, template: CertificateTemplate, name: str, layout: dict, user):
    require_editable_template(template, user)
    version = template.current_version
    if version is None:
        raise ValidationError({"template": "This template has no editable layout."})

    normalized_name = str(name or "").strip()[:255]
    if not normalized_name:
        raise ValidationError({"name": "Enter a template name."})
    normalized_layout = validate_layout(
        layout,
        width_mm=version.width_mm,
        height_mm=version.height_mm,
    )

    if version.is_published:
        if normalized_name == template.name and normalized_layout == version.layout:
            return template, version
        version = CertificateTemplateVersion.objects.create(
            template=template,
            version_number=template.versions.order_by("-version_number").first().version_number + 1,
            orientation=version.orientation,
            width_mm=version.width_mm,
            height_mm=version.height_mm,
            layout=deepcopy(version.layout),
            created_by=user,
        )
        template.current_version_number = version.version_number
        template.status = CertificateTemplate.Status.DRAFT

    version.layout = normalized_layout
    version.save(update_fields=["layout", "updated_at"])
    template.name = normalized_name
    template.save(
        update_fields=[
            "name",
            "current_version_number",
            "status",
            "updated_at",
        ]
    )
    return template, version


@transaction.atomic
def publish_template(*, template: CertificateTemplate, user):
    require_editable_template(template, user)
    version = template.current_version
    if version is None:
        raise ValidationError({"template": "This template has no layout to publish."})
    payload = json.dumps(version.layout, separators=(",", ":"), sort_keys=True)
    version.checksum = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    version.is_published = True
    version.published_at = timezone.now()
    version.save(
        update_fields=[
            "checksum",
            "is_published",
            "published_at",
            "updated_at",
        ]
    )
    template.status = CertificateTemplate.Status.PUBLISHED
    template.save(update_fields=["status", "updated_at"])
    return template, version
