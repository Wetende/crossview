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
