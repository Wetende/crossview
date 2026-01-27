
from django.test import TestCase
from django.urls import reverse
from apps.core.models import User, Program
from apps.curriculum.models import CurriculumNode
from apps.blueprints.models import AcademicBlueprint
from apps.progression.models import InstructorAssignment

class TestSectionCreationFix(TestCase):
    def test_create_section_mapped_to_blueprint_root(self):
        # 1. Setup: Create Instructor, Program with specific Blueprint
        instructor = User.objects.create_user(
            username='instructor', 
            email='inst@example.com', 
            password='pass'
        )
        from django.contrib.auth.models import Group
        group, _ = Group.objects.get_or_create(name="Instructors")
        instructor.groups.add(group)
        
        blueprint = AcademicBlueprint.objects.create(
            name="Academic Year",
            hierarchy_structure=["Year", "Unit", "Session"],
            grading_logic={"type": "weighted", "components": []},
            feature_flags={}
        )
        
        program = Program.objects.create(
            name="Test Program",
            code="TEST-101",
            blueprint=blueprint,
            submitted_by=instructor,
            submission_status='approved'
        )
            
        InstructorAssignment.objects.create(instructor=instructor, program=program)
        
        self.client.force_login(instructor)
        
        # 2. Action: Try to create a node with type="Module" (what frontend sends)
        url = reverse('core:instructor.node_create', kwargs={'program_id': program.id})
        data = {
            'title': 'New Section API Test',
            'type': 'Module', # Generic type sent by frontend
            # parent_id is None for root
        }
        
        response = self.client.post(url, data, follow=False)
        self.assertEqual(response.status_code, 302)
        print(f"Redirecting to: {response.url}")
        
        # 3. Assertion:
        # WITHOUT FIX: This should fail to create the node because "Module" is not in ["Year", "Unit", "Session"]
        # WITH FIX: This should create a node of type "Year" (root of hierarchy)
        
        # Check if any node was created
        node = CurriculumNode.objects.filter(program=program, title='New Section API Test').first()
        
        if node:
            print(f"\nNode created with type: {node.node_type}")
            self.assertEqual(node.node_type, "Year") # Should be mapped to the blueprint root
        else:
            # For reproduction, we expect this path initially (failure)
            self.fail("Node was not created. This confirms the bug where 'Module' type is rejected.")
