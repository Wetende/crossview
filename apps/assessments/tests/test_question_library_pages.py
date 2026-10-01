from django.contrib.auth.models import Group
from django.test import TestCase
from django.urls import reverse

from apps.assessments.models import QuestionBank, Quiz, QuizQuestionPool
from apps.core.tests.factories import UserFactory
from apps.progression.tests.factories import (
    CurriculumNodeFactory,
    InstructorAssignmentFactory,
    ProgramFactory,
)


class QuestionLibraryPageTests(TestCase):
    def setUp(self):
        group, _ = Group.objects.get_or_create(name="Instructors")
        self.instructor = UserFactory()
        self.instructor.groups.add(group)
        self.admin = UserFactory(is_staff=True)
        self.learner = UserFactory()
        self.program = ProgramFactory(name="Electrical installation")
        InstructorAssignmentFactory(instructor=self.instructor, program=self.program)
        self.library = QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_INSTRUCTOR, owner=self.instructor, name="My circuits"
        )
        self.shared = QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_INSTITUTION, owner=self.admin, name="Workshop safety"
        )
        self.archived = QuestionBank.objects.create(
            program=self.program, owner=self.instructor, name="Old unit", is_archived=True
        )

    def inertia_get(self, name, **params):
        response = self.client.get(reverse(name), params, HTTP_X_INERTIA="true")
        return response

    def test_instructors_see_their_library_page(self):
        self.client.force_login(self.instructor)

        response = self.inertia_get("question_library:instructor")

        self.assertEqual(response.status_code, 200)
        page = response.json()
        self.assertEqual(page["component"], "Instructor/QuestionLibrary/Index")
        props = page["props"]
        self.assertEqual(
            {bank["name"] for bank in props["banks"]},
            {"My circuits", "Workshop safety", "Old unit"},
        )
        self.assertEqual(props["programs"], [{"id": self.program.id, "name": "Electrical installation"}])
        self.assertFalse(props["canCreateShared"])
        self.assertEqual(props["role"], "instructor")

    def test_learners_are_sent_back_to_their_dashboard(self):
        self.client.force_login(self.learner)

        response = self.client.get(reverse("question_library:instructor"))

        self.assertEqual(response.status_code, 302)

    def test_admins_manage_every_bank(self):
        quiz = Quiz.objects.create(node=CurriculumNodeFactory(program=self.program), title="Q")
        QuizQuestionPool.objects.create(quiz=quiz, bank=self.library, question_count=1)
        self.client.force_login(self.admin)

        response = self.inertia_get("question_library:admin", tab="promote")

        self.assertEqual(response.status_code, 200)
        page = response.json()
        self.assertEqual(page["component"], "Admin/QuestionBanks/Index")
        props = page["props"]
        self.assertEqual(
            {bank["name"] for bank in props["banks"]},
            {"My circuits", "Workshop safety", "Old unit"},
        )
        self.assertEqual(props["poolCounts"][str(self.library.id)], 1)
        self.assertEqual(props["tab"], "promote")

    def test_instructors_cannot_open_the_admin_page(self):
        self.client.force_login(self.instructor)

        response = self.client.get(reverse("question_library:admin"))

        self.assertEqual(response.status_code, 302)


class BuilderQuestionBankPropsTests(TestCase):
    """Every builder response carries the question bank data the quiz editor uses."""

    def setUp(self):
        group, _ = Group.objects.get_or_create(name="Instructors")
        self.instructor = UserFactory()
        self.instructor.groups.add(group)
        self.program = ProgramFactory()
        InstructorAssignmentFactory(instructor=self.instructor, program=self.program)
        self.library = QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_INSTRUCTOR, owner=self.instructor, name="My circuits"
        )

    def test_creating_a_lesson_keeps_question_bank_data(self):
        self.client.force_login(self.instructor)

        response = self.client.post(
            reverse("core:instructor.node_create", kwargs={"program_id": self.program.id}),
            {"title": "New unit"},
            HTTP_X_INERTIA="true",
        )

        # Node creation redirects to the manage page; the follow-up GET
        # carries the question bank props.
        self.assertEqual(response.status_code, 302)
        page = self.client.get(response["Location"], HTTP_X_INERTIA="true").json()
        self.assertEqual(page["component"], "Instructor/Program/Manage")
        props = page["props"]
        self.assertEqual([bank["name"] for bank in props["questionBanks"]], ["My circuits"])
        self.assertIn("questionCategories", props)
        self.assertIn("questionLibraryVersions", props)
