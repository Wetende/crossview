from urllib.parse import quote_plus

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.models import Program
from apps.messaging.models import Conversation, DirectMessage
from apps.messaging.services import MessagingService
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

    def test_new_message_passes_a_capped_draft_from_the_course_player(self):
        self.client.force_login(self.student)
        question = 'Question about "Deployment models" in Messaging Program:'
        draft = f"  {question}\n\n" + ("x" * 400)

        response = self.client.get(
            '/messages/new/',
            {'recipient_id': self.instructor.id, 'draft': draft},
            HTTP_X_INERTIA='true',
        )

        self.assertEqual(response.status_code, 200)
        props = response.json()['props']
        self.assertEqual(props['preselectedRecipientId'], self.instructor.id)
        self.assertEqual(len(props['draftContent']), 300)
        self.assertEqual(props['draftContent'], draft.lstrip()[:300])
        self.assertTrue(props['draftContent'].startswith(question))

    def test_new_message_draft_keeps_its_trailing_blank_line(self):
        self.client.force_login(self.student)
        draft = 'Question about "Deployment models" in Messaging Program:\n\n'

        response = self.client.get(
            '/messages/new/',
            {'recipient_id': self.instructor.id, 'draft': draft},
            HTTP_X_INERTIA='true',
        )

        self.assertEqual(response.json()['props']['draftContent'], draft)

    def test_existing_conversation_redirect_carries_the_capped_draft(self):
        self.client.force_login(self.student)
        conversation, _ = MessagingService.get_or_create_conversation(
            self.student,
            self.instructor,
        )
        draft = 'Question about "Deployment models" in Messaging Program:\n\n'
        long_draft = draft + ('y' * 400)

        response = self.client.get(
            '/messages/new/',
            {'recipient_id': self.instructor.id, 'draft': long_draft},
        )

        self.assertEqual(response.status_code, 302)
        expected_draft = long_draft[:300]
        self.assertEqual(
            response['Location'],
            f'/messages/{conversation.id}/?draft={quote_plus(expected_draft)}',
        )

        followed = self.client.get(response['Location'], HTTP_X_INERTIA='true')
        self.assertEqual(followed.status_code, 200)
        self.assertEqual(followed.json()['props']['draftContent'], expected_draft)

    def test_existing_conversation_redirect_without_draft_is_unchanged(self):
        self.client.force_login(self.student)
        conversation, _ = MessagingService.get_or_create_conversation(
            self.student,
            self.instructor,
        )

        response = self.client.get(
            '/messages/new/',
            {'recipient_id': self.instructor.id},
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response['Location'], f'/messages/{conversation.id}/')

    def test_new_message_without_draft_sends_empty_draft(self):
        self.client.force_login(self.student)

        response = self.client.get('/messages/new/', HTTP_X_INERTIA='true')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['props']['draftContent'], '')

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
