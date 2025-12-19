"""
Certification signals - Integration with Progression Engine.
Requirements: 2.1
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.progression.models import Enrollment
from .services import CertificationEngine


@receiver(post_save, sender=Enrollment)
def on_enrollment_completed(sender, instance, **kwargs):
    """
    Signal handler for enrollment completion.
    Generates certificate when enrollment reaches 100% completion.
    Requirements: 2.1
    """
    # Only process if status changed to 'completed'
    if instance.status == 'completed':
        engine = CertificationEngine()
        engine.on_program_completed(instance)
