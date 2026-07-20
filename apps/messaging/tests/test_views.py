from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.models import Program
from apps.messaging.models import Conversation, DirectMessage
from apps.progression.models import Enrollment, InstructorAssignment

User = get_user_model()


class MessagingViewsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.student = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='testpass123',
        )
        self.instructor = User.objects.create_user(
            username='instructor',
            email='instructor@example.com',
            password='testpass123',
        )
        self.other_student = User.objects.create_user(
            username='other_student',
            email='other-student@example.com',
            password='testpass123',
        )

        instructors_group, _ = Group.objects.get_or_create(name='Instructors')
        self.instructor.groups.add(instructors_group)

        self.program = Program.objects.create(
            name='Messaging Program',
            code='MSG-002',
            level='beginner',
        )
        Enrollment.objects.create(user=self.student, program=self.program, status='active')
        InstructorAssignment.objects.create(
            instructor=self.instructor,
            program=self.program,
            is_primary=True,
        )

    def test_inbox_requires_authentication(self):
        response = self.client.get('/messages/')
        self.assertIn(response.status_code, [302, 403])

    def test_create_conversation_and_first_message(self):
        self.client.force_login(self.student)

        response = self.client.post(
            '/messages/new/',
            {
                'recipient_id': self.instructor.id,
                'content': 'Hello from student',
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(DirectMessage.objects.count(), 1)

    def test_student_cannot_message_unrelated_student(self):
        self.client.force_login(self.student)

        response = self.client.post(
            '/messages/new/',
            {
                'recipient_id': self.other_student.id,
                'content': 'Hi',
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Conversation.objects.count(), 0)

    def test_new_message_prefills_allowed_recipient_from_email(self):
        self.client.force_login(self.instructor)

        response = self.client.get(
            '/messages/new/',
            {'recipient_email': self.student.email.upper()},
            HTTP_X_INERTIA='true',
        )

        self.assertEqual(response.status_code, 200)
        props = response.json()['props']
        self.assertEqual(props['preselectedRecipientId'], self.student.id)
        self.assertIn(
            {
                'id': self.student.id,
                'name': self.student.email,
                'email': self.student.email,
            },
            props['recipients'],
        )

    def test_send_reply_in_existing_conversation(self):
        conversation = Conversation.objects.create(
            participant_one=self.student,
            participant_two=self.instructor,
        )
        DirectMessage.objects.create(
            conversation=conversation,
            sender=self.student,
            content='Initial',
        )

        self.client.force_login(self.instructor)
        response = self.client.post(
            f'/messages/{conversation.id}/send/',
            {'content': 'Reply message'},
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(DirectMessage.objects.filter(conversation=conversation).count(), 2)

    def test_unread_count_api(self):
        conversation = Conversation.objects.create(
            participant_one=self.student,
            participant_two=self.instructor,
        )
        DirectMessage.objects.create(
            conversation=conversation,
            sender=self.student,
            content='Unread message',
        )

        self.client.force_login(self.instructor)
        response = self.client.get('/api/messages/unread-count/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get('count'), 1)
