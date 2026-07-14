from django.test import TestCase
from django.utils import timezone

from apps.assessments.models import (
    Question,
    QuestionMatchingPair,
    QuestionOption,
    Quiz,
    QuizAttempt,
)
from apps.assessments.official_results import can_start_quiz_attempt
from apps.assessments.quiz_results import build_quiz_results_payload
from apps.assessments.student_payloads import sanitize_assessment_properties
from apps.core.models import Program, User
from apps.core.views import (
    _ensure_quiz_attempt_runtime_state,
    _serialize_quiz_questions_for_attempt,
)
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment


class QuizMasteryPolicyTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="mastery.student",
            email="mastery.student@test.com",
            password="password123",
        )
        self.program = Program.objects.create(name="Mastery", code="MASTERY")
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status="active",
        )
        self.node = CurriculumNode.objects.create(
            program=self.program,
            title="Mastery Quiz",
            node_type="Quiz",
            properties={
                "lesson_type": "quiz",
                "quiz_attempt_history": True,
            },
            is_published=True,
        )
        self.quiz = Quiz.objects.create(
            node=self.node,
            title="Mastery Quiz",
            max_attempts=3,
            pass_threshold=70,
            is_published=True,
        )
        self.node.properties["quiz_id"] = self.quiz.id
        self.node.save(update_fields=["properties"])
        self.question = Question.objects.create(
            quiz=self.quiz,
            question_type="mcq",
            text="Choose the correct answer",
            points=1,
            position=0,
            answer_data={"correct": 0},
        )
        self.correct_option = QuestionOption.objects.create(
            question=self.question,
            text="Correct",
            is_correct=True,
            position=0,
        )
        self.wrong_option = QuestionOption.objects.create(
            question=self.question,
            text="Wrong",
            is_correct=False,
            position=1,
        )

    def create_attempt(self, number, *, passed, score, option):
        return QuizAttempt.objects.create(
            enrollment=self.enrollment,
            quiz=self.quiz,
            attempt_number=number,
            started_at=timezone.now(),
            submitted_at=timezone.now(),
            answers={str(self.question.id): str(option.id)},
            points_earned=1 if passed else 0,
            points_possible=1,
            score=score,
            passed=passed,
        )

    def test_attempt_quota_is_not_erased_by_pass_policy_lock(self):
        self.create_attempt(
            1,
            passed=True,
            score=87,
            option=self.correct_option,
        )

        eligibility = can_start_quiz_attempt(self.quiz, self.enrollment)
        self.assertTrue(eligibility.allowed)
        self.assertEqual(eligibility.attempts_remaining, 2)
        self.assertIsNone(eligibility.lock_reason)

        self.quiz.allow_retake_after_pass = False
        self.quiz.save(update_fields=["allow_retake_after_pass"])
        eligibility = can_start_quiz_attempt(self.quiz, self.enrollment)
        self.assertFalse(eligibility.allowed)
        self.assertEqual(eligibility.attempts_remaining, 2)
        self.assertEqual(eligibility.lock_reason, "passed_retake_disabled")

    def test_max_attempt_lock_reports_exhausted_quota(self):
        for number in range(1, 4):
            self.create_attempt(
                number,
                passed=False,
                score=0,
                option=self.wrong_option,
            )

        eligibility = can_start_quiz_attempt(self.quiz, self.enrollment)
        self.assertFalse(eligibility.allowed)
        self.assertEqual(eligibility.attempts_remaining, 0)
        self.assertEqual(eligibility.lock_reason, "max_attempts_reached")

    def test_release_policy_handles_each_pass_final_and_never(self):
        failed_attempt = self.create_attempt(
            1,
            passed=False,
            score=0,
            option=self.wrong_option,
        )

        self.quiz.answer_release_policy = Quiz.AnswerReleasePolicy.AFTER_PASS_OR_FINAL
        self.quiz.save(update_fields=["answer_release_policy"])
        payload = build_quiz_results_payload(
            quiz=self.quiz,
            enrollment=self.enrollment,
        )
        self.assertFalse(payload["correctAnswersReleased"])
        self.assertIsNone(payload["questionReview"][0]["correctAnswer"])

        self.create_attempt(
            2,
            passed=True,
            score=100,
            option=self.correct_option,
        )
        payload = build_quiz_results_payload(
            quiz=self.quiz,
            enrollment=self.enrollment,
            selected_attempt_id=failed_attempt.id,
        )
        self.assertTrue(payload["correctAnswersReleased"])
        self.assertEqual(payload["questionReview"][0]["correctAnswer"], "Correct")

        self.quiz.answer_release_policy = Quiz.AnswerReleasePolicy.NEVER
        self.quiz.save(update_fields=["answer_release_policy"])
        payload = build_quiz_results_payload(
            quiz=self.quiz,
            enrollment=self.enrollment,
        )
        self.assertFalse(payload["correctAnswersReleased"])

        self.quiz.answer_release_policy = Quiz.AnswerReleasePolicy.AFTER_EACH_ATTEMPT
        self.quiz.save(update_fields=["answer_release_policy"])
        payload = build_quiz_results_payload(
            quiz=self.quiz,
            enrollment=self.enrollment,
        )
        self.assertTrue(payload["correctAnswersReleased"])

    def test_after_final_policy_releases_when_numeric_limit_is_used(self):
        self.quiz.max_attempts = 1
        self.quiz.answer_release_policy = Quiz.AnswerReleasePolicy.AFTER_FINAL_ATTEMPT
        self.quiz.save(update_fields=["max_attempts", "answer_release_policy"])
        self.create_attempt(
            1,
            passed=False,
            score=0,
            option=self.wrong_option,
        )

        payload = build_quiz_results_payload(
            quiz=self.quiz,
            enrollment=self.enrollment,
        )
        self.assertTrue(payload["correctAnswersReleased"])
        self.assertEqual(payload["retryLockReason"], "max_attempts_reached")

    def test_results_review_latest_attempt_but_keep_best_official_score(self):
        best = self.create_attempt(
            1,
            passed=True,
            score=100,
            option=self.correct_option,
        )
        latest = self.create_attempt(
            2,
            passed=False,
            score=0,
            option=self.wrong_option,
        )
        self.quiz.answer_release_policy = Quiz.AnswerReleasePolicy.AFTER_EACH_ATTEMPT
        self.quiz.save(update_fields=["answer_release_policy"])

        payload = build_quiz_results_payload(
            quiz=self.quiz,
            enrollment=self.enrollment,
        )

        self.assertEqual(payload["reviewedAttempt"]["id"], latest.id)
        self.assertEqual(payload["officialAttempt"]["id"], best.id)
        self.assertEqual(payload["officialAttempt"]["score"], 100.0)
        self.assertEqual(payload["questionReview"][0]["studentAnswer"], "Wrong")

    def test_invalid_attempt_selection_falls_back_to_latest_authorized_attempt(self):
        latest = self.create_attempt(
            1,
            passed=False,
            score=0,
            option=self.wrong_option,
        )

        payload = build_quiz_results_payload(
            quiz=self.quiz,
            enrollment=self.enrollment,
            selected_attempt_id=999999,
        )

        self.assertEqual(payload["reviewedAttempt"]["id"], latest.id)

    def test_student_payload_removes_linked_quiz_authoring_answers(self):
        payload = sanitize_assessment_properties(
            {
                "lesson_type": "quiz",
                "quiz_id": self.quiz.id,
                "questions": [{"correct": 0}],
                "question_banks": [{"id": 1}],
            }
        )

        self.assertEqual(payload["lesson_type"], "quiz")
        self.assertNotIn("questions", payload)
        self.assertNotIn("question_banks", payload)

    def test_runtime_payload_never_serializes_matching_or_ordering_answers(self):
        self.quiz.shuffle_options = True
        self.quiz.save(update_fields=["shuffle_options"])
        matching = Question.objects.create(
            quiz=self.quiz,
            question_type="matching",
            text="Match the items",
            points=2,
            position=1,
            answer_data={},
        )
        QuestionMatchingPair.objects.create(
            question=matching,
            left_text="One",
            right_text="1",
            position=0,
        )
        QuestionMatchingPair.objects.create(
            question=matching,
            left_text="Two",
            right_text="2",
            position=1,
        )
        Question.objects.create(
            quiz=self.quiz,
            question_type="ordering",
            text="Order the items",
            points=2,
            position=2,
            answer_data={"items": ["First", "Second", "Third"]},
        )
        attempt = QuizAttempt.objects.create(
            enrollment=self.enrollment,
            quiz=self.quiz,
            attempt_number=1,
            started_at=timezone.now(),
        )

        runtime_state = _ensure_quiz_attempt_runtime_state(self.quiz, attempt)
        first_payload = _serialize_quiz_questions_for_attempt(
            self.quiz,
            attempt,
            runtime_state,
        )
        second_payload = _serialize_quiz_questions_for_attempt(
            self.quiz,
            attempt,
            _ensure_quiz_attempt_runtime_state(self.quiz, attempt),
        )
        by_type = {question["type"]: question for question in first_payload}

        self.assertCountEqual(
            [option["id"] for option in by_type["mcq"]["options"]],
            [self.correct_option.id, self.wrong_option.id],
        )
        self.assertNotEqual(
            [pair["right_text"] for pair in by_type["matching"]["pairs"]],
            ["1", "2"],
        )
        self.assertNotEqual(
            by_type["ordering"]["items"],
            ["First", "Second", "Third"],
        )
        self.assertEqual(first_payload, second_payload)
