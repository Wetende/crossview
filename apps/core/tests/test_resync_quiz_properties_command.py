from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from apps.assessments.models import Question, Quiz
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode


class ResyncQuizPropertiesCommandTest(TestCase):
    def test_true_false_questions_are_written_as_editor_indices(self):
        program = Program.objects.create(name="Resync Program", code="RSYNC-101")
        node = CurriculumNode.objects.create(
            program=program,
            title="Unit 6 Knowledge Check",
            node_type="quiz",
            properties={"lesson_type": "quiz", "questions": []},
        )
        quiz = Quiz.objects.create(
            node=node,
            title="Unit 6 Knowledge Check",
            is_published=True,
        )
        Question.objects.create(
            quiz=quiz,
            question_type="true_false",
            text="The correct answer is false.",
            points=1,
            position=0,
            answer_data={"correct": False},
        )

        call_command("resync_quiz_properties", stdout=StringIO())

        node.refresh_from_db()
        self.assertEqual(node.properties["questions"][0]["correct"], 1)

    def test_explanation_and_hint_are_written_back_to_the_builder(self):
        program = Program.objects.create(name="Resync Notes", code="RSYNC-102")
        node = CurriculumNode.objects.create(
            program=program,
            title="Explained check",
            node_type="quiz",
            properties={"lesson_type": "quiz", "questions": []},
        )
        quiz = Quiz.objects.create(node=node, title="Explained check")
        Question.objects.create(
            quiz=quiz,
            question_type="mcq",
            text="Pick one",
            position=0,
            answer_data={"correct": 0},
            explanation="<p>Because.</p>",
            hint="<p>Think.</p>",
        )

        call_command("resync_quiz_properties", stdout=StringIO())

        node.refresh_from_db()
        self.assertEqual(node.properties["questions"][0]["explanation"], "<p>Because.</p>")
        self.assertEqual(node.properties["questions"][0]["hint"], "<p>Think.</p>")
