from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.assessments.models import Question, QuestionBank, QuestionBankEntry, Quiz
from apps.core.tests.factories import UserFactory
from apps.progression.tests.factories import (
    CurriculumNodeFactory,
    InstructorAssignmentFactory,
    ProgramFactory,
)


class AssessmentApiAuthorizationTests(APITestCase):
    def setUp(self):
        self.instructor = UserFactory()
        self.other_instructor = UserFactory()
        self.student = UserFactory()
        instructor_group, _ = Group.objects.get_or_create(name="Instructors")
        self.instructor.groups.add(instructor_group)
        self.other_instructor.groups.add(instructor_group)

        self.program = ProgramFactory()
        self.other_program = ProgramFactory()
        self.node = CurriculumNodeFactory(program=self.program)
        self.other_node = CurriculumNodeFactory(program=self.other_program)
        InstructorAssignmentFactory(instructor=self.instructor, program=self.program)
        InstructorAssignmentFactory(
            instructor=self.other_instructor,
            program=self.other_program,
        )

        self.quiz = Quiz.objects.create(node=self.node, title="Program A Quiz")
        self.other_quiz = Quiz.objects.create(
            node=self.other_node,
            title="Program B Quiz",
        )
        self.question = Question.objects.create(
            quiz=self.quiz,
            question_type="true_false",
            text="Program A Question",
            answer_data={"correct": True},
        )
        self.other_question = Question.objects.create(
            quiz=self.other_quiz,
            question_type="true_false",
            text="Program B Question",
            answer_data={"correct": False},
        )
        self.bank = QuestionBank.objects.create(
            name="Owned Bank",
            program=self.program,
            owner=self.instructor,
        )
        self.other_bank = QuestionBank.objects.create(
            name="Foreign Bank",
            program=self.program,
            owner=self.other_instructor,
        )
        self.entry = QuestionBankEntry.objects.create(
            owner=self.instructor,
            question=self.question,
            bank=self.bank,
        )

        self.quiz_list_url = reverse("assessments:quiz-list")
        self.question_list_url = reverse("assessments:question-list")
        self.question_bank_list_url = reverse("assessments:question-bank-list")
        self.reorder_url = reverse("assessments:question-reorder")

    def test_student_cannot_crud_quizzes_or_questions(self):
        self.client.force_login(self.student)

        cases = [
            ("get", self.quiz_list_url, None),
            ("post", self.quiz_list_url, {"node": self.node.id, "title": "New Quiz"}),
            ("get", reverse("assessments:quiz-detail", args=[self.quiz.id]), None),
            (
                "patch",
                reverse("assessments:quiz-detail", args=[self.quiz.id]),
                {"title": "Renamed"},
            ),
            ("delete", reverse("assessments:quiz-detail", args=[self.quiz.id]), None),
            ("get", self.question_list_url, None),
            (
                "post",
                self.question_list_url,
                {
                    "quiz": self.quiz.id,
                    "question_type": "true_false",
                    "text": "New Question",
                    "answer_data": {"correct": True},
                },
            ),
            (
                "get",
                reverse("assessments:question-detail", args=[self.question.id]),
                None,
            ),
            (
                "patch",
                reverse("assessments:question-detail", args=[self.question.id]),
                {"text": "Updated"},
            ),
            (
                "delete",
                reverse("assessments:question-detail", args=[self.question.id]),
                None,
            ),
        ]

        for method, url, payload in cases:
            response = getattr(self.client, method)(url, payload, format="json")
            self.assertEqual(response.status_code, 403, msg=f"{method.upper()} {url}")

    def test_instructor_queryset_is_scoped_to_assigned_program(self):
        self.client.force_login(self.instructor)

        quiz_response = self.client.get(self.quiz_list_url, format="json")
        question_response = self.client.get(self.question_list_url, format="json")
        foreign_quiz_response = self.client.get(
            reverse("assessments:quiz-detail", args=[self.other_quiz.id]),
            format="json",
        )
        foreign_question_response = self.client.get(
            reverse("assessments:question-detail", args=[self.other_question.id]),
            format="json",
        )

        self.assertEqual(quiz_response.status_code, 200)
        self.assertEqual([quiz["id"] for quiz in quiz_response.data], [self.quiz.id])
        self.assertEqual(question_response.status_code, 200)
        self.assertEqual(
            [question["id"] for question in question_response.data],
            [self.question.id],
        )
        self.assertEqual(foreign_quiz_response.status_code, 404)
        self.assertEqual(foreign_question_response.status_code, 404)

    def test_quiz_and_question_mutations_reject_foreign_related_objects(self):
        self.client.force_login(self.instructor)

        create_quiz_response = self.client.post(
            self.quiz_list_url,
            {"node": self.other_node.id, "title": "Foreign Quiz"},
            format="json",
        )
        update_quiz_response = self.client.patch(
            reverse("assessments:quiz-detail", args=[self.quiz.id]),
            {"node": self.other_node.id},
            format="json",
        )
        create_question_response = self.client.post(
            self.question_list_url,
            {
                "quiz": self.other_quiz.id,
                "question_type": "true_false",
                "text": "Foreign Question",
                "answer_data": {"correct": True},
            },
            format="json",
        )
        update_question_response = self.client.patch(
            reverse("assessments:question-detail", args=[self.question.id]),
            {"quiz": self.other_quiz.id},
            format="json",
        )

        self.assertEqual(create_quiz_response.status_code, 404)
        self.assertEqual(update_quiz_response.status_code, 404)
        self.assertEqual(create_question_response.status_code, 404)
        self.assertEqual(update_question_response.status_code, 404)

    def test_reorder_rejects_foreign_quiz_id(self):
        self.client.force_login(self.instructor)

        response = self.client.post(
            self.reorder_url,
            {"quiz_id": self.other_quiz.id, "order": [self.other_question.id]},
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_add_to_quiz_rejects_foreign_destination_quiz(self):
        self.client.force_login(self.instructor)

        response = self.client.post(
            reverse("assessments:question-bank-add-to-quiz", args=[self.entry.id]),
            {"quiz_id": self.other_quiz.id},
            format="json",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            Question.objects.filter(quiz=self.other_quiz).count(),
            1,
        )

    def test_question_bank_create_requires_accessible_owned_relations(self):
        self.client.force_login(self.instructor)

        foreign_question_response = self.client.post(
            self.question_bank_list_url,
            {
                "question": self.other_question.id,
                "bank": self.bank.id,
                "category": "security",
            },
            format="json",
        )
        foreign_bank_response = self.client.post(
            self.question_bank_list_url,
            {
                "question": self.question.id,
                "bank": self.other_bank.id,
                "category": "security",
            },
            format="json",
        )

        self.assertEqual(foreign_question_response.status_code, 404)
        self.assertEqual(foreign_bank_response.status_code, 404)
