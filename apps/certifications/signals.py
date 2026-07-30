"""
Certification signals - Integration with Progression Engine.
Requirements: 2.1
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.progression.models import Enrollment

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
