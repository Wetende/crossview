from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.curriculum.models import CurriculumNode
from apps.core.models import Program
from apps.blueprints.models import AcademicBlueprint
from apps.content.models import ContentBlock

User = get_user_model()

class ContentBlockTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.blueprint = AcademicBlueprint.objects.create(
            name="Test Blueprint", 
            hierarchy_structure=["Unit", "Session"],
            grading_logic={"type": "percentage"}
        )
        self.program = Program.objects.create(name="Test Program", blueprint=self.blueprint)
        self.node = CurriculumNode.objects.create(
            program=self.program, 
            title="Test Session", 
            node_type="Session"
        )
        self.client.force_authenticate(user=self.user)
        self.list_url = reverse('content:contentblock-list')

    def test_create_video_block(self):
        data = {
            "node": self.node.id,
            "block_type": "VIDEO",
            "data": {"provider": "youtube", "url": "https://youtu.be/xyz"}
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContentBlock.objects.count(), 1)
        self.assertEqual(ContentBlock.objects.get().data['provider'], 'youtube')

    def test_create_invalid_video_block(self):
        # Missing URL
        data = {
            "node": self.node.id,
            "block_type": "VIDEO",
            "data": {"provider": "youtube"}
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("data", response.data)

    def test_create_quiz_block_without_id(self):
        data = {
            "node": self.node.id,
            "block_type": "QUIZ",
            "data": {}
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reorder_blocks(self):
        b1 = ContentBlock.objects.create(node=self.node, block_type="RICHTEXT", position=0)
        b2 = ContentBlock.objects.create(node=self.node, block_type="RICHTEXT", position=1)
        b3 = ContentBlock.objects.create(node=self.node, block_type="RICHTEXT", position=2)
        
        reorder_url = reverse('content:contentblock-reorder')
        response = self.client.post(reorder_url, {
            "node_id": self.node.id,
            "order": [b3.id, b1.id, b2.id]
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        b1.refresh_from_db()
        b2.refresh_from_db()
        b3.refresh_from_db()
        
        self.assertEqual(b3.position, 0)
        self.assertEqual(b1.position, 1)
        self.assertEqual(b2.position, 2)

    def test_filter_by_node(self):
        ContentBlock.objects.create(node=self.node, block_type="RICHTEXT")
        
        # Create another node
        other_node = CurriculumNode.objects.create(program=self.program, title="Other", node_type="Session")
        ContentBlock.objects.create(node=other_node, block_type="VIDEO")
        
        response = self.client.get(self.list_url, {'node_id': self.node.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['node'], self.node.id)
