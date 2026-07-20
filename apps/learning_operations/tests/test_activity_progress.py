from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, NodeCompletion

from apps.learning_operations.models import LearnerContentSession, LearnerNodeProgress


class LearnerActivityProgressApiTests(TestCase):
    def setUp(self):
        self.student = UserFactory()
        self.other_student = UserFactory()
        self.program = Program.objects.create(
            name="Evidence course",
            code="EVIDENCE",
            level="beginner",
            is_published=True,
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status="active",
        )
        self.client.force_login(self.student)

    def _node(self, lesson_type, **properties):
        return CurriculumNode.objects.create(
            program=self.program,
            title=f"{lesson_type} lesson",
            node_type="Lesson",
            position=1,
            is_published=True,
            properties={"lesson_type": lesson_type, **properties},
        )

    def _progress_url(self, node):
        return reverse(
            "learning_operations:learner-node-progress",
            args=[self.enrollment.id, node.id],
        )

    def test_playback_uses_ordered_active_time_and_ignores_client_percentage(self):
        node = self._node("video", video_url="https://video.example/one", required_progress=50)
        url = self._progress_url(node)
        first = self.client.post(
            url,
            {
                "eventType": "playback",
                "sessionId": "video-session-1",
                "sequence": 1,
                "positionSeconds": 0,
                "durationSeconds": 20,
                "progressPercent": 100,
            },
            content_type="application/json",
        )
        self.assertEqual(first.status_code, 200)
        self.assertFalse(first.json()["isCompleted"])

        session = LearnerContentSession.objects.get()
        LearnerContentSession.objects.filter(pk=session.pk).update(
            last_event_at=timezone.now() - timedelta(seconds=10)
        )
        second = self.client.post(
            url,
            {
                "eventType": "playback",
                "sessionId": "video-session-1",
                "sequence": 2,
                "positionSeconds": 10,
                "durationSeconds": 20,
            },
            content_type="application/json",
        )
        self.assertEqual(second.status_code, 200)
        self.assertTrue(second.json()["isCompleted"])
        self.assertTrue(
            NodeCompletion.objects.filter(enrollment=self.enrollment, node=node).exists()
        )

        duplicate = self.client.post(
            url,
            {
                "eventType": "playback",
                "sessionId": "video-session-1",
                "sequence": 2,
                "positionSeconds": 20,
                "durationSeconds": 20,
            },
            content_type="application/json",
        )
        self.assertFalse(duplicate.json()["accepted"])
        self.assertEqual(LearnerNodeProgress.objects.get().active_seconds, 10)

    def test_document_requires_distinct_server_validated_pages(self):
        node = self._node(
            "document",
            document={"page_count": 2, "strict_completion": True},
        )
        url = self._progress_url(node)
        for sequence, page in [(1, 1), (2, 1), (3, 2)]:
            response = self.client.post(
                url,
                {
                    "eventType": "page_view",
                    "sessionId": "document-session-1",
                    "sequence": sequence,
                    "pageNumber": page,
                },
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["pagesViewed"], [1, 2])
        self.assertTrue(response.json()["isCompleted"])

    def test_progress_endpoint_hides_another_learners_enrollment(self):
        node = self._node("audio", audio_url="https://audio.example/one")
        self.client.force_login(self.other_student)
        response = self.client.get(self._progress_url(node))
        self.assertEqual(response.status_code, 404)

    def test_code_draft_is_cross_device_and_submission_completes(self):
        node = self._node(
            "code",
            language="javascript",
            starter_code="console.log('start')",
            solution_code="console.log('secret')",
        )
        work_url = reverse(
            "learning_operations:code-lab-work",
            args=[self.enrollment.id, node.id],
        )
        submit_url = reverse(
            "learning_operations:code-lab-submit",
            args=[self.enrollment.id, node.id],
        )

        initial = self.client.get(work_url)
        self.assertEqual(initial.json()["draftCode"], "console.log('start')")
        self.assertNotContains(initial, "secret")

        saved = self.client.put(
            work_url,
            {"code": "console.log('draft')"},
            content_type="application/json",
        )
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(self.client.get(work_url).json()["draftCode"], "console.log('draft')")

        submitted = self.client.post(
            submit_url,
            {"code": "console.log('final')"},
            content_type="application/json",
        )
        self.assertEqual(submitted.status_code, 200)
        self.assertIsNotNone(submitted.json()["submittedAt"])
        self.assertTrue(
            NodeCompletion.objects.filter(enrollment=self.enrollment, node=node).exists()
        )
