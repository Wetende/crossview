from decimal import Decimal

from django.test import TestCase

from apps.assessments.models import (
    Question,
    QuestionGapAnswer,
    QuestionMatchingPair,
    QuestionOption,
    Quiz,
)
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode


class QuestionCheckAnswerTest(TestCase):
    def setUp(self):
        self.program = Program.objects.create(name="Grading Program", code="GRADING-101")
        self.node = CurriculumNode.objects.create(
            program=self.program,
            title="Quiz Node",
            node_type="Session",
            properties={"lesson_type": "quiz"},
        )
        self.quiz = Quiz.objects.create(node=self.node, title="Grading Quiz")

    def test_ordering_requires_items_array(self):
        question = Question.objects.create(
            quiz=self.quiz,
            question_type="ordering",
            text="Order steps",
            points=3,
            position=0,
            answer_data={"correct_order": ["Step 1", "Step 2"]},
        )

        is_correct, points = question.check_answer(["Step 1", "Step 2"])

        self.assertFalse(is_correct)
        self.assertEqual(points, 0)

    def test_mcq_accepts_option_position_or_id(self):
        question = Question.objects.create(
            quiz=self.quiz,
            question_type="mcq",
            text="Pick one",
            points=1,
            position=0,
            answer_data={},
        )
        QuestionOption.objects.create(
            question=question,
            text="A",
            is_correct=False,
            position=0,
        )
        correct_option = QuestionOption.objects.create(
            question=question,
            text="B",
            is_correct=True,
            position=1,
        )

        by_position, position_points = question.check_answer(1)
        by_option_id, id_points = question.check_answer(str(correct_option.id))

        self.assertTrue(by_position)
        self.assertEqual(position_points, 1)
        self.assertTrue(by_option_id)
        self.assertEqual(id_points, 1)

    def test_mcq_multi_accepts_option_positions_or_ids(self):
        question = Question.objects.create(
            quiz=self.quiz,
            question_type="mcq_multi",
            text="Pick all that apply",
            points=2,
            position=1,
            answer_data={},
        )
        QuestionOption.objects.create(
            question=question,
            text="A",
            is_correct=False,
            position=0,
        )
        correct_option = QuestionOption.objects.create(
            question=question,
            text="B",
            is_correct=True,
            position=1,
        )
        QuestionOption.objects.create(
            question=question,
            text="C",
            is_correct=False,
            position=2,
        )

        by_position, position_points = question.check_answer([1])
        by_option_id, id_points = question.check_answer([str(correct_option.id)])

        self.assertTrue(by_position)
        self.assertEqual(position_points, 2)
        self.assertTrue(by_option_id)
        self.assertEqual(id_points, 2)

    def test_mcq_without_options_fails_closed(self):
        question = Question.objects.create(
            quiz=self.quiz,
            question_type="mcq",
            text="No options",
            points=1,
            position=2,
            answer_data={"correct": 0},
        )

        is_correct, points = question.check_answer(0)

        self.assertFalse(is_correct)
        self.assertEqual(points, 0)

    def test_mcq_multi_awards_penalized_partial_credit(self):
        question = Question.objects.create(
            quiz=self.quiz,
            question_type="mcq_multi",
            text="Pick all that apply",
            points=6,
            position=3,
            answer_data={},
        )
        QuestionOption.objects.create(
            question=question,
            text="A",
            is_correct=True,
            position=0,
        )
        QuestionOption.objects.create(
            question=question,
            text="B",
            is_correct=True,
            position=1,
        )
        QuestionOption.objects.create(
            question=question,
            text="C",
            is_correct=True,
            position=2,
        )
        QuestionOption.objects.create(
            question=question,
            text="D",
            is_correct=False,
            position=3,
        )

        is_correct, points = question.check_answer([0, 1, 3])

        self.assertFalse(is_correct)
        self.assertEqual(points, Decimal("2.00"))

    def test_ordering_awards_partial_credit_by_correct_position(self):
        question = Question.objects.create(
            quiz=self.quiz,
            question_type="ordering",
            text="Order the steps",
            points=3,
            position=4,
            answer_data={"items": ["First", "Second", "Third"]},
        )

        is_correct, points = question.check_answer(["Third", "Second", "First"])

        self.assertFalse(is_correct)
        self.assertEqual(points, Decimal("1.00"))

    def test_matching_awards_fractional_partial_credit(self):
        question = Question.objects.create(
            quiz=self.quiz,
            question_type="matching",
            text="Match them",
            points=2,
            position=5,
            answer_data={},
        )
        QuestionMatchingPair.objects.create(
            question=question,
            left_text="One",
            right_text="1",
            position=0,
        )
        QuestionMatchingPair.objects.create(
            question=question,
            left_text="Two",
            right_text="2",
            position=1,
        )
        QuestionMatchingPair.objects.create(
            question=question,
            left_text="Three",
            right_text="3",
            position=2,
        )
        QuestionMatchingPair.objects.create(
            question=question,
            left_text="Four",
            right_text="4",
            position=3,
        )

        is_correct, points = question.check_answer(
            {"One": "1", "Two": "2", "Three": "3", "Four": "wrong"}
        )

        self.assertFalse(is_correct)
        self.assertEqual(points, Decimal("1.50"))

    def test_fill_blank_awards_fractional_partial_credit(self):
        question = Question.objects.create(
            quiz=self.quiz,
            question_type="fill_blank",
            text="Complete the sentence",
            points=2,
            position=6,
            answer_data={},
        )
        QuestionGapAnswer.objects.create(
            question=question,
            gap_index=0,
            accepted_answers=["Paris"],
        )
        QuestionGapAnswer.objects.create(
            question=question,
            gap_index=1,
            accepted_answers=["Madrid"],
        )
        QuestionGapAnswer.objects.create(
            question=question,
            gap_index=2,
            accepted_answers=["Rome"],
        )
        QuestionGapAnswer.objects.create(
            question=question,
            gap_index=3,
            accepted_answers=["Berlin"],
        )

        is_correct, points = question.check_answer(
            {"0": "Paris", "1": "Madrid", "2": "Rome", "3": "wrong"}
        )

        self.assertFalse(is_correct)
        self.assertEqual(points, Decimal("1.50"))
