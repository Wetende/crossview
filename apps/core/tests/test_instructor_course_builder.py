import json
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from apps.core.models import ProgramResource
from apps.core.tests.factories import UserFactory
from apps.progression.tests.factories import ProgramFactory
from apps.curriculum.models import CurriculumNode
from apps.progression.models import InstructorAssignment
from apps.core.views import serialize_program_data

@pytest.fixture
def instructor():
    from django.contrib.auth.models import Group
    user = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user

@pytest.fixture
def program(db):
    return ProgramFactory()

@pytest.fixture
def assignment(instructor, program):
    return InstructorAssignment.objects.create(instructor=instructor, program=program)

@pytest.mark.django_db
class TestInstructorCourseBuilder:
    def test_instructor_can_access_manage_page(self, client, instructor, program, assignment):
        client.force_login(instructor)
        url = reverse('core:instructor.program_manage', kwargs={'pk': program.id})
        response = client.get(url)
        assert response.status_code == 200
        # Check for program name or breadcrumbs which should be present
        assert program.name in str(response.content)

    def test_manage_serializer_uses_canonical_level(self, program):
        program.level = "Beginner"
        program.exam_body = "Internal"
        program.qualification_family = "Short Course"
        program.save()

        data = serialize_program_data(program)

        assert data["program"]["level"] == "Beginner"
        assert data["program"]["taxonomy"]["level"] == "Beginner"

    def test_manage_serializer_includes_publication_state(self, program):
        program.is_published = False
        program.save(update_fields=["is_published"])

        data = serialize_program_data(program)

        assert data["program"]["isPublished"] is False

    def test_instructor_programs_uses_assigned_scope_for_levels(
        self, client, instructor, program, assignment
    ):
        program.name = "Assigned Beginner"
        program.level = "Beginner"
        program.save(update_fields=["name", "level"])
        unassigned = ProgramFactory(name="Unassigned Advanced", level="Advanced")

        client.force_login(instructor)
        response = client.get(
            reverse("core:instructor.programs"),
            HTTP_X_INERTIA="true",
        )

        assert response.status_code == 200
        props = response.json()["props"]
        assert [p["name"] for p in props["programs"]] == ["Assigned Beginner"]
        assert props["courseLevels"] == [{"value": "Beginner", "label": "Beginner"}]
        assert props["groupedPrograms"][0]["label"] == "Beginner"
        assert unassigned.name not in str(response.content)

    def test_manage_serializer_builds_html_from_existing_outcome_items(self, program):
        outcomes = ["Explain AI concepts", "Use AI tools responsibly"]
        program.__class__.objects.filter(pk=program.pk).update(
            what_you_learn_html="",
            what_you_learn_items=outcomes,
        )
        program.refresh_from_db()

        data = serialize_program_data(program)

        assert data["program"]["whatYouLearn"] == outcomes
        assert data["program"]["whatYouLearnHtml"] == (
            "<ul><li>Explain AI concepts</li>"
            "<li>Use AI tools responsibly</li></ul>"
        )

    def test_instructor_cannot_access_unassigned_program(self, client, instructor):
        other_program = ProgramFactory()
        client.force_login(instructor)
        url = reverse('core:instructor.program_manage', kwargs={'pk': other_program.id})
        response = client.get(url)
        assert response.status_code == 302 # Redirects to dashboard

    def test_invalid_course_cannot_bypass_publish_validation(
        self,
        client,
        instructor,
        program,
        assignment,
    ):
        program.is_published = False
        program.save(update_fields=["is_published"])
        client.force_login(instructor)

        response = client.post(
            reverse(
                "core:instructor.program_publish",
                kwargs={"program_id": program.id},
            )
        )

        assert response.status_code == 302
        assert response["Location"] == reverse(
            "core:instructor.program_manage",
            kwargs={"pk": program.id},
        )
        program.refresh_from_db()
        assert program.is_published is False

    def test_unassigned_instructor_cannot_control_or_preview_course(
        self,
        client,
        instructor,
        program,
    ):
        program.is_published = False
        program.save(update_fields=["is_published"])
        client.force_login(instructor)

        validate_response = client.get(
            reverse(
                "core:instructor.program_validate",
                kwargs={"program_id": program.id},
            )
        )
        publish_response = client.post(
            reverse(
                "core:instructor.program_publish",
                kwargs={"program_id": program.id},
            )
        )
        unpublish_response = client.post(
            reverse(
                "core:instructor.program_unpublish",
                kwargs={"program_id": program.id},
            )
        )
        preview_response = client.get(
            reverse("core:instructor.program_preview", kwargs={"pk": program.id})
        )

        assert validate_response.status_code == 403
        assert publish_response.status_code == 302
        assert unpublish_response.status_code == 302
        assert preview_response.status_code == 302
        assert publish_response["Location"] == "/dashboard/"
        assert unpublish_response["Location"] == "/dashboard/"
        assert preview_response["Location"] == "/dashboard/"

    def test_draft_preview_renders_public_page_without_session_state(
        self,
        client,
        instructor,
        program,
        assignment,
    ):
        program.is_published = False
        program.save(update_fields=["is_published"])
        client.force_login(instructor)

        response = client.get(
            reverse("core:instructor.program_preview", kwargs={"pk": program.id}),
            HTTP_X_INERTIA="true",
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["component"] == "Public/ProgramDetail"
        assert payload["props"]["isPreview"] is True
        assert payload["props"]["builderUrl"] == (
            f"/instructor/programs/{program.id}/manage/"
        )
        assert "preview_program_id" not in client.session

    def test_create_root_node(self, client, instructor, program, assignment):
        client.force_login(instructor)
        url = reverse('core:instructor.node_create', kwargs={'program_id': program.id})
        data = {
            'title': 'New Unit Node',
            # Parent ID is None
        }
        response = client.post(url, data)
        assert response.status_code == 200
        assert CurriculumNode.objects.filter(program=program, title='New Unit Node').exists()
        node = CurriculumNode.objects.get(title='New Unit Node')
        assert node.parent is None
        # Factory defaults: hierarchy=["Unit", "Session"] -> root is Unit.
        assert node.node_type == "Unit"

    def test_create_child_node(self, client, instructor, program, assignment):
        # Create root "Unit"
        root = CurriculumNode.objects.create(program=program, title="Unit 1", node_type="Unit")
        
        client.force_login(instructor)
        url = reverse('core:instructor.node_create', kwargs={'program_id': program.id})
        data = {
            'title': 'Session 1',
            'parent_id': root.id
        }
        response = client.post(url, data)
        assert response.status_code == 200
        # Should be Session (child of Unit)
        assert CurriculumNode.objects.filter(program=program, title='Session 1').exists()
        child = CurriculumNode.objects.get(title='Session 1')
        assert child.parent == root
        assert child.node_type == "Session"

    def test_update_node(self, client, instructor, program, assignment):
        node = CurriculumNode.objects.create(program=program, title="Old Title", node_type="Unit")
        
        client.force_login(instructor)
        url = reverse('core:instructor.node_update', kwargs={'node_id': node.id})
        data = {
            'title': 'New Title',
            'description': 'Updated desc'
        }
        response = client.post(url, data)
        assert response.status_code == 302
        node.refresh_from_db()
        assert node.title == 'New Title'
        assert node.description == 'Updated desc'

    def test_delete_node(self, client, instructor, program, assignment):
        node = CurriculumNode.objects.create(program=program, title="To Delete", node_type="Unit")
        
        client.force_login(instructor)
        url = reverse('core:instructor.node_delete', kwargs={'node_id': node.id})
        response = client.post(url)
        assert response.status_code == 302
        assert not CurriculumNode.objects.filter(id=node.id).exists()

    def test_update_settings(self, client, instructor, program, assignment):
        client.force_login(instructor)
        url = reverse('core:instructor.program_update_settings', kwargs={'pk': program.id})

        faq = [{"question": "Q1", "answer": "A1"}]
        # View expects dictionary decoded from JSON in request.POST? 
        # Wait, the view says: `data = _get_post_data(request)`. 
        # The Frontend sends JSON object if using Inertia/Axios JSON post.
        # Test client.post usually sends form data.
        # Check `_get_post_data` implementation. If it handles JSON content type, good.
        
        response = client.post(
            url, 
            data={'faq': faq, 'custom_pricing': {'price': 100}}, 
            content_type='application/json'
        )
        assert response.status_code == 302
        program.refresh_from_db()
        assert program.faq == faq
        assert program.custom_pricing == {'price': 100.0, 'currency': 'KES'}

    def test_update_overview_accepts_multipart_resources(
        self,
        client,
        instructor,
        program,
        assignment,
        settings,
        tmp_path,
    ):
        settings.MEDIA_ROOT = str(tmp_path / "media")
        old_resource = ProgramResource.objects.create(
            program=program,
            title="Old syllabus",
            file="programs/resources/old-syllabus.pdf",
            resource_type="material",
        )
        upload = SimpleUploadedFile(
            "syllabus.pdf",
            b"%PDF-1.4 test",
            content_type="application/pdf",
        )

        client.force_login(instructor)
        url = reverse("core:instructor.program_update_settings", kwargs={"pk": program.id})
        response = client.post(
            url,
            data={
                "tab": "overview",
                "description": "<p>Rich <strong>course</strong> overview.</p>",
                "whatYouLearn": "<ul><li>Build confidence</li></ul>",
                "deleteResourceIds": json.dumps([old_resource.id]),
                "materials": upload,
            },
        )

        assert response.status_code == 302
        assert response["Location"] == f"/instructor/programs/{program.id}/manage/?tab=overview"

        program.refresh_from_db()
        assert program.description == "<p>Rich <strong>course</strong> overview.</p>"
        assert program.what_you_learn_html == "<ul><li>Build confidence</li></ul>"
        assert program.what_you_learn_items == ["Build confidence"]
        assert not ProgramResource.objects.filter(pk=old_resource.pk).exists()

        resource = ProgramResource.objects.get(program=program)
        assert resource.title == "syllabus.pdf"
        assert resource.resource_type == "material"

    def test_update_drip_can_disable_and_redirect_back_to_drip_tab(
        self,
        client,
        instructor,
        program,
        assignment,
    ):
        program.drip_enabled = True
        program.drip_mode = "relative"
        program.save()
        node = CurriculumNode.objects.create(
            program=program,
            title="Scheduled Session",
            node_type="Session",
            unlock_after_days=3,
        )

        client.force_login(instructor)
        url = reverse("core:instructor.program_update_settings", kwargs={"pk": program.id})
        response = client.post(
            url,
            data={
                "tab": "drip",
                "drip_enabled": False,
                "drip_mode": "none",
                "drip_schedule": [],
            },
            content_type="application/json",
        )

        assert response.status_code == 302
        assert response["Location"] == f"/instructor/programs/{program.id}/manage/?tab=drip"

        program.refresh_from_db()
        assert program.drip_enabled is False
        assert program.drip_mode == "none"

        node.refresh_from_db()
        assert node.unlock_after_days == 3
