from datetime import datetime, timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.discussions.models import DiscussionPost, DiscussionThread
from apps.progression.models import Announcement, Enrollment, InstructorAssignment


class CoursePlayerParityTests(TestCase):
    def setUp(self):
        self.student = UserFactory(first_name="Amina", last_name="Learner")
        self.instructor = UserFactory(first_name="Grace", last_name="Mentor")
        self.program = Program.objects.create(
            name="Delivery Parity",
            code="DELIVERY-PARITY",
            level="beginner",
            is_published=True,
        )
        InstructorAssignment.objects.create(
            instructor=self.instructor,
            program=self.program,
            is_primary=True,
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status="active",
        )
        self.lesson = CurriculumNode.objects.create(
            program=self.program,
            title="Deployment models",
            node_type="Lesson",
            position=1,
            is_published=True,
            properties={"lesson_type": "text", "content": "<p>Body</p>"},
        )
        self.client.force_login(self.student)

    def _inertia_get(self, url):
        return self.client.get(url, HTTP_X_INERTIA="true")

    def test_session_discussions_mark_instructor_authors(self):
        co_instructor = UserFactory(first_name="Chris", last_name="Coteach")
        self.program.instructors.add(co_instructor)
        thread = DiscussionThread.objects.create(
            node=self.lesson,
            user=self.student,
            title="Blue-green rollouts",
            content="When should we switch traffic?",
        )
        DiscussionPost.objects.create(
            thread=thread,
            user=self.instructor,
            content="Once the health checks pass.",
        )
        DiscussionPost.objects.create(
            thread=thread,
            user=co_instructor,
            content="And keep the old stack warm.",
        )
        DiscussionPost.objects.create(
            thread=thread,
            user=self.student,
            content="Thanks!",
        )

        response = self._inertia_get(
            reverse(
                "progression:student.session",
                args=[self.enrollment.id, self.lesson.id],
            )
        )

        self.assertEqual(response.status_code, 200)
        [payload] = response.json()["props"]["discussions"]
        self.assertIs(payload["user"]["isInstructor"], False)
        flags = {
            post["user"]["id"]: post["user"]["isInstructor"]
            for post in payload["posts"]
        }
        self.assertEqual(
            flags,
            {
                self.instructor.id: True,
                co_instructor.id: True,
                self.student.id: False,
            },
        )

    def _announce(self, title, *, days_ago, pinned=False, author=None, content="Details"):
        announcement = Announcement.objects.create(
            program=self.program,
            author=author or self.instructor,
            title=title,
            content=content,
            is_pinned=pinned,
        )
        Announcement.objects.filter(pk=announcement.pk).update(
            created_at=timezone.now() - timedelta(days=days_ago)
        )
        return announcement

    def _overview_announcements(self):
        response = self._inertia_get(
            reverse("progression:student.program", args=[self.program.id])
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["props"]["announcements"]

    def test_overview_lists_latest_five_announcements_pinned_first(self):
        pinned = self._announce(
            "Pinned this week",
            days_ago=3,
            pinned=True,
            content="<p>Read the course guide.</p>",
        )
        for index in range(5):
            if index == 3:
                continue
            self._announce(f"Update {index}", days_ago=index)
        self._announce("Old pinned", days_ago=30, pinned=True)
        other_program = Program.objects.create(
            name="Other course",
            code="OTHER-PARITY",
            level="beginner",
        )
        Announcement.objects.create(
            program=other_program,
            author=self.instructor,
            title="Not for this course",
            content="Hidden",
            is_pinned=True,
        )

        announcements = self._overview_announcements()

        self.assertEqual(
            [item["title"] for item in announcements],
            ["Pinned this week", "Update 0", "Update 1", "Update 2", "Update 4"],
        )
        first = announcements[0]
        self.assertEqual(first["id"], pinned.id)
        self.assertEqual(first["content"], "<p>Read the course guide.</p>")
        self.assertIs(first["isPinned"], True)
        self.assertTrue(first["createdAt"])
        self.assertEqual(first["author"], {"name": "Grace Mentor"})

    def test_overview_announcements_are_not_hidden_by_many_pinned(self):
        for index in range(6):
            self._announce(f"Pinned {index}", days_ago=10 + index, pinned=True)
        self._announce("Fresh news", days_ago=0)

        titles = [item["title"] for item in self._overview_announcements()]

        self.assertEqual(len(titles), 5)
        self.assertIn("Fresh news", titles)
        self.assertEqual(titles[-1], "Fresh news")

    def test_overview_announcement_author_never_exposes_email(self):
        nameless = UserFactory(first_name="", last_name="")
        self._announce("From the team", days_ago=0, author=nameless)

        [announcement] = self._overview_announcements()

        self.assertEqual(announcement["author"], {"name": "Course team"})

    def test_overview_curriculum_explains_scheduled_locks(self):
        self.program.drip_enabled = True
        self.program.save(update_fields=["drip_enabled"])
        unlocks_at = timezone.now() + timedelta(days=7)
        scheduled = CurriculumNode.objects.create(
            program=self.program,
            title="Release strategies",
            node_type="Lesson",
            position=2,
            is_published=True,
            unlock_date=unlocks_at,
            properties={"lesson_type": "text"},
        )

        response = self._inertia_get(
            reverse("progression:student.program", args=[self.program.id])
        )

        self.assertEqual(response.status_code, 200)
        nodes = {node["id"]: node for node in response.json()["props"]["curriculum"]}
        locked = nodes[scheduled.id]
        self.assertIs(locked["isLocked"], True)
        self.assertEqual(locked["lockReason"], "scheduled")
        self.assertEqual(
            locked["lockReasonText"], "Scheduled content is not yet available"
        )
        self.assertEqual(datetime.fromisoformat(locked["unlocksAt"]), unlocks_at)
        self.assertIsNone(nodes[self.lesson.id]["lockReasonText"])

    def test_resume_redirects_to_the_lesson_session_url(self):
        response = self.client.get(
            reverse("progression:student.program.resume", args=[self.program.id])
        )

        self.assertRedirects(
            response,
            reverse(
                "progression:student.session",
                args=[self.enrollment.id, self.lesson.id],
            ),
            fetch_redirect_response=False,
        )
