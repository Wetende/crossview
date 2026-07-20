from django.test import TestCase
from django.urls import reverse

from apps.content.models import ContentBlock
from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment


class CoursePlayerActivityContractTests(TestCase):
    def setUp(self):
        self.student = UserFactory()
        self.program = Program.objects.create(
            name="Activity Contract",
            code="ACTIVITY-CONTRACT",
            level="beginner",
            is_published=True,
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status="active",
        )
        self.client.force_login(self.student)

    def test_player_normalizes_activity_and_removes_author_only_data(self):
        node = CurriculumNode.objects.create(
            program=self.program,
            title="Browser lab",
            node_type="Lesson",
            position=1,
            is_published=True,
            properties={
                "lesson_type": "code",
                "starter_code": "console.log('safe')",
                "solution_code": "console.log('private')",
                "meeting_password": "private-passcode",
            },
        )
        ContentBlock.objects.create(
            node=node,
            block_type="QUIZ",
            data={
                "questions": [
                    {
                        "id": "q1",
                        "text": "Safe prompt",
                        "answer_data": {"correct": 1},
                    }
                ]
            },
        )

        response = self.client.get(
            reverse(
                "progression:student.session",
                args=[self.enrollment.id, node.id],
            ),
            HTTP_X_INERTIA="true",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()["props"]["node"]
        self.assertEqual(payload["activityType"], "code")
        self.assertEqual(payload["primaryActivity"]["type"], "code")
        self.assertNotIn("solution_code", payload["properties"])
        self.assertNotIn("meeting_password", payload["properties"])
        self.assertNotIn(
            "answer_data",
            payload["supplements"][0]["data"]["questions"][0],
        )

    def test_stable_lesson_launch_resolves_the_current_enrollment(self):
        node = CurriculumNode.objects.create(
            program=self.program,
            title="Stable link lesson",
            node_type="Lesson",
            position=1,
            is_published=True,
            properties={"lesson_type": "text"},
        )

        response = self.client.get(
            reverse(
                "progression:student.lesson.launch",
                args=[self.program.id, node.id],
            )
        )

        self.assertRedirects(
            response,
            reverse(
                "progression:student.session",
                args=[self.enrollment.id, node.id],
            ),
            fetch_redirect_response=False,
        )

    def test_stable_lesson_launch_hides_other_course_enrollments(self):
        other_program = Program.objects.create(
            name="Other course",
            code="OTHER-COURSE",
            level="beginner",
            is_published=True,
        )
        node = CurriculumNode.objects.create(
            program=other_program,
            title="Private lesson",
            node_type="Lesson",
            position=1,
            is_published=True,
        )

        response = self.client.get(
            reverse(
                "progression:student.lesson.launch",
                args=[other_program.id, node.id],
            )
        )

        self.assertEqual(response.status_code, 404)
