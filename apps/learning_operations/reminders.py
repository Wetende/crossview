from __future__ import annotations

from uuid import UUID, uuid4

from django.utils import timezone

from apps.assessments.models import Assignment, AssignmentSubmission
from apps.notifications.models import NotificationEmailOutbox
from apps.notifications.services import NotificationService

from .models import LearnerManagementAudit, LearnerReminderEvent
from .services import classify_enrollment


def _local_deadline(value):
    return timezone.localtime(value).strftime("%d %b %Y at %H:%M")


def _candidate(
    enrollment,
    *,
    notification_type,
    title,
    message,
    action_url,
    condition,
    related_assessment_id=None,
):
    availability = NotificationService.delivery_availability(
        enrollment.user, notification_type
    )
    return {
        "enrollment": enrollment,
        "enrollmentId": enrollment.id,
        "learnerName": enrollment.user.get_full_name() or enrollment.user.email,
        "notificationType": notification_type,
        "title": title,
        "message": message,
        "actionUrl": action_url,
        "condition": condition,
        "relatedAssessmentId": related_assessment_id,
        "availableChannels": availability,
    }


def build_contextual_reminder_candidates(enrollments, *, now=None):
    """Choose at most one highest-priority contextual reminder per enrollment."""
    now = now or timezone.now()
    enrollments = list(enrollments)
    if not enrollments:
        return {}
    program = enrollments[0].program
    assignments = list(
        Assignment.objects.filter(
            program=program,
            is_published=True,
            due_date__isnull=False,
        ).order_by("due_date", "id")
    )
    resolved = set(
        AssignmentSubmission.objects.filter(
            enrollment__in=enrollments,
            assignment__in=assignments,
            status__in=["submitted", "graded"],
        ).values_list("enrollment_id", "assignment_id")
    )
    results = {}
    for enrollment in enrollments:
        unresolved = [
            assignment
            for assignment in assignments
            if (enrollment.id, assignment.id) not in resolved
        ]
        overdue = [
            assignment for assignment in unresolved if assignment.due_date < now
        ]
        if overdue:
            assignment = overdue[0]
            results[enrollment.id] = _candidate(
                enrollment,
                notification_type="assignment_reminder",
                title=f"Assignment overdue: {assignment.title}",
                message=(
                    f'“{assignment.title}” in “{program.name}” was due on '
                    f"{_local_deadline(assignment.due_date)}. Submit it as soon as possible."
                ),
                action_url=f"/student/assignments/{assignment.id}/",
                related_assessment_id=assignment.id,
                condition={
                    "type": "overdue_assignment",
                    "title": f"{assignment.title} is overdue",
                    "dueAt": assignment.due_date.isoformat(),
                    "assignmentId": assignment.id,
                    "severity": "error",
                },
            )
            continue

        upcoming = [
            (assignment.due_date, "assignment", assignment)
            for assignment in unresolved
            if assignment.due_date >= now
        ]
        if enrollment.expires_at and enrollment.expires_at > now:
            upcoming.append((enrollment.expires_at, "access_expiry", None))
        if upcoming:
            due_at, deadline_type, assignment = min(
                upcoming, key=lambda item: item[0]
            )
            if deadline_type == "assignment":
                results[enrollment.id] = _candidate(
                    enrollment,
                    notification_type="assignment_reminder",
                    title=f"Upcoming assignment: {assignment.title}",
                    message=(
                        f'“{assignment.title}” in “{program.name}” is due on '
                        f"{_local_deadline(due_at)}."
                    ),
                    action_url=f"/student/assignments/{assignment.id}/",
                    related_assessment_id=assignment.id,
                    condition={
                        "type": "upcoming_assignment",
                        "title": f"{assignment.title} is due soon",
                        "dueAt": due_at.isoformat(),
                        "assignmentId": assignment.id,
                        "severity": "warning",
                    },
                )
            else:
                results[enrollment.id] = _candidate(
                    enrollment,
                    notification_type="access_expiry_reminder",
                    title="Course access expires soon",
                    message=(
                        f'Your access to “{program.name}” expires on '
                        f"{_local_deadline(due_at)}."
                    ),
                    action_url=f"/student/programs/{program.id}/",
                    condition={
                        "type": "access_expiry",
                        "title": "Course access expires soon",
                        "dueAt": due_at.isoformat(),
                        "severity": "warning",
                    },
                )
            continue

        learner_state = classify_enrollment(enrollment, now=now)
        if learner_state == "not_started":
            results[enrollment.id] = _candidate(
                enrollment,
                notification_type="course_start_reminder",
                title=f"Start {program.name}",
                message=(
                    f'Your course “{program.name}” is ready. Open your first lesson '
                    "to begin learning."
                ),
                action_url=f"/student/programs/{program.id}/",
                condition={
                    "type": "not_started",
                    "title": "Course not started",
                    "dueAt": None,
                    "severity": "warning",
                },
            )
        elif learner_state in {"stalled", "inactive"}:
            days = 7 if learner_state == "stalled" else 30
            results[enrollment.id] = _candidate(
                enrollment,
                notification_type="inactivity_reminder",
                title="Continue your learning",
                message=(
                    f'You have not been active in “{program.name}” for at least '
                    f"{days} days. Return to continue where you left off."
                ),
                action_url=f"/student/programs/{program.id}/",
                condition={
                    "type": learner_state,
                    "title": (
                        "Learning has stalled"
                        if learner_state == "stalled"
                        else "Learner is inactive"
                    ),
                    "dueAt": None,
                    "severity": "warning" if learner_state == "stalled" else "error",
                },
            )
    return results


def _public_candidate(candidate):
    return {
        key: value
        for key, value in candidate.items()
        if key != "enrollment"
    }


def preview_contextual_reminders(enrollments, *, operation_id=None, now=None):
    enrollments = list(enrollments)
    operation_id = operation_id or uuid4()
    candidates = build_contextual_reminder_candidates(enrollments, now=now)
    reminders = [
        _public_candidate(candidates[enrollment.id])
        for enrollment in enrollments
        if enrollment.id in candidates
    ]
    eligible = len(reminders)
    title = reminders[0]["title"] if eligible == 1 else "Contextual learner reminders"
    message = (
        reminders[0]["message"]
        if eligible == 1
        else "Each eligible learner will receive the message shown in this preview."
    )
    return {
        "operationId": str(operation_id),
        "requested": len(enrollments),
        "eligible": eligible,
        "skipped": len(enrollments) - eligible,
        "learnerCount": eligible,
        "skippedCount": len(enrollments) - eligible,
        "title": title,
        "message": message,
        "reminders": reminders,
    }


def send_contextual_reminders(
    enrollments,
    *,
    actor,
    operation_id=None,
    now=None,
):
    enrollments = list(enrollments)
    operation_id = UUID(str(operation_id)) if operation_id else uuid4()
    candidates = build_contextual_reminder_candidates(enrollments, now=now)
    unavailable = {"inApp": 0, "email": 0}
    results = []
    processed = 0
    for enrollment in enrollments:
        key = f"manual-reminder:{enrollment.program_id}:{operation_id}:{enrollment.id}"
        event = LearnerReminderEvent.objects.filter(idempotency_key=key).first()
        candidate = candidates.get(enrollment.id)
        if event is None and candidate is None:
            results.append(
                {
                    "enrollmentId": enrollment.id,
                    "status": "skipped",
                    "detail": "No contextual reminder is currently needed.",
                }
            )
            continue
        if event is None:
            event, created = LearnerReminderEvent.objects.get_or_create(
                idempotency_key=key,
                defaults={
                    "enrollment": enrollment,
                    "recipient": enrollment.user,
                    "actor": actor,
                    "operation_id": operation_id,
                    "notification_type": candidate["notificationType"],
                    "title": candidate["title"],
                    "message": candidate["message"],
                    "action_url": candidate["actionUrl"],
                    "condition": candidate["condition"],
                },
            )
            if created:
                LearnerManagementAudit.objects.create(
                    enrollment=enrollment,
                    action="send_reminder",
                    actor=actor,
                    previous_state={},
                    resulting_state={
                        "operationId": str(operation_id),
                        "reminderEventId": event.id,
                    },
                )

        notification = NotificationService.notify_with_email(
            recipient=event.recipient,
            notification_type=event.notification_type,
            title=event.title,
            message=event.message,
            action_url=event.action_url,
            related_program_id=event.enrollment.program_id,
            related_enrollment_id=event.enrollment_id,
            related_assessment_id=(event.condition or {}).get("assignmentId"),
            idempotency_key=event.idempotency_key,
            email_metadata={
                "reminderEventId": event.id,
                "operationId": str(operation_id),
                "actionUrl": event.action_url,
            },
        )
        email_row = NotificationEmailOutbox.objects.filter(
            idempotency_key=f"email:{event.idempotency_key}"
        ).first()
        channels = {
            "inApp": "created" if notification else "unavailable",
            "email": email_row.status if email_row else "unavailable",
        }
        unavailable["inApp"] += int(channels["inApp"] == "unavailable")
        unavailable["email"] += int(channels["email"] == "unavailable")
        if event.channels != channels:
            event.channels = channels
            event.save(update_fields=["channels", "updated_at"])
        processed += 1
        results.append(
            {
                "enrollmentId": enrollment.id,
                "status": "processed",
                "eventId": event.id,
                "channels": channels,
            }
        )
    return {
        "operationId": str(operation_id),
        "requested": len(enrollments),
        "processed": processed,
        "skipped": len(enrollments) - processed,
        "unavailableChannels": unavailable,
        "results": results,
        "updated": processed,
        "action": "send_reminder",
    }
