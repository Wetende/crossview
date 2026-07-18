from __future__ import annotations

import hashlib
from datetime import timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

from apps.assessments.models import AssignmentSubmission, QuizAttempt

from .adapter import ClassroomAPIError, GoogleClassroomAdapter
from .models import (
    ClassroomCourseLink,
    ClassroomGradeSync,
    ClassroomOAuthCredential,
    ClassroomResourceMapping,
    ClassroomRosterMapping,
    ClassroomSyncJob,
)
from .publishing import (
    build_resource_payload,
    canonical_payload_hash,
    sync_resource,
)


RETRYABLE_CATEGORIES = {"quota_or_transient", "remote_error", "roster_not_ready"}


def _idempotency_key(prefix, *parts):
    digest = hashlib.sha256(
        "\x1f".join(str(part) for part in parts).encode()
    ).hexdigest()
    return f"classroom-{prefix}:{digest}"


def enqueue_job(
    *, course_link, job_type, idempotency_key, payload=None, actor=None,
    resource_mapping=None, available_at=None,
):
    job, created = ClassroomSyncJob.objects.get_or_create(
        idempotency_key=idempotency_key,
        defaults={
            "course_link": course_link,
            "job_type": job_type,
            "payload": payload or {},
            "actor": actor,
            "resource_mapping": resource_mapping,
            "available_at": available_at or timezone.now(),
        },
    )
    if not created and job.status in {
        ClassroomSyncJob.Status.FAILED,
        ClassroomSyncJob.Status.DEAD,
    }:
        job.status = ClassroomSyncJob.Status.PENDING
        job.attempts = 0
        job.available_at = available_at or timezone.now()
        job.error_category = ""
        job.last_error = ""
        job.save(
            update_fields=[
                "status", "attempts", "available_at", "error_category",
                "last_error", "updated_at",
            ]
        )
    return job


def queue_roster_invitation(course_link, email, actor):
    normalized = email.strip().lower()
    return enqueue_job(
        course_link=course_link,
        job_type="roster_invite",
        idempotency_key=_idempotency_key(
            "roster", course_link.id, course_link.classroom_course_id, normalized
        ),
        payload={"email": normalized},
        actor=actor,
    )


def queue_resource_publish(
    *, course_link, actor, local_type, local_id, force=False
):
    resource_type, body = build_resource_payload(
        course_link.program, local_type, local_id
    )
    payload_hash = canonical_payload_hash(resource_type, body)
    mapping, _ = ClassroomResourceMapping.objects.get_or_create(
        course_link=course_link,
        local_type=local_type,
        local_id=str(local_id),
        defaults={"google_resource_type": resource_type},
    )
    if mapping.google_resource_type != resource_type:
        raise ValidationError("The existing Classroom mapping uses another resource type.")
    revision = mapping.updated_at.isoformat() if force else "canonical"
    return enqueue_job(
        course_link=course_link,
        resource_mapping=mapping,
        actor=actor,
        job_type="content_upsert",
        idempotency_key=_idempotency_key(
            "content",
            mapping.id,
            course_link.classroom_course_id,
            payload_hash,
            revision,
        ),
        payload={"body": body, "payloadHash": payload_hash, "force": bool(force)},
    )


def queue_grade_passback(
    *, mapping, enrollment, source_type, source_id, grade, actor=None
):
    grade_value = Decimal(str(grade)).quantize(Decimal("0.01"))
    key = _idempotency_key(
        "grade",
        mapping.id,
        mapping.course_link.classroom_course_id,
        mapping.google_resource_id,
        enrollment.id,
        source_type,
        source_id,
        grade_value,
    )
    grade_sync, created = ClassroomGradeSync.objects.get_or_create(
        idempotency_key=key,
        defaults={
            "resource_mapping": mapping,
            "enrollment": enrollment,
            "local_source_type": source_type,
            "local_source_id": str(source_id),
            "grade": grade_value,
            "status": "pending",
            "error_category": "",
            "last_error": "",
        },
    )
    job = enqueue_job(
        course_link=mapping.course_link,
        resource_mapping=mapping,
        actor=actor,
        job_type="grade_passback",
        idempotency_key=key,
        payload={"gradeSyncId": grade_sync.id},
    )
    if not created and job.status == ClassroomSyncJob.Status.PENDING:
        ClassroomGradeSync.objects.filter(pk=grade_sync.pk).update(
            status="pending",
            error_category="",
            last_error="",
            updated_at=timezone.now(),
        )
    return job


def queue_grade_from_source(source_type, source_id):
    if source_type == "assignment_submission":
        source = AssignmentSubmission.objects.select_related(
            "enrollment", "assignment"
        ).filter(pk=source_id, status="graded", score__isnull=False).first()
        if not source:
            return None
        mapping = ClassroomResourceMapping.objects.filter(
            course_link__program=source.assignment.program,
            local_type="assignment",
            local_id=str(source.assignment_id),
            google_resource_id__gt="",
            status=ClassroomResourceMapping.Status.ACTIVE,
        ).first()
        grade = source.score
        enrollment = source.enrollment
    elif source_type == "quiz_attempt":
        source = QuizAttempt.objects.select_related(
            "enrollment", "quiz__node__program"
        ).filter(pk=source_id, submitted_at__isnull=False, score__isnull=False).first()
        if not source:
            return None
        mapping = ClassroomResourceMapping.objects.filter(
            course_link__program=source.quiz.node.program,
            local_type="quiz",
            local_id=str(source.quiz_id),
            google_resource_id__gt="",
            status=ClassroomResourceMapping.Status.ACTIVE,
        ).first()
        grade = source.score
        enrollment = source.enrollment
    else:
        return None
    if not mapping or not ClassroomRosterMapping.objects.filter(
        course_link=mapping.course_link,
        enrollment=enrollment,
        status=ClassroomRosterMapping.Status.MATCHED,
    ).exists():
        return None
    return queue_grade_passback(
        mapping=mapping,
        enrollment=enrollment,
        source_type=source_type,
        source_id=source_id,
        grade=grade,
    )


def queue_existing_grades(roster_mapping):
    if not roster_mapping.enrollment_id:
        return []
    jobs = []
    mappings = ClassroomResourceMapping.objects.filter(
        course_link=roster_mapping.course_link,
        status=ClassroomResourceMapping.Status.ACTIVE,
        google_resource_id__gt="",
        local_type__in=["assignment", "quiz"],
    )
    for mapping in mappings:
        if mapping.local_type == "assignment":
            source = AssignmentSubmission.objects.filter(
                enrollment=roster_mapping.enrollment,
                assignment_id=mapping.local_id,
                status="graded",
                score__isnull=False,
            ).order_by("-attempt_number").first()
            source_type = "assignment_submission"
        else:
            source = QuizAttempt.objects.filter(
                enrollment=roster_mapping.enrollment,
                quiz_id=mapping.local_id,
                submitted_at__isnull=False,
                score__isnull=False,
            ).order_by("-attempt_number").first()
            source_type = "quiz_attempt"
        if source:
            jobs.append(
                queue_grade_passback(
                    mapping=mapping,
                    enrollment=roster_mapping.enrollment,
                    source_type=source_type,
                    source_id=source.id,
                    grade=source.score,
                )
            )
    return jobs


def _credential_for_job(job):
    if job.actor_id:
        credential = ClassroomOAuthCredential.objects.filter(
            user_id=job.actor_id,
            status=ClassroomOAuthCredential.Status.CONNECTED,
        ).first()
        if credential:
            return credential
    credential = job.course_link.credential
    if not credential or credential.status != ClassroomOAuthCredential.Status.CONNECTED:
        raise ClassroomAPIError(
            "Reconnect Google Classroom to continue synchronization.",
            category="authorization_invalid",
        )
    return credential


def _process_grade(job, adapter):
    grade_sync = ClassroomGradeSync.objects.select_related(
        "resource_mapping", "enrollment"
    ).get(pk=job.payload["gradeSyncId"])
    mapping = grade_sync.resource_mapping
    if not mapping.created_by_integration or not mapping.google_resource_id:
        raise ClassroomAPIError(
            "Grade passback is limited to coursework created by this integration.",
            category="project_ownership",
        )
    roster = ClassroomRosterMapping.objects.filter(
        course_link=job.course_link,
        enrollment=grade_sync.enrollment,
        status=ClassroomRosterMapping.Status.MATCHED,
    ).first()
    if not roster:
        raise ClassroomAPIError(
            "The learner has not joined the linked Classroom course.",
            category="roster_not_ready",
        )
    submissions = adapter.list_student_submissions(
        job.course_link.classroom_course_id,
        mapping.google_resource_id,
        roster.google_user_id,
    )
    submission = next(
        (item for item in submissions if item.get("associatedWithDeveloper")), None
    )
    if not submission:
        raise ClassroomAPIError(
            "No project-owned Classroom submission exists for this learner.",
            category="project_ownership" if submissions else "roster_not_ready",
        )
    remote = adapter.set_submission_grade(
        job.course_link.classroom_course_id,
        mapping.google_resource_id,
        submission["id"],
        grade_sync.grade,
    )
    if submission.get("state") == "TURNED_IN":
        adapter.return_submission(
            job.course_link.classroom_course_id,
            mapping.google_resource_id,
            submission["id"],
        )
    grade_sync.google_submission_id = submission["id"]
    grade_sync.status = "synced"
    grade_sync.synced_at = timezone.now()
    grade_sync.error_category = ""
    grade_sync.last_error = ""
    grade_sync.save()
    return {"submissionId": submission["id"], "assignedGrade": remote.get("assignedGrade")}


def _run_job(job, adapter):
    if job.job_type == "roster_invite":
        remote = adapter.create_student_invitation(
            job.course_link.classroom_course_id, job.payload["email"]
        )
        return {"invitationId": remote.get("id", "")}
    if job.job_type == "content_upsert":
        remote = sync_resource(
            job.resource_mapping,
            adapter,
            body=job.payload["body"],
            payload_hash=job.payload["payloadHash"],
            force=job.payload.get("force", False),
        )
        return {"resourceId": remote.get("id", "")}
    if job.job_type == "grade_passback":
        return _process_grade(job, adapter)
    if job.job_type == "course_sync":
        remote = adapter.get_course(job.course_link.classroom_course_id)
        job.course_link.classroom_name = remote.get("name", job.course_link.classroom_name)
        job.course_link.enrollment_code = remote.get("enrollmentCode", "")
        job.course_link.alternate_link = remote.get("alternateLink", "")
        job.course_link.course_state = remote.get("courseState", "")
        job.course_link.save()
        return {"courseState": job.course_link.course_state}
    raise ClassroomAPIError("Unsupported Classroom synchronization job.", category="invalid_job")


def _retry_delay(job):
    minutes = min(2 ** max(job.attempts - 1, 0), 12 * 60)
    return timedelta(minutes=minutes, seconds=(job.id * 29) % 61)


def _claim_jobs(limit, now, link_ids=None, job_ids=None):
    stale_before = now - timedelta(minutes=30)
    with transaction.atomic():
        queryset = ClassroomSyncJob.objects.select_for_update(skip_locked=True)
        if link_ids:
            queryset = queryset.filter(course_link_id__in=link_ids)
        if job_ids:
            queryset = queryset.filter(id__in=job_ids)
        jobs = list(
            queryset.filter(attempts__lt=F("max_attempts"))
            .filter(
                Q(status__in=["pending", "failed"], available_at__lte=now)
                | Q(status="processing", locked_at__lt=stale_before)
            )
            .select_related("course_link__credential", "resource_mapping", "actor")
            .order_by("available_at", "id")[:limit]
        )
        for job in jobs:
            job.status = ClassroomSyncJob.Status.PROCESSING
            job.locked_at = now
            job.attempts += 1
            job.updated_at = now
        ClassroomSyncJob.objects.bulk_update(
            jobs, ["status", "locked_at", "attempts", "updated_at"]
        )
    return jobs


def process_classroom_jobs(*, limit=100, now=None, link_ids=None, job_ids=None):
    now = now or timezone.now()
    jobs = _claim_jobs(limit, now, link_ids=link_ids, job_ids=job_ids)
    succeeded = failed = 0
    for job in jobs:
        link = job.course_link
        link.last_attempted_at = now
        try:
            if link.sync_paused or not link.enabled:
                raise ClassroomAPIError(
                    "Classroom synchronization is paused.", category="sync_paused"
                )
            adapter = GoogleClassroomAdapter(_credential_for_job(job))
            adapter.ensure_teacher(link.classroom_course_id)
            result = _run_job(job, adapter)
        except Exception as exc:
            if not isinstance(exc, ClassroomAPIError):
                exc = ClassroomAPIError(
                    "Google Classroom synchronization failed unexpectedly.",
                    category="remote_error",
                )
            retryable = exc.category in RETRYABLE_CATEGORIES and job.attempts < job.max_attempts
            job.status = (
                ClassroomSyncJob.Status.FAILED
                if retryable
                else ClassroomSyncJob.Status.DEAD
            )
            job.available_at = now + _retry_delay(job)
            job.error_category = exc.category
            job.last_error = str(exc)[:2000]
            job.locked_at = None
            if not retryable:
                job.finished_at = now
            job.save()
            if job.job_type == "grade_passback":
                ClassroomGradeSync.objects.filter(pk=job.payload.get("gradeSyncId")).update(
                    status="failed",
                    error_category=exc.category,
                    last_error=str(exc)[:2000],
                    updated_at=now,
                )
            link.last_error_category = exc.category
            link.last_error = str(exc)[:2000]
            link.save()
            failed += 1
            continue
        job.status = ClassroomSyncJob.Status.SUCCEEDED
        job.result = result or {}
        job.finished_at = now
        job.locked_at = None
        job.error_category = ""
        job.last_error = ""
        job.save()
        link.last_success_at = now
        link.last_error_category = ""
        link.last_error = ""
        link.save()
        succeeded += 1
    return {"claimed": len(jobs), "succeeded": succeeded, "failed": failed}
