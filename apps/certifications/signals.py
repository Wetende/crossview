"""
Certification signals - Integration with Progression Engine.
Requirements: 2.1
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

from apps.progression.models import Enrollment
from .services import CertificationEngine


logger = logging.getLogger(__name__)


@receiver(post_save, sender=Enrollment)
def on_enrollment_completed(sender, instance, **kwargs):
    """
    Signal handler for enrollment completion.
    Refreshes certificate eligibility queue when enrollment reaches completion.
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
