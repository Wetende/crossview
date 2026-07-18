from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.assessments.models import AssignmentSubmission, QuizAttempt


@receiver(post_save, sender=AssignmentSubmission)
def queue_assignment_grade(sender, instance, **kwargs):
    if instance.status == "graded" and instance.score is not None:
        transaction.on_commit(
            lambda source_id=instance.id: _queue_grade(
                "assignment_submission", source_id
            )
        )


@receiver(post_save, sender=QuizAttempt)
def queue_quiz_grade(sender, instance, **kwargs):
    if instance.submitted_at and instance.score is not None and instance.passed is not None:
        transaction.on_commit(
            lambda source_id=instance.id: _queue_grade("quiz_attempt", source_id)
        )


def _queue_grade(source_type, source_id):
    from .jobs import queue_grade_from_source

    queue_grade_from_source(source_type, source_id)
