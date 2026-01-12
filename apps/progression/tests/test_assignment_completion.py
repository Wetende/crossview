from django.test import TestCase
from django.utils import timezone
from apps.core.models import User, Program
from apps.progression.models import Enrollment, NodeCompletion
from apps.curriculum.models import CurriculumNode
from apps.assessments.models import Assignment, AssignmentSubmission
from apps.progression.services import ProgressionEngine

class AssignmentCompletionTests(TestCase):
    def setUp(self):
        # Setup student
        self.student = User.objects.create_user(
            username='student@example.com',
            email='student@example.com',
            password='Password123!'
        )
        
        # Setup program
        self.program = Program.objects.create(name="Test Program", is_published=True)
        
        # Setup Assignment
        self.assignment = Assignment.objects.create(
            program=self.program,
            title="Test Assignment",
            weight=10,
            is_published=True
        )
        
        # Setup Curriculum Node linked to Assignment
        self.node = CurriculumNode.objects.create(
            program=self.program,
            node_type="Assignment",
            title="Assignment Node",
            completion_rules={
                "type": "assignment_pass", 
                "assignment_id": self.assignment.id,
                "min_score": 50
            }
        )
        
        # Setup Enrollment
        self.enrollment = Enrollment.objects.create(
            user=self.student,
            program=self.program
        )
        
        self.engine = ProgressionEngine()

    def test_failing_grade_does_not_complete_node(self):
        """Test that a score below min_score does not complete the node."""
        submission = AssignmentSubmission.objects.create(
            enrollment=self.enrollment,
            assignment=self.assignment,
            submitted_at=timezone.now(),
            score=40,  # Below 50
            status='graded'
        )
        
        # Trigger logic manually (simulating view call)
        self.engine.handle_assignment_grading(submission)
        
        # Verify no completion
        self.assertFalse(
            NodeCompletion.objects.filter(enrollment=self.enrollment, node=self.node).exists()
        )

    def test_passing_grade_completes_node(self):
        """Test that a score above min_score completes the node."""
        submission = AssignmentSubmission.objects.create(
            enrollment=self.enrollment,
            assignment=self.assignment,
            submitted_at=timezone.now(),
            score=60,  # Above 50
            status='graded'
        )
        
        # Trigger logic
        self.engine.handle_assignment_grading(submission)
        
        # Verify completion
        self.assertTrue(
            NodeCompletion.objects.filter(enrollment=self.enrollment, node=self.node).exists()
        )
        
    def test_late_penalty_affects_completion(self):
        """Test that late penalty can cause failure to complete if score drops below min."""
        # Enable penalty
        self.assignment.late_penalty_percent = 20
        self.assignment.save()
        
        # Score 60, but late -> 60 - (60*0.2) = 48. Below 50.
        submission = AssignmentSubmission.objects.create(
            enrollment=self.enrollment,
            assignment=self.assignment,
            submitted_at=timezone.now(),
            score=60,
            is_late=True,
            status='graded'
        )
        
        self.engine.handle_assignment_grading(submission)
        
        self.assertFalse(
            NodeCompletion.objects.filter(enrollment=self.enrollment, node=self.node).exists()
        )
