import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.test import TestCase
from apps.core.models import Program
from apps.blueprints.models import AcademicBlueprint
from apps.platform.models import PlatformSettings

User = get_user_model()

@pytest.mark.django_db
class TestProgramManagement(TestCase):
    """Tests for program CRUD operations."""

    def setUp(self):
        """Set up test user and blueprint."""
        self.user = User.objects.create_user(
            username="admin@test.com", 
            email="admin@test.com", 
            password="password123",
            is_staff=True,
        )
        self.client.login(username="admin@test.com", password="password123")
        self.blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint", 
            hierarchy_structure=["Unit", "Session"],
            grading_logic={"type": "points"},
        )
        settings = PlatformSettings.get_settings()
        settings.active_blueprint = self.blueprint
        settings.save(update_fields=["active_blueprint", "updated_at"])

    def test_list_programs(self):
        """Test program listing."""
        Program.objects.create(
            name="Program 1",
            code="P1",
            blueprint=self.blueprint,
            is_featured=True,
        )
        Program.objects.create(name="Program 2", code="P2", blueprint=self.blueprint)
        
        response = self.client.get(reverse('core:admin.programs'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'Admin/Programs/Index'
        assert len(data['props']['programs']) == 2
        featured_by_code = {
            program["code"]: program["isFeatured"] for program in data["props"]["programs"]
        }
        assert featured_by_code["P1"] is True
        assert featured_by_code["P2"] is False

    def test_admin_can_toggle_program_featured(self):
        """Admins can feature and unfeature programs from admin routes."""
        program = Program.objects.create(
            name="Feature Toggle",
            code="FT101",
            blueprint=self.blueprint,
            is_featured=False,
        )

        response = self.client.post(
            reverse("core:admin.program.featured", args=[program.id]),
        )

        assert response.status_code == 302
        program.refresh_from_db()
        assert program.is_featured is True

        self.client.post(reverse("core:admin.program.featured", args=[program.id]))
        program.refresh_from_db()
        assert program.is_featured is False

    def test_non_admin_cannot_toggle_program_featured(self):
        """Featured status is not mutable by non-admin users."""
        program = Program.objects.create(
            name="Protected Feature Toggle",
            code="PFT101",
            blueprint=self.blueprint,
            is_featured=False,
        )
        self.client.logout()
        user = User.objects.create_user(
            username="teacher@test.com",
            email="teacher@test.com",
            password="password123",
        )
        self.client.login(username=user.username, password="password123")

        response = self.client.post(
            reverse("core:admin.program.featured", args=[program.id]),
        )

        assert response.status_code == 302
        assert response["Location"] == "/dashboard/"
        program.refresh_from_db()
        assert program.is_featured is False

    def test_create_program(self):
        data = {
            "name": "New Program",
            "code": "NP101",
            "description": "A test program",
            "isPublished": True
        }
        response = self.client.post(reverse('core:admin.program.create'), data=data)
        
        assert response.status_code == 302
        new_program = Program.objects.get(name="New Program")
        assert response.url == f"/instructor/programs/{new_program.id}/manage/?tab=settings"
        assert Program.objects.filter(name="New Program").exists()
        assert new_program.blueprint == self.blueprint
        assert new_program.slug == "new-program"

    def test_create_program_persists_configured_category(self):
        settings = PlatformSettings.get_settings()
        settings.program_categories = ["Engineering & ICT", "Business Management"]
        settings.save(update_fields=["program_categories", "updated_at"])

        response = self.client.post(
            reverse("core:admin.program.create"),
            data={
                "name": "Category Program",
                "code": "CAT101",
                "category": "Engineering & ICT",
                "description": "A categorized program",
            },
        )

        assert response.status_code == 302
        program = Program.objects.get(code="CAT101")
        assert program.category == "Engineering & ICT"

    def test_create_program_rejects_unknown_configured_category(self):
        settings = PlatformSettings.get_settings()
        settings.program_categories = ["Engineering & ICT"]
        settings.save(update_fields=["program_categories", "updated_at"])

        response = self.client.post(
            reverse("core:admin.program.create"),
            data={
                "name": "Invalid Category Program",
                "code": "BADCAT101",
                "category": "Mystery School",
            },
            HTTP_X_INERTIA="true",
        )

        assert response.status_code == 200
        props = response.json()["props"]
        assert props["errors"]["category"] == "Select a valid category."
        assert not Program.objects.filter(code="BADCAT101").exists()

    def test_edit_program(self):
        """Test program editing."""
        program = Program.objects.create(name="Old Name", code="OLD1", blueprint=self.blueprint)
        data = {
            "name": "Updated Name",
            "code": "UP101",
            "description": "Updated description",
            "isPublished": True
        }
        response = self.client.post(reverse('core:admin.program.edit', args=[program.id]), data=data)
        assert response.status_code == 302
        program.refresh_from_db()
        assert program.name == "Updated Name"
        assert program.slug == "updated-name"

    def test_manage_program_content_with_materials(self):
        """Test uploading program materials."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.core.models import ProgramResource

        program = Program.objects.create(name="Content Program", code="CP1", blueprint=self.blueprint)
        
        file_content = b"dummy content"
        test_file = SimpleUploadedFile("syllabus.pdf", file_content, content_type="application/pdf")

        response = self.client.post(
            reverse('core:instructor.program_update_settings', args=[program.id]),
            data={
                "tab": "settings",
                "description": "Test description",
                "whatYouLearn": "<ul><li>Outcome one</li></ul>",
                "materials": [test_file],
            },
        )

        assert response.status_code == 302
        assert (
            response["Location"]
            == f"/instructor/programs/{program.id}/manage/?tab=settings&section=main"
        )
        program.refresh_from_db()
        assert program.description == "Test description"
        assert program.what_you_learn_items == ["Outcome one"]
        assert ProgramResource.objects.filter(program=program).count() == 1
        resource = ProgramResource.objects.get(program=program)
        assert resource.title == "syllabus.pdf"
        assert resource.resource_type == "material"
