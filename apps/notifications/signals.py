"""
Django signals for notification triggers.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.progression.models import Announcement, Enrollment
from .services import NotificationService


@receiver(post_save, sender=Announcement)
def announcement_created(sender, instance, created, **kwargs):
    """
    Send notifications to enrolled students when a new announcement is created.
    """
    if created:
        # Get all active enrollments for this program
        enrolled_users = Enrollment.objects.filter(
            program=instance.program,
            status='active'
        ).select_related('user').values_list('user', flat=True)
        
        from apps.core.models import User
        users = User.objects.filter(id__in=enrolled_users)
        
        if users.exists():
            NotificationService.notify_announcement(instance, users)
