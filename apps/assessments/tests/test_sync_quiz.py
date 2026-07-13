
from django.test import TestCase
from apps.core.models import Program, User
from apps.curriculum.models import CurriculumNode
from apps.assessments.models import Quiz, Question, QuestionGapAnswer, QuestionImageMatchingPair
from apps.core.views import _sync_quiz_questions

class SyncQuizQuestionsTest(TestCase):
    def setUp(self):
        # Setup basic requirements
        self.user = User.objects.create_user(username='instructor', email='inst@test.com', password='password')
        self.program = Program.objects.create(name="Test Program", code="TEST-101")
        self.program.instructors.add(self.user)
        self.node = CurriculumNode.objects.create(
            program=self.program,
            title="Test Quiz Node",
            node_type="quiz",
            properties={}
        )

    def test_sync_fill_blank_question(self):
        """
        Test that fill_blank questions correctly save gaps.
        """
        questions_data = [
            {
                "id": "temp_1",
                "type": "fill_blank",
                "text": "The capital of France is {{blank}}.",
                "points": 5,
                "gaps": [
                    {
                        "gap_index": 0,
                        "accepted_answers": ["Paris", "paris"]
                    }
                ]
            }
        ]

        _sync_quiz_questions(self.node, questions_data)

        # Verify Quiz created
        quiz = Quiz.objects.get(node=self.node)
        self.assertEqual(quiz.questions.count(), 1)

        # Verify Question created
        question = quiz.questions.first()
        self.assertEqual(question.question_type, "fill_blank")
        self.assertEqual(question.text, "The capital of France is {{blank}}.")

        # Verify Gaps created
        gaps = QuestionGapAnswer.objects.filter(question=question)
        self.assertEqual(gaps.count(), 1, "Should create 1 gap answer record")
        
        gap = gaps.first()
        if gap:
            self.assertEqual(gap.gap_index, 0)
            self.assertIn("Paris", gap.accepted_answers)

    def test_sync_ordering_question(self):
        """
        Test that ordering questions correctly save items.
        """
        questions_data = [
            {
                "id": "temp_2",
                "type": "ordering",
                "text": "Order the numbers",
                "points": 3,
                "items": ["One", "Two", "Three"],  # The correct order
            }
        ]

        _sync_quiz_questions(self.node, questions_data)

        quiz = Quiz.objects.get(node=self.node)
        question = quiz.questions.first()
        
        self.assertEqual(question.question_type, "ordering")
        self.assertEqual(question.answer_data.get("items"), ["One", "Two", "Three"])

    def test_sync_all_quiz_settings(self):
        """
        Test that builder-visible quiz settings are synced to Quiz model.
        """
        self.node.properties = {
            "passing_grade": 85,
            "quiz_duration": 45,
            "max_attempts": 3,
            "randomize_questions": True,
            "randomize_answers": True,
            "show_correct_answer": True,
            "answer_release_policy": "after_pass_or_final",
            "retake_after_pass": True,
            "quiz_style": "pagination",
            "quiz_attempt_history": True,
            "retake_penalty": 5,
            "points_cut_after_retake": 15,
            "weight": 40,
            "description": "Test quiz description",
            "questions": [
                {
                    "id": "temp_1",
                    "type": "mcq",
                    "text": "Sample question",
                    "points": 10,
                    "options": ["A", "B", "C"],
                    "correct": 0
                }
            ]
        }
        self.node.save()

        _sync_quiz_questions(self.node, self.node.properties.get("questions", []))

        quiz = Quiz.objects.get(node=self.node)

        self.assertEqual(quiz.pass_threshold, 85)
        self.assertEqual(quiz.time_limit_minutes, 45)
        self.assertEqual(quiz.max_attempts, 3)
        self.assertTrue(quiz.randomize_questions)
        self.assertEqual(quiz.weight, 40)
        self.assertEqual(quiz.description, "Test quiz description")
        self.assertTrue(quiz.shuffle_options)
        self.assertTrue(quiz.show_answers_after_submit)
        self.assertEqual(
            quiz.answer_release_policy,
            Quiz.AnswerReleasePolicy.AFTER_PASS_OR_FINAL,
        )
        self.assertTrue(quiz.allow_retake_after_pass)
        self.assertEqual(float(quiz.retake_penalty_percent), 0.0)

        self.node.refresh_from_db()
        self.assertEqual((self.node.properties or {}).get("quiz_id"), quiz.id)

    def test_sync_settings_when_questions_are_empty(self):
        self.node.properties = {
            "passing_grade": 60,
            "quiz_duration": 10,
            "max_attempts": 2,
            "randomize_questions": False,
            "randomize_answers": False,
            "show_correct_answer": False,
            "retake_penalty": 12,
            "questions": [
                {
                    "id": "temp_existing",
                    "type": "mcq",
                    "text": "Keep?",
                    "points": 1,
                    "options": ["A", "B"],
                    "correct": 0,
                }
            ],
        }
        self.node.save()
        _sync_quiz_questions(self.node, self.node.properties.get("questions", []))

        quiz = Quiz.objects.get(node=self.node)
        self.assertEqual(quiz.questions.count(), 1)

        self.node.properties.update(
            {
                "passing_grade": 92,
                "quiz_duration": 30,
                "max_attempts": 4,
                "randomize_questions": True,
                "randomize_answers": True,
                "show_correct_answer": True,
                "retake_penalty": 7,
                "questions": [],
            }
        )
        self.node.save(update_fields=["properties"])

        _sync_quiz_questions(self.node, [])

        quiz.refresh_from_db()
        self.assertEqual(quiz.pass_threshold, 92)
        self.assertEqual(quiz.time_limit_minutes, 30)
        self.assertEqual(quiz.max_attempts, 4)
        self.assertTrue(quiz.randomize_questions)
        self.assertTrue(quiz.shuffle_options)
        self.assertTrue(quiz.show_answers_after_submit)
        self.assertEqual(float(quiz.retake_penalty_percent), 0.0)
        self.assertEqual(quiz.questions.count(), 0)

    def test_sync_defaults_retake_after_pass_to_true_when_unspecified(self):
        self.node.properties = {
            "passing_grade": 70,
            "max_attempts": 3,
            "questions": [
                {
                    "id": "temp_1",
                    "type": "mcq",
                    "text": "Sample question",
                    "points": 1,
                    "options": ["A", "B"],
                    "correct": 0,
                }
            ],
        }
        self.node.save(update_fields=["properties"])

        _sync_quiz_questions(self.node, self.node.properties.get("questions", []))

        quiz = Quiz.objects.get(node=self.node)
        self.assertTrue(quiz.allow_retake_after_pass)
        self.assertEqual(
            quiz.answer_release_policy,
            Quiz.AnswerReleasePolicy.AFTER_PASS_OR_FINAL,
        )

    def test_sync_true_false_stores_boolean_but_preserves_editor_index(self):
        self.node.properties = {
            "questions": [
                {
                    "id": "temp_tf_1",
                    "type": "true_false",
                    "text": "PR strategy matters.",
                    "points": 1,
                    "correct": 0,
                }
            ],
        }
        self.node.save(update_fields=["properties"])

        _sync_quiz_questions(self.node, self.node.properties.get("questions", []))

        quiz = Quiz.objects.get(node=self.node)
        question = quiz.questions.get()
        self.assertIs(question.answer_data.get("correct"), True)

        self.node.refresh_from_db()
        self.assertEqual(self.node.properties["questions"][0]["correct"], 0)

        self.node.properties["questions"][0]["correct"] = 1
        self.node.save(update_fields=["properties"])
        _sync_quiz_questions(self.node, self.node.properties.get("questions", []))

        question.refresh_from_db()
        self.assertIs(question.answer_data.get("correct"), False)

        self.node.refresh_from_db()
        self.assertEqual(self.node.properties["questions"][0]["correct"], 1)

    def test_sync_image_matching_question_creates_pairs(self):
        questions_data = [
            {
                "id": "temp_img_1",
                "type": "image_matching",
                "text": "Match images",
                "points": 4,
                "image_pairs": [
                    {
                        "question_text": "Dog",
                        "question_image": "/media/quiz_images/1/1/dog.png",
                        "answer_text": "Bark",
                        "answer_image": "/media/quiz_images/1/1/bark.png",
                        "explanation": "Dogs bark",
                        "position": 0,
                    },
                    {
                        "question_text": "Cat",
                        "question_image": "/media/quiz_images/1/1/cat.png",
                        "answer_text": "Meow",
                        "answer_image": "/media/quiz_images/1/1/meow.png",
                        "explanation": "Cats meow",
                        "position": 1,
                    },
                ],
            }
        ]

        _sync_quiz_questions(self.node, questions_data)

        quiz = Quiz.objects.get(node=self.node)
        self.assertEqual(quiz.questions.count(), 1)
        q = quiz.questions.first()
        self.assertEqual(q.question_type, "image_matching")

        pairs = QuestionImageMatchingPair.objects.filter(question=q).order_by("position")
        self.assertEqual(pairs.count(), 2)
        self.assertEqual(pairs[0].question_text, "Dog")
        self.assertEqual(pairs[0].answer_text, "Bark")
