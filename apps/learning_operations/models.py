from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from apps.core.models import TimeStampedModel


def default_assignment_reminder_offsets():
    return [7, 1, -1]


def default_expiry_reminder_offsets():
    return [7, 1]


def default_inactivity_reminder_offsets():
    return [7, 30]


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


class CourseEngagementPolicy(TimeStampedModel):
    """Portable course reminder policy expressed as whole-day offsets."""

    program = models.OneToOneField(
        "core.Program",
        on_delete=models.CASCADE,
        related_name="engagement_policy",
    )
    assignment_reminders_enabled = models.BooleanField(default=True)
    assignment_offsets = models.JSONField(default=default_assignment_reminder_offsets)
    expiry_reminders_enabled = models.BooleanField(default=True)
    expiry_offsets = models.JSONField(default=default_expiry_reminder_offsets)
    inactivity_reminders_enabled = models.BooleanField(default=True)
    inactivity_offsets = models.JSONField(default=default_inactivity_reminder_offsets)

    class Meta:
        db_table = "learning_course_engagement_policies"


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


class LearnerNodeProgress(TimeStampedModel):
    """Server-owned aggregate of a learner's evidence for one activity."""

    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="node_activity_progress",
    )
    node = models.ForeignKey(
        "curriculum.CurriculumNode",
        on_delete=models.CASCADE,
        related_name="learner_activity_progress",
    )
    activity_type = models.CharField(max_length=32)
    active_seconds = models.FloatField(default=0)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    resume_position_seconds = models.FloatField(default=0)
    pages_viewed = models.JSONField(default=list, blank=True)
    total_pages = models.PositiveIntegerField(null=True, blank=True)
    last_evidence_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "learning_learner_node_progress"
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "node"],
                name="learning_unique_enrollment_node_progress",
            )
        ]
        indexes = [
            models.Index(fields=["enrollment", "-last_evidence_at"]),
            models.Index(fields=["node", "activity_type"]),
        ]


class LearnerContentSession(TimeStampedModel):
    """Deduplicates ordered client events and bounds accumulated active time."""

    progress = models.ForeignKey(
        LearnerNodeProgress,
        on_delete=models.CASCADE,
        related_name="content_sessions",
    )
    session_key = models.CharField(max_length=64)
    last_sequence = models.PositiveBigIntegerField(default=0)
    last_position_seconds = models.FloatField(default=0)
    active_seconds = models.FloatField(default=0)
    last_event_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "learning_learner_content_sessions"
        constraints = [
            models.UniqueConstraint(
                fields=["progress", "session_key"],
                name="learning_unique_progress_content_session",
            )
        ]
        indexes = [models.Index(fields=["progress", "-last_event_at"])]


class CodeLabWork(TimeStampedModel):
    """Cross-device code-lab draft and immutable latest submitted snapshot."""

    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="code_lab_work",
    )
    node = models.ForeignKey(
        "curriculum.CurriculumNode",
        on_delete=models.CASCADE,
        related_name="code_lab_work",
    )
    language = models.CharField(max_length=32)
    draft_code = models.TextField(blank=True, default="")
    submitted_code = models.TextField(blank=True, default="")
    submitted_at = models.DateTimeField(null=True, blank=True)
    revision = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "learning_code_lab_work"
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "node"],
                name="learning_unique_enrollment_code_work",
            )
        ]
        indexes = [models.Index(fields=["enrollment", "-updated_at"])]


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


class CourseInvitation(TimeStampedModel):
    """Single-use course invitation for an email that may not have an account."""

    program = models.ForeignKey(
        "core.Program",
        on_delete=models.CASCADE,
        related_name="course_invitations",
    )
    email = models.EmailField()
    token_digest = models.CharField(max_length=64, unique=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_course_invitations",
    )
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accepted_invitations",
    )

    class Meta:
        db_table = "learning_course_invitations"
        indexes = [
            models.Index(fields=["program", "email"]),
            models.Index(fields=["expires_at"]),
        ]


class LearnerManagementAudit(TimeStampedModel):
    """Immutable record of instructor/admin learner-management actions."""

    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="management_audits",
    )
    action = models.CharField(max_length=64)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="learner_management_actions",
    )
    reason = models.TextField(blank=True, default="")
    previous_state = models.JSONField(default=dict, blank=True)
    resulting_state = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "learning_learner_management_audits"
        indexes = [models.Index(fields=["enrollment", "-created_at"])]


class LearnerReminderEvent(TimeStampedModel):
    """Durable reminder event that can feed current and future delivery channels."""

    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="reminder_events",
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learner_reminder_events",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_learner_reminders",
    )
    operation_id = models.UUIDField(db_index=True)
    notification_type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    message = models.TextField()
    action_url = models.CharField(max_length=500)
    condition = models.JSONField(default=dict, blank=True)
    channels = models.JSONField(default=dict, blank=True)
    idempotency_key = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "learning_learner_reminder_events"
        indexes = [
            models.Index(fields=["enrollment", "-created_at"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]


class AssessmentAttemptGrant(TimeStampedModel):
    """Audited extra quiz or assignment attempt allowance."""

    QUIZ = "quiz"
    ASSIGNMENT = "assignment"
    ASSESSMENT_TYPE_CHOICES = [(QUIZ, "Quiz"), (ASSIGNMENT, "Assignment")]

    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="attempt_grants",
    )
    assessment_type = models.CharField(max_length=16, choices=ASSESSMENT_TYPE_CHOICES)
    quiz = models.ForeignKey(
        "assessments.Quiz",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attempt_grants",
    )
    assignment = models.ForeignKey(
        "assessments.Assignment",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attempt_grants",
    )
    extra_attempts = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(20)],
    )
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="granted_assessment_attempts",
    )
    reason = models.TextField(blank=True, default="")

    class Meta:
        db_table = "learning_assessment_attempt_grants"
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(
                        assessment_type="quiz",
                        quiz__isnull=False,
                        assignment__isnull=True,
                    )
                    | Q(
                        assessment_type="assignment",
                        assignment__isnull=False,
                        quiz__isnull=True,
                    )
                ),
                name="learning_attempt_grant_target_matches_type",
            )
        ]
        indexes = [
            models.Index(fields=["enrollment", "assessment_type"]),
            models.Index(fields=["quiz"]),
            models.Index(fields=["assignment"]),
        ]
