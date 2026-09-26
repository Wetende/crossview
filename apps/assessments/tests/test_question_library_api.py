from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.assessments.models import Question, QuestionBank, Quiz, QuizQuestionPool
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


class QuestionLibraryApiTests(APITestCase):
    def setUp(self):
        group, _ = Group.objects.get_or_create(name="Instructors")
        self.owner = UserFactory()
        self.colleague = UserFactory()
        for user in (self.owner, self.colleague):
            user.groups.add(group)
        self.admin = UserFactory(is_staff=True)
        self.program = ProgramFactory()
        self.unassigned_program = ProgramFactory()
        InstructorAssignmentFactory(instructor=self.owner, program=self.program)
        InstructorAssignmentFactory(instructor=self.colleague, program=self.program)
        self.quiz = Quiz.objects.create(
            node=CurriculumNodeFactory(program=self.program), title="Course quiz"
        )

        self.course_bank = QuestionBank.objects.create(
            program=self.program, owner=self.owner, name="Course bank"
        )
        self.library = QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_INSTRUCTOR,
            owner=self.owner,
            name="Owner library",
            category="Circuits",
        )
        self.shared = QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_INSTITUTION, owner=self.admin, name="Shared bank"
        )
        service = QuestionBankService()
        self.course_entry = service.add_to_bank(
            question=None, user=self.owner, bank=self.course_bank,
            question_snapshot=snapshot("Course question"),
        )
        self.library_entries = [
            service.add_to_bank(
                question=None, user=self.owner, bank=self.library,
                question_snapshot=snapshot(f"Library question {index}"),
            )
            for index in range(3)
        ]
        self.shared_entry = service.add_to_bank(
            question=None, user=self.admin, bank=self.shared,
            question_snapshot=snapshot("Shared question"),
        )

    def url(self, name, *args):
        return reverse(f"assessments:{name}", args=args)

    def test_bank_list_needs_no_course(self):
        self.client.force_login(self.owner)

        response = self.client.get(self.url("question-library-banks"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {bank["name"] for bank in response.data},
            {"Course bank", "Owner library", "Shared bank"},
        )

    def test_bank_list_filters_by_scope(self):
        self.client.force_login(self.owner)

        response = self.client.get(
            self.url("question-library-banks"), {"scope": QuestionBank.SCOPE_INSTRUCTOR}
        )

        self.assertEqual([bank["name"] for bank in response.data], ["Owner library"])

    def test_creating_banks_of_each_scope(self):
        self.client.force_login(self.owner)
        library = self.client.post(
            self.url("question-library-banks"),
            {"name": "Second library", "scope": QuestionBank.SCOPE_INSTRUCTOR},
            format="json",
        )
        course = self.client.post(
            self.url("question-library-banks"),
            {"name": "Unit bank", "scope": QuestionBank.SCOPE_COURSE, "program": self.program.id},
            format="json",
        )
        missing_course = self.client.post(
            self.url("question-library-banks"),
            {"name": "Nowhere", "scope": QuestionBank.SCOPE_COURSE},
            format="json",
        )
        foreign_course = self.client.post(
            self.url("question-library-banks"),
            {
                "name": "Not mine",
                "scope": QuestionBank.SCOPE_COURSE,
                "program": self.unassigned_program.id,
            },
            format="json",
        )
        shared = self.client.post(
            self.url("question-library-banks"),
            {"name": "For everyone", "scope": QuestionBank.SCOPE_INSTITUTION},
            format="json",
        )

        self.assertEqual(library.status_code, 201)
        self.assertIsNone(library.data["program"])
        self.assertEqual(course.status_code, 201)
        self.assertEqual(course.data["program"], self.program.id)
        self.assertEqual(missing_course.status_code, 400)
        self.assertEqual(foreign_course.status_code, 404)
        self.assertEqual(shared.status_code, 403)

    def test_admins_can_create_shared_banks(self):
        self.client.force_login(self.admin)

        response = self.client.post(
            self.url("question-library-banks"),
            {"name": "Workshop safety", "scope": QuestionBank.SCOPE_INSTITUTION},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["scope"], QuestionBank.SCOPE_INSTITUTION)

    def test_entries_are_paginated(self):
        self.client.force_login(self.owner)

        first = self.client.get(self.url("question-library-entries"), {"page_size": 2})
        second = self.client.get(
            self.url("question-library-entries"), {"page_size": 2, "page": 2}
        )

        self.assertEqual(first.data["count"], 5)
        self.assertEqual(first.data["pageSize"], 2)
        self.assertEqual(first.data["totalPages"], 3)
        self.assertEqual(len(first.data["results"]), 2)
        self.assertEqual(second.data["page"], 2)
        first_ids = {item["id"] for item in first.data["results"]}
        second_ids = {item["id"] for item in second.data["results"]}
        self.assertFalse(first_ids & second_ids)

    def test_page_size_is_capped(self):
        self.client.force_login(self.owner)

        response = self.client.get(self.url("question-library-entries"), {"page_size": 5000})

        self.assertEqual(response.data["pageSize"], 100)

    def test_entries_filter_by_scope_and_owner(self):
        self.client.force_login(self.owner)

        library = self.client.get(
            self.url("question-library-entries"), {"scope": QuestionBank.SCOPE_INSTRUCTOR}
        )
        mine = self.client.get(self.url("question-library-entries"), {"owner_only": "1"})

        self.assertEqual(
            {item["id"] for item in library.data["results"]},
            {entry.id for entry in self.library_entries},
        )
        self.assertEqual(mine.data["count"], 4)

    def test_entries_for_an_unassigned_course_are_not_found(self):
        self.client.force_login(self.owner)

        response = self.client.get(
            self.url("question-library-entries"), {"program": self.unassigned_program.id}
        )

        self.assertEqual(response.status_code, 404)

    def test_entry_detail_includes_revisions_and_enforces_edit_rights(self):
        self.client.force_login(self.owner)

        detail = self.client.get(self.url("question-library-entry-detail", self.shared_entry.id))
        edit = self.client.patch(
            self.url("question-library-entry-detail", self.shared_entry.id),
            {"category": "Changed"},
            format="json",
        )

        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["revisions"][0]["version"], 1)
        self.assertEqual(edit.status_code, 403)

    def test_entries_can_be_created_in_a_library_bank(self):
        self.client.force_login(self.owner)

        response = self.client.post(
            self.url("question-library-entries"),
            {"bank_id": self.library.id, "questionSnapshot": snapshot("Written in the library")},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["bank"], self.library.id)

    def test_library_entries_can_be_copied_into_a_quiz(self):
        self.client.force_login(self.owner)

        response = self.client.post(
            self.url("question-library-entry-add-to-quiz", self.library_entries[0].id),
            {"quiz_id": self.quiz.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        copy = Question.objects.get(pk=response.data["id"])
        self.assertEqual(copy.source_bank_entry, self.library_entries[0])

    def test_only_admins_can_promote_a_bank_to_shared(self):
        QuizQuestionPool.objects.create(quiz=self.quiz, bank=self.library, question_count=2)
        self.client.force_login(self.owner)
        refused = self.client.post(self.url("question-library-bank-promote", self.library.id))
        self.client.force_login(self.admin)
        promoted = self.client.post(self.url("question-library-bank-promote", self.library.id))
        promoted_again = self.client.post(
            self.url("question-library-bank-promote", self.library.id)
        )
        self.client.force_login(self.colleague)
        colleague_banks = self.client.get(self.url("question-library-banks"))

        self.assertEqual(refused.status_code, 403)
        self.assertEqual(promoted.status_code, 200)
        self.assertEqual(promoted.data["scope"], QuestionBank.SCOPE_INSTITUTION)
        self.assertIsNone(promoted.data["program"])
        self.assertEqual(promoted_again.status_code, 200)
        self.assertIn("Owner library", {bank["name"] for bank in colleague_banks.data})
        self.assertEqual(self.library.quiz_pools.count(), 1)

    def test_admins_can_list_every_bank_for_management(self):
        self.client.force_login(self.admin)
        managed = self.client.get(self.url("question-library-banks"), {"manage": "1"})
        self.client.force_login(self.owner)
        refused = self.client.get(self.url("question-library-banks"), {"manage": "1"})

        self.assertIn("Owner library", {bank["name"] for bank in managed.data})
        self.assertEqual(refused.status_code, 403)

    def test_categories_need_no_course(self):
        self.client.force_login(self.owner)

        response = self.client.get(self.url("question-library-categories"))

        self.assertIn("Circuits", response.data["categories"])

    def test_stats_can_focus_on_one_bank(self):
        self.client.force_login(self.owner)

        response = self.client.get(
            self.url("question-library-stats"), {"bank_id": self.library.id}
        )

        self.assertEqual(
            {row["entryId"] for row in response.data["entries"]},
            {entry.id for entry in self.library_entries},
        )

    def test_archived_bank_entries_are_listed_when_requested(self):
        self.library.is_archived = True
        self.library.save(update_fields=["is_archived"])
        self.client.force_login(self.owner)

        hidden = self.client.get(
            self.url("question-library-entries"), {"bank_id": self.library.id}
        )
        shown = self.client.get(
            self.url("question-library-entries"),
            {"bank_id": self.library.id, "include_archived": "1"},
        )

        self.assertEqual(hidden.data["count"], 0)
        self.assertEqual(shown.data["count"], 3)
