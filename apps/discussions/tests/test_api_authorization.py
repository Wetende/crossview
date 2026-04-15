from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.core.tests.factories import UserFactory
from apps.discussions.models import DiscussionPost, DiscussionThread
from apps.progression.tests.factories import (
    CurriculumNodeFactory,
    InstructorAssignmentFactory,
    ProgramFactory,
)


class DiscussionApiAuthorizationTests(APITestCase):
    def setUp(self):
        self.instructor = UserFactory()
        self.student = UserFactory()
        instructor_group, _ = Group.objects.get_or_create(name="Instructors")
        self.instructor.groups.add(instructor_group)

        self.program = ProgramFactory()
        self.other_program = ProgramFactory()
        self.node = CurriculumNodeFactory(program=self.program)
        self.other_node = CurriculumNodeFactory(program=self.other_program)
        InstructorAssignmentFactory(instructor=self.instructor, program=self.program)

        self.thread = DiscussionThread.objects.create(
            node=self.node,
            user=self.student,
            title="Assigned thread",
            content="Program A",
        )
        self.other_thread = DiscussionThread.objects.create(
            node=self.other_node,
            user=self.student,
            title="Foreign thread",
            content="Program B",
        )
        self.locked_thread = DiscussionThread.objects.create(
            node=self.node,
            user=self.student,
            title="Locked thread",
            content="Locked",
            is_locked=True,
        )
        self.parent_post = DiscussionPost.objects.create(
            thread=self.thread,
            user=self.student,
            content="Parent reply",
        )
        self.other_parent_post = DiscussionPost.objects.create(
            thread=self.locked_thread,
            user=self.student,
            content="Other parent",
        )
        self.other_post = DiscussionPost.objects.create(
            thread=self.other_thread,
            user=self.student,
            content="Foreign reply",
        )

        self.thread_list_url = reverse("discussions:discussionthread-list")
        self.post_list_url = reverse("discussions:discussionpost-list")

    def test_student_cannot_access_discussion_rest_api(self):
        self.client.force_login(self.student)

        cases = [
            ("get", self.thread_list_url, None),
            (
                "post",
                self.thread_list_url,
                {"node": self.node.id, "title": "New", "content": "Nope"},
            ),
            (
                "get",
                reverse("discussions:discussionthread-detail", args=[self.thread.id]),
                None,
            ),
            ("get", self.post_list_url, None),
            (
                "post",
                self.post_list_url,
                {"thread": self.thread.id, "content": "Reply"},
            ),
        ]

        for method, url, payload in cases:
            response = getattr(self.client, method)(url, payload, format="json")
            self.assertEqual(response.status_code, 403, msg=f"{method.upper()} {url}")

    def test_instructor_queryset_is_scoped_to_assigned_program(self):
        self.client.force_login(self.instructor)

        thread_response = self.client.get(self.thread_list_url, format="json")
        post_response = self.client.get(self.post_list_url, format="json")
        foreign_thread_response = self.client.get(
            reverse("discussions:discussionthread-detail", args=[self.other_thread.id]),
            format="json",
        )
        foreign_post_response = self.client.get(
            reverse("discussions:discussionpost-detail", args=[self.other_post.id]),
            format="json",
        )

        self.assertEqual(thread_response.status_code, 200)
        self.assertEqual(
            {thread["id"] for thread in thread_response.data},
            {self.thread.id, self.locked_thread.id},
        )
        self.assertEqual(post_response.status_code, 200)
        self.assertEqual(
            [post["id"] for post in post_response.data],
            [self.parent_post.id, self.other_parent_post.id],
        )
        self.assertEqual(foreign_thread_response.status_code, 404)
        self.assertEqual(foreign_post_response.status_code, 404)

    def test_thread_create_ignores_moderation_fields(self):
        self.client.force_login(self.instructor)

        response = self.client.post(
            self.thread_list_url,
            {
                "node": self.node.id,
                "title": "Instructor thread",
                "content": "Visible",
                "is_pinned": True,
                "is_locked": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        created_thread = DiscussionThread.objects.get(id=response.data["id"])
        self.assertFalse(created_thread.is_pinned)
        self.assertFalse(created_thread.is_locked)

    def test_thread_and_post_create_reject_foreign_relationships(self):
        self.client.force_login(self.instructor)

        foreign_thread_response = self.client.post(
            self.thread_list_url,
            {
                "node": self.other_node.id,
                "title": "Foreign thread",
                "content": "No access",
            },
            format="json",
        )
        foreign_post_response = self.client.post(
            self.post_list_url,
            {"thread": self.other_thread.id, "content": "No access"},
            format="json",
        )

        self.assertEqual(foreign_thread_response.status_code, 404)
        self.assertEqual(foreign_post_response.status_code, 404)

    def test_post_create_validates_parent_thread_and_lock_state(self):
        self.client.force_login(self.instructor)

        mismatched_parent_response = self.client.post(
            self.post_list_url,
            {
                "thread": self.thread.id,
                "parent": self.other_parent_post.id,
                "content": "Invalid parent",
            },
            format="json",
        )
        locked_thread_response = self.client.post(
            self.post_list_url,
            {"thread": self.locked_thread.id, "content": "Cannot reply"},
            format="json",
        )

        self.assertEqual(mismatched_parent_response.status_code, 400)
        self.assertEqual(locked_thread_response.status_code, 400)

    def test_rest_api_disallows_thread_and_post_updates(self):
        self.client.force_login(self.instructor)

        thread_response = self.client.patch(
            reverse("discussions:discussionthread-detail", args=[self.thread.id]),
            {"is_locked": True},
            format="json",
        )
        post_response = self.client.delete(
            reverse("discussions:discussionpost-detail", args=[self.parent_post.id]),
            format="json",
        )

        self.assertEqual(thread_response.status_code, 405)
        self.assertEqual(post_response.status_code, 405)
