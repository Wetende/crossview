
import pytest
from apps.assessments.models import Quiz, Question, QuestionOption, QuestionMatchingPair, QuestionGapAnswer
from apps.curriculum.models import CurriculumNode
from apps.core.models import Program

@pytest.mark.django_db
class TestNewQuestionTypes:
    
    @pytest.fixture(autouse=True)
    def setup_data(self):
        # Create minimal required relationships
        self.program = Program.objects.create(name="Test Program")
        self.node = CurriculumNode.objects.create(program=self.program, title="Test Node", node_type='lesson')
        self.quiz = Quiz.objects.create(node=self.node, title="Test Quiz", pass_threshold=70)

    def test_matching_question_full_correct(self):
        q = Question.objects.create(
            quiz=self.quiz, 
            question_type='matching', 
            points=10, 
            text="Match items",
            answer_data={}
        )
        QuestionMatchingPair.objects.create(question=q, left_text="A", right_text="1", position=0)
        QuestionMatchingPair.objects.create(question=q, left_text="B", right_text="2", position=1)
        
        # Student answers: { "A": "1", "B": "2" }
        student_answer = {"A": "1", "B": "2"}
        is_correct, points = q.check_answer(student_answer)
        
        assert is_correct is True
        assert points == 10

    def test_matching_question_partial_credit(self):
        q = Question.objects.create(
            quiz=self.quiz, 
            question_type='matching', 
            points=10, 
            text="Match items",
            answer_data={}
        )
        QuestionMatchingPair.objects.create(question=q, left_text="A", right_text="1", position=0)
        QuestionMatchingPair.objects.create(question=q, left_text="B", right_text="2", position=1)
        
        # 1 correct, 1 wrong
        student_answer = {"A": "1", "B": "3"}
        is_correct, points = q.check_answer(student_answer)
        
        assert is_correct is False
        assert points == 5

    def test_fill_blank_case_insensitive(self):
        q = Question.objects.create(
            quiz=self.quiz, 
            question_type='fill_blank', 
            points=10, 
            text="Roses are {{blank}}",
            answer_data={}
        )
        QuestionGapAnswer.objects.create(question=q, gap_index=0, accepted_answers=["Red", "Pink"])
        
        # Exact match
        is_correct, points = q.check_answer({"0": "Red"})
        assert is_correct is True
        assert points == 10
        
        # Case insensitive
        is_correct, points = q.check_answer({"0": "red"})
        assert is_correct is True
        
        # Wrong
        is_correct, points = q.check_answer({"0": "Blue"})
        assert is_correct is False
        assert points == 0

    def test_fill_blank_multiple_gaps(self):
        q = Question.objects.create(
            quiz=self.quiz, 
            question_type='fill_blank', 
            points=10, 
            text="{{blank}} and {{blank}}",
            answer_data={}
        )
        QuestionGapAnswer.objects.create(question=q, gap_index=0, accepted_answers=["A"])
        QuestionGapAnswer.objects.create(question=q, gap_index=1, accepted_answers=["B"])
        
        # Half correct
        is_correct, points = q.check_answer({"0": "A", "1": "C"})
        assert is_correct is False
        assert points == 5

    def test_ordering_correct_sequence(self):
        q = Question.objects.create(
            quiz=self.quiz,
            question_type='ordering', 
            points=10, 
            text="Order steps",
            answer_data={"correct_order": ["Step 1", "Step 2", "Step 3"]}
        )
        
        # Correct
        is_correct, points = q.check_answer(["Step 1", "Step 2", "Step 3"])
        assert is_correct is True
        assert points == 10
        
        # Incorrect order
        is_correct, points = q.check_answer(["Step 2", "Step 1", "Step 3"])
        assert is_correct is False
        assert points == 0

    def test_mcq_multi_all_correct(self):
        q = Question.objects.create(
            quiz=self.quiz, 
            question_type='mcq_multi', 
            points=10, 
            text="Select evens",
            answer_data={}
        )
        opt0 = QuestionOption.objects.create(question=q, text="1", is_correct=False, position=0)
        opt1 = QuestionOption.objects.create(question=q, text="2", is_correct=True, position=1)
        opt2 = QuestionOption.objects.create(question=q, text="3", is_correct=False, position=2)
        opt3 = QuestionOption.objects.create(question=q, text="4", is_correct=True, position=3)
        
        # Correct indices: 1, 3
        # Student sends indices [1, 3]
        is_correct, points = q.check_answer([1, 3])
        assert is_correct is True
        
        # Missing one
        is_correct, points = q.check_answer([1])
        assert is_correct is False
        assert points == 0
