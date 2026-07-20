from django.test import TestCase
from django.urls import reverse
from datetime import timedelta

from django.utils import timezone

from apps.core.models import Program, ProgramResource
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.learning_operations.services import update_course_delivery_profile
from apps.live_sessions.models import ScheduledLearningSession
from apps.progression.models import Enrollment, NodeCompletion


class StudentProgramsViewTests(TestCase):
    def test_student_programs_page_renders_with_inertia(self):
        student = UserFactory()
        program = Program.objects.create(
            name="Student Program",
            code="STUDENT-PROGRAM-001",
            level="beginner",
            is_published=True,
        )
        Enrollment.objects.create(user=student, program=program, status="active")

        self.client.force_login(student)
        response = self.client.get(
            reverse("progression:student.programs"),
            HTTP_X_INERTIA="true",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["component"], "Student/Programs/Index")

    def test_program_view_renders_course_overview_payload(self):
        student = UserFactory()
        program = Program.objects.create(
            name="Overview Program",
            code="OVERVIEW-PROGRAM-001",
            level="beginner",
            description="A practical course overview.",
            what_you_learn_html="<ul><li>Build confidence</li></ul>",
            notices=[{"title": "Exam window", "content": "Registration opens soon."}],
            is_published=True,
        )
        ProgramResource.objects.create(
            program=program,
            title="Syllabus",
            file="programs/resources/syllabus.pdf",
            resource_type="outline",
        )
        Enrollment.objects.create(user=student, program=program, status="active")

        self.client.force_login(student)
        response = self.client.get(
            reverse("progression:student.program", args=[program.id]),
            HTTP_X_INERTIA="true",
        )

        props = response.json()["props"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["component"], "Student/CoursePlayer")
        self.assertEqual(props["activeView"], "overview")
        self.assertIsNone(props["node"])
        self.assertEqual(props["resumeUrl"], f"/student/programs/{program.id}/resume/")
        self.assertEqual(props["program"]["description"], "A practical course overview.")
        self.assertEqual(props["program"]["notices"][0]["title"], "Exam window")
        self.assertEqual(props["program"]["resources"][0]["title"], "Syllabus")
        self.assertIn("deliveryMode", props["program"])
        self.assertIn("deliveryReadiness", props["program"])
        self.assertIn("upcomingDeadlines", props["enrollment"])
        self.assertNotIn("curriculumSummary", props)

    def test_live_online_overview_includes_the_next_safe_session(self):
        student = UserFactory()
        program = Program.objects.create(
            name="Live overview",
            code="LIVE-OVERVIEW",
            level="beginner",
            is_published=True,
        )
        update_course_delivery_profile(program, "live_online")
        enrollment = Enrollment.objects.create(
            user=student, program=program, status="active"
        )
        node = CurriculumNode.objects.create(
            program=program,
            title="Live workshop",
            node_type="Lesson",
            position=1,
            is_published=True,
            properties={"lesson_type": "live_meeting"},
        )
        start = timezone.now() + timedelta(days=1)
        ScheduledLearningSession.objects.create(
            node=node,
            kind="live_meeting",
            provider="google_meet",
            title=node.title,
            starts_at=start,
            ends_at=start + timedelta(hours=1),
            source_timezone="Africa/Nairobi",
            join_url="https://meet.google.com/abc-defg-hij",
        )
        self.client.force_login(student)

        response = self.client.get(
            reverse("progression:student.program", args=[program.id]),
            HTTP_X_INERTIA="true",
        )

        payload = response.json()["props"]["program"]
        self.assertEqual(payload["deliveryMode"], "live_online")
        self.assertTrue(payload["deliveryReadiness"]["ready"])
        self.assertEqual(
            payload["nextScheduledSession"]["kind"], "live_meeting"
        )
        self.assertEqual(
            payload["nextScheduledSession"]["lessonUrl"],
            f"/student/programs/{enrollment.id}/session/{node.id}/",
        )
        self.assertIsNone(payload["nextScheduledSession"]["joinUrl"])

    def test_program_resume_renders_first_incomplete_lesson(self):
        student = UserFactory()
        program = Program.objects.create(
            name="Resume Program",
            code="RESUME-PROGRAM-001",
            level="beginner",
            is_published=True,
        )
        first_node = CurriculumNode.objects.create(
            program=program,
            title="Start Here",
            node_type="lesson",
            position=1,
            is_published=True,
        )
        second_node = CurriculumNode.objects.create(
            program=program,
            title="Next Lesson",
            node_type="lesson",
            position=2,
            is_published=True,
        )
        enrollment = Enrollment.objects.create(
            user=student,
            program=program,
            status="active",
        )
        NodeCompletion.objects.create(
            enrollment=enrollment,
            node=first_node,
            completed_at=timezone.now(),
            completion_type="view",
        )

        self.client.force_login(student)
        response = self.client.get(
            reverse("progression:student.program.resume", args=[program.id]),
            HTTP_X_INERTIA="true",
        )

        props = response.json()["props"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["component"], "Student/CoursePlayer")
        self.assertIsNone(props["activeView"])
        self.assertEqual(props["node"]["id"], second_node.id)
