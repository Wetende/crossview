from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from apps.assessments.models import Question, Quiz, QuizAttempt
from apps.core.models import Program, User
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, NodeCompletion


class RegradeQuizAttemptsCommandTest(TestCase):
    def test_regrades_submitted_quiz_attempts_for_quiz(self):
        program = Program.objects.create(name="Regrade Program", code="REGR-101")
        node = CurriculumNode.objects.create(
            program=program,
            title="Unit 6 Quiz",
            node_type="quiz",
            properties={"lesson_type": "quiz"},
        )
        quiz = Quiz.objects.create(
            node=node,
            title="Unit 6 Knowledge Check",
            is_published=True,
            pass_threshold=70,
        )
        question = Question.objects.create(
            quiz=quiz,
            question_type="true_false",
            text="PR strategy matters.",
            points=1,
            position=0,
            answer_data={"correct": True},
        )
        student = User.objects.create_user(
            username="regrade.student",
            email="regrade.student@example.com",
            password="password123",
        )
        enrollment = Enrollment.objects.create(
            user=student,
            program=program,
            status="active",
        )
        attempt = QuizAttempt.objects.create(
            enrollment=enrollment,
            quiz=quiz,
            attempt_number=1,
            started_at=timezone.now(),
            submitted_at=timezone.now(),
            answers={str(question.id): "0"},
            points_earned=0,
            points_possible=1,
            score=0,
            passed=False,
        )

        output = StringIO()
        call_command(
            "regrade_quiz_attempts",
            "--quiz-id",
            str(quiz.id),
            stdout=output,
        )

        attempt.refresh_from_db()
        self.assertEqual(attempt.points_earned, 1)
        self.assertEqual(attempt.points_possible, 1)
        self.assertEqual(float(attempt.score), 100.0)
        self.assertTrue(attempt.passed)
        self.assertTrue(
            NodeCompletion.objects.filter(enrollment=enrollment, node=node).exists()
        )
        self.assertIn("updated=1", output.getvalue())
