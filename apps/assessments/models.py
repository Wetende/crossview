"""
Assessment models - Grading strategies and results.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Union

from django.db import models
from django.utils.crypto import salted_hmac

from apps.core.models import TimeStampedModel


def _round2(value) -> Decimal:
    """Round a numeric value to 2 decimal places using ROUND_HALF_UP."""
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class AssessmentResult(TimeStampedModel):
    """
    Stores the outcome of a student's assessment for a specific curriculum node.
    Contains component scores, calculated total, status, and letter grade in result_data JSON.
    """

    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="assessment_results",
    )
    node = models.ForeignKey(
        "curriculum.CurriculumNode",
        on_delete=models.CASCADE,
        related_name="assessment_results",
    )
    result_data = models.JSONField()
    lecturer_comments = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    graded_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="graded_results",
    )

    class Meta:
        db_table = "assessment_results"
        constraints = [
            models.UniqueConstraint(
                fields=["enrollment", "node"], name="unique_enrollment_node_result"
            )
        ]
        indexes = [
            models.Index(
                fields=["node", "is_published"], name="results_node_published_idx"
            ),
        ]

    def __str__(self):
        return f"Result: {self.enrollment} - {self.node}"

    def get_total(self) -> Optional[float]:
        """Get the calculated total score from result_data."""
        return self.result_data.get("total") if self.result_data else None

    def get_status(self) -> Optional[str]:
        """Get the result status (Pass, Fail, Competent, etc.) from result_data."""
        return self.result_data.get("status") if self.result_data else None

    def get_letter_grade(self) -> Optional[str]:
        """Get the letter grade from result_data (if applicable)."""
        return self.result_data.get("letter_grade") if self.result_data else None

    def get_components(self) -> dict:
        """Get the component scores from result_data."""
        return self.result_data.get("components", {}) if self.result_data else {}


class Rubric(TimeStampedModel):
    """
    Rubric model for grading subjective assessments.
    Supports global (superadmin), program (admin), and course (instructor) scopes.
    """

    SCOPE_CHOICES = [
        ("global", "Global"),
        ("program", "Program"),
        ("course", "Course"),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    dimensions = models.JSONField(
        help_text="List of dimension objects with name, weight, max_score"
    )
    max_score = models.PositiveIntegerField()
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="course")
    owner = models.ForeignKey(
        "core.User", on_delete=models.CASCADE, related_name="rubrics"
    )
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="rubrics",
        help_text="Required for program-scoped rubrics",
    )

    class Meta:
        db_table = "assessments_rubrics"
        indexes = [
            models.Index(fields=["scope", "owner"]),
            models.Index(fields=["program"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_scope_display()})"

    def calculate_score(self, dimension_scores: dict):
        """Calculate weighted total from dimension scores."""
        from decimal import Decimal

        total = Decimal("0")
        for dim in self.dimensions:
            dim_name = dim["name"]
            weight = Decimal(str(dim.get("weight", 1)))
            score = Decimal(str(dimension_scores.get(dim_name, 0)))
            total += score * weight
        return total


class Quiz(TimeStampedModel):
    """
    Quiz attached to a lesson/session node.
    Each lesson can have one or more quizzes for knowledge checks.
    """

    node = models.ForeignKey(
        "curriculum.CurriculumNode", on_delete=models.CASCADE, related_name="quizzes"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)
    max_attempts = models.PositiveIntegerField(default=1)
    pass_threshold = models.PositiveIntegerField(default=70)  # Percentage
    weight = models.PositiveIntegerField(
        default=0, help_text="Percentage weight in final grade"
    )

    # Enhanced Quiz Settings
    randomize_questions = models.BooleanField(default=False)
    show_answers_after_submit = models.BooleanField(default=True)
    allow_retake_after_pass = models.BooleanField(default=False)
    retake_penalty_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    shuffle_options = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)

    class Meta:
        db_table = "quizzes"
        indexes = [
            models.Index(fields=["node"]),
            models.Index(fields=["is_published"]),
        ]

    def __str__(self):
        return f"Quiz: {self.title}"

    def get_total_points(self) -> int:
        """Calculate total possible points for this quiz."""
        return sum(q.points for q in self.questions.all())


class Question(TimeStampedModel):
    """
    Individual question within a quiz.
    Supports MCQ, True/False, and Short Answer types.
    """

    QUESTION_TYPE_CHOICES = [
        ("mcq", "Multiple Choice"),
        ("mcq_multi", "Multiple Choice (Multi-Select)"),
        ("true_false", "True/False"),
        ("short_answer", "Short Answer"),
        ("matching", "Matching"),
        ("image_matching", "Image Matching"),
        ("fill_blank", "Fill in the Blank"),
        ("ordering", "Ordering/Sequence"),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    text = models.TextField()
    points = models.PositiveIntegerField(default=1)
    position = models.PositiveIntegerField(default=0)

    # answer_data format:
    # MCQ: {"options": ["A", "B", "C", "D"], "correct": 0}
    # T/F: {"correct": true}
    # Short Answer: {"keywords": ["term1", "term2"], "manual_grading": false}
    answer_data = models.JSONField()

    class Meta:
        db_table = "questions"
        ordering = ["position"]
        indexes = [
            models.Index(fields=["quiz", "position"]),
        ]

    def __str__(self):
        return f"Q{self.position + 1}: {self.text[:50]}..."

    def get_image_matching_item_id(
        self, pair_id: int, attempt_id: int, side: str
    ) -> str:
        """
        Generate a stable opaque identifier for image-matching items per attempt.
        """
        token = salted_hmac(
            "assessments.image_matching_item",
            f"{attempt_id}:{self.id}:{pair_id}:{side}",
        ).hexdigest()
        return f"{side}_{token}"

    def check_answer(
        self, student_answer, attempt_id: Optional[int] = None
    ) -> tuple[bool, Union[Decimal, int]]:
        """
        Check if student answer is correct.
        Returns (is_correct, points_earned) where points_earned is a Decimal.

        Refactored to support new question types.
        """
        # 1. Matching Questions
        if self.question_type == "matching":
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

            is_completely_correct = correct_count == len(pairs)
            points_earned = (
                Decimal(self.points)
                if is_completely_correct
                else _round2(Decimal(self.points) * correct_count / len(pairs))
            )
            return is_completely_correct, points_earned

        # 2. Image Matching
        elif self.question_type == "image_matching":
            # student_answer: {"<left_item_id>": "<right_item_id>", ...}
            pairs = list(self.image_matching_pairs.all())
            if not pairs:
                return False, 0

            if not isinstance(student_answer, dict):
                return False, 0

            correct_count = 0
            for pair in pairs:
                if attempt_id is not None:
                    left_id = self.get_image_matching_item_id(
                        pair.id, attempt_id, "left"
                    )
                    expected_right_id = self.get_image_matching_item_id(
                        pair.id, attempt_id, "right"
                    )
                    submitted = student_answer.get(left_id)
                else:
                    submitted = student_answer.get(str(pair.id))
                    expected_right_id = str(pair.id)

                if str(submitted) == expected_right_id:
                    correct_count += 1

            is_completely_correct = correct_count == len(pairs)
            points_earned = (
                Decimal(self.points)
                if is_completely_correct
                else _round2(Decimal(self.points) * correct_count / len(pairs))
            )
            return is_completely_correct, points_earned

        # 3. Fill in the Blank
        elif self.question_type == "fill_blank":
            # student_answer: {"0": "answer1", "1": "answer2"}
            gaps = list(self.gap_answers.all())
            if not gaps:
                return False, 0

            def normalize_fill_blank(value):
                return " ".join(str(value or "").lower().strip().split())

            correct_count = 0
            for gap in gaps:
                submitted = normalize_fill_blank(
                    student_answer.get(str(gap.gap_index), "")
                )
                accepted = [normalize_fill_blank(a) for a in gap.accepted_answers]
                if submitted in accepted:
                    correct_count += 1

            is_completely_correct = correct_count == len(gaps)
            points_earned = (
                Decimal(self.points)
                if is_completely_correct
                else _round2(Decimal(self.points) * correct_count / len(gaps))
            )
            return is_completely_correct, points_earned

        # 4. Ordering / Sequence
        elif self.question_type == "ordering":
            # student_answer: ["Step 1", "Step 2"]
            expected_order = self.answer_data.get("items", [])

            if not isinstance(expected_order, list) or not isinstance(
                student_answer, list
            ):
                return False, Decimal(0)

            # Score by correct final position count
            correct_count = 0
            for i, expected_item in enumerate(expected_order):
                if i < len(student_answer) and student_answer[i] == expected_item:
                    correct_count += 1

            is_correct = student_answer == expected_order
            if is_correct:
                points_earned = Decimal(self.points)
            else:
                points_earned = _round2(
                    Decimal(self.points) * correct_count / len(expected_order)
                ) if len(expected_order) > 0 else Decimal(0)
            return is_correct, points_earned

        # 5. Multi-Select MCQ
        elif self.question_type == "mcq_multi":
            options = list(self.options.all())
            if not options:
                return False, 0

            correct_positions = {str(opt.position) for opt in options if opt.is_correct}

            def normalize_to_position(value):
                if isinstance(value, (int, float)) and not isinstance(value, bool):
                    numeric = int(value)
                    matched = next(
                        (opt for opt in options if opt.position == numeric),
                        None,
                    )
                    if matched is not None:
                        return str(matched.position)
                    matched = next((opt for opt in options if opt.id == numeric), None)
                    if matched is not None:
                        return str(matched.position)

                token = str(value).strip()
                # Strings from modern payloads are option ids; fallback to positions.
                matched = next((opt for opt in options if str(opt.id) == token), None)
                if matched is not None:
                    return str(matched.position)

                matched = next(
                    (opt for opt in options if str(opt.position) == token),
                    None,
                )
                if matched is not None:
                    return str(matched.position)
                return None

            submitted_set = set()
            if isinstance(student_answer, list):
                for value in student_answer:
                    mapped = normalize_to_position(value)
                    if mapped is not None:
                        submitted_set.add(mapped)

            is_correct = submitted_set == correct_positions
            if is_correct:
                return True, Decimal(self.points)

            # Penalized partial credit:
            # ratio = clamp((correct_selected - incorrect_selected) / total_correct, 0, 1)
            total_correct = len(correct_positions)
            if total_correct == 0:
                return False, Decimal(0)
            correct_selected = len(submitted_set & correct_positions)
            incorrect_selected = len(submitted_set - correct_positions)
            ratio = max(Decimal(0), Decimal(correct_selected - incorrect_selected) / total_correct)
            ratio = min(ratio, Decimal(1))
            points_earned = _round2(Decimal(self.points) * ratio)
            return False, points_earned

        # 6. Standard MCQ
        elif self.question_type == "mcq":
            options = list(self.options.all())
            if not options:
                return False, 0

            correct_option = next((opt for opt in options if opt.is_correct), None)
            if correct_option is None:
                return False, 0

            submitted_position = None
            if student_answer is not None:
                matched_option = None
                if isinstance(student_answer, (int, float)) and not isinstance(
                    student_answer, bool
                ):
                    numeric = int(student_answer)
                    matched_option = next(
                        (opt for opt in options if opt.position == numeric),
                        None,
                    )
                    if matched_option is None:
                        matched_option = next(
                            (opt for opt in options if opt.id == numeric),
                            None,
                        )
                else:
                    submitted_raw = str(student_answer).strip()
                    # Strings from modern payloads are option ids; fallback to positions.
                    matched_option = next(
                        (opt for opt in options if str(opt.id) == submitted_raw),
                        None,
                    )
                if matched_option is None:
                    submitted_raw = str(student_answer).strip()
                    matched_option = next(
                        (opt for opt in options if str(opt.position) == submitted_raw),
                        None,
                    )
                if matched_option is not None:
                    submitted_position = matched_option.position

            is_correct = submitted_position == correct_option.position
            return is_correct, Decimal(self.points) if is_correct else Decimal(0)

        # 7. True/False
        elif self.question_type == "true_false":

            def normalize_bool(value):
                if isinstance(value, bool):
                    return value
                if isinstance(value, (int, float)):
                    if int(value) in {0, 1}:
                        return bool(int(value))
                    return None
                if isinstance(value, str):
                    normalized = value.strip().lower()
                    if normalized in {"true", "1", "yes"}:
                        return True
                    if normalized in {"false", "0", "no"}:
                        return False
                return None

            correct_val = self.answer_data.get("correct")
            correct_bool = normalize_bool(correct_val)
            submitted_bool = None

            parsed_direct = normalize_bool(student_answer)
            if parsed_direct is not None:
                submitted_bool = parsed_direct
            elif self.options.exists():
                if isinstance(student_answer, (str, int, float)):
                    option = self.options.filter(
                        models.Q(id=student_answer) | models.Q(position=student_answer)
                    ).first()
                    if option is None and isinstance(student_answer, str):
                        normalized = student_answer.strip().lower()
                        option = self.options.filter(text__iexact=normalized).first()

                    if option is not None:
                        by_text = normalize_bool(option.text)
                        if by_text is not None:
                            submitted_bool = by_text
                        elif option.position in {0, 1}:
                            submitted_bool = option.position == 0

            is_correct = (
                submitted_bool is not None
                and correct_bool is not None
                and submitted_bool == correct_bool
            )
            return is_correct, Decimal(self.points) if is_correct else Decimal(0)

        # 8. Short Answer
        elif self.question_type == "short_answer":
            if self.answer_data.get("manual_grading", True):
                return None, None  # Needs manual grading
            keywords = self.answer_data.get("keywords", [])
            answer_lower = str(student_answer).lower()
            is_correct = any(kw.lower() in answer_lower for kw in keywords)
            return is_correct, Decimal(self.points) if is_correct else Decimal(0)

        return False, Decimal(0)


class QuizAttempt(models.Model):
    """
    Student's attempt at a quiz.
    Tracks answers, score, and pass/fail status.
    """

    enrollment = models.ForeignKey(
        "progression.Enrollment", on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    attempt_number = models.PositiveIntegerField()
    started_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)

    # answers format: {"question_id": answer_value, ...}
    answers = models.JSONField(default=dict)
    # runtime_state stores in-progress player metadata (e.g. current question index,
    # randomized order snapshots) so reloads can resume exactly where the learner left off.
    runtime_state = models.JSONField(default=dict)

    # Grading results
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    points_earned = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    points_possible = models.PositiveIntegerField(null=True, blank=True)
    passed = models.BooleanField(null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "quiz_attempts"
        unique_together = ["enrollment", "quiz", "attempt_number"]
        indexes = [
            models.Index(fields=["enrollment", "quiz"]),
        ]

    def __str__(self):
        return f"Attempt #{self.attempt_number} on {self.quiz.title}"

    def calculate_score(self) -> tuple[Decimal, int, float, bool]:
        """
        Grade the quiz attempt.
        Returns (points_earned, points_possible, percentage, passed).
        points_earned is a Decimal with 2 decimal places.
        """
        points_earned = Decimal(0)
        points_possible = 0
        needs_manual = False

        for question in self.quiz.questions.all():
            points_possible += question.points
            answer = self.answers.get(str(question.id))

            if answer is not None:
                is_correct, pts = question.check_answer(answer, attempt_id=self.id)
                if is_correct is None:
                    needs_manual = True
                else:
                    points_earned += max(Decimal(0), Decimal(str(pts or 0)))

        # Round accumulated points_earned to 2 decimal places
        points_earned = _round2(points_earned)

        raw_percentage = (
            (float(points_earned) / points_possible * 100) if points_possible > 0 else 0
        )

        passed = (
            raw_percentage >= self.quiz.pass_threshold
            if not needs_manual
            else None
        )

        return (
            points_earned,
            points_possible,
            round(raw_percentage, 2),
            passed,
        )


class Assignment(TimeStampedModel):
    """
    Major graded assignment within a program.
    Each program has 2 assignments (configurable weight).
    """

    SUBMISSION_TYPE_CHOICES = [
        ("file", "File Upload"),
        ("text", "Text Entry"),
        ("both", "Both"),
    ]

    program = models.ForeignKey(
        "core.Program", on_delete=models.CASCADE, related_name="assignments"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    instructions = models.TextField()
    weight = models.PositiveIntegerField(help_text="Percentage weight in final grade")
    pass_threshold = models.PositiveIntegerField(default=50)
    due_date = models.DateTimeField(null=True, blank=True)
    allow_late_submission = models.BooleanField(default=False)
    late_penalty_percent = models.PositiveIntegerField(default=0)

    submission_type = models.CharField(
        max_length=20, choices=SUBMISSION_TYPE_CHOICES, default="file"
    )
    allowed_file_types = models.JSONField(default=list)  # ['pdf', 'docx']
    max_file_size_mb = models.PositiveIntegerField(default=10)

    rubric = models.ForeignKey(
        "assessments.Rubric",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments",
        help_text="Optional rubric for grading",
    )

    is_published = models.BooleanField(default=False)

    class Meta:
        db_table = "assignments"
        indexes = [
            models.Index(fields=["program"]),
            models.Index(fields=["is_published"]),
        ]

    def __str__(self):
        return f"Assignment: {self.title}"


class AssignmentSubmission(models.Model):
    """
    Student submission for an assignment.
    Supports file uploads and/or text entry.
    """

    STATUS_CHOICES = [
        ("started", "Started"),
        ("submitted", "Submitted"),
        ("graded", "Graded"),
        ("returned", "Returned for Revision"),
    ]

    enrollment = models.ForeignKey(
        "progression.Enrollment",
        on_delete=models.CASCADE,
        related_name="assignment_submissions",
    )
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="submissions"
    )
    attempt_number = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="started"
    )

    # Submission content
    file_path = models.CharField(max_length=500, null=True, blank=True)
    file_name = models.CharField(max_length=255, null=True, blank=True)
    text_content = models.TextField(blank=True, default="")
    submitted_at = models.DateTimeField()
    is_late = models.BooleanField(default=False)

    # Grading
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    passed = models.BooleanField(null=True, blank=True)
    dimension_scores = models.JSONField(
        null=True, blank=True, help_text="Rubric dimension scores"
    )
    feedback = models.TextField(blank=True, default="")
    graded_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="graded_assignments",
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    is_official = models.BooleanField(default=False)

    class Meta:
        db_table = "assignment_submissions"
        unique_together = ["enrollment", "assignment", "attempt_number"]
        indexes = [
            models.Index(fields=["enrollment", "assignment", "attempt_number"]),
            models.Index(fields=["assignment", "status"]),
            models.Index(fields=["enrollment", "assignment", "is_official"]),
        ]

    def __str__(self):
        return f"Submission #{self.attempt_number} for {self.assignment.title}"

    @classmethod
    def get_official_attempt(cls, enrollment, assignment):
        """
        Official assignment result is the highest graded finalized attempt.
        Pending or ungraded attempts never displace a graded official attempt.
        """
        return (
            cls.objects.filter(
                enrollment=enrollment,
                assignment=assignment,
                status__in=["graded", "returned"],
                score__isnull=False,
            )
            .order_by("-score", "-attempt_number")
            .first()
        )

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

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="options"
    )
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "question_options"
        ordering = ["position"]

    def __str__(self):
        return f"{self.question.id} Option: {self.text[:30]}"


class AssignmentSubmissionMedia(models.Model):
    """Media assets attached to a learner assignment attempt."""

    MEDIA_TYPE_CHOICES = [
        ("file", "File"),
        ("audio", "Audio"),
        ("video", "Video"),
    ]

    submission = models.ForeignKey(
        AssignmentSubmission,
        on_delete=models.CASCADE,
        related_name="media_assets",
    )
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    file_path = models.CharField(max_length=500)
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveBigIntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "assignment_submission_media"
        indexes = [
            models.Index(fields=["submission", "media_type"]),
        ]

    def __str__(self):
        return f"{self.media_type}:{self.file_name}"


class AssignmentReviewMedia(models.Model):
    """Media assets attached by instructors during assignment review."""

    MEDIA_TYPE_CHOICES = [
        ("file", "File"),
        ("audio", "Audio"),
        ("video", "Video"),
    ]

    submission = models.ForeignKey(
        AssignmentSubmission,
        on_delete=models.CASCADE,
        related_name="review_media_assets",
    )
    uploaded_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignment_review_media",
    )
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    file_path = models.CharField(max_length=500)
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveBigIntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "assignment_review_media"
        indexes = [
            models.Index(fields=["submission", "media_type"]),
        ]

    def __str__(self):
        return f"review-{self.media_type}:{self.file_name}"


class QuestionMatchingPair(models.Model):
    """
    Left-right paired items for Matching questions.
    """

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="matching_pairs"
    )
    left_text = models.TextField()
    right_text = models.TextField()
    explanation = models.TextField(blank=True, default="")
    position = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "question_matching_pairs"
        ordering = ["position"]

    def __str__(self):
        return f"Pair {self.position} for Q{self.question.id}"


class QuestionImageMatchingPair(models.Model):
    """
    Left-right image matching items for Image Matching questions.
    """

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="image_matching_pairs"
    )
    question_text = models.TextField(blank=True, default="")
    question_image = models.CharField(max_length=500, blank=True, default="")
    answer_text = models.TextField(blank=True, default="")
    answer_image = models.CharField(max_length=500, blank=True, default="")
    explanation = models.TextField(blank=True, default="")
    position = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "question_image_matching_pairs"
        ordering = ["position"]

    def __str__(self):
        return f"Image Pair {self.position} for Q{self.question.id}"


class QuestionGapAnswer(models.Model):
    """
    Correct answers for fill-in-the-blank gaps.
    """

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="gap_answers"
    )
    gap_index = models.PositiveIntegerField()  # Which blank (0, 1, 2, ...)
    accepted_answers = models.JSONField(
        default=list
    )  # ["answer1", "answer2"] for flexibility
    explanation = models.TextField(blank=True, default="")

    class Meta:
        db_table = "question_gap_answers"
        unique_together = ["question", "gap_index"]

    def __str__(self):
        return f"Gap {self.gap_index} for Q{self.question.id}"


class QuestionBank(TimeStampedModel):
    """
    Question Bank for organizing reusable questions by program.
    Allows instructors to group questions by topic/category within a program.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.CASCADE,
        related_name="question_banks",
        help_text="Questions in this bank are shared within the program",
    )
    owner = models.ForeignKey(
        "core.User", on_delete=models.CASCADE, related_name="owned_question_banks"
    )
    category = models.CharField(max_length=100, blank=True, default="")

    class Meta:
        db_table = "question_banks"
        indexes = [
            models.Index(fields=["program"]),
            models.Index(fields=["owner"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.program.name})"


class QuestionBankEntry(TimeStampedModel):
    """
    Reusable question library entry.
    Allows instructors to save and reuse questions across different quizzes.
    """

    DIFFICULTY_CHOICES = [
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    ]

    owner = models.ForeignKey(
        "core.User", on_delete=models.CASCADE, related_name="question_bank"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="bank_entries"
    )
    bank = models.ForeignKey(
        QuestionBank,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="entries",
        help_text="Optional grouping for questions",
    )

    subject_area = models.CharField(max_length=100, blank=True, default="")
    category = models.CharField(max_length=100, blank=True, default="")
    difficulty = models.CharField(
        max_length=20, choices=DIFFICULTY_CHOICES, default="medium"
    )
    tags = models.JSONField(default=list, blank=True)

    usage_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "question_bank_entries"
        indexes = [
            models.Index(fields=["owner", "subject_area"]),
            models.Index(fields=["bank"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"Bank Entry: {self.question.text[:30]} ({self.owner})"
