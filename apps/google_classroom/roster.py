from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.learning_operations.learner_management import add_or_invite_learner
from apps.learning_operations.models import CourseInvitation
from apps.progression.models import Enrollment

from .jobs import queue_existing_grades, queue_roster_invitation
from .models import (
    ClassroomRosterMapping,
    ClassroomRosterPreview,
    ClassroomSyncAudit,
)


def normalize_email(value):
    return str(value or "").strip().casefold()


def _remote_students(adapter, course_link):
    students = []
    for item in adapter.list_students(course_link.classroom_course_id):
        profile = item.get("profile") or {}
        email = normalize_email(profile.get("emailAddress"))
        if not email:
            continue
        students.append(
            {
                "googleUserId": str(profile.get("id") or item.get("userId") or ""),
                "email": email,
                "name": profile.get("name", {}).get("fullName", ""),
            }
        )
    return students


def build_roster_rows(course_link, adapter, direction):
    if direction not in {"google_to_lms", "lms_to_google", "both"}:
        raise ValidationError("Select a valid roster synchronization direction.")
    User = get_user_model()
    remote = _remote_students(adapter, course_link)
    remote_by_email = {}
    duplicate_emails = set()
    for item in remote:
        if item["email"] in remote_by_email:
            duplicate_emails.add(item["email"])
        remote_by_email[item["email"]] = item
    local_enrollments = list(
        Enrollment.objects.filter(
            program=course_link.program, status__in=["active", "completed"]
        ).select_related("user")
    )
    local_by_email = {
        normalize_email(enrollment.user.email): enrollment
        for enrollment in local_enrollments
        if enrollment.user.email
    }
    prior_mappings = list(
        ClassroomRosterMapping.objects.filter(
            course_link=course_link,
            status=ClassroomRosterMapping.Status.MATCHED,
        ).select_related("enrollment__user")
    )
    prior_by_google_id = {
        mapping.google_user_id: mapping for mapping in prior_mappings
    }
    pending_lms_invites = set(
        CourseInvitation.objects.filter(
            program=course_link.program,
            accepted_at__isnull=True,
            revoked_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).values_list("email", flat=True)
    )
    pending_classroom_invites = set(
        course_link.sync_jobs.filter(
            job_type="roster_invite",
            status__in=["pending", "processing", "succeeded"],
        ).values_list("payload__email", flat=True)
    )
    rows = []
    if direction in {"google_to_lms", "both"}:
        for item in remote:
            email = item["email"]
            user = User.objects.filter(email__iexact=email).first()
            enrollment = local_by_email.get(email)
            existing_mapping = ClassroomRosterMapping.objects.filter(
                course_link=course_link,
                lms_user=user,
                status=ClassroomRosterMapping.Status.MATCHED,
            ).first() if user else None
            remote_mapping = ClassroomRosterMapping.objects.filter(
                course_link=course_link,
                google_user_id=item["googleUserId"],
                status=ClassroomRosterMapping.Status.MATCHED,
            ).first()
            conflict = (
                email in duplicate_emails
                or (
                    existing_mapping
                    and existing_mapping.google_user_id != item["googleUserId"]
                )
                or (
                    remote_mapping
                    and (
                        remote_mapping.verified_email != email
                        or (user and remote_mapping.lms_user_id != user.id)
                    )
                )
            )
            prior_mapping = prior_by_google_id.get(item["googleUserId"])
            removed = bool(
                prior_mapping
                and (
                    not prior_mapping.enrollment_id
                    or prior_mapping.enrollment.status not in {"active", "completed"}
                )
            )
            row_status = (
                "conflict"
                if conflict
                else "removed"
                if removed
                else "matched"
                if enrollment
                else "invited"
                if email in pending_lms_invites
                else "missing"
            )
            rows.append(
                {
                    "direction": "both" if direction == "both" and enrollment else "google_to_lms",
                    **item,
                    "lmsUserId": user.id if user else None,
                    "enrollmentId": enrollment.id if enrollment else None,
                    "status": row_status,
                    "action": (
                        None
                        if conflict or removed or enrollment or email in pending_lms_invites
                        else "enroll_lms"
                        if user
                        else "invite_lms"
                    ),
                }
            )
    if direction in {"lms_to_google", "both"}:
        for email, enrollment in local_by_email.items():
            item = remote_by_email.get(email)
            if direction == "both" and item:
                continue
            prior_mapping = next(
                (
                    mapping
                    for mapping in prior_mappings
                    if mapping.enrollment_id == enrollment.id
                ),
                None,
            )
            row_status = (
                "removed"
                if prior_mapping and not item
                else "matched"
                if item
                else "invited"
                if email in pending_classroom_invites
                else "missing"
            )
            rows.append(
                {
                    "direction": "lms_to_google",
                    "email": email,
                    "name": enrollment.user.get_full_name() or email,
                    "googleUserId": item["googleUserId"] if item else "",
                    "lmsUserId": enrollment.user_id,
                    "enrollmentId": enrollment.id,
                    "status": row_status,
                    "action": (
                        "invite_classroom" if row_status == "missing" else None
                    ),
                }
            )
    return rows


def create_roster_preview(course_link, actor, adapter, direction):
    rows = build_roster_rows(course_link, adapter, direction)
    token = secrets.token_urlsafe(32)
    preview = ClassroomRosterPreview.objects.create(
        course_link=course_link,
        actor=actor,
        direction=direction,
        rows=rows,
        token_digest=hashlib.sha256(token.encode()).hexdigest(),
        expires_at=timezone.now() + timedelta(minutes=30),
    )
    summary = {}
    for row in rows:
        summary[row["status"]] = summary.get(row["status"], 0) + 1
    return preview, token, summary


@transaction.atomic
def apply_roster_preview(*, course_link, actor, raw_token, request=None):
    digest = hashlib.sha256(raw_token.encode()).hexdigest()
    preview = ClassroomRosterPreview.objects.select_for_update().filter(
        token_digest=digest,
        course_link=course_link,
        actor=actor,
    ).first()
    if not preview or preview.applied_at or preview.expires_at <= timezone.now():
        raise ValidationError("This roster preview is invalid, expired, or already applied.")
    results = {"enrolled": 0, "lmsInvited": 0, "classroomInvited": 0, "matched": 0, "conflicts": 0}
    for row in preview.rows:
        if row["status"] == "conflict":
            results["conflicts"] += 1
            continue
        if row["action"] in {"enroll_lms", "invite_lms"}:
            outcome = add_or_invite_learner(
                program=course_link.program,
                email=row["email"],
                actor=actor,
                request=request,
            )
            if outcome["status"] == "enrolled":
                enrollment = outcome["enrollment"]
                mapping, _ = ClassroomRosterMapping.objects.update_or_create(
                    course_link=course_link,
                    google_user_id=row["googleUserId"],
                    defaults={
                        "enrollment": enrollment,
                        "lms_user": enrollment.user,
                        "verified_email": normalize_email(row["email"]),
                        "status": ClassroomRosterMapping.Status.MATCHED,
                    },
                )
                queue_existing_grades(mapping)
                results["enrolled"] += 1
            else:
                results["lmsInvited"] += 1
        elif row["action"] == "invite_classroom":
            queue_roster_invitation(course_link, row["email"], actor)
            results["classroomInvited"] += 1
        elif row["status"] == "matched" and row.get("googleUserId") and row.get("enrollmentId"):
            enrollment = Enrollment.objects.filter(
                pk=row["enrollmentId"], program=course_link.program
            ).select_related("user").first()
            if enrollment and normalize_email(enrollment.user.email) == row["email"]:
                mapping, _ = ClassroomRosterMapping.objects.update_or_create(
                    course_link=course_link,
                    google_user_id=row["googleUserId"],
                    defaults={
                        "enrollment": enrollment,
                        "lms_user": enrollment.user,
                        "verified_email": row["email"],
                        "status": ClassroomRosterMapping.Status.MATCHED,
                    },
                )
                queue_existing_grades(mapping)
                results["matched"] += 1
    preview.applied_at = timezone.now()
    preview.save(update_fields=["applied_at", "updated_at"])
    ClassroomSyncAudit.objects.create(
        course_link=course_link,
        actor=actor,
        action="roster_preview_applied",
        details={"previewId": preview.id, **results},
    )
    return results
