import json
import os
from pathlib import Path

import pytest
from django.contrib.auth.models import Group
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.curriculum.services import CoursePublishValidationService
from apps.progression.models import InstructorAssignment


def _make_pdf_bytes(page_count=2):
    import fitz

    doc = fitz.open()
    try:
        for _ in range(page_count):
            doc.new_page()
        return doc.tobytes()
    finally:
        doc.close()


@pytest.fixture
def media_root(settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path / "media")
    settings.MEDIA_URL = "/media/"
    return settings.MEDIA_ROOT


@pytest.fixture
def instructor(db):
    user = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


@pytest.fixture
def other_instructor(db):
    user = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


@pytest.fixture
def program(db):
    blueprint = AcademicBlueprint.objects.create(
        name="Document Blueprint",
        hierarchy_structure=["Section", "Lesson"],
        grading_logic={"type": "weighted", "components": []},
    )
    return Program.objects.create(
        blueprint=blueprint,
        name="Document Program",
        code="DOC-PROGRAM-1",
        level="certificate",
    )


@pytest.fixture
def document_node(db, program):
    section = CurriculumNode.objects.create(
        program=program,
        title="Section 1",
        node_type="Section",
        properties={},
        position=0,
    )
    return CurriculumNode.objects.create(
        program=program,
        parent=section,
        title="Document Lesson",
        node_type="Lesson",
        properties={"lesson_type": "document"},
        position=0,
    )


@pytest.fixture
def assigned_instructor(instructor, program):
    return InstructorAssignment.objects.create(instructor=instructor, program=program)


@pytest.mark.django_db
def test_upload_pdf_document_stores_metadata(
    client, media_root, instructor, assigned_instructor, document_node
):
    client.force_login(instructor)

    upload_url = reverse(
        "core:instructor.lesson_document_upload",
        kwargs={"node_id": document_node.id},
    )
    pdf_file = SimpleUploadedFile(
        "intro.pdf",
        _make_pdf_bytes(page_count=2),
        content_type="application/pdf",
    )

    response = client.post(upload_url, {"file": pdf_file})
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    document = payload["document"]
    assert document["original_ext"] == "pdf"
    assert document["conversion_status"] == "ready"
    assert document["page_count"] == 2
    assert document["viewer_pdf_url"] == document["original_url"]

    document_node.refresh_from_db()
    assert document_node.properties["document"]["original_name"] == "intro.pdf"

    stored_file = os.path.join(media_root, document["original_path"])
    assert os.path.exists(stored_file)


@pytest.mark.django_db
def test_upload_docx_converts_to_tracked_pdf(
    client,
    media_root,
    instructor,
    assigned_instructor,
    document_node,
    monkeypatch,
):
    def fake_convert(input_path, output_dir, timeout_seconds=120):
        output_path = os.path.join(
            output_dir, f"{Path(input_path).stem}.pdf"
        )
        with open(output_path, "wb") as handle:
            handle.write(_make_pdf_bytes(page_count=3))
        return output_path, 0.08

    monkeypatch.setattr(
        "apps.core.views._convert_office_document_to_pdf",
        fake_convert,
    )

    client.force_login(instructor)
    upload_url = reverse(
        "core:instructor.lesson_document_upload",
        kwargs={"node_id": document_node.id},
    )
    docx_file = SimpleUploadedFile(
        "lesson.docx",
        b"fake-docx-content",
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )

    response = client.post(upload_url, {"file": docx_file})
    assert response.status_code == 200
    document = response.json()["document"]
    assert document["original_ext"] == "docx"
    assert document["conversion_status"] == "ready"
    assert document["page_count"] == 3
    assert document["viewer_pdf_path"].endswith(".pdf")
    assert document["viewer_pdf_url"] != document["original_url"]


@pytest.mark.django_db
def test_upload_invalid_extension_returns_400(
    client, instructor, assigned_instructor, document_node
):
    client.force_login(instructor)
    upload_url = reverse(
        "core:instructor.lesson_document_upload",
        kwargs={"node_id": document_node.id},
    )
    bad_file = SimpleUploadedFile(
        "script.sh",
        b"echo hello",
        content_type="text/plain",
    )

    response = client.post(upload_url, {"file": bad_file})
    assert response.status_code == 400
    assert "supported" in response.json()["error"].lower()


@pytest.mark.django_db
def test_conversion_failure_returns_error_and_does_not_store_document(
    client,
    media_root,
    instructor,
    assigned_instructor,
    document_node,
    monkeypatch,
):
    def fake_convert(*args, **kwargs):
        raise RuntimeError("conversion failed")

    monkeypatch.setattr(
        "apps.core.views._convert_office_document_to_pdf",
        fake_convert,
    )

    client.force_login(instructor)
    upload_url = reverse(
        "core:instructor.lesson_document_upload",
        kwargs={"node_id": document_node.id},
    )
    docx_file = SimpleUploadedFile(
        "broken.docx",
        b"broken-content",
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )

    response = client.post(upload_url, {"file": docx_file})
    assert response.status_code == 400

    document_node.refresh_from_db()
    assert "document" not in document_node.properties

    document_dir = Path(media_root) / "lesson_documents" / str(document_node.program_id) / str(document_node.id)
    if document_dir.exists():
        assert not list(document_dir.glob("*"))


@pytest.mark.django_db
def test_delete_primary_document_removes_metadata_and_file(
    client, media_root, instructor, assigned_instructor, document_node
):
    client.force_login(instructor)
    upload_url = reverse(
        "core:instructor.lesson_document_upload",
        kwargs={"node_id": document_node.id},
    )
    delete_url = reverse(
        "core:instructor.lesson_document_delete",
        kwargs={"node_id": document_node.id},
    )
    pdf_file = SimpleUploadedFile(
        "chapter1.pdf",
        _make_pdf_bytes(page_count=1),
        content_type="application/pdf",
    )

    upload_response = client.post(upload_url, {"file": pdf_file})
    assert upload_response.status_code == 200
    stored_path = upload_response.json()["document"]["original_path"]
    assert os.path.exists(os.path.join(media_root, stored_path))

    delete_response = client.post(delete_url, {})
    assert delete_response.status_code == 200
    assert delete_response.json()["success"] is True

    document_node.refresh_from_db()
    assert "document" not in document_node.properties
    assert not os.path.exists(os.path.join(media_root, stored_path))


@pytest.mark.django_db
def test_non_owner_instructor_cannot_upload_document(
    client, other_instructor, document_node
):
    client.force_login(other_instructor)
    upload_url = reverse(
        "core:instructor.lesson_document_upload",
        kwargs={"node_id": document_node.id},
    )
    pdf_file = SimpleUploadedFile(
        "intro.pdf",
        _make_pdf_bytes(page_count=1),
        content_type="application/pdf",
    )

    response = client.post(upload_url, {"file": pdf_file})
    assert response.status_code == 404


@pytest.mark.django_db
def test_document_strict_mode_blocks_node_save_without_ready_conversion(
    client, instructor, assigned_instructor, document_node
):
    client.force_login(instructor)
    update_url = reverse(
        "core:instructor.node_update",
        kwargs={"node_id": document_node.id},
    )

    payload = {
        "title": "Updated Title",
        "properties": {
            "lesson_type": "document",
            "document": {
                "strict_completion": True,
                "conversion_status": "processing",
                "viewer_pdf_url": "",
                "page_count": 0,
            },
        },
    }

    response = client.post(
        update_url,
        data=json.dumps(payload),
        content_type="application/json",
    )
    assert response.status_code == 302

    document_node.refresh_from_db()
    assert document_node.title == "Document Lesson"


def _post_node_update(client, node, properties):
    return client.post(
        reverse("core:instructor.node_update", kwargs={"node_id": node.id}),
        data=json.dumps({"title": "Updated Title", "properties": properties}),
        content_type="application/json",
    )


@pytest.mark.django_db
def test_document_save_without_upload_returns_inertia_errors_to_open_editor(
    client, instructor, assigned_instructor, program, document_node
):
    client.force_login(instructor)

    response = _post_node_update(
        client, document_node, {"lesson_type": "document", "document": {}}
    )

    manage_url = reverse("core:instructor.program_manage", kwargs={"pk": program.id})
    assert response.status_code == 302
    assert response["Location"] == f"{manage_url}?node={document_node.id}"

    page = client.get(response["Location"], HTTP_X_INERTIA="true").json()
    message = "Document lesson requires a primary document upload before saving."
    assert page["component"] == "Instructor/Program/Manage"
    assert page["props"]["errors"] == {"properties": message}
    assert page["props"]["flash"] == [{"type": "error", "message": message}]

    # Errors are one-shot: the next visit is clean.
    next_page = client.get(manage_url, HTTP_X_INERTIA="true").json()
    assert next_page["props"]["errors"] == {}

    document_node.refresh_from_db()
    assert document_node.title == "Document Lesson"


@pytest.mark.django_db
def test_document_strict_save_before_conversion_returns_inertia_errors(
    client, instructor, assigned_instructor, program, document_node
):
    client.force_login(instructor)

    response = _post_node_update(
        client,
        document_node,
        {
            "lesson_type": "document",
            "document": {
                "original_url": "/media/documents/source.docx",
                "strict_completion": True,
                "conversion_status": "processing",
            },
        },
    )

    assert response.status_code == 302
    assert response["Location"].endswith(f"?node={document_node.id}")
    page = client.get(response["Location"], HTTP_X_INERTIA="true").json()
    assert page["props"]["errors"] == {
        "properties": (
            "Document lesson strict mode requires a converted document before saving."
        )
    }


@pytest.mark.django_db
def test_publish_validation_flags_document_without_primary_file(program, document_node):
    result = CoursePublishValidationService().validate_for_publish(program)
    error_types = {err["type"] for err in result["errors"]}
    assert "missing_document" in error_types


@pytest.mark.django_db
def test_publish_validation_requires_primary_document_when_non_strict(program, document_node):
    document_node.properties = {
        "lesson_type": "document",
        "document": {
            "strict_completion": False,
        },
    }
    document_node.save(update_fields=["properties"])

    result = CoursePublishValidationService().validate_for_publish(program)
    error_types = {err["type"] for err in result["errors"]}
    assert "missing_document" in error_types


@pytest.mark.django_db
def test_publish_validation_rejects_pdf_path_outside_media_root(
    media_root, program, document_node
):
    outside_pdf = Path(media_root).parent / "outside.pdf"
    outside_pdf.write_bytes(_make_pdf_bytes(page_count=1))

    document_node.properties = {
        "lesson_type": "document",
        "document": {
            "original_url": "/media/lesson_documents/1/1/source.pdf",
            "original_path": "lesson_documents/1/1/source.pdf",
            "strict_completion": True,
            "conversion_status": "ready",
            "viewer_pdf_path": "../outside.pdf",
            "viewer_pdf_url": "/media/../outside.pdf",
            "page_count": 1,
        },
    }
    document_node.save(update_fields=["properties"])

    result = CoursePublishValidationService().validate_for_publish(program)
    error_types = {err["type"] for err in result["errors"]}
    assert "document_pdf_invalid_path" in error_types
