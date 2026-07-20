from __future__ import annotations

import csv
import hashlib
import io
import json
import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core import signing
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.db.models.functions import Lower
from django.utils import timezone
from django.utils.text import slugify

from apps.assessments.models import AssignmentSubmission, Quiz
from apps.certifications.models import Certificate
from apps.platform.models import PlatformSettings
from apps.progression.models import Enrollment, NodeCompletion

from .models import AssessmentAttemptGrant, CourseInvitation, LearnerManagementAudit


INVITATION_LIFETIME = timedelta(days=7)
ROSTER_PREVIEW_MAX_AGE_SECONDS = 30 * 60
ROSTER_PREVIEW_SALT = "learning_operations.roster_preview"
VALID_ENROLLMENT_STATUSES = {"active", "completed", "withdrawn", "suspended"}
ALLOWED_ENROLLMENT_STATUS_TRANSITIONS = {
    "active": {"suspended", "withdrawn"},
    "suspended": {"active", "withdrawn"},
    "withdrawn": {"active"},
    "completed": set(),
}


def normalize_email(value: str) -> str:
    return str(value or "").strip().lower()


def validate_normalized_email(value: str) -> str:
    email = normalize_email(value)
    validate_email(email)
    return email


def token_digest(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _roster_rows_digest(rows: list[dict]) -> str:
    normalized = [
        {
            "email": normalize_email(row.get("email")),
            "first_name": str(row.get("first_name") or "").strip(),
            "last_name": str(row.get("last_name") or "").strip(),
        }
        for row in rows
    ]
    serialized = json.dumps(normalized, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def create_roster_preview_token(program, rows: list[dict]) -> str:
    return signing.dumps(
        {"programId": program.id, "rowsDigest": _roster_rows_digest(rows)},
        salt=ROSTER_PREVIEW_SALT,
        compress=True,
    )


def validate_roster_preview_token(program, rows: list[dict], token: str) -> None:
    try:
        payload = signing.loads(
            token,
            salt=ROSTER_PREVIEW_SALT,
            max_age=ROSTER_PREVIEW_MAX_AGE_SECONDS,
        )
    except signing.BadSignature as exc:
        raise ValidationError("Preview this CSV again before importing it.") from exc
    if payload != {"programId": program.id, "rowsDigest": _roster_rows_digest(rows)}:
        raise ValidationError("The imported rows do not match the reviewed preview.")


def invitation_status(invitation: CourseInvitation, now=None) -> str:
    now = now or timezone.now()
    if invitation.accepted_at:
        return "accepted"
    if invitation.revoked_at:
        return "revoked"
    if invitation.expires_at <= now:
        return "expired"
    return "pending"


@transaction.atomic
def create_course_invitation(*, program, email: str, invited_by):
    email = validate_normalized_email(email)

    now = timezone.now()
    CourseInvitation.objects.filter(
        program=program,
        email__iexact=email,
        accepted_at__isnull=True,
        revoked_at__isnull=True,
    ).update(revoked_at=now, updated_at=now)
    raw_token = secrets.token_urlsafe(32)
    invitation = CourseInvitation.objects.create(
        program=program,
        email=email,
        token_digest=token_digest(raw_token),
        invited_by=invited_by,
        expires_at=now + INVITATION_LIFETIME,
    )
    return invitation, raw_token


def send_course_invitation(*, invitation, raw_token, request=None) -> bool:
    relative_url = f"/course-invitations/{raw_token}/"
    invitation_url = request.build_absolute_uri(relative_url) if request else relative_url
    institution_name = PlatformSettings.get_settings().institution_name
    sent = send_mail(
        subject=f"Invitation to {invitation.program.name}",
        message=(
            f"You have been invited to join {invitation.program.name} on "
            f"{institution_name}. This invitation expires in seven days.\n\n"
            f"Accept invitation: {invitation_url}"
        ),
        from_email=None,
        recipient_list=[invitation.email],
        fail_silently=True,
    )
    return sent > 0


@transaction.atomic
def add_or_invite_learner(*, program, email: str, actor, request=None):
    User = get_user_model()
    email = validate_normalized_email(email)
    user = User.objects.filter(email__iexact=email).first()
    if user:
        enrollment, created = Enrollment.objects.get_or_create(
            user=user,
            program=program,
            defaults={"status": "active", "access_source": "admin"},
        )
        if not created and enrollment.status in {"withdrawn", "suspended"}:
            previous = {"status": enrollment.status}
            enrollment.status = "active"
            enrollment.save(update_fields=["status", "updated_at"])
            LearnerManagementAudit.objects.create(
                enrollment=enrollment,
                action="reactivate",
                actor=actor,
                previous_state=previous,
                resulting_state={"status": "active"},
            )
        elif created:
            LearnerManagementAudit.objects.create(
                enrollment=enrollment,
                action="enroll_existing_user",
                actor=actor,
                previous_state={},
                resulting_state={"status": "active"},
            )
        return {"status": "enrolled", "enrollment": enrollment, "created": created}

    invitation, raw_token = create_course_invitation(
        program=program,
        email=email,
        invited_by=actor,
    )
    sent = send_course_invitation(
        invitation=invitation,
        raw_token=raw_token,
        request=request,
    )
    return {
        "status": "invited",
        "invitation": invitation,
        "emailSent": sent,
        "rawToken": raw_token,
    }


def resend_course_invitation(*, invitation, actor, request=None):
    if invitation_status(invitation) == "accepted":
        raise ValidationError("Accepted invitations cannot be resent.")
    replacement, raw_token = create_course_invitation(
        program=invitation.program,
        email=invitation.email,
        invited_by=actor,
    )
    sent = send_course_invitation(
        invitation=replacement,
        raw_token=raw_token,
        request=request,
    )
    return replacement, sent


def get_invitation_by_token(raw_token: str, *, for_update=False):
    queryset = CourseInvitation.objects.select_related("program", "enrollment")
    if for_update:
        queryset = queryset.select_for_update()
    invitation = queryset.filter(token_digest=token_digest(raw_token)).first()
    if not invitation or invitation_status(invitation) != "pending":
        raise ValidationError("This invitation is invalid or has expired.")
    return invitation


def _unique_username(email: str) -> str:
    User = get_user_model()
    base = slugify(email.split("@", 1)[0])[:120] or "learner"
    candidate = base
    while User.objects.filter(username=candidate).exists():
        candidate = f"{base}-{secrets.token_hex(3)}"
    return candidate


@transaction.atomic
def accept_course_invitation(
    *, raw_token: str, authenticated_user=None, first_name="", last_name="", password=""
):
    User = get_user_model()
    invitation = get_invitation_by_token(raw_token, for_update=True)
    user = User.objects.filter(email__iexact=invitation.email).first()
    is_authenticated = bool(
        authenticated_user and getattr(authenticated_user, "is_authenticated", False)
    )

    if user:
        if not is_authenticated or authenticated_user.pk != user.pk:
            raise ValidationError("Sign in with the invited email to accept this invitation.")
    else:
        if is_authenticated:
            if normalize_email(authenticated_user.email) != invitation.email:
                raise ValidationError("This invitation belongs to a different email address.")
            user = authenticated_user
        else:
            if not password:
                raise ValidationError("Set a password to create your account.")
            provisional = User(email=invitation.email, username=_unique_username(invitation.email))
            validate_password(password, user=provisional)
            user = User.objects.create_user(
                username=provisional.username,
                email=invitation.email,
                password=password,
                first_name=str(first_name or "").strip(),
                last_name=str(last_name or "").strip(),
            )

    enrollment, _ = Enrollment.objects.get_or_create(
        user=user,
        program=invitation.program,
        defaults={"status": "active", "access_source": "admin"},
    )
    if enrollment.status in {"withdrawn", "suspended"}:
        enrollment.status = "active"
        enrollment.save(update_fields=["status", "updated_at"])
    invitation.accepted_at = timezone.now()
    invitation.enrollment = enrollment
    invitation.save(update_fields=["accepted_at", "enrollment", "updated_at"])
    LearnerManagementAudit.objects.create(
        enrollment=enrollment,
        action="accept_invitation",
        actor=user,
        previous_state={"invitationId": invitation.id},
        resulting_state={"status": enrollment.status},
    )
    return user, enrollment


def parse_csv_rows(upload) -> list[dict]:
    raw = upload.read() if hasattr(upload, "read") else upload
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(str(raw or "")))
    headers = {normalize_email(name).replace(" ", "_") for name in (reader.fieldnames or [])}
    if "email" not in headers:
        raise ValidationError("CSV must include an email column.")
    rows = []
    for row in reader:
        normalized_row = {
            normalize_email(key).replace(" ", "_"): value
            for key, value in row.items()
            if key is not None
        }
        rows.append(
            {
                "email": normalize_email(normalized_row.get("email")),
                "first_name": str(normalized_row.get("first_name") or "").strip(),
                "last_name": str(normalized_row.get("last_name") or "").strip(),
            }
        )
    if len(rows) > 2000:
        raise ValidationError("CSV imports are limited to 2,000 rows.")
    return rows


def preview_learner_rows(program, rows: list[dict]) -> list[dict]:
    User = get_user_model()
    normalized = []
    seen = set()
    existing_enrollments = {
        normalize_email(email)
        for email in Enrollment.objects.filter(program=program).values_list(
            "user__email", flat=True
        )
    }
    candidate_emails = [normalize_email(row.get("email")) for row in rows]
    existing_users = {
        normalize_email(email)
        for email in User.objects.annotate(_normalized_email=Lower("email"))
        .filter(_normalized_email__in=candidate_emails)
        .values_list("email", flat=True)
    }
    for index, row in enumerate(rows, start=2):
        email = normalize_email(row.get("email"))
        result = {"row": index, "email": email}
        try:
            validate_normalized_email(email)
            valid_email = True
        except ValidationError:
            valid_email = False
        if not valid_email:
            result.update(status="rejected", detail="Valid email required")
        elif email in seen:
            result.update(status="duplicate", detail="Duplicate email in file")
        elif email in existing_enrollments:
            result.update(status="already_enrolled", detail="Already enrolled")
        elif email in existing_users:
            result.update(status="ready_to_enroll", detail="Existing account")
        else:
            result.update(status="ready_to_invite", detail="Invitation will be sent")
        seen.add(email)
        normalized.append(result)
    return normalized


@transaction.atomic
def change_enrollment_status(*, enrollment, status: str, actor, reason=""):
    if status not in VALID_ENROLLMENT_STATUSES:
        raise ValidationError("Select a valid enrollment status.")
    allowed = ALLOWED_ENROLLMENT_STATUS_TRANSITIONS.get(enrollment.status, set())
    if status not in allowed:
        raise ValidationError(
            f"A {enrollment.get_status_display().lower()} enrollment cannot be changed "
            f"to {dict(Enrollment._meta.get_field('status').choices).get(status, status).lower()}."
        )
    previous = {
        "status": enrollment.status,
        "completedAt": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
    }
    enrollment.status = status
    enrollment.save(update_fields=["status", "updated_at"])
    LearnerManagementAudit.objects.create(
        enrollment=enrollment,
        action="status_change",
        actor=actor,
        reason=str(reason or "").strip(),
        previous_state=previous,
        resulting_state={
            "status": status,
            "completedAt": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
        },
    )
    return enrollment


@transaction.atomic
def reset_lesson_completion(*, enrollment, node, actor, reason=""):
    completion = NodeCompletion.objects.select_for_update().filter(
        enrollment=enrollment,
        node=node,
    ).first()
    if not completion:
        raise ValidationError("The lesson is not currently complete.")
    snapshot = {
        "completionId": completion.id,
        "nodeId": node.id,
        "completedAt": completion.completed_at.isoformat(),
        "completionType": completion.completion_type,
        "metadata": completion.metadata or {},
    }
    completion.delete()
    audit = LearnerManagementAudit.objects.create(
        enrollment=enrollment,
        action="reset_lesson_completion",
        actor=actor,
        reason=str(reason or "").strip(),
        previous_state=snapshot,
        resulting_state={"completed": False, "nodeId": node.id},
    )
    for certificate in Certificate.objects.filter(enrollment=enrollment, is_revoked=False):
        metadata = dict(certificate.metadata or {})
        metadata["progress_adjusted_after_issue"] = True
        metadata["progress_adjustment_audit_id"] = audit.id
        certificate.metadata = metadata
        certificate.save(update_fields=["metadata", "updated_at"])
    if enrollment.status == "completed":
        enrollment.status = "active"
        enrollment.completed_at = None
        enrollment.save(update_fields=["status", "completed_at", "updated_at"])
    return audit


def grant_quiz_attempt(*, enrollment, quiz, actor, reason=""):
    if quiz.node.program_id != enrollment.program_id:
        raise ValidationError("Quiz does not belong to this enrollment.")
    return AssessmentAttemptGrant.objects.create(
        enrollment=enrollment,
        assessment_type=AssessmentAttemptGrant.QUIZ,
        quiz=quiz,
        extra_attempts=1,
        granted_by=actor,
        reason=str(reason or "").strip(),
    )


@transaction.atomic
def return_assignment_for_resubmission(*, submission, actor, feedback=""):
    assignment = submission.assignment
    enrollment = submission.enrollment
    if submission.status not in {"submitted", "graded"}:
        raise ValidationError("Only submitted or graded work can be returned.")
    previous = {
        "submissionId": submission.id,
        "status": submission.status,
        "score": float(submission.score) if submission.score is not None else None,
        "feedback": submission.feedback,
    }
    submission.status = "returned"
    if feedback:
        submission.feedback = str(feedback).strip()
    submission.graded_by = actor
    submission.graded_at = timezone.now()
    submission.save(
        update_fields=["status", "feedback", "graded_by", "graded_at"]
    )
    grant = AssessmentAttemptGrant.objects.create(
        enrollment=enrollment,
        assessment_type=AssessmentAttemptGrant.ASSIGNMENT,
        assignment=assignment,
        extra_attempts=1,
        granted_by=actor,
        reason="Assignment returned for resubmission",
    )
    LearnerManagementAudit.objects.create(
        enrollment=enrollment,
        action="return_assignment",
        actor=actor,
        previous_state=previous,
        resulting_state={"status": "returned", "attemptGrantId": grant.id},
    )
    return submission, grant
