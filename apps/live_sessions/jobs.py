import uuid

from django.utils import timezone

from .models import LiveSessionSyncJob


def enqueue_session_job(session, job_type, *, actor=None, payload=None, operation_id=None):
    operation_id = operation_id or uuid.uuid4()
    key = f"live-session:{session.id}:{job_type}:{operation_id}"
    job, _ = LiveSessionSyncJob.objects.get_or_create(
        idempotency_key=key,
        defaults={
            "session": session,
            "actor": actor,
            "job_type": job_type,
            "payload": payload or {},
            "available_at": timezone.now(),
        },
    )
    return job
