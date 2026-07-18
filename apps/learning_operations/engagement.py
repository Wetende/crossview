from __future__ import annotations

from datetime import timedelta

from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.assessments.models import Assignment, AssignmentSubmission
from apps.notifications.services import NotificationService
from apps.progression.models import Enrollment

from .models import CourseEngagementPolicy, EnrollmentLearningActivity


def get_course_engagement_policy(program):
    policy, _ = CourseEngagementPolicy.objects.get_or_create(program=program)
    return policy


def _normalize_offsets(values, *, allow_negative):
    if not isinstance(values, list) or not values:
        raise ValidationError("Provide at least one reminder offset.")
    offsets = []
    for value in values:
        if isinstance(value, bool):
            raise ValidationError("Reminder offsets must be whole days.")
        try:
            offset = int(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError("Reminder offsets must be whole days.") from exc
        if offset != value or abs(offset) > 365 or (not allow_negative and offset < 0):
            raise ValidationError("Select reminder offsets between 0 and 365 days.")
        offsets.append(offset)
    return sorted(set(offsets), reverse=True)


def update_course_engagement_policy(program, values):
    policy = get_course_engagement_policy(program)
    boolean_fields = {
        "assignmentRemindersEnabled": "assignment_reminders_enabled",
        "expiryRemindersEnabled": "expiry_reminders_enabled",
        "inactivityRemindersEnabled": "inactivity_reminders_enabled",
    }
    offset_fields = {
        "assignmentOffsets": ("assignment_offsets", True),
        "expiryOffsets": ("expiry_offsets", False),
        "inactivityOffsets": ("inactivity_offsets", False),
    }
    changed = []
    for public_name, model_name in boolean_fields.items():
        if public_name in values:
            setattr(policy, model_name, bool(values[public_name]))
            changed.append(model_name)
    for public_name, (model_name, allow_negative) in offset_fields.items():
        if public_name in values:
            setattr(
                policy,
                model_name,
                _normalize_offsets(values[public_name], allow_negative=allow_negative),
            )
            changed.append(model_name)
    if changed:
        policy.save(update_fields=[*changed, "updated_at"])
    return policy


def serialize_engagement_policy(policy):
    return {
        "assignmentRemindersEnabled": policy.assignment_reminders_enabled,
        "assignmentOffsets": policy.assignment_offsets,
        "expiryRemindersEnabled": policy.expiry_reminders_enabled,
        "expiryOffsets": policy.expiry_offsets,
        "inactivityRemindersEnabled": policy.inactivity_reminders_enabled,
        "inactivityOffsets": policy.inactivity_offsets,
    }


def _in_window(target, now, lookback):
    return now - lookback < target <= now


def _assignment_events(policy, now, lookback):
    if not policy.assignment_reminders_enabled:
        return 0
    count = 0
    assignments = Assignment.objects.filter(
        program=policy.program,
        is_published=True,
        due_date__isnull=False,
    )
    enrollments = Enrollment.objects.filter(program=policy.program, status="active")
    for assignment in assignments:
        for offset in policy.assignment_offsets:
            target = assignment.due_date - timedelta(days=offset)
            if not _in_window(target, now, lookback):
                continue
            resolved = AssignmentSubmission.objects.filter(
                enrollment__in=enrollments,
                assignment=assignment,
                status__in=["submitted", "graded"],
            ).values_list("enrollment_id", flat=True)
            for enrollment in enrollments.exclude(id__in=resolved).select_related("user"):
                label = f"due in {offset} days" if offset > 0 else f"overdue by {abs(offset)} days"
                key = f"assignment:{assignment.id}:{enrollment.id}:{assignment.due_date.isoformat()}:{offset}"
                NotificationService.notify_with_email(
                    recipient=enrollment.user,
                    notification_type="assignment_reminder",
                    title=f"Assignment {label}",
                    message=f'“{assignment.title}” in “{policy.program.name}” is {label}.',
                    action_url=f"/student/assignments/{assignment.id}/",
                    related_program_id=policy.program_id,
                    related_enrollment_id=enrollment.id,
                    related_assessment_id=assignment.id,
                    idempotency_key=key,
                )
                count += 1
    return count


def _expiry_events(policy, now, lookback):
    if not policy.expiry_reminders_enabled:
        return 0
    count = 0
    enrollments = Enrollment.objects.filter(
        program=policy.program,
        status="active",
        expires_at__isnull=False,
        expires_at__gt=now,
    ).select_related("user")
    for enrollment in enrollments:
        for offset in policy.expiry_offsets:
            target = enrollment.expires_at - timedelta(days=offset)
            if not _in_window(target, now, lookback):
                continue
            key = f"expiry:{enrollment.id}:{enrollment.expires_at.isoformat()}:{offset}"
            NotificationService.notify_with_email(
                recipient=enrollment.user,
                notification_type="access_expiry_reminder",
                title="Course access expires soon",
                message=f'Your access to “{policy.program.name}” expires in {offset} days.',
                action_url=f"/student/programs/{policy.program_id}/",
                related_program_id=policy.program_id,
                related_enrollment_id=enrollment.id,
                idempotency_key=key,
            )
            count += 1
    return count


def _inactivity_events(policy, now, lookback):
    if not policy.inactivity_reminders_enabled:
        return 0
    count = 0
    activities = EnrollmentLearningActivity.objects.filter(
        enrollment__program=policy.program,
        enrollment__status="active",
        last_activity_at__isnull=False,
    ).select_related("enrollment__user")
    for activity in activities:
        enrollment = activity.enrollment
        if enrollment.expires_at and enrollment.expires_at <= now:
            continue
        for offset in policy.inactivity_offsets:
            target = activity.last_activity_at + timedelta(days=offset)
            if not _in_window(target, now, lookback):
                continue
            key = f"inactive:{enrollment.id}:{activity.last_activity_at.isoformat()}:{offset}"
            NotificationService.notify_with_email(
                recipient=enrollment.user,
                notification_type="inactivity_reminder",
                title="Continue your learning",
                message=f'It has been {offset} days since your last activity in “{policy.program.name}”.',
                action_url=f"/student/programs/{policy.program_id}/",
                related_program_id=policy.program_id,
                related_enrollment_id=enrollment.id,
                idempotency_key=key,
            )
            count += 1
    return count


def generate_engagement_reminders(*, now=None, lookback=None):
    now = now or timezone.now()
    lookback = lookback or timedelta(minutes=20)
    counts = {"assignments": 0, "expiry": 0, "inactivity": 0}
    for policy in CourseEngagementPolicy.objects.select_related("program"):
        counts["assignments"] += _assignment_events(policy, now, lookback)
        counts["expiry"] += _expiry_events(policy, now, lookback)
        counts["inactivity"] += _inactivity_events(policy, now, lookback)
    counts["total"] = sum(counts.values())
    return counts
