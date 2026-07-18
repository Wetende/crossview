from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.assessments.models import AssignmentSubmission, QuizAttempt
from apps.core.models import Program
from apps.progression.models import NodeCompletion

from .models import CourseEngagementPolicy
from .services import record_learning_activity


@receiver(post_save, sender=Program)
def create_default_engagement_policy(sender, instance, created, **kwargs):
    if created:
        CourseEngagementPolicy.objects.get_or_create(program=instance)


@receiver(post_save, sender=NodeCompletion)
def record_completion_activity(sender, instance, created, **kwargs):
    if created:
        record_learning_activity(
            instance.enrollment,
            source="node_completion",
            occurred_at=instance.completed_at,
        )
        from apps.progression.gamification import handle_node_completion

        handle_node_completion(instance)


@receiver(post_save, sender=QuizAttempt)
def record_quiz_activity(sender, instance, created, **kwargs):
    occurred_at = instance.submitted_at or instance.started_at
    if created or instance.submitted_at:
        record_learning_activity(
            instance.enrollment,
            source="quiz_submission" if instance.submitted_at else "quiz_start",
            occurred_at=occurred_at,
        )
    if instance.submitted_at:
        from apps.progression.gamification import handle_quiz_attempt

        handle_quiz_attempt(instance)


@receiver(post_save, sender=AssignmentSubmission)
def record_assignment_activity(sender, instance, created, **kwargs):
    if created or instance.status in {"submitted", "graded", "returned"}:
        record_learning_activity(
            instance.enrollment,
            source="assignment_submission",
            occurred_at=instance.submitted_at,
        )
    if instance.status in {"submitted", "graded"}:
        from apps.progression.gamification import handle_assignment_submission

        handle_assignment_submission(instance)
