"""
Certification signals - Integration with Progression Engine.
Requirements: 2.1
"""
import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.progression.models import Enrollment

from .models import Certificate
from .services import CertificationEngine


logger = logging.getLogger(__name__)


@receiver(post_save, sender=Enrollment)
def on_enrollment_completed(sender, instance, **kwargs):
    """
    Signal handler for enrollment completion.
    Automatically issues an eligible certificate and retains a pending recovery
    record if rendering cannot complete.
    Requirements: 2.1
    """
    # Only process if status changed to 'completed'
    if instance.status == 'completed':
        engine = CertificationEngine()
        try:
            engine.on_program_completed(instance)
        except Exception:
            logger.exception(
                "Certificate generation failed for enrollment_id=%s; continuing without blocking completion flow",
                instance.id,
            )


@receiver(post_save, sender=Certificate)
def on_certificate_issued(sender, instance, created, raw=False, **kwargs):
    """Notify the learner once a new certificate record is committed."""
    if not created or raw or instance.is_revoked:
        return

    certificate_id = instance.pk

    def _notify():
        from apps.notifications.services import NotificationService

        certificate = (
            Certificate.objects.select_related(
                "enrollment__user", "enrollment__program"
            )
            .filter(pk=certificate_id, is_revoked=False)
            .first()
        )
        if certificate is not None:
            NotificationService.notify_certificate_issued(certificate)

    transaction.on_commit(_notify, robust=True)
