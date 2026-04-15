import json

from django.contrib.auth.models import Group
from django.test import TestCase

from apps.content.models import ContentBlock
from apps.core.tests.factories import UserFactory
from apps.progression.tests.factories import (
    CurriculumNodeFactory,
    InstructorAssignmentFactory,
    ProgramFactory,
)


class ContentBlockAuthorizationTests(TestCase):
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

        self.list_url = "/content/blocks/"
        self.create_url = "/content/blocks/create/"
        self.reorder_url = "/content/blocks/reorder/"

    def test_instructor_can_create_list_and_reorder_blocks_for_assigned_node(self):
        self.client.force_login(self.instructor)

        create_response = self.client.post(
            self.create_url,
            data=json.dumps(
                {
                    "node": self.node.id,
                    "block_type": "VIDEO",
                    "data": {"provider": "youtube", "url": "https://youtu.be/xyz"},
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(create_response.status_code, 201)
        created_block = ContentBlock.objects.get(node=self.node)

        list_response = self.client.get(self.list_url, {"node_id": self.node.id})
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)
        self.assertEqual(list_response.json()[0]["id"], created_block.id)

        block_a = ContentBlock.objects.create(
            node=self.node,
            block_type="RICHTEXT",
            position=1,
        )
        reorder_response = self.client.post(
            self.reorder_url,
            data=json.dumps(
                {"node_id": self.node.id, "order": [block_a.id, created_block.id]}
            ),
            content_type="application/json",
        )
        self.assertEqual(reorder_response.status_code, 200)

        created_block.refresh_from_db()
        block_a.refresh_from_db()
        self.assertEqual(block_a.position, 0)
        self.assertEqual(created_block.position, 1)

    def test_non_instructor_cannot_access_content_api(self):
        self.client.force_login(self.student)

        list_response = self.client.get(self.list_url, {"node_id": self.node.id})
        create_response = self.client.post(
            self.create_url,
            data=json.dumps(
                {
                    "node": self.node.id,
                    "block_type": "VIDEO",
                    "data": {"provider": "youtube", "url": "https://youtu.be/xyz"},
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(list_response.status_code, 403)
        self.assertEqual(create_response.status_code, 403)

    def test_foreign_node_returns_not_found_for_instructor(self):
        self.client.force_login(self.instructor)

        list_response = self.client.get(self.list_url, {"node_id": self.other_node.id})
        create_response = self.client.post(
            self.create_url,
            data=json.dumps(
                {
                    "node": self.other_node.id,
                    "block_type": "VIDEO",
                    "data": {"provider": "youtube", "url": "https://youtu.be/xyz"},
                }
            ),
            content_type="application/json",
        )
        reorder_response = self.client.post(
            self.reorder_url,
            data=json.dumps({"node_id": self.other_node.id, "order": []}),
            content_type="application/json",
        )

        self.assertEqual(list_response.status_code, 404)
        self.assertEqual(create_response.status_code, 404)
        self.assertEqual(reorder_response.status_code, 404)
