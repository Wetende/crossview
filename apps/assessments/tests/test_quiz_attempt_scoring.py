from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.assessments.models import Question, QuestionOption, Quiz, QuizAttempt
from apps.core.models import Program, User
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment


class QuizAttemptScoringTest(TestCase):
    def setUp(self):
        self.program = Program.objects.create(name="Penalty Program", code="PEN-101")
        self.node = CurriculumNode.objects.create(
            program=self.program,
            title="Penalty Quiz Node",
            node_type="Session",
            properties={"lesson_type": "quiz"},
        )
        self.quiz = Quiz.objects.create(
            node=self.node,
            title="Penalty Quiz",
            pass_threshold=70,
            retake_penalty_percent=Decimal("10.00"),
        )
        self.question = Question.objects.create(
            quiz=self.quiz,
            question_type="mcq",
            text="Pick one",
            points=1,
            position=0,
            answer_data={},
        )
        self.correct_option = QuestionOption.objects.create(
            question=self.question,
            text="Correct",
            is_correct=True,
            position=0,
        )
        QuestionOption.objects.create(
            question=self.question,
            text="Wrong",
            is_correct=False,
            position=1,
        )
        self.student = User.objects.create_user(
            username="penalty.student",
            email="penalty.student@test.com",
            password="password123",
        )
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program,
            status="active",
        )

    def _build_attempt(self, attempt_number, answer_value):
        return QuizAttempt.objects.create(
            enrollment=self.enrollment,
            quiz=self.quiz,
            attempt_number=attempt_number,
            started_at=timezone.now(),
            answers={str(self.question.id): answer_value},
        )

    def test_first_attempt_scores_from_actual_points(self):
        attempt = self._build_attempt(1, self.correct_option.position)

        points, possible, percentage, passed = attempt.calculate_score()

        self.assertEqual(points, 1)
        self.assertEqual(possible, 1)
        self.assertEqual(percentage, 100.0)
        self.assertTrue(passed)

    def test_second_attempt_keeps_full_score_when_answers_are_correct(self):
        attempt = self._build_attempt(2, self.correct_option.position)

        _, _, percentage, passed = attempt.calculate_score()

        self.assertEqual(percentage, 100.0)
        self.assertTrue(passed)

    def test_pass_fail_uses_actual_score_without_hidden_penalty(self):
        self.quiz.pass_threshold = 95
        self.quiz.save(update_fields=["pass_threshold"])
        attempt = self._build_attempt(2, self.correct_option.position)

        _, _, percentage, passed = attempt.calculate_score()

        self.assertEqual(percentage, 100.0)
        self.assertTrue(passed)

    def test_legacy_penalty_values_no_longer_reduce_scores(self):
        self.quiz.retake_penalty_percent = Decimal("60.00")
        self.quiz.save(update_fields=["retake_penalty_percent"])
        attempt = self._build_attempt(3, self.correct_option.position)

        _, _, percentage, passed = attempt.calculate_score()

        self.assertEqual(percentage, 100.0)
        self.assertTrue(passed)
