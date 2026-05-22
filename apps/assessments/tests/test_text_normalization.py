from django.test import TestCase

from apps.assessments.models import Quiz
from apps.assessments.serializers import QuestionSerializer
from apps.assessments.text_normalization import (
    normalize_assessment_text,
    normalize_question_answer_data,
)
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode


class AssessmentTextNormalizationTests(TestCase):
    def setUp(self):
        self.program = Program.objects.create(name="Normalization Program", code="NORM-101")
        self.node = CurriculumNode.objects.create(
            program=self.program,
            title="Normalization Quiz Node",
            node_type="quiz",
            properties={},
        )
        self.quiz = Quiz.objects.create(node=self.node, title="Normalization Quiz")

    def test_normalize_assessment_text_decodes_entities(self):
        self.assertEqual(
            normalize_assessment_text("<p>Define&nbsp;public&#39;s&nbsp;role</p>"),
            "Define public's role",
        )

    def test_normalize_question_answer_data_cleans_known_text_lists(self):
        self.assertEqual(
            normalize_question_answer_data(
                "ordering",
                {
                    "items": ["First&nbsp;step", "Second&#39;s step"],
                    "explanations": {"0": "Do&nbsp;this", "1": "Don&#39;t skip"},
                },
            ),
            {
                "items": ["First step", "Second's step"],
                "explanations": {"0": "Do this", "1": "Don't skip"},
            },
        )

    def test_normalize_question_answer_data_promotes_legacy_correct_order(self):
        self.assertEqual(
            normalize_question_answer_data(
                "ordering",
                {"correct_order": ["First&nbsp;step", "Second&#39;s step"]},
            )["items"],
            ["First step", "Second's step"],
        )

    def test_question_serializer_normalizes_question_and_nested_text(self):
        serializer = QuestionSerializer(
            data={
                "quiz": self.quiz.id,
                "question_type": "mcq",
                "text": "<p>Define&nbsp;public&nbsp;relations&#39;&nbsp;role</p>",
                "points": 1,
                "position": 0,
                "answer_data": {
                    "options": ["Option&nbsp;A", "Option&#39;B"],
                    "correct": 0,
                },
                "options": [
                    {"text": "Option&nbsp;A", "is_correct": True, "position": 0},
                    {"text": "Option&#39;B", "is_correct": False, "position": 1},
                ],
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        question = serializer.save()

        self.assertEqual(question.text, "Define public relations' role")
        self.assertEqual(
            question.answer_data,
            {"options": ["Option A", "Option'B"], "correct": 0},
        )
        self.assertEqual(
            list(question.options.order_by("position").values_list("text", flat=True)),
            ["Option A", "Option'B"],
        )
