from __future__ import annotations

from datetime import datetime, time, timedelta
from uuid import uuid4
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

from .models import NotificationEmailOutbox, NotificationPreference


def _preferences_for(user):
    try:
        return user.notification_preferences
    except NotificationPreference.DoesNotExist:
        return None


def _email_delivery_mode(user, notification_type):
    preferences = _preferences_for(user)
    if preferences is None:
        return "instant"
    if not preferences.email_enabled or preferences.email_digest == "never":
        return None
    type_preference = (preferences.type_preferences or {}).get(notification_type, {})
    if isinstance(type_preference, dict) and type_preference.get("email") is False:
        return None
    return preferences.email_digest


def _next_digest_time(mode, now):
    local_zone = ZoneInfo(settings.TIME_ZONE)
    local_now = now.astimezone(local_zone)
    target_date = local_now.date()
    if mode == "weekly":
        target_date += timedelta(days=(-local_now.weekday()) % 7)
    target = datetime.combine(target_date, time(hour=8), tzinfo=local_zone)
    if target <= local_now:
        target += timedelta(days=7 if mode == "weekly" else 1)
    return target.astimezone(timezone.get_default_timezone())


def enqueue_email(
    *, recipient, notification_type, subject, message, html_message=None,
    from_email=None, notification=None, idempotency_key=None, metadata=None,
):
    if not recipient.email:
        return None
    digest_mode = _email_delivery_mode(recipient, notification_type)
    if digest_mode is None:
        return None
    now = timezone.now()
    available_at = now if digest_mode == "instant" else _next_digest_time(digest_mode, now)
    row, _ = NotificationEmailOutbox.objects.get_or_create(
        idempotency_key=idempotency_key or f"email:{uuid4().hex}",
        defaults={
            "recipient": recipient,
            "notification": notification,
            "notification_type": notification_type,
            "subject": subject,
            "message": message,
            "html_message": html_message or "",
            "from_email": from_email or getattr(settings, "DEFAULT_FROM_EMAIL", ""),
            "digest_mode": digest_mode,
            "available_at": available_at,
            "metadata": metadata or {},
        },
    )
    return row


def _retry_delay(attempts, row_id):
    base_minutes = min(2 ** max(attempts - 1, 0), 12 * 60)
    jitter_seconds = (row_id * 37) % 61
    return timedelta(minutes=base_minutes, seconds=jitter_seconds)


def _claim_rows(limit, now, row_ids=None):
    stale_before = now - timedelta(minutes=30)
    with transaction.atomic():
        queryset = NotificationEmailOutbox.objects.select_for_update(skip_locked=True)
        if row_ids:
            queryset = queryset.filter(id__in=row_ids)
        rows = list(
            queryset
            .filter(attempts__lt=F("max_attempts"))
            .filter(
                Q(status__in=["pending", "failed"], available_at__lte=now)
                | Q(status="processing", locked_at__lt=stale_before)
            )
            .order_by("available_at", "id")[:limit]
        )
        for row in rows:
            row.status = "processing"
            row.locked_at = now
            row.attempts += 1
        NotificationEmailOutbox.objects.bulk_update(
            rows, ["status", "locked_at", "attempts", "updated_at"]
        )
    return rows


def _digest_content(rows):
    subject = "Your learning notifications"
    lines = ["Here is your learning activity digest:", ""]
    for row in rows:
        lines.extend([row.subject, row.message, ""])
    return subject, "\n".join(lines).strip()


def _deliver_group(rows, now):
    first = rows[0]
    subject, message = (
        _digest_content(rows)
        if first.digest_mode in {"daily", "weekly"}
        else (first.subject, first.message)
    )
    html_message = first.html_message if len(rows) == 1 else None
    try:
        sent = send_mail(
            subject=subject,
            message=message,
            from_email=first.from_email or None,
            recipient_list=[first.recipient.email],
            fail_silently=False,
            html_message=html_message,
        )
        if sent <= 0:
            raise RuntimeError("The email backend did not accept the message.")
    except Exception as exc:
        for row in rows:
            row.status = "failed"
            row.locked_at = None
            row.last_error = str(exc)[:2000]
            row.available_at = now + _retry_delay(row.attempts, row.id)
        NotificationEmailOutbox.objects.bulk_update(
            rows, ["status", "locked_at", "last_error", "available_at", "updated_at"]
        )
        return 0, len(rows)

    for row in rows:
        row.status = "sent"
        row.sent_at = now
        row.locked_at = None
        row.last_error = ""
    NotificationEmailOutbox.objects.bulk_update(
        rows, ["status", "sent_at", "locked_at", "last_error", "updated_at"]
    )
    return len(rows), 0


def process_notification_outbox(*, limit=200, now=None, row_ids=None):
    now = now or timezone.now()
    rows = _claim_rows(limit, now, row_ids=row_ids)
    groups = {}
    for row in rows:
        key = (
            (row.recipient_id, row.digest_mode)
            if row.digest_mode in {"daily", "weekly"}
            else (row.id, row.digest_mode)
        )
        groups.setdefault(key, []).append(row)

    sent = failed = 0
    for group in groups.values():
        group_sent, group_failed = _deliver_group(group, now)
        sent += group_sent
        failed += group_failed
    return {"claimed": len(rows), "sent": sent, "failed": failed}
