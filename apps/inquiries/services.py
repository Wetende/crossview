import logging

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import EmailMessage
from django.core.validators import validate_email
from django.utils import timezone

from apps.platform.models import PlatformSettings

from .models import Inquiry

logger = logging.getLogger(__name__)


def _valid_email(value: str) -> str:
    candidate = str(value or "").strip()
    if not candidate:
        return ""
    try:
        validate_email(candidate)
    except ValidationError:
        return ""
    return candidate


def get_inquiry_notification_context() -> tuple[str, str]:
    """Return the configured recipient and neutral institution label."""
    configured_recipient = _valid_email(
        getattr(settings, "INQUIRY_NOTIFICATION_EMAIL", "")
    )

    platform_settings = PlatformSettings.get_settings()
    recipient = configured_recipient or _valid_email(platform_settings.contact_email)
    institution_name = " ".join(
        str(platform_settings.institution_name or "Learning platform").splitlines()
    ).strip()
    return recipient, institution_name or "Learning platform"


def _notification_body(inquiry: Inquiry) -> str:
    fields = [
        ("Name", inquiry.name),
        ("Email", inquiry.email),
        ("Phone", inquiry.phone),
        ("Type", inquiry.get_kind_display()),
        ("Subject", inquiry.subject),
        ("Program", inquiry.program.name if inquiry.program else ""),
        ("Source", inquiry.source),
        ("Submitted", inquiry.created_at.isoformat()),
        ("Message", inquiry.message),
    ]
    return "A new inquiry was submitted.\n\n" + "\n".join(
        f"{label}: {value}" for label, value in fields if value
    )


def send_inquiry_notification(inquiry: Inquiry) -> bool:
    """Send an internal notification without rolling back the saved inquiry."""
    try:
        recipient, institution_name = get_inquiry_notification_context()
        if not recipient:
            raise ValueError("No valid inquiry notification recipient is configured.")

        message = EmailMessage(
            subject=(
                f"[{institution_name}] New "
                f"{inquiry.get_kind_display().lower()} inquiry"
            ),
            body=_notification_body(inquiry),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            to=[recipient],
            reply_to=[inquiry.email],
        )
        if message.send(fail_silently=False) != 1:
            raise RuntimeError("The email backend did not accept the notification.")
    except Exception as exc:  # The inquiry must remain available to staff.
        error = str(exc).strip()[:500] or exc.__class__.__name__
        Inquiry.objects.filter(pk=inquiry.pk).update(notification_error=error)
        inquiry.notification_error = error
        logger.exception("Unable to send notification for inquiry %s", inquiry.pk)
        return False

    sent_at = timezone.now()
    Inquiry.objects.filter(pk=inquiry.pk).update(
        notification_sent_at=sent_at,
        notification_error="",
    )
    inquiry.notification_sent_at = sent_at
    inquiry.notification_error = ""
    return True
