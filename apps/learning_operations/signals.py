from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.assessments.models import AssignmentSubmission, QuizAttempt
from apps.progression.models import NodeCompletion

from .services import record_learning_activity


@receiver(post_save, sender=NodeCompletion)
def record_completion_activity(sender, instance, created, **kwargs):
    if created:
        record_learning_activity(
            instance.enrollment,
            source="node_completion",
            occurred_at=instance.completed_at,
        )


@receiver(post_save, sender=QuizAttempt)
def record_quiz_activity(sender, instance, created, **kwargs):
    occurred_at = instance.submitted_at or instance.started_at
    if created or instance.submitted_at:
        record_learning_activity(
            instance.enrollment,
            source="quiz_submission" if instance.submitted_at else "quiz_start",
            occurred_at=occurred_at,
        )


@receiver(post_save, sender=AssignmentSubmission)
def record_assignment_activity(sender, instance, created, **kwargs):
    if created or instance.status in {"submitted", "graded", "returned"}:
        record_learning_activity(
            instance.enrollment,
            source="assignment_submission",
            occurred_at=instance.submitted_at,
        )

