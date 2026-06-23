from django.test import TestCase

from apps.assessments.models import Assignment, Quiz
from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program, User
from apps.curriculum.models import CurriculumNode
from apps.curriculum.services import CoursePublishValidationService
from apps.progression.models import InstructorAssignment


class ProgramValidationWeightedTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="inst",
            email="inst@test.com",
            password="password",
        )
        self.blueprint = AcademicBlueprint.objects.create(
            name="Weighted",
            hierarchy_structure=["Unit", "Session"],
            grading_logic={"type": "weighted", "components": []},
        )
        self.program = Program.objects.create(
            name="Test Program",
            code="TEST-101",
            blueprint=self.blueprint,
            description="desc",
            thumbnail="thumb.png",
            level="beginner",
            what_you_learn_html="<ul><li>Build a practical skill</li></ul>",
        )
        InstructorAssignment.objects.create(
            instructor=self.user,
            program=self.program,
        )

        self.validator = CoursePublishValidationService()

    def test_publish_validation_requires_assessment(self):
        CurriculumNode.objects.create(
            program=self.program,
            title="Lesson",
            node_type="Session",
            properties={"lesson_type": "text"},
        )

        result = self.validator.validate_for_publish(self.program)
        errors = result["errors"]

        self.assertTrue(
            any(error.get("type") == "missing_assessment" for error in errors)
        )

    def test_weighted_includes_quiz_nodes_by_lesson_type(self):
        CurriculumNode.objects.create(
            program=self.program,
            title="Lesson",
            node_type="Session",
            properties={"lesson_type": "text"},
        )
        node = CurriculumNode.objects.create(
            program=self.program,
            title="Quiz",
            node_type="Session",
            properties={
                "lesson_type": "quiz",
                "questions": [
                    {
                        "id": "q1",
                        "type": "mcq",
                        "text": "Question?",
                        "options": ["A", "B"],
                        "correct": 0,
                    }
                ],
            },
        )
        quiz = Quiz.objects.create(node=node, title="Quiz", weight=40)
        node.properties["quiz_id"] = quiz.id
        node.save(update_fields=["properties"])
        assignment = Assignment.objects.create(
            program=self.program,
            title="A1",
            description="d",
            instructions="i" * 120,
            weight=40,
        )
        CurriculumNode.objects.create(
            program=self.program,
            title="Assignment",
            node_type="Session",
            properties={
                "lesson_type": "assignment",
                "assignment_id": assignment.id,
                "assignment_mode": "submission_only",
                "typed_response_mode": "submission_text",
                "submission_type": "text",
                "assessment_prompt": "Write a short response.",
                "instructions": "i" * 120,
            },
        )

        result = self.validator.validate_for_publish(self.program)
        errors = result["errors"]
        self.assertEqual(result["details"]["total_assessment_weight"], 80)
        self.assertTrue(
            any(error.get("type") == "invalid_weight_sum" for error in errors)
        )

    def test_weighted_includes_quiz_nodes_by_canonical_lesson_type(self):
        CurriculumNode.objects.create(
            program=self.program,
            title="Lesson",
            node_type="Session",
            properties={"lesson_type": "text"},
        )
        node = CurriculumNode.objects.create(
            program=self.program,
            title="Quiz",
            node_type="Session",
            properties={
                "lesson_type": "quiz",
                "questions": [
                    {
                        "id": "q1",
                        "type": "mcq",
                        "text": "Question?",
                        "options": ["A", "B"],
                        "correct": 0,
                    }
                ],
            },
        )
        quiz = Quiz.objects.create(node=node, title="Quiz", weight=60)
        node.properties["quiz_id"] = quiz.id
        node.save(update_fields=["properties"])
        assignment = Assignment.objects.create(
            program=self.program,
            title="A1",
            description="d",
            instructions="i" * 120,
            weight=30,
        )
        CurriculumNode.objects.create(
            program=self.program,
            title="Assignment",
            node_type="Session",
            properties={
                "lesson_type": "assignment",
                "assignment_id": assignment.id,
                "assignment_mode": "submission_only",
                "typed_response_mode": "submission_text",
                "submission_type": "text",
                "assessment_prompt": "Write a short response.",
                "instructions": "i" * 120,
            },
        )

        result = self.validator.validate_for_publish(self.program)
        errors = result["errors"]
        self.assertEqual(result["details"]["total_assessment_weight"], 90)
        self.assertTrue(
            any(error.get("type") == "invalid_weight_sum" for error in errors)
        )

    def test_session_text_lesson_and_session_quiz_at_100_are_publish_ready(self):
        CurriculumNode.objects.create(
            program=self.program,
            title="Lesson 1: Types of Machine Learning",
            node_type="Session",
            properties={"lesson_type": "text"},
        )
        quiz_node = CurriculumNode.objects.create(
            program=self.program,
            title="Knowledge Check",
            node_type="Session",
            properties={
                "lesson_type": "quiz",
                "weight": 100,
                "questions": [
                    {
                        "id": "q1",
                        "type": "mcq",
                        "text": "What is machine learning?",
                        "options": ["A method", "A building"],
                        "correct": 0,
                    }
                ],
            },
        )
        quiz = Quiz.objects.create(node=quiz_node, title="Knowledge Check", weight=100)
        quiz_node.properties["quiz_id"] = quiz.id
        quiz_node.save(update_fields=["properties"])

        result = self.validator.validate_for_publish(self.program)

        self.assertTrue(result["is_valid"], result["errors"])
        self.assertEqual(result["details"]["lesson_count"], 1)
        self.assertEqual(result["details"]["quiz_count"], 1)
        self.assertEqual(result["details"]["total_assessment_weight"], 100)
