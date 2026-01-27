import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.test import TestCase
from apps.core.models import Program
from apps.blueprints.models import AcademicBlueprint

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
            hierarchy_structure=["Level 1"],
            grading_logic={"type": "points"}
        )

    def test_list_programs(self):
        """Test program listing."""
        Program.objects.create(name="Program 1", code="P1", blueprint=self.blueprint)
        Program.objects.create(name="Program 2", code="P2", blueprint=self.blueprint)
        
        response = self.client.get(reverse('core:admin.programs'), HTTP_X_INERTIA=True)
        assert response.status_code == 200
        data = response.json()
        assert data['component'] == 'Admin/Programs/Index'
        assert len(data['props']['programs']) == 2

    def test_create_program(self):
        data = {
            "name": "New Program",
            "blueprintId": self.blueprint.id,
            "code": "NP101",
            "description": "A test program",
            "isPublished": True
        }
        response = self.client.post(reverse('core:admin.program.create'), data=data)
        
        assert response.status_code == 302
        new_program = Program.objects.get(name="New Program")
        assert response.url == reverse('core:admin.program.content', kwargs={'pk': new_program.id})
        assert Program.objects.filter(name="New Program").exists()

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

    def test_manage_program_content_with_materials(self):
        """Test uploading program materials."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.core.models import ProgramResource

        program = Program.objects.create(name="Content Program", code="CP1", blueprint=self.blueprint)
        
        file_content = b"dummy content"
        test_file = SimpleUploadedFile("syllabus.pdf", file_content, content_type="application/pdf")

        data = {
            "description": "Test description",
            "materials": [test_file]
        }
        
        response = self.client.post(reverse('core:admin.program.content', args=[program.id]), data=data)
        
        assert response.status_code == 302
        assert ProgramResource.objects.filter(program=program).count() == 1
        resource = ProgramResource.objects.get(program=program)
        assert resource.title == "syllabus.pdf"
        assert resource.resource_type == "material"
