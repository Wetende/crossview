"""
Assessment models - Grading strategies and results.
"""
from django.db import models
from typing import Optional


class AssessmentResult(models.Model):
    """
    Stores the outcome of a student's assessment for a specific curriculum node.
    Contains component scores, calculated total, status, and letter grade in result_data JSON.
    """
    enrollment = models.ForeignKey(
        'progression.Enrollment',
        on_delete=models.CASCADE,
        related_name='assessment_results'
    )
    node = models.ForeignKey(
        'curriculum.CurriculumNode',
        on_delete=models.CASCADE,
        related_name='assessment_results'
    )
    result_data = models.JSONField()
    lecturer_comments = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    graded_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_results'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assessment_results'
        constraints = [
            models.UniqueConstraint(
                fields=['enrollment', 'node'],
                name='unique_enrollment_node_result'
            )
        ]
        indexes = [
            models.Index(fields=['node', 'is_published'], name='results_node_published_idx'),
        ]

    def __str__(self):
        return f"Result: {self.enrollment} - {self.node}"

    def get_total(self) -> Optional[float]:
        """Get the calculated total score from result_data."""
        return self.result_data.get('total') if self.result_data else None

    def get_status(self) -> Optional[str]:
        """Get the result status (Pass, Fail, Competent, etc.) from result_data."""
        return self.result_data.get('status') if self.result_data else None

    def get_letter_grade(self) -> Optional[str]:
        """Get the letter grade from result_data (if applicable)."""
        return self.result_data.get('letter_grade') if self.result_data else None

    def get_components(self) -> dict:
        """Get the component scores from result_data."""
        return self.result_data.get('components', {}) if self.result_data else {}


class Quiz(models.Model):
    """
    Quiz attached to a lesson/session node.
    Each lesson can have one or more quizzes for knowledge checks.
    """
    node = models.ForeignKey(
        'curriculum.CurriculumNode',
        on_delete=models.CASCADE,
        related_name='quizzes'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)
    max_attempts = models.PositiveIntegerField(default=1)
    pass_threshold = models.PositiveIntegerField(default=70)  # Percentage
    
    # Enhanced Quiz Settings
    randomize_questions = models.BooleanField(default=False)
    show_answers_after_submit = models.BooleanField(default=True)
    retake_penalty_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    shuffle_options = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quizzes'
        indexes = [
            models.Index(fields=['node']),
            models.Index(fields=['is_published']),
        ]

    def __str__(self):
        return f"Quiz: {self.title}"

    def get_total_points(self) -> int:
        """Calculate total possible points for this quiz."""
        return sum(q.points for q in self.questions.all())


class Question(models.Model):
    """
    Individual question within a quiz.
    Supports MCQ, True/False, and Short Answer types.
    """
    QUESTION_TYPE_CHOICES = [
        ('mcq', 'Multiple Choice'),
        ('mcq_multi', 'Multiple Choice (Multi-Select)'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
        ('matching', 'Matching'),
        ('fill_blank', 'Fill in the Blank'),
        ('ordering', 'Ordering/Sequence'),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    text = models.TextField()
    points = models.PositiveIntegerField(default=1)
    position = models.PositiveIntegerField(default=0)
    
    # answer_data format:
    # MCQ: {"options": ["A", "B", "C", "D"], "correct": 0}
    # T/F: {"correct": true}
    # Short Answer: {"keywords": ["term1", "term2"], "manual_grading": false}
    answer_data = models.JSONField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'questions'
        ordering = ['position']
        indexes = [
            models.Index(fields=['quiz', 'position']),
        ]

    def __str__(self):
        return f"Q{self.position + 1}: {self.text[:50]}..."

    def check_answer(self, student_answer) -> tuple[bool, int]:
        """
        Check if student answer is correct.
        Returns (is_correct, points_earned).
        
        Refactored to support new question types.
        """
        # 1. Matching Questions
        if self.question_type == 'matching':
            # student_answer: {"LeftText": "RightText", ...}
            pairs = list(self.matching_pairs.all())
            if not pairs:
                return False, 0
            
            correct_count = 0
            for pair in pairs:
                # Key is now left_text as sent by frontend
                submitted = student_answer.get(pair.left_text)
                if submitted == pair.right_text:
                    correct_count += 1
            
            is_completely_correct = (correct_count == len(pairs))
            points_earned = self.points if is_completely_correct else int(self.points * correct_count / len(pairs))
            return is_completely_correct, points_earned

        # 2. Fill in the Blank
        elif self.question_type == 'fill_blank':
            # student_answer: {"0": "answer1", "1": "answer2"}
            gaps = list(self.gap_answers.all())
            if not gaps:
                return False, 0
                
            correct_count = 0
            for gap in gaps:
                submitted = str(student_answer.get(str(gap.gap_index), '')).lower().strip()
                accepted = [a.lower().strip() for a in gap.accepted_answers]
                if submitted in accepted:
                    correct_count += 1
            
            is_completely_correct = (correct_count == len(gaps))
            points_earned = self.points if is_completely_correct else int(self.points * correct_count / len(gaps))
            return is_completely_correct, points_earned

        # 3. Ordering / Sequence
        elif self.question_type == 'ordering':
            # student_answer: [2, 0, 1, 3] (indices in correct order)
            correct_order = self.answer_data.get('correct_order', [])
            is_correct = (student_answer == correct_order)
            return is_correct, self.points if is_correct else 0

        # 4. Multi-Select MCQ
        elif self.question_type == 'mcq_multi':
            # student_answer: [0, 2] (list of selected option positions)
            # Use QuestionOption model if available, fallback to answer_data for legacy/migration
            if self.options.exists():
                correct_positions = set(
                    opt.position for opt in self.options.filter(is_correct=True)
                )
            else:
                # Fallback to answer_data
                correct_positions = set(self.answer_data.get('correct_indices', []))
                
            submitted_set = set(student_answer) if isinstance(student_answer, list) else set()
            is_correct = (submitted_set == correct_positions)
            return is_correct, self.points if is_correct else 0

        # 5. Standard MCQ
        elif self.question_type == 'mcq':
            if self.options.exists():
                # select related is_correct option
                try:
                    correct_option = self.options.get(is_correct=True)
                    # Assuming student answer sends position index
                    is_correct = (int(student_answer) == correct_option.position)
                except (self.options.model.DoesNotExist, ValueError, TypeError):
                    is_correct = False
            else:
                # Fallback
                correct_idx = self.answer_data.get('correct')
                is_correct = (student_answer == correct_idx)
            return is_correct, self.points if is_correct else 0
        
        # 6. True/False
        elif self.question_type == 'true_false':
            correct_val = self.answer_data.get('correct')
            is_correct = (student_answer == correct_val)
            return is_correct, self.points if is_correct else 0
        
        # 7. Short Answer
        elif self.question_type == 'short_answer':
            if self.answer_data.get('manual_grading', True):
                return None, None  # Needs manual grading
            keywords = self.answer_data.get('keywords', [])
            answer_lower = str(student_answer).lower()
            is_correct = any(kw.lower() in answer_lower for kw in keywords)
            return is_correct, self.points if is_correct else 0
        
        return False, 0


class QuizAttempt(models.Model):
    """
    Student's attempt at a quiz.
    Tracks answers, score, and pass/fail status.
    """
    enrollment = models.ForeignKey(
        'progression.Enrollment',
        on_delete=models.CASCADE,
        related_name='quiz_attempts'
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    attempt_number = models.PositiveIntegerField()
    started_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    # answers format: {"question_id": answer_value, ...}
    answers = models.JSONField(default=dict)
    
    # Grading results
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    points_earned = models.PositiveIntegerField(null=True, blank=True)
    points_possible = models.PositiveIntegerField(null=True, blank=True)
    passed = models.BooleanField(null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quiz_attempts'
        unique_together = ['enrollment', 'quiz', 'attempt_number']
        indexes = [
            models.Index(fields=['enrollment', 'quiz']),
        ]

    def __str__(self):
        return f"Attempt #{self.attempt_number} on {self.quiz.title}"

    def calculate_score(self) -> tuple[int, int, float, bool]:
        """
        Grade the quiz attempt.
        Returns (points_earned, points_possible, percentage, passed).
        """
        points_earned = 0
        points_possible = 0
        needs_manual = False
        
        for question in self.quiz.questions.all():
            points_possible += question.points
            answer = self.answers.get(str(question.id))
            
            if answer is not None:
                is_correct, pts = question.check_answer(answer)
                if is_correct is None:
                    needs_manual = True
                elif is_correct:
                    points_earned += pts
        
        percentage = (points_earned / points_possible * 100) if points_possible > 0 else 0
        passed = percentage >= self.quiz.pass_threshold if not needs_manual else None
        
        return points_earned, points_possible, round(percentage, 2), passed


class Assignment(models.Model):
    """
    Major graded assignment within a program.
    Each program has 2 assignments (configurable weight).
    """
    SUBMISSION_TYPE_CHOICES = [
        ('file', 'File Upload'),
        ('text', 'Text Entry'),
        ('both', 'Both'),
    ]

    program = models.ForeignKey(
        'core.Program',
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    instructions = models.TextField()
    weight = models.PositiveIntegerField(help_text='Percentage weight in final grade')
    due_date = models.DateTimeField(null=True, blank=True)
    allow_late_submission = models.BooleanField(default=False)
    late_penalty_percent = models.PositiveIntegerField(default=0)
    
    submission_type = models.CharField(
        max_length=20,
        choices=SUBMISSION_TYPE_CHOICES,
        default='file'
    )
    allowed_file_types = models.JSONField(default=list)  # ['pdf', 'docx']
    max_file_size_mb = models.PositiveIntegerField(default=10)
    
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assignments'
        indexes = [
            models.Index(fields=['program']),
            models.Index(fields=['is_published']),
        ]

    def __str__(self):
        return f"Assignment: {self.title}"


class AssignmentSubmission(models.Model):
    """
    Student submission for an assignment.
    Supports file uploads and/or text entry.
    """
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('returned', 'Returned for Revision'),
    ]

    enrollment = models.ForeignKey(
        'progression.Enrollment',
        on_delete=models.CASCADE,
        related_name='assignment_submissions'
    )
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    
    # Submission content
    file_path = models.CharField(max_length=500, null=True, blank=True)
    file_name = models.CharField(max_length=255, null=True, blank=True)
    text_content = models.TextField(blank=True, default='')
    submitted_at = models.DateTimeField()
    is_late = models.BooleanField(default=False)
    
    # Grading
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True, default='')
    graded_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_assignments'
    )
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'assignment_submissions'
        unique_together = ['enrollment', 'assignment']
        indexes = [
            models.Index(fields=['assignment', 'status']),
        ]

    def __str__(self):
        return f"Submission for {self.assignment.title}"

    def get_final_score(self) -> Optional[float]:
        """Calculate final score after late penalty if applicable."""
        if self.score is None:
            return None
        if self.is_late and self.assignment.late_penalty_percent > 0:
            penalty = float(self.score) * (self.assignment.late_penalty_percent / 100)
            return float(self.score) - penalty
        return float(self.score)


class QuestionOption(models.Model):
    """
    Individual option for MCQ/MCQ-Multi questions.
    Replaces the JSON storage method for better querying.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'question_options'
        ordering = ['position']
    
    def __str__(self):
        return f"{self.question.id} Option: {self.text[:30]}"


class QuestionMatchingPair(models.Model):
    """
    Left-right paired items for Matching questions.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='matching_pairs')
    left_text = models.TextField()
    right_text = models.TextField()
    position = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'question_matching_pairs'
        ordering = ['position']

    def __str__(self):
        return f"Pair {self.position} for Q{self.question.id}"


class QuestionGapAnswer(models.Model):
    """
    Correct answers for fill-in-the-blank gaps.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='gap_answers')
    gap_index = models.PositiveIntegerField()  # Which blank (0, 1, 2, ...)
    accepted_answers = models.JSONField(default=list)  # ["answer1", "answer2"] for flexibility
    
    class Meta:
        db_table = 'question_gap_answers'
        unique_together = ['question', 'gap_index']
    
    def __str__(self):
        return f"Gap {self.gap_index} for Q{self.question.id}"


class QuestionBankEntry(models.Model):
    """
    Reusable question library entry.
    Allows instructors to save and reuse questions across different quizzes.
    """
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    owner = models.ForeignKey('core.User', on_delete=models.CASCADE, related_name='question_bank')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='bank_entries')
    
    subject_area = models.CharField(max_length=100, blank=True, default='')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    tags = models.JSONField(default=list, blank=True)
    
    usage_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'question_bank_entries'
        indexes = [
            models.Index(fields=['owner', 'subject_area']),
        ]

    def __str__(self):
        return f"Bank Entry: {self.question.text[:30]} ({self.owner})"


