from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone

from apps.core.tests.factories import UserFactory
from apps.notifications.models import NotificationEmailOutbox, NotificationPreference
from apps.notifications.outbox import enqueue_email, process_notification_outbox
from apps.notifications.services import NotificationService


@pytest.mark.django_db
def test_instant_email_is_idempotent():
    user = UserFactory(email="learner@example.com")

    for _ in range(2):
        assert NotificationService.send_email_notification(
            user,
            "system",
            "A notice",
            "Notice body",
            idempotency_key="same-email",
        )

    assert NotificationEmailOutbox.objects.count() == 1
    assert NotificationEmailOutbox.objects.get().status == "sent"
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_daily_digest_groups_due_rows():
    user = UserFactory(email="digest@example.com")
    NotificationPreference.objects.create(user=user, email_digest="daily")
    first = enqueue_email(
        recipient=user,
        notification_type="system",
        subject="First",
        message="First body",
        idempotency_key="digest-one",
    )
    second = enqueue_email(
        recipient=user,
        notification_type="system",
        subject="Second",
        message="Second body",
        idempotency_key="digest-two",
    )

    assert first.available_at.hour == 8
    assert len(mail.outbox) == 0
    result = process_notification_outbox(now=max(first.available_at, second.available_at))

    assert result == {"claimed": 2, "sent": 2, "failed": 0}
    assert len(mail.outbox) == 1
    assert "First body" in mail.outbox[0].body
    assert "Second body" in mail.outbox[0].body


@pytest.mark.django_db
def test_weekly_digest_is_scheduled_for_monday_at_eight():
    user = UserFactory(email="weekly@example.com")
    NotificationPreference.objects.create(user=user, email_digest="weekly")
    row = enqueue_email(
        recipient=user,
        notification_type="system",
        subject="Weekly",
        message="Body",
        idempotency_key="weekly",
    )
    local = timezone.localtime(row.available_at)
    assert local.weekday() == 0
    assert (local.hour, local.minute) == (8, 0)


@pytest.mark.django_db
def test_never_preference_does_not_enqueue():
    user = UserFactory(email="never@example.com")
    NotificationPreference.objects.create(user=user, email_digest="never")
    assert enqueue_email(
        recipient=user,
        notification_type="system",
        subject="Ignored",
        message="Body",
    ) is None


@pytest.mark.django_db
def test_transient_delivery_failure_remains_retryable(monkeypatch):
    user = UserFactory(email="retry@example.com")
    row = enqueue_email(
        recipient=user,
        notification_type="system",
        subject="Retry",
        message="Body",
        idempotency_key="retry",
    )
    monkeypatch.setattr(
        "apps.notifications.outbox.send_mail",
        lambda **kwargs: (_ for _ in ()).throw(RuntimeError("temporary")),
    )

    result = process_notification_outbox(now=timezone.now() + timedelta(seconds=1))
    row.refresh_from_db()

    assert result["failed"] == 1
    assert row.status == "failed"
    assert row.available_at > timezone.now()
    assert "temporary" in row.last_error
