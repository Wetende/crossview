from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.assessments.models import Question, QuestionBank, QuestionBankEntry, Quiz
from apps.assessments.question_bank_service import QuestionBankService
from apps.core.tests.factories import UserFactory
from apps.progression.tests.factories import (
    CurriculumNodeFactory,
    InstructorAssignmentFactory,
    ProgramFactory,
)


def snapshot(text):
    return {
        "question_type": "true_false",
        "text": text,
        "points": 1,
        "answer_data": {"correct": True},
    }


class QuestionBankScopeApiTests(APITestCase):
    def setUp(self):
        group, _ = Group.objects.get_or_create(name="Instructors")
        self.owner = UserFactory()
        self.colleague = UserFactory()
        self.outsider = UserFactory()
        for user in (self.owner, self.colleague, self.outsider):
            user.groups.add(group)
        self.admin = UserFactory(is_staff=True)

        self.program = ProgramFactory()
        self.other_program = ProgramFactory()
        InstructorAssignmentFactory(instructor=self.owner, program=self.program)
        InstructorAssignmentFactory(instructor=self.colleague, program=self.program)
        InstructorAssignmentFactory(instructor=self.outsider, program=self.other_program)

        self.quiz = Quiz.objects.create(
            node=CurriculumNodeFactory(program=self.program), title="Course quiz"
        )
        self.other_quiz = Quiz.objects.create(
            node=CurriculumNodeFactory(program=self.other_program), title="Other quiz"
        )

        self.course_bank = QuestionBank.objects.create(
            program=self.program, owner=self.owner, name="Course bank"
        )
        self.library = QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_INSTRUCTOR, owner=self.owner, name="Owner library"
        )
        self.shared = QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_INSTITUTION,
            owner=self.admin,
            name="Shared bank",
            category="Safety",
        )
        service = QuestionBankService()
        self.course_entry = service.add_to_bank(
            question=None, user=self.owner, bank=self.course_bank,
            question_snapshot=snapshot("Course question"),
        )
        self.library_entry = service.add_to_bank(
            question=None, user=self.owner, bank=self.library,
            question_snapshot=snapshot("Library question"),
        )
        self.shared_entry = service.add_to_bank(
            question=None, user=self.admin, bank=self.shared,
            question_snapshot=snapshot("Shared question"),
        )

    def library_url(self, name, program=None, **kwargs):
        return reverse(
            f"assessments:{name}",
            kwargs={"program_id": (program or self.program).id, **kwargs},
        )

    def pools_url(self, quiz):
        return reverse("assessments:quiz-question-pools", args=[quiz.id])

    def test_pools_can_draw_from_the_owners_library_in_any_taught_course(self):
        self.client.force_login(self.owner)

        response = self.client.post(
            self.pools_url(self.quiz),
            {"bank": self.library.id, "question_count": 1},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["bank"], self.library.id)

    def test_pools_reject_banks_the_editor_cannot_use(self):
        self.client.force_login(self.colleague)
        colleague_response = self.client.post(
            self.pools_url(self.quiz),
            {"bank": self.library.id, "question_count": 1},
            format="json",
        )
        self.client.force_login(self.outsider)
        outsider_response = self.client.post(
            self.pools_url(self.other_quiz),
            {"bank": self.course_bank.id, "question_count": 1},
            format="json",
        )

        self.assertEqual(colleague_response.status_code, 404)
        self.assertEqual(outsider_response.status_code, 404)

    def test_course_library_lists_course_library_and_shared_entries(self):
        self.client.force_login(self.owner)
        owner_ids = {
            item["id"]
            for item in self.client.get(self.library_url("program-question-library")).data
        }
        self.client.force_login(self.colleague)
        colleague_ids = {
            item["id"]
            for item in self.client.get(self.library_url("program-question-library")).data
        }

        self.assertEqual(
            owner_ids,
            {self.course_entry.id, self.library_entry.id, self.shared_entry.id},
        )
        self.assertEqual(colleague_ids, {self.course_entry.id, self.shared_entry.id})

    def test_bank_list_shows_scope_and_permissions(self):
        self.client.force_login(self.owner)

        response = self.client.get(self.library_url("program-question-banks"))

        banks = {item["name"]: item for item in response.data}
        self.assertEqual(set(banks), {"Course bank", "Owner library", "Shared bank"})
        self.assertEqual(banks["Owner library"]["scope"], QuestionBank.SCOPE_INSTRUCTOR)
        self.assertTrue(banks["Owner library"]["can_edit"])
        self.assertFalse(banks["Shared bank"]["can_edit"])
        self.assertFalse(banks["Shared bank"]["can_delete"])

    def test_instructors_can_create_library_banks_but_not_shared_banks(self):
        self.client.force_login(self.owner)

        library = self.client.post(
            self.library_url("program-question-banks"),
            {"name": "My second library", "scope": QuestionBank.SCOPE_INSTRUCTOR},
            format="json",
        )
        shared = self.client.post(
            self.library_url("program-question-banks"),
            {"name": "Everyone's bank", "scope": QuestionBank.SCOPE_INSTITUTION},
            format="json",
        )

        self.assertEqual(library.status_code, 201)
        self.assertEqual(library.data["scope"], QuestionBank.SCOPE_INSTRUCTOR)
        self.assertIsNone(library.data["program"])
        self.assertEqual(shared.status_code, 403)

    def test_instructors_cannot_edit_shared_bank_entries(self):
        self.client.force_login(self.owner)

        response = self.client.patch(
            self.library_url("program-question-entry-detail", pk=self.shared_entry.id),
            {"category": "Renamed"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_entries_cannot_move_into_banks_the_editor_cannot_edit(self):
        self.client.force_login(self.owner)

        response = self.client.patch(
            self.library_url("program-question-entry-detail", pk=self.course_entry.id),
            {"bank_id": self.shared.id},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.course_entry.refresh_from_db()
        self.assertEqual(self.course_entry.bank, self.course_bank)

    def test_saving_an_invalid_question_to_the_library_is_a_client_error(self):
        self.client.force_login(self.owner)

        response = self.client.post(
            self.library_url("program-question-entry-create"),
            {
                "bank_id": self.course_bank.id,
                "questionSnapshot": {"question_type": "bogus", "text": "Broken"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "invalid_question")

    def test_instructors_cannot_save_into_shared_banks(self):
        self.client.force_login(self.owner)

        response = self.client.post(
            self.library_url("program-question-entry-create"),
            {"bank_id": self.shared.id, "questionSnapshot": snapshot("Sneaky")},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_library_entries_can_be_added_to_quizzes_in_other_taught_courses(self):
        InstructorAssignmentFactory(instructor=self.owner, program=self.other_program)
        self.client.force_login(self.owner)

        response = self.client.post(
            reverse(
                "assessments:program-question-entry-add-to-quiz",
                kwargs={"program_id": self.other_program.id, "pk": self.library_entry.id},
            ),
            {"quiz_id": self.other_quiz.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        copy = Question.objects.get(pk=response.data["id"])
        self.assertEqual(copy.source_bank_entry, self.library_entry)
        self.assertEqual(copy.source_bank_entry_version, 1)

    def test_owned_entry_api_lists_library_entries(self):
        self.client.force_login(self.owner)

        response = self.client.get(reverse("assessments:question-bank-list"))

        self.assertEqual(
            {item["id"] for item in response.data},
            {self.course_entry.id, self.library_entry.id},
        )

    def test_owned_entry_api_blocks_copying_course_entries_into_other_courses(self):
        InstructorAssignmentFactory(instructor=self.owner, program=self.other_program)
        self.client.force_login(self.owner)

        response = self.client.post(
            reverse("assessments:question-bank-add-to-quiz", args=[self.course_entry.id]),
            {"quiz_id": self.other_quiz.id},
            format="json",
        )

        self.assertEqual(response.status_code, 404)
        self.assertFalse(Question.objects.filter(quiz=self.other_quiz).exists())

    def test_admins_manage_shared_banks_and_colleagues_cannot_delete_course_banks(self):
        self.client.force_login(self.colleague)
        colleague_delete = self.client.delete(
            self.library_url("program-question-bank-detail", pk=self.course_bank.id)
        )
        self.client.force_login(self.admin)
        admin_rename = self.client.patch(
            self.library_url("program-question-bank-detail", pk=self.shared.id),
            {"name": "Shared safety bank"},
            format="json",
        )

        self.assertEqual(colleague_delete.status_code, 403)
        self.assertEqual(admin_rename.status_code, 200)
        self.assertEqual(admin_rename.data["name"], "Shared safety bank")

    def test_banks_can_be_archived_and_leave_the_picker(self):
        self.client.force_login(self.owner)

        archive = self.client.patch(
            self.library_url("program-question-bank-detail", pk=self.library.id),
            {"is_archived": True},
            format="json",
        )
        listed = self.client.get(self.library_url("program-question-banks"))

        self.assertEqual(archive.status_code, 200)
        self.assertTrue(archive.data["is_archived"])
        self.assertNotIn("Owner library", {item["name"] for item in listed.data})

    def test_categories_include_shared_banks(self):
        self.client.force_login(self.colleague)

        response = self.client.get(self.library_url("program-question-categories"))

        self.assertIn("Safety", response.data["categories"])
