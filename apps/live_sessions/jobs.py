import uuid
from datetime import timedelta

from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

from .models import LiveSessionSyncJob, ScheduledLearningSession


RETRYABLE_CATEGORIES = {
    "quota_or_transient",
    "remote_error",
    "conference_not_ready",
}


def enqueue_session_job(
    session,
    job_type,
    *,
    actor=None,
    payload=None,
    operation_id=None,
    available_at=None,
):
    operation_id = operation_id or uuid.uuid4()
    key = f"live-session:{session.id}:{job_type}:{operation_id}"
    job, _ = LiveSessionSyncJob.objects.get_or_create(
        idempotency_key=key,
        defaults={
            "session": session,
            "actor": actor,
            "job_type": job_type,
            "payload": payload or {},
            "available_at": available_at or timezone.now(),
        },
    )
    return job


def _retry_delay(job):
    minutes = min(2 ** max(job.attempts - 1, 0), 12 * 60)
    return timedelta(minutes=minutes, seconds=(job.id * 31) % 61)


def _claim_jobs(limit, now, job_ids=None):
    stale_before = now - timedelta(minutes=30)
    with transaction.atomic():
        queryset = LiveSessionSyncJob.objects.select_for_update(skip_locked=True)
        if job_ids:
            queryset = queryset.filter(id__in=job_ids)
        jobs = list(
            queryset.filter(attempts__lt=F("max_attempts"))
            .filter(
                Q(status__in=["pending", "failed"], available_at__lte=now)
                | Q(status="processing", locked_at__lt=stale_before)
            )
            .select_related("session__node__program", "actor", "session__created_by")
            .order_by("available_at", "id")[:limit]
        )
        for job in jobs:
            job.status = LiveSessionSyncJob.Status.PROCESSING
            job.locked_at = now
            job.attempts += 1
            job.updated_at = now
        LiveSessionSyncJob.objects.bulk_update(
            jobs, ["status", "locked_at", "attempts", "updated_at"]
        )
    return jobs


def _run_job(job):
    from apps.google_classroom.adapter import ClassroomAPIError
    from apps.google_classroom.meet import (
        GoogleMeetAdapter,
        apply_meet_conference,
        credential_for_session,
        store_created_event,
    )
    from apps.progression.models import Enrollment

    session = job.session
    if session.provider != ScheduledLearningSession.Provider.GOOGLE_MEET:
        return {"skipped": "External provider has no native synchronization."}

    credential = credential_for_session(session, job.actor)
    adapter = GoogleMeetAdapter(credential)
    if job.job_type == "google_meet_create":
        enrollment_ids = job.payload.get("inviteEnrollmentIds", [])
        enrollments = Enrollment.objects.filter(
            id__in=enrollment_ids,
            program=session.node.program,
            status="active",
        ).select_related("user")
        emails = [row.user.email for row in enrollments if row.user.email]
        remote = adapter.create_event(
            session,
            attendee_emails=emails,
            request_id=job.idempotency_key,
        )
        store_created_event(
            session,
            remote,
            invited_enrollment_ids=[row.id for row in enrollments if row.user.email],
            credential=credential,
        )
        enqueue_session_job(
            session,
            "google_meet_attendance",
            actor=job.actor,
            operation_id=f"conference:{session.id}",
            available_at=session.ends_at + timedelta(minutes=5),
        )
        return {
            "eventId": session.provider_event_id,
            "joinUrlCreated": bool(session.join_url),
            "invited": len(emails),
        }
    if job.job_type == "update":
        if not session.provider_event_id:
            return {"skipped": "Google Meet has not been created yet."}
        remote = adapter.update_event(session)
        store_created_event(
            session,
            remote,
            invited_enrollment_ids=(session.provider_metadata or {}).get(
                "invitedEnrollmentIds", []
            ),
        )
        session.sync_jobs.filter(
            job_type="google_meet_attendance",
            status__in=["pending", "failed"],
        ).update(
            available_at=session.ends_at + timedelta(minutes=5),
            updated_at=timezone.now(),
        )
        return {"eventId": session.provider_event_id}
    if job.job_type == "cancel":
        if not session.provider_event_id:
            return {"skipped": "Google Meet has not been created yet."}
        adapter.cancel_event(session)
        session.sync_jobs.filter(
            job_type="google_meet_attendance",
            status__in=["pending", "failed"],
        ).update(
            status=LiveSessionSyncJob.Status.DEAD,
            error_category="session_cancelled",
            last_error="The scheduled session was cancelled.",
            finished_at=timezone.now(),
            updated_at=timezone.now(),
        )
        return {"eventId": session.provider_event_id, "cancelled": True}
    if job.job_type == "google_meet_attendance":
        return apply_meet_conference(session, adapter.collect_conference(session))
    raise ClassroomAPIError(
        "Unsupported live-session synchronization job.",
        category="invalid_job",
    )


def process_live_session_jobs(*, limit=100, now=None, job_ids=None):
    from apps.google_classroom.adapter import ClassroomAPIError

    now = now or timezone.now()
    jobs = _claim_jobs(limit, now, job_ids=job_ids)
    succeeded = failed = 0
    for job in jobs:
        session = job.session
        try:
            result = _run_job(job)
        except Exception as exc:
            if not isinstance(exc, ClassroomAPIError):
                exc = ClassroomAPIError(
                    "Live-session synchronization failed unexpectedly.",
                    category="remote_error",
                )
            retryable = (
                exc.category in RETRYABLE_CATEGORIES
                and job.attempts < job.max_attempts
            )
            job.status = (
                LiveSessionSyncJob.Status.FAILED
                if retryable
                else LiveSessionSyncJob.Status.DEAD
            )
            job.available_at = now + _retry_delay(job)
            job.error_category = exc.category
            job.last_error = str(exc)[:2000]
            job.locked_at = None
            if not retryable:
                job.finished_at = now
            job.save()
            session.last_sync_error = str(exc)[:2000]
            session.save(update_fields=["last_sync_error", "updated_at"])
            failed += 1
            continue
        job.status = LiveSessionSyncJob.Status.SUCCEEDED
        job.result = result or {}
        job.finished_at = now
        job.locked_at = None
        job.error_category = ""
        job.last_error = ""
        job.save()
        session.last_sync_at = now
        session.last_sync_error = ""
        session.save(update_fields=["last_sync_at", "last_sync_error", "updated_at"])
        succeeded += 1
    return {"claimed": len(jobs), "succeeded": succeeded, "failed": failed}
