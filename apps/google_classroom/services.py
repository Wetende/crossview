from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from .adapter import GoogleClassroomAdapter
from .configuration import classroom_configuration, granted_capabilities
from .models import (
    ClassroomCourseLink,
    ClassroomOAuthCredential,
    ClassroomResourceMapping,
    ClassroomSyncAudit,
)


def connected_credential(user):
    return ClassroomOAuthCredential.objects.filter(
        user=user, status=ClassroomOAuthCredential.Status.CONNECTED
    ).first()


def require_connected_credential(user):
    credential = connected_credential(user)
    if not credential:
        raise ValidationError("Connect an authorized Google teacher account first.")
    return credential


def serialize_connection(user):
    credential = ClassroomOAuthCredential.objects.filter(user=user).first()
    return {
        "available": classroom_configuration()["available"],
        "connected": bool(
            credential and credential.status == ClassroomOAuthCredential.Status.CONNECTED
        ),
        "status": credential.status if credential else "disconnected",
        "googleEmail": credential.google_email if credential else "",
        "grantedScopes": credential.granted_scopes if credential else [],
        "grantedCapabilities": sorted(granted_capabilities(credential)) if credential else [],
        "lastError": credential.last_error if credential else "",
    }


def serialize_course_link(link):
    if not link:
        return {"connected": False}
    return {
        "connected": bool(link.enabled),
        "id": link.id,
        "courseId": link.classroom_course_id,
        "name": link.classroom_name,
        "section": link.classroom_section,
        "courseState": link.course_state,
        "needsActivation": link.course_state == "PROVISIONED",
        "enrollmentCode": link.enrollment_code,
        "alternateLink": link.alternate_link,
        "syncPaused": link.sync_paused,
        "lastAttemptedAt": link.last_attempted_at.isoformat() if link.last_attempted_at else None,
        "lastSuccessAt": link.last_success_at.isoformat() if link.last_success_at else None,
        "lastErrorCategory": link.last_error_category,
        "lastError": link.last_error,
        "connectedBy": link.credential.google_email if link.credential else "",
    }


def course_link_for(program):
    try:
        return program.google_classroom_link
    except ClassroomCourseLink.DoesNotExist:
        return None


@transaction.atomic
def link_classroom_course(*, program, actor, classroom_course_id, adapter=None):
    credential = require_connected_credential(actor)
    adapter = adapter or GoogleClassroomAdapter(credential)
    adapter.ensure_teacher(classroom_course_id)
    remote = adapter.get_course(classroom_course_id)
    existing = ClassroomCourseLink.objects.select_for_update().filter(program=program).first()
    values = {
        "credential": credential,
        "classroom_course_id": str(remote["id"]),
        "classroom_name": remote.get("name", program.name),
        "classroom_section": remote.get("section", ""),
        "enrollment_code": remote.get("enrollmentCode", ""),
        "alternate_link": remote.get("alternateLink", ""),
        "course_state": remote.get("courseState", ""),
        "enabled": True,
        "sync_paused": False,
        "last_error_category": "",
        "last_error": "",
    }
    try:
        if existing:
            relinked = existing.classroom_course_id != str(remote["id"])
            if relinked:
                existing.resource_mappings.update(
                    google_resource_id="",
                    status="unlinked",
                    payload_hash="",
                    remote_snapshot={},
                    remote_update_time="",
                    last_synced_at=None,
                    updated_at=timezone.now(),
                )
                existing.roster_mappings.update(
                    status="removed", updated_at=timezone.now()
                )
                existing.sync_jobs.filter(status__in=["pending", "failed", "processing"]).update(
                    status="dead",
                    error_category="course_relinked",
                    last_error="The local course was linked to another Classroom course.",
                    finished_at=timezone.now(),
                    locked_at=None,
                    updated_at=timezone.now(),
                )
            for field, value in values.items():
                setattr(existing, field, value)
            existing.save()
            link = existing
        else:
            link = ClassroomCourseLink.objects.create(program=program, **values)
    except IntegrityError as exc:
        raise ValidationError("That Google Classroom course is linked elsewhere.") from exc
    ClassroomSyncAudit.objects.create(
        course_link=link,
        actor=actor,
        action="course_linked",
        details={"classroomCourseId": link.classroom_course_id},
    )
    return link


def unlink_classroom_course(link, actor):
    link.enabled = False
    link.sync_paused = True
    link.save(update_fields=["enabled", "sync_paused", "updated_at"])
    ClassroomSyncAudit.objects.create(
        course_link=link,
        actor=actor,
        action="course_unlinked",
        details={"classroomCourseId": link.classroom_course_id},
    )


def serialize_student_companion(program, enrollment):
    link = course_link_for(program)
    if not link or not link.enabled:
        return {"available": False, "connected": False}
    mapping = link.roster_mappings.filter(enrollment=enrollment).first()
    return {
        "available": True,
        "connected": True,
        "membershipStatus": mapping.status if mapping else "not_joined",
        "classCode": link.enrollment_code,
        "alternateLink": link.alternate_link,
        "courseName": link.classroom_name,
    }


def serialize_student_classroom_publication(program, node):
    link = course_link_for(program)
    if not link or not link.enabled:
        return {"published": False, "status": "not_linked"}
    mapping = link.resource_mappings.filter(
        local_type="lesson",
        local_id=str(node.id),
    ).first()
    if not mapping or not mapping.google_resource_id:
        return {"published": False, "status": "not_published"}
    return {
        "published": mapping.status
        in {
            ClassroomResourceMapping.Status.ACTIVE,
            ClassroomResourceMapping.Status.DRIFT,
        },
        "status": mapping.status,
        "resourceType": mapping.google_resource_type,
        "lastSyncedAt": (
            mapping.last_synced_at.isoformat() if mapping.last_synced_at else None
        ),
    }


def serialize_publishable_resources(program):
    lessons = program.curriculum_nodes.filter(
        is_published=True, children__isnull=True
    ).order_by("position", "id")
    topics = program.curriculum_nodes.filter(
        is_published=True, parent__isnull=True, children__isnull=False
    ).distinct().order_by("position", "id")
    assignments = program.assignments.filter(is_published=True).order_by("id")
    from apps.assessments.models import Quiz

    quizzes = Quiz.objects.filter(
        node__program=program, is_published=True
    ).select_related("node").order_by("node__position", "id")
    announcements = program.announcements.order_by("-created_at")[:100]
    return [
        *[
            {"localType": "lesson", "localId": str(item.id), "title": item.title}
            for item in lessons
        ],
        *[
            {"localType": "topic", "localId": str(item.id), "title": item.title}
            for item in topics
        ],
        *[
            {"localType": "assignment", "localId": str(item.id), "title": item.title}
            for item in assignments
        ],
        *[
            {"localType": "quiz", "localId": str(item.id), "title": item.title}
            for item in quizzes
        ],
        *[
            {"localType": "announcement", "localId": str(item.id), "title": item.title}
            for item in announcements
        ],
    ]
