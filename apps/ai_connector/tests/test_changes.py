from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone

from apps.assessments.models import Question, Quiz, QuizAttempt
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, InstructorAssignment

from .. import changes
from ..access import AccessDenied, ConnectorError
from ..models import CourseChange
from .helpers import LINKS, FakeToken, make_course, make_user, question_snapshot

TOKEN = FakeToken()


def prepare(user, course, operations, token=TOKEN):
    return changes.prepare_change(
        user=user, token=token, links=LINKS, course_id=course["program"].id, operations=operations
    )


def apply(user, change_id, token=TOKEN):
    return changes.apply_change(user=user, token=token, links=LINKS, change_id=change_id)


NEW_QUESTIONS = [
    {"type": "single_choice", "text": "What does ML learn from?", "options": ["Data", "Magic", "Luck"], "correct": 0},
    {"type": "multiple_choice", "text": "Pick model types", "options": ["Tree", "Net", "Rock"], "correct": [0, 1], "points": 2},
    {"type": "true_false", "text": "Models can be biased.", "correct": True},
]


class PrepareAndApplyTests(TestCase):
    def setUp(self):
        self.instructor = make_user("teacher", instructor=True)
        self.course = make_course("AI101", instructor=self.instructor)

    def test_ai_question_append_preserves_existing_explanations_and_hints(self):
        question = self.course["quiz"].questions.order_by("position").first()
        question.explanation = "<p>Why this answer is right.</p>"
        question.hint = "<p>Think about the model.</p>"
        question.save(update_fields=["explanation", "hint"])
        preview = prepare(self.instructor, self.course, [{
            "op": "add_questions", "quiz_lesson_id": self.course["quiz_node"].id,
            "questions": NEW_QUESTIONS,
        }])
        apply(self.instructor, preview["change_id"])
        self.course["quiz_node"].refresh_from_db()
        mirrored = next(item for item in self.course["quiz_node"].properties["questions"] if item["db_id"] == question.id)
        self.assertEqual(mirrored.get("explanation"), question.explanation)
        self.assertEqual(mirrored.get("hint"), question.hint)

    def test_prepare_changes_nothing_and_apply_saves_exactly_the_preview(self):
        program = self.course["program"]
        before_nodes = CurriculumNode.objects.filter(program=program).count()
        preview = prepare(
            self.instructor,
            self.course,
            [
                {"op": "update_course", "learning_outcomes": ["Explain AI", "Train a model"]},
                {"op": "update_module", "module_id": self.course["module2"].id, "title": "Module 2: Machine learning"},
                {
                    "op": "create_text_lesson",
                    "module_id": self.course["module2"].id,
                    "title": "Training data",
                    "body_html": "<h2>Why data</h2><p>Models learn from examples.</p>",
                    "duration": "30",
                },
            ],
        )
        self.assertEqual(preview["status"], "prepared")
        self.assertEqual(len(preview["operations"]), 3)
        self.assertEqual(preview["operations"][2]["position"], "End of the module, after 'Module 2 quiz'")
        self.assertFalse(preview["affects_published_content"])
        program.refresh_from_db()
        self.assertEqual(program.what_you_learn_items, [])
        self.assertEqual(CurriculumNode.objects.filter(program=program).count(), before_nodes)

        result = apply(self.instructor, preview["change_id"])
        self.assertEqual(result["status"], "applied")
        program.refresh_from_db()
        self.assertEqual(program.what_you_learn_items, ["Explain AI", "Train a model"])
        self.assertEqual(CurriculumNode.objects.get(pk=self.course["module2"].id).title, "Module 2: Machine learning")
        lesson = CurriculumNode.objects.get(program=program, title="Training data")
        self.assertEqual(lesson.parent_id, self.course["module2"].id)
        self.assertEqual(lesson.position, 1)
        self.assertEqual(lesson.node_type, "Lesson")
        self.assertFalse(lesson.is_published)
        self.assertEqual(lesson.properties["lesson_type"], "text")
        self.assertEqual(lesson.properties["duration"], "30")
        self.assertIn("<h2>Why data</h2>", lesson.properties["content"])
        self.assertIn(f"node={lesson.id}", result["results"][2]["url"])
        self.assertFalse(program.is_published)

        change = CourseChange.objects.get(pk=preview["change_id"])
        self.assertEqual(change.user, self.instructor)
        self.assertEqual(change.status, CourseChange.Status.APPLIED)
        self.assertIsNotNone(change.applied_at)

    def test_add_questions_preserves_existing_questions_settings_and_attempts(self):
        quiz = self.course["quiz"]
        student = make_user("learner")
        enrollment = Enrollment.objects.create(user=student, program=self.course["program"], status="active")
        QuizAttempt.objects.create(enrollment=enrollment, quiz=quiz, attempt_number=1, started_at=timezone.now())
        before = question_snapshot(quiz)
        settings_before = Quiz.objects.filter(pk=quiz.pk).values("pass_threshold", "weight", "max_attempts").get()

        preview = prepare(
            self.instructor,
            self.course,
            [{"op": "add_questions", "quiz_lesson_id": self.course["quiz_node"].id, "questions": NEW_QUESTIONS}],
        )
        self.assertIn("1 attempt", preview["operations"][0]["notes"][0])
        self.assertEqual(question_snapshot(quiz), before)
        apply(self.instructor, preview["change_id"])

        after = question_snapshot(quiz)
        self.assertEqual(after[: len(before)], before)
        self.assertEqual(len(after), len(before) + 3)
        self.assertEqual(Quiz.objects.filter(pk=quiz.pk).values("pass_threshold", "weight", "max_attempts").get(), settings_before)
        self.assertEqual(QuizAttempt.objects.filter(quiz=quiz).count(), 1)
        new_multi = Question.objects.get(quiz=quiz, text="Pick model types")
        self.assertEqual(
            list(new_multi.options.order_by("position").values_list("is_correct", flat=True)), [True, True, False]
        )
        node = CurriculumNode.objects.get(pk=self.course["quiz_node"].id)
        self.assertEqual(len(node.properties["questions"]), 5)
        self.assertEqual(node.properties["quiz_id"], quiz.id)
        self.assertEqual(node.properties["weight"], 40)

    def test_update_question_edits_in_place_and_keeps_option_ids(self):
        quiz = self.course["quiz"]
        target = Question.objects.get(quiz=quiz, question_type="mcq")
        other_before = [row for row in question_snapshot(quiz) if row[0] != target.id]
        option_ids = list(target.options.order_by("position").values_list("id", flat=True))

        preview = prepare(
            self.instructor,
            self.course,
            [
                {
                    "op": "update_question",
                    "quiz_lesson_id": self.course["quiz_node"].id,
                    "question_id": target.id,
                    "question": {"type": "single_choice", "text": "Which is a learning model?", "options": ["Decision tree", "Rock"], "correct": 0},
                }
            ],
        )
        change = preview["operations"][0]["changes"][0]
        self.assertEqual(change["before"]["text"], "Which is a model?")
        self.assertEqual(change["after"]["points"], 2)
        apply(self.instructor, preview["change_id"])

        target.refresh_from_db()
        self.assertEqual(target.text, "Which is a learning model?")
        self.assertEqual(target.points, 2)
        self.assertEqual(list(target.options.order_by("position").values_list("id", flat=True)), option_ids)
        self.assertEqual(target.options.get(position=0).text, "Decision tree")
        self.assertEqual([row for row in question_snapshot(quiz) if row[0] != target.id], other_before)

    def test_create_quiz_links_an_assessment_record(self):
        preview = prepare(
            self.instructor,
            self.course,
            [{"op": "create_quiz", "module_id": self.course["module1"].id, "title": "Foundations check", "questions": NEW_QUESTIONS}],
        )
        apply(self.instructor, preview["change_id"])
        node = CurriculumNode.objects.get(program=self.course["program"], title="Foundations check")
        quiz = Quiz.objects.get(node=node)
        self.assertEqual(node.properties["quiz_id"], quiz.id)
        self.assertEqual(quiz.questions.count(), 3)
        self.assertEqual(quiz.weight, 0)

    def test_text_lesson_update_keeps_unrelated_properties(self):
        lesson = self.course["lesson"]
        preview = prepare(
            self.instructor,
            self.course,
            [{"op": "update_text_lesson", "lesson_id": lesson.id, "body_html": "<p>AI is the study of agents.</p>"}],
        )
        apply(self.instructor, preview["change_id"])
        lesson.refresh_from_db()
        self.assertEqual(lesson.properties["content"], "<p>AI is the study of agents.</p>")
        self.assertEqual(lesson.properties["duration"], "20")
        self.assertIs(lesson.properties["is_preview"], True)
        self.assertEqual(lesson.title, "What is AI?")


class PublishedContentTests(TestCase):
    def test_published_course_changes_are_flagged_and_publication_is_unchanged(self):
        instructor = make_user("teacher", instructor=True)
        course = make_course("AI101", published=True, instructor=instructor)
        preview = prepare(
            instructor,
            course,
            [{"op": "create_text_lesson", "module_id": course["module1"].id, "title": "Ethics", "body_html": "<p>Be fair.</p>"}],
        )
        self.assertTrue(preview["affects_published_content"])
        self.assertIn("visible to learners", preview["publication_notice"])
        apply(instructor, preview["change_id"])
        self.assertTrue(CurriculumNode.objects.get(title="Ethics").is_published)
        self.assertTrue(Program.objects.get(pk=course["program"].pk).is_published)


class SafetyTests(TestCase):
    def setUp(self):
        self.instructor = make_user("teacher", instructor=True)
        self.course = make_course("AI101", instructor=self.instructor)
        self.lesson_op = {"op": "update_text_lesson", "lesson_id": self.course["lesson"].id, "title": "What is artificial intelligence?"}

    def test_stale_change_is_rejected_and_nothing_is_saved(self):
        preview = prepare(self.instructor, self.course, [self.lesson_op])
        CurriculumNode.objects.filter(pk=self.course["lesson"].id).update(title="Edited in the builder")
        with self.assertRaisesMessage(ConnectorError, "changed after this preview"):
            apply(self.instructor, preview["change_id"])
        self.assertEqual(CurriculumNode.objects.get(pk=self.course["lesson"].id).title, "Edited in the builder")
        self.assertEqual(CourseChange.objects.get(pk=preview["change_id"]).status, CourseChange.Status.STALE)

    def test_truncated_lesson_body_cannot_be_replaced_from_an_incomplete_read(self):
        lesson = self.course["lesson"]
        original = "<p>" + ("A" * 100_001) + "</p>"
        lesson.properties = {**lesson.properties, "content": original}
        lesson.save(update_fields=["properties"], skip_validation=True)

        with self.assertRaisesMessage(ConnectorError, "too long to read in full"):
            prepare(
                self.instructor,
                self.course,
                [{"op": "update_text_lesson", "lesson_id": lesson.id, "body_html": "<p>New text</p>"}],
            )
        self.assertEqual(CurriculumNode.objects.get(pk=lesson.id).properties["content"], original)

        preview = prepare(
            self.instructor,
            self.course,
            [{"op": "update_text_lesson", "lesson_id": lesson.id, "title": "Renamed lesson"}],
        )
        apply(self.instructor, preview["change_id"])
        self.assertEqual(CurriculumNode.objects.get(pk=lesson.id).properties["content"], original)

    def test_quiz_with_unsaved_builder_questions_is_refused(self):
        node = self.course["quiz_node"]
        node.properties["questions"].append({"id": "temp_1", "type": "mcq", "text": "Draft", "options": ["A", "B"]})
        node.save(update_fields=["properties"], skip_validation=True)
        with self.assertRaisesMessage(ConnectorError, "not saved in the course builder"):
            prepare(
                self.instructor, self.course,
                [{"op": "add_questions", "quiz_lesson_id": node.id, "questions": NEW_QUESTIONS[:1]}],
            )

    def test_quiz_edits_detect_question_changes_made_elsewhere(self):
        preview = prepare(
            self.instructor, self.course,
            [{"op": "add_questions", "quiz_lesson_id": self.course["quiz_node"].id, "questions": NEW_QUESTIONS[:1]}],
        )
        Question.objects.filter(quiz=self.course["quiz"], question_type="mcq").update(text="Changed elsewhere")
        with self.assertRaises(ConnectorError):
            apply(self.instructor, preview["change_id"])
        self.assertEqual(self.course["quiz"].questions.count(), 2)

    def test_publishing_between_preview_and_apply_makes_the_change_stale(self):
        preview = prepare(self.instructor, self.course, [self.lesson_op])
        Program.objects.filter(pk=self.course["program"].pk).update(is_published=True)
        with self.assertRaisesMessage(ConnectorError, "published state"):
            apply(self.instructor, preview["change_id"])

    def test_repeated_apply_returns_the_original_result(self):
        preview = prepare(
            self.instructor, self.course,
            [{"op": "create_text_lesson", "module_id": self.course["module1"].id, "title": "Once only", "body_html": "<p>x</p>"}],
        )
        first = apply(self.instructor, preview["change_id"])
        second = apply(self.instructor, preview["change_id"])
        self.assertEqual(CurriculumNode.objects.filter(title="Once only").count(), 1)
        self.assertEqual(second["results"], first["results"])
        self.assertIn("already saved", second["message"])

    def test_failure_rolls_back_every_operation(self):
        preview = prepare(
            self.instructor, self.course,
            [
                self.lesson_op,
                {"op": "update_module", "module_id": self.course["module1"].id, "title": "Renamed"},
            ],
        )
        def fail(*args):
            raise RuntimeError("database went away")

        with patch.dict("apps.ai_connector.operations.APPLIERS", {"update_module": fail}):
            with self.assertRaisesMessage(ConnectorError, "Nothing was changed"):
                apply(self.instructor, preview["change_id"])
        self.assertEqual(CurriculumNode.objects.get(pk=self.course["lesson"].id).title, "What is AI?")
        self.assertEqual(CourseChange.objects.get(pk=preview["change_id"]).status, CourseChange.Status.FAILED)

    def test_access_removed_after_preparation_rejects_the_change(self):
        preview = prepare(self.instructor, self.course, [self.lesson_op])
        InstructorAssignment.objects.filter(instructor=self.instructor).delete()
        with self.assertRaisesMessage(ConnectorError, "no longer have access"):
            apply(self.instructor, preview["change_id"])
        self.assertEqual(CourseChange.objects.get(pk=preview["change_id"]).status, CourseChange.Status.REJECTED)

    def test_status_and_replay_hide_details_after_access_is_removed(self):
        preview = prepare(
            self.instructor, self.course,
            [{"op": "add_questions", "quiz_lesson_id": self.course["quiz_node"].id, "questions": NEW_QUESTIONS[:1]}],
        )
        apply(self.instructor, preview["change_id"])
        InstructorAssignment.objects.filter(instructor=self.instructor).delete()

        status = changes.change_status(user=self.instructor, token=TOKEN, change_id=preview["change_id"])
        self.assertEqual(status["status"], "applied")
        for hidden in ("operations", "result", "summary", "error"):
            self.assertNotIn(hidden, status)
        self.assertIn("no longer have access", status["message"])
        with self.assertRaisesMessage(AccessDenied, "no longer have access"):
            apply(self.instructor, preview["change_id"])

    def test_other_users_cannot_apply_or_read_a_change(self):
        preview = prepare(self.instructor, self.course, [self.lesson_op])
        intruder = make_user("intruder", instructor=True, staff=True)
        with self.assertRaises(AccessDenied):
            apply(intruder, preview["change_id"])
        with self.assertRaises(AccessDenied):
            changes.change_status(user=intruder, token=TOKEN, change_id=preview["change_id"])

    def test_read_only_connection_cannot_prepare_or_apply(self):
        read_only = FakeToken(scope="courses:read")
        with self.assertRaisesMessage(AccessDenied, "not authorized to save"):
            prepare(self.instructor, self.course, [self.lesson_op], token=read_only)

    @override_settings(AI_CONNECTOR_CHANGE_TTL_HOURS=1)
    def test_expired_change_cannot_be_applied(self):
        preview = prepare(self.instructor, self.course, [self.lesson_op])
        CourseChange.objects.filter(pk=preview["change_id"]).update(expires_at=timezone.now() - timedelta(minutes=1))
        with self.assertRaisesMessage(ConnectorError, "expired"):
            apply(self.instructor, preview["change_id"])

    def test_unsafe_html_is_removed_before_saving(self):
        preview = prepare(
            self.instructor, self.course,
            [{
                "op": "create_text_lesson",
                "module_id": self.course["module1"].id,
                "title": "Unsafe",
                "body_html": '<p onclick="steal()">Hi<script>alert(1)</script></p><a href="javascript:alert(1)">x</a><img src="x" onerror="bad()">',
            }],
        )
        stored = preview["operations"][0]["values"]["body_html"]
        for fragment in ("script", "onclick", "javascript:", "onerror"):
            self.assertNotIn(fragment, stored)
        apply(self.instructor, preview["change_id"])
        self.assertEqual(CurriculumNode.objects.get(title="Unsafe").properties["content"], stored)

    def test_malformed_and_unsupported_operations_are_rejected_with_guidance(self):
        cases = [
            ([{"op": "delete_lesson", "lesson_id": 1}], "unsupported op"),
            ([{"op": "add_questions", "quiz_lesson_id": self.course["quiz_node"].id,
               "questions": [{"type": "single_choice", "text": "Q", "options": ["A", "B"], "correct": 5}]}], "outside the 2 options"),
            ([{"op": "add_questions", "quiz_lesson_id": self.course["quiz_node"].id,
               "questions": [{"type": "matching", "text": "Q"}]}], "single_choice, multiple_choice or true_false"),
            ([{"op": "update_text_lesson", "lesson_id": self.course["quiz_node"].id, "title": "Nope nope"}], "not a text lesson"),
            ([{"op": "update_text_lesson", "lesson_id": CurriculumNode.objects.create(
                program=self.course["program"], parent=self.course["module1"], title="Package", node_type="Lesson",
                properties={"lesson_type": "scorm"}).id, "title": "Nope nope"}], "not a text lesson"),
            ([{"op": "update_module", "module_id": self.course["lesson"].id, "title": "X"}], "is a lesson, not a module"),
            ([self.lesson_op, self.lesson_op], "more than one operation"),
        ]
        other = make_course("BIO201")
        cases.append(([{"op": "update_module", "module_id": other["module1"].id, "title": "X"}], "not part of course"))
        for operations, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesMessage(ConnectorError, message):
                    prepare(self.instructor, self.course, operations)
        self.assertFalse(CourseChange.objects.exists())
