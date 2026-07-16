from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel


class CourseDeliveryProfile(TimeStampedModel):
    """Portable course-level delivery policy without changing Program."""

    SELF_PACED = "self_paced"
    LIVE_ONLINE = "live_online"
    BLENDED = "blended"
    IN_PERSON = "in_person"

    DELIVERY_MODE_CHOICES = [
        (SELF_PACED, "Self-paced"),
        (LIVE_ONLINE, "Live online"),
        (BLENDED, "Blended"),
        (IN_PERSON, "In person"),
    ]

    program = models.OneToOneField(
        "core.Program",
        on_delete=models.CASCADE,
        related_name="delivery_profile",
    )
    delivery_mode = models.CharField(
        max_length=24,
        choices=DELIVERY_MODE_CHOICES,
        default=IN_PERSON,
    )
    gamification_opt_in = models.BooleanField(default=False)

    class Meta:
        db_table = "learning_course_delivery_profiles"


class EnrollmentLearningActivity(TimeStampedModel):
    """Compact activity summary used by dashboards and intervention queues."""

    enrollment = models.OneToOneField(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="learning_activity",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)
    last_source = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        db_table = "learning_enrollment_activity"
        indexes = [models.Index(fields=["last_activity_at"])]


class LearningActivityDay(TimeStampedModel):
    """One record per active learning day for analytics and streaks."""

    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="learning_activity_days",
    )
    activity_date = models.DateField()
    first_activity_at = models.DateTimeField()
    last_activity_at = models.DateTimeField()
    event_count = models.PositiveIntegerField(default=1)
    sources = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "learning_activity_days"
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "activity_date"],
                name="learning_unique_enrollment_activity_day",
            )
        ]
        indexes = [
            models.Index(fields=["enrollment", "-activity_date"]),
            models.Index(fields=["activity_date"]),
        ]


class ManualQuizGrade(TimeStampedModel):
    """Instructor grade for a manual-response question in one quiz attempt."""

    attempt = models.ForeignKey(
        "assessments.QuizAttempt",
        on_delete=models.CASCADE,
        related_name="manual_grades",
    )
    question = models.ForeignKey(
        "assessments.Question",
        on_delete=models.PROTECT,
        related_name="manual_grades",
    )
    points_awarded = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    feedback = models.TextField(blank=True, default="")
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="manual_quiz_grades",
    )
    graded_at = models.DateTimeField()

    class Meta:
        db_table = "learning_manual_quiz_grades"
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"],
                name="learning_unique_manual_attempt_question",
            )
        ]
        indexes = [models.Index(fields=["attempt", "graded_at"])]

