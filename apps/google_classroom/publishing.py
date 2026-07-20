from __future__ import annotations

import hashlib
import json
from datetime import timezone as datetime_timezone
from urllib.parse import urljoin

from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.assessments.models import Assignment, Quiz
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Announcement

from .adapter import ClassroomAPIError
from .configuration import classroom_public_base_url
from .models import ClassroomResourceMapping


def _secure_url(path):
    return urljoin(f"{classroom_public_base_url()}/", path.lstrip("/"))


def _link_material(url, title):
    return {"link": {"url": url, "title": title}}


def _due_fields(value):
    if not value:
        return {}
    utc_value = value.astimezone(datetime_timezone.utc)
    return {
        "dueDate": {
            "year": utc_value.year,
            "month": utc_value.month,
            "day": utc_value.day,
        },
        "dueTime": {
            "hours": utc_value.hour,
            "minutes": utc_value.minute,
            "seconds": utc_value.second,
        },
    }


def build_resource_payload(program, local_type, local_id, google_resource_type=None):
    local_id = str(local_id)
    if local_type == "lesson":
        node = CurriculumNode.objects.filter(pk=local_id, program=program).first()
        if not node:
            raise ValidationError("The lesson no longer exists in this course.")
        body = {
            "title": node.title,
            "description": node.description or "",
            "materials": [
                _link_material(
                    _secure_url(
                        f"/student/courses/{program.id}/lessons/{node.id}/launch/"
                    ),
                    node.title,
                )
            ],
            "state": "PUBLISHED",
        }
        return "material", body
    if local_type == "assignment":
        assignment = Assignment.objects.filter(pk=local_id, program=program).first()
        if not assignment:
            raise ValidationError("The assignment no longer exists in this course.")
        body = {
            "title": assignment.title,
            "description": assignment.description or assignment.instructions or "",
            "workType": "ASSIGNMENT",
            "materials": [
                _link_material(
                    _secure_url("/student/assignments/"), assignment.title
                )
            ],
            "maxPoints": 100,
            "state": "PUBLISHED",
            **_due_fields(assignment.due_date),
        }
        return "coursework", body
    if local_type == "quiz":
        quiz = Quiz.objects.select_related("node__program").filter(
            pk=local_id, node__program=program
        ).first()
        if not quiz:
            raise ValidationError("The quiz no longer exists in this course.")
        body = {
            "title": quiz.title,
            "description": quiz.description or "Complete this quiz securely in the course player.",
            "workType": "ASSIGNMENT",
            "materials": [
                _link_material(
                    _secure_url(
                        f"/student/courses/{program.id}/lessons/{quiz.node_id}/launch/"
                    ),
                    quiz.title,
                )
            ],
            "maxPoints": max(quiz.get_total_points(), 1),
            "state": "PUBLISHED",
        }
        return "coursework", body
    if local_type == "announcement":
        announcement = Announcement.objects.filter(pk=local_id, program=program).first()
        if not announcement:
            raise ValidationError("The announcement no longer exists in this course.")
        return "announcement", {
            "text": f"{announcement.title}\n\n{announcement.content}",
            "state": "PUBLISHED",
        }
    if local_type == "topic":
        node = CurriculumNode.objects.filter(pk=local_id, program=program).first()
        if not node:
            raise ValidationError("The curriculum section no longer exists in this course.")
        return "topic", {"name": node.title}
    raise ValidationError("Select a supported course resource type.")


def canonical_payload_hash(resource_type, body):
    value = json.dumps(
        {"resourceType": resource_type, "body": body},
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(value.encode()).hexdigest()


def remote_snapshot(resource_type, value):
    keys = {
        "coursework": [
            "title", "description", "workType", "materials", "maxPoints",
            "dueDate", "dueTime", "state", "topicId",
        ],
        "material": ["title", "description", "materials", "state", "topicId"],
        "announcement": ["text", "materials", "state"],
        "topic": ["name"],
    }[resource_type]
    return {key: value[key] for key in keys if key in value}


def update_mask_for(resource_type, body):
    allowed = {
        "coursework": {
            "title", "description", "materials", "maxPoints", "dueDate", "dueTime", "state", "topicId"
        },
        "material": {"title", "description", "materials", "state", "topicId"},
        "announcement": {"text", "materials", "state"},
        "topic": {"name"},
    }[resource_type]
    return ",".join(sorted(set(body) & allowed))


def sync_resource(mapping, adapter, *, body, payload_hash, force=False):
    course_id = mapping.course_link.classroom_course_id
    resource_type = mapping.google_resource_type
    if mapping.google_resource_id:
        if not mapping.created_by_integration:
            raise ClassroomAPIError(
                "Only resources created by this integration can be synchronized.",
                category="project_ownership",
            )
        try:
            current = adapter.get_resource(
                course_id, resource_type, mapping.google_resource_id
            )
        except ClassroomAPIError as exc:
            if exc.category == "remote_deleted":
                mapping.status = ClassroomResourceMapping.Status.REMOTE_DELETED
                mapping.save(update_fields=["status", "updated_at"])
            raise
        current_snapshot = remote_snapshot(resource_type, current)
        if mapping.remote_snapshot and current_snapshot != mapping.remote_snapshot and not force:
            mapping.status = ClassroomResourceMapping.Status.DRIFT
            mapping.save(update_fields=["status", "updated_at"])
            raise ClassroomAPIError(
                "The Classroom resource changed outside the course platform.",
                category="remote_drift",
            )
        remote = adapter.update_resource(
            course_id,
            resource_type,
            mapping.google_resource_id,
            body,
            update_mask_for(resource_type, body),
        )
    else:
        remote = adapter.create_resource(course_id, resource_type, body)
        mapping.google_resource_id = str(remote["id"])

    mapping.status = ClassroomResourceMapping.Status.ACTIVE
    mapping.payload_hash = payload_hash
    mapping.remote_snapshot = remote_snapshot(resource_type, remote)
    mapping.remote_update_time = str(remote.get("updateTime", ""))
    mapping.last_synced_at = timezone.now()
    mapping.save(
        update_fields=[
            "google_resource_id", "status", "payload_hash", "remote_snapshot",
            "remote_update_time", "last_synced_at", "updated_at",
        ]
    )
    return remote


def inspect_mapping_drift(mapping, adapter):
    identity = {
        "mappingId": mapping.id,
        "localType": mapping.local_type,
        "localId": mapping.local_id,
        "googleResourceType": mapping.google_resource_type,
        "googleResourceId": mapping.google_resource_id,
    }
    if not mapping.google_resource_id:
        return {**identity, "status": "not_published"}
    try:
        current = adapter.get_resource(
            mapping.course_link.classroom_course_id,
            mapping.google_resource_type,
            mapping.google_resource_id,
        )
    except ClassroomAPIError as exc:
        if exc.category == "remote_deleted":
            mapping.status = ClassroomResourceMapping.Status.REMOTE_DELETED
            mapping.save(update_fields=["status", "updated_at"])
        return {**identity, "status": exc.category}
    changed = remote_snapshot(mapping.google_resource_type, current) != mapping.remote_snapshot
    mapping.status = (
        ClassroomResourceMapping.Status.DRIFT
        if changed
        else ClassroomResourceMapping.Status.ACTIVE
    )
    mapping.save(update_fields=["status", "updated_at"])
    return {
        **identity,
        "status": "drift" if changed else "in_sync",
    }


def unlink_resource_mapping(mapping, actor):
    from .models import ClassroomSyncAudit

    detached_resource_id = mapping.google_resource_id
    mapping.google_resource_id = ""
    mapping.status = ClassroomResourceMapping.Status.UNLINKED
    mapping.payload_hash = ""
    mapping.remote_snapshot = {}
    mapping.remote_update_time = ""
    mapping.last_synced_at = None
    mapping.save(
        update_fields=[
            "google_resource_id",
            "status",
            "payload_hash",
            "remote_snapshot",
            "remote_update_time",
            "last_synced_at",
            "updated_at",
        ]
    )
    mapping.sync_jobs.filter(status__in=["pending", "failed", "processing"]).update(
        status="dead",
        error_category="resource_unlinked",
        last_error="The Classroom resource mapping was explicitly unlinked.",
        finished_at=timezone.now(),
        locked_at=None,
        updated_at=timezone.now(),
    )
    ClassroomSyncAudit.objects.create(
        course_link=mapping.course_link,
        actor=actor,
        action="resource_unlinked",
        details={
            "mappingId": mapping.id,
            "localType": mapping.local_type,
            "localId": mapping.local_id,
            "googleResourceType": mapping.google_resource_type,
            "googleResourceId": detached_resource_id,
        },
    )
