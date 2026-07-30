"""Certificate template assignment and precedence services."""

from __future__ import annotations

from dataclasses import dataclass

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.certifications.models import (
    CertificateTemplate,
    CertificateTemplateAssignment,
    CertificateTemplateVersion,
)


@dataclass(frozen=True)
class ResolvedCertificateTemplate:
    version: CertificateTemplateVersion | None
    source: str
    enabled: bool

    @property
    def template(self):
        return self.version.template if self.version else None


def latest_published_version(template: CertificateTemplate):
    return (
        template.versions.filter(is_published=True)
        .order_by("-version_number")
        .first()
    )


def published_template_versions():
    """Return one current published version for each visible template."""
    versions = (
        CertificateTemplateVersion.objects.filter(
            is_published=True,
            template__status__in=[
                CertificateTemplate.Status.PUBLISHED,
                CertificateTemplate.Status.DRAFT,
            ],
        )
        .select_related("template")
        .order_by("template_id", "-version_number")
    )
    seen = set()
    result = []
    for version in versions:
        if version.template_id in seen:
            continue
        seen.add(version.template_id)
        result.append(version)
    return result


def resolve_certificate_template(program) -> ResolvedCertificateTemplate:
    """Resolve course > category > system default, including course opt-out."""
    program_id = getattr(program, "pk", None) or getattr(program, "id", None)
    if not isinstance(program_id, int) or isinstance(program_id, bool):
        # Some legacy service callers use lightweight enrollment doubles.
        # They can still use the original blueprint/default-template fallback.
        return ResolvedCertificateTemplate(None, "unconfigured", True)

    course_assignment = (
        CertificateTemplateAssignment.objects.filter(
            scope=CertificateTemplateAssignment.Scope.COURSE,
            program_id=program_id,
        )
        .select_related("template_version__template")
        .first()
    )
    if course_assignment:
        if not course_assignment.issue_enabled:
            return ResolvedCertificateTemplate(None, "course-disabled", False)
        if course_assignment.template_version_id:
            return ResolvedCertificateTemplate(
                course_assignment.template_version,
                "course",
                True,
            )

    return resolve_inherited_certificate_template(program)


def resolve_inherited_certificate_template(program) -> ResolvedCertificateTemplate:
    """Resolve the category or system certificate without a course override."""
    if program.category:
        category_assignment = (
            CertificateTemplateAssignment.objects.filter(
                scope=CertificateTemplateAssignment.Scope.CATEGORY,
                category=program.category,
                issue_enabled=True,
            )
            .select_related("template_version__template")
            .first()
        )
        if category_assignment:
            return ResolvedCertificateTemplate(
                category_assignment.template_version,
                "category",
                True,
            )

    default_assignment = (
        CertificateTemplateAssignment.objects.filter(
            scope=CertificateTemplateAssignment.Scope.DEFAULT,
            issue_enabled=True,
        )
        .select_related("template_version__template")
        .first()
    )
    if default_assignment:
        return ResolvedCertificateTemplate(
            default_assignment.template_version,
            "default",
            True,
        )

    # Compatibility for installations that already use the legacy default flag.
    legacy_template = CertificateTemplate.objects.filter(is_default=True).first()
    if legacy_template:
        version = latest_published_version(legacy_template)
        if version:
            return ResolvedCertificateTemplate(version, "legacy-default", True)

    return ResolvedCertificateTemplate(None, "unconfigured", True)


def _validate_published_version(version):
    if version is None or not version.is_published:
        raise ValidationError(
            {"template": "Choose a published certificate template."}
        )


@transaction.atomic
def set_default_assignment(*, version, user):
    _validate_published_version(version)
    assignment, _ = CertificateTemplateAssignment.objects.update_or_create(
        scope=CertificateTemplateAssignment.Scope.DEFAULT,
        defaults={
            "template_version": version,
            "category": "",
            "program": None,
            "issue_enabled": True,
            "assigned_by": user,
        },
    )
    return assignment


@transaction.atomic
def set_category_assignment(*, category: str, version, user):
    category = str(category or "").strip()[:100]
    if not category:
        raise ValidationError({"category": "Choose a course category."})
    _validate_published_version(version)
    assignment, _ = CertificateTemplateAssignment.objects.update_or_create(
        scope=CertificateTemplateAssignment.Scope.CATEGORY,
        category=category,
        defaults={
            "template_version": version,
            "program": None,
            "issue_enabled": True,
            "assigned_by": user,
        },
    )
    return assignment


@transaction.atomic
def set_course_assignment(*, program, version, issue_enabled: bool, user):
    if version is not None:
        _validate_published_version(version)
    assignment, _ = CertificateTemplateAssignment.objects.update_or_create(
        scope=CertificateTemplateAssignment.Scope.COURSE,
        program=program,
        defaults={
            "template_version": version,
            "category": "",
            "issue_enabled": bool(issue_enabled),
            "assigned_by": user,
        },
    )
    return assignment


def serialize_assignment(assignment):
    version = assignment.template_version
    template = version.template if version else None
    return {
        "id": assignment.id,
        "scope": assignment.scope,
        "category": assignment.category,
        "programId": assignment.program_id,
        "issueEnabled": assignment.issue_enabled,
        "templateVersionId": assignment.template_version_id,
        "templateId": template.id if template else None,
        "templateName": template.name if template else None,
        "version": version.version_number if version else None,
    }
