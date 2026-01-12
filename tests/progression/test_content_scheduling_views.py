
import pytest
from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from apps.curriculum.models import CurriculumNode
from apps.core.models import Program
from apps.progression.models import Enrollment

@pytest.mark.django_db
class TestContentSchedulingViews:
    

    @pytest.fixture
    def setup_data(self):
        from apps.core.models import User, Program
        self.student = User.objects.create_user(username="student", email="student@test.com", password="password")
        self.program = Program.objects.create(name="Test Program", is_published=True)


    def _get_inertia_props(self, response):
        import json
        from django.utils.html import escape
        content = response.content.decode('utf-8')
        # Simple extraction of data-page attribute
        # data-page="..."
        import re
        match = re.search(r'data-page="([^"]+)"', content)
        if match:
            import html
            page_data = json.loads(html.unescape(match.group(1)))
            return page_data['props']
        raise ValueError("Could not find data-page in response")

    def test_scheduled_content_view_locking(self, client, setup_data):
        # Setup
        
        # Node 1: Unlocked immediately
        node1 = CurriculumNode.objects.create(
            program=self.program,
            title="Introduction",
            node_type="lesson",
            position=1,
            is_published=True
        )
        
        # Node 2: Locked by absolute date (future)
        future_date = timezone.now() + timedelta(days=5)
        node2 = CurriculumNode.objects.create(
            program=self.program,
            title="Future Lesson",
            node_type="lesson",
            position=2,
            is_published=True,
            unlock_date=future_date
        )
        
        # Enroll student
        enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status='active'
        )
        
        # Login
        client.force_login(self.student)
        
        # Call program view (HTML)
        url = reverse('progression:student.program', args=[enrollment.id])
        response = client.get(url)
        assert response.status_code == 200
        
        # Check props
        props = self._get_inertia_props(response)
        curriculum_tree = props['curriculumTree']
        
        # Verify Node 1 (Unlocked)
        node1_data = next(n for n in curriculum_tree if n['id'] == node1.id)
        assert node1_data['isLocked'] is False
        
        # Verify Node 2 (Locked)
        node2_data = next(n for n in curriculum_tree if n['id'] == node2.id)
        assert node2_data['isLocked'] is True
        assert node2_data['lockReason'] == 'scheduled'
        assert node2_data['unlocksAt'] is not None

    def test_drip_content_view_locking(self, client, setup_data):
        # Setup
        
        # Node: Locked by relative days (drip)
        # Unlock after 3 days. Enrollment created now -> Locked.
        node_drip = CurriculumNode.objects.create(
            program=self.program,
            title="Drip Lesson",
            node_type="lesson",
            position=1,
            is_published=True,
            unlock_after_days=3
        )
        
        enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status='active'
        )
        
        client.force_login(self.student)
        
        # 1. Check Locked State
        url = reverse('progression:student.program', args=[enrollment.id])
        response = client.get(url)
        props = self._get_inertia_props(response)
        node_data = props['curriculumTree'][0]
        
        assert node_data['id'] == node_drip.id
        assert node_data['isLocked'] is True
        assert node_data['lockReason'] == 'drip'
        
        # 2. Fast forward time to unlock
        enrollment.created_at = timezone.now() - timedelta(days=4)
        enrollment.save()
        
        # Check Unlocked State
        # Must refetch view
        response = client.get(url)
        props = self._get_inertia_props(response)
        node_data = props['curriculumTree'][0]
        
        assert node_data['isLocked'] is False
