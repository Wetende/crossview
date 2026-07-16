"""
Assessment result serializers for export and API responses.
"""
from typing import Dict, Any
import json
from rest_framework import serializers

from apps.assessments.models import (
    AssessmentResult, Quiz, Question, 
    QuestionOption, QuestionMatchingPair, 
    QuestionGapAnswer, QuestionBankEntry, QuestionBank, QuizQuestionPool,
    Rubric
)
from apps.assessments.text_normalization import (
    normalize_assessment_text,
    normalize_assessment_text_list,
    normalize_question_answer_data,
)


class RubricSerializer(serializers.ModelSerializer):
    """
    Serializer for Rubric model.
    """
    class Meta:
        model = Rubric
        fields = ['id', 'name', 'description', 'dimensions', 'max_score', 'scope', 'owner', 'program', 'created_at', 'updated_at']
        read_only_fields = ['owner', 'created_at', 'updated_at']

    def validate_dimensions(self, value):
        """
        Validate dimensions JSON structure.
        Expected: [{"name": "string", "weight": float, "max_score": int}, ...]
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("Dimensions must be a list of objects")
        
        total_weight = 0
        for dim in value:
            if not isinstance(dim, dict):
                raise serializers.ValidationError("Each dimension must be an object")
            
            if 'name' not in dim:
                raise serializers.ValidationError("Dimension missing 'name'")
            
            weight = dim.get('weight', 1)
            try:
                total_weight += float(weight)
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"Invalid weight for dimension {dim.get('name')}")
                
        # Optional: Validate total weight equals 1.0 (or close to it)
        # For now, we'll leave it flexible but maybe warn?
        # Enforcing strict 1.0 might be annoying for simple point-based rubrics where weight is just 1.
        
        return value


class AssessmentResultSerializer:
    """
    Serializer for AssessmentResult model.
    Provides JSON serialization for API responses and transcript exports.
    """

    def __init__(self, result: AssessmentResult):
        """
        Initialize serializer with an AssessmentResult instance.
        
        Args:
            result: AssessmentResult to serialize
        """
        self.result = result

    def to_dict(self) -> Dict[str, Any]:
        """
        Serialize result to dictionary.
        
        Returns:
            Dictionary containing all result data
        """
        return {
            'id': self.result.id,
            'enrollment_id': self.result.enrollment_id,
            'node_id': self.result.node_id,
            'components': self.result.get_components(),
            'total': self.result.get_total(),
            'status': self.result.get_status(),
            'letter_grade': self.result.get_letter_grade(),
            'lecturer_comments': self.result.lecturer_comments,
            'is_published': self.result.is_published,
            'published_at': self.result.published_at.isoformat() if self.result.published_at else None,
            'graded_by_id': self.result.graded_by_id,
            'created_at': self.result.created_at.isoformat() if self.result.created_at else None,
            'updated_at': self.result.updated_at.isoformat() if self.result.updated_at else None,
        }

    def to_json(self) -> str:
        """
        Serialize result to JSON string.
        
        Returns:
            JSON string containing all result data
        """
        return json.dumps(self.to_dict(), indent=2)

    def to_transcript_format(self) -> Dict[str, Any]:
        """
        Serialize result for transcript display.
        Includes student name, node title, and grade information.
        
        Returns:
            Dictionary formatted for transcript display
        """
        enrollment = self.result.enrollment
        node = self.result.node
        user = enrollment.user
        
        return {
            'student_name': user.get_full_name() or user.username,
            'student_email': user.email,
            'program_name': enrollment.program.name,
            'node_title': node.title,
            'node_type': node.node_type,
            'components': self.result.get_components(),
            'total': self.result.get_total(),
            'status': self.result.get_status(),
            'letter_grade': self.result.get_letter_grade(),
            'graded_at': self.result.updated_at.isoformat() if self.result.updated_at else None,
        }

    def to_transcript_json(self) -> str:
        """
        Serialize result to JSON string for transcript.
        
        Returns:
            JSON string formatted for transcript display
        """
        return json.dumps(self.to_transcript_format(), indent=2)


class AssessmentResultListSerializer:
    """
    Serializer for lists of AssessmentResult instances.
    """

    def __init__(self, results):
        """
        Initialize serializer with a queryset or list of results.
        
        Args:
            results: QuerySet or list of AssessmentResult instances
        """
        self.results = results

    def to_list(self) -> list:
        """
        Serialize all results to list of dictionaries.
        
        Returns:
            List of dictionaries
        """
        return [AssessmentResultSerializer(r).to_dict() for r in self.results]

    def to_json(self) -> str:
        """
        Serialize all results to JSON string.
        
        Returns:
            JSON string containing array of results
        """
        return json.dumps(self.to_list(), indent=2)

    def to_transcript_list(self) -> list:
        """
        Serialize all results for transcript display.
        
        Returns:
            List of transcript-formatted dictionaries
        """
        return [AssessmentResultSerializer(r).to_transcript_format() for r in self.results]

    def to_transcript_json(self) -> str:
        """
        Serialize all results to JSON for transcript.
        
        Returns:
            JSON string containing array of transcript entries
        """
        return json.dumps(self.to_transcript_list(), indent=2)


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'text', 'is_correct', 'position']


class QuestionMatchingPairSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionMatchingPair
        fields = ['id', 'left_text', 'right_text', 'explanation', 'position']


class QuestionGapAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionGapAnswer
        fields = ['id', 'gap_index', 'accepted_answers', 'explanation']


class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, required=False)
    matching_pairs = QuestionMatchingPairSerializer(many=True, required=False)
    gap_answers = QuestionGapAnswerSerializer(many=True, required=False)
    
    class Meta:
        model = Question
        fields = [
            'id', 'quiz', 'question_type', 'text', 'points', 'position', 'answer_data',
            'options', 'matching_pairs', 'gap_answers', 'created_at'
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        question_type = attrs.get("question_type", getattr(self.instance, "question_type", ""))

        if "text" in attrs:
            attrs["text"] = normalize_assessment_text(attrs["text"])
        if "answer_data" in attrs:
            attrs["answer_data"] = normalize_question_answer_data(
                question_type,
                attrs["answer_data"],
            )
        return attrs
        
    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        pairs_data = validated_data.pop('matching_pairs', [])
        gaps_data = validated_data.pop('gap_answers', [])
        
        question = Question.objects.create(**validated_data)
        
        for opt in options_data:
            opt["text"] = normalize_assessment_text(opt.get("text", ""))
            QuestionOption.objects.create(question=question, **opt)
            
        for pair in pairs_data:
            pair["left_text"] = normalize_assessment_text(pair.get("left_text", ""))
            pair["right_text"] = normalize_assessment_text(pair.get("right_text", ""))
            pair["explanation"] = normalize_assessment_text(pair.get("explanation", ""))
            QuestionMatchingPair.objects.create(question=question, **pair)
            
        for gap in gaps_data:
            gap["accepted_answers"] = normalize_assessment_text_list(
                gap.get("accepted_answers", [])
            )
            gap["explanation"] = normalize_assessment_text(gap.get("explanation", ""))
            QuestionGapAnswer.objects.create(question=question, **gap)
            
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', [])
        pairs_data = validated_data.pop('matching_pairs', [])
        gaps_data = validated_data.pop('gap_answers', [])
        
        # Update main fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Re-create nested objects (simplest strategy for now)
        if options_data:
            instance.options.all().delete()
            for opt in options_data:
                opt["text"] = normalize_assessment_text(opt.get("text", ""))
                QuestionOption.objects.create(question=instance, **opt)
                
        if pairs_data:
            instance.matching_pairs.all().delete()
            for pair in pairs_data:
                pair["left_text"] = normalize_assessment_text(pair.get("left_text", ""))
                pair["right_text"] = normalize_assessment_text(pair.get("right_text", ""))
                pair["explanation"] = normalize_assessment_text(pair.get("explanation", ""))
                QuestionMatchingPair.objects.create(question=instance, **pair)
                
        if gaps_data:
            instance.gap_answers.all().delete()
            for gap in gaps_data:
                gap["accepted_answers"] = normalize_assessment_text_list(
                    gap.get("accepted_answers", [])
                )
                gap["explanation"] = normalize_assessment_text(gap.get("explanation", ""))
                QuestionGapAnswer.objects.create(question=instance, **gap)
                
        return instance


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        policy = attrs.get("answer_release_policy")
        legacy_visibility = attrs.get("show_answers_after_submit")

        if policy is None and legacy_visibility is not None:
            attrs["answer_release_policy"] = (
                Quiz.AnswerReleasePolicy.AFTER_EACH_ATTEMPT
                if legacy_visibility
                else Quiz.AnswerReleasePolicy.NEVER
            )
        elif policy is not None:
            attrs["show_answers_after_submit"] = (
                policy != Quiz.AnswerReleasePolicy.NEVER
            )

        return attrs
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'node', 'title', 'description', 'time_limit_minutes',
            'max_attempts', 'pass_threshold', 'randomize_questions',
            'show_answers_after_submit', 'answer_release_policy',
            'allow_retake_after_pass', 'retake_penalty_percent',
            'shuffle_options', 'is_published', 'questions',
            'created_at', 'updated_at'
        ]


class QuestionBankSerializer(serializers.ModelSerializer):
    """Serializer for QuestionBank model (question groupings)."""
    entries_count = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionBank
        fields = [
            'id', 'name', 'description', 'program', 'owner', 'category',
            'entries_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['owner', 'entries_count']
    
    def get_entries_count(self, obj):
        return obj.entries.count()


class QuestionBankEntrySerializer(serializers.ModelSerializer):
    question_data = serializers.SerializerMethodField()
    questionSnapshot = serializers.JSONField(source='question_snapshot', required=False)
    bank_name = serializers.CharField(source='bank.name', read_only=True, allow_null=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    question_type = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionBankEntry
        fields = [
            'id', 'owner', 'owner_name', 'question', 'question_data',
            'bank', 'bank_name', 'category', 'subject_area', 'difficulty', 
            'tags', 'usage_count', 'last_used_at', 'snapshot_version',
            'questionSnapshot', 'question_type', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'owner', 'usage_count', 'last_used_at', 'snapshot_version',
            'owner_name', 'bank_name', 'question_type'
        ]

    def get_question_data(self, obj):
        from apps.assessments.question_snapshots import (
            build_question_snapshot,
            snapshot_as_question_data,
        )

        snapshot = obj.question_snapshot
        if not snapshot and obj.question_id:
            snapshot = build_question_snapshot(obj.question)
        return snapshot_as_question_data(snapshot)

    def get_question_type(self, obj):
        return (obj.question_snapshot or {}).get('question_type') or (
            obj.question.question_type if obj.question_id else None
        )


class QuizQuestionPoolSerializer(serializers.ModelSerializer):
    bankName = serializers.CharField(source='bank.name', read_only=True)
    availableQuestions = serializers.SerializerMethodField()

    class Meta:
        model = QuizQuestionPool
        fields = [
            'id', 'quiz', 'bank', 'bankName', 'question_count', 'category',
            'tags', 'difficulty', 'question_type', 'position', 'is_active',
            'availableQuestions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['quiz', 'availableQuestions']

    def get_availableQuestions(self, obj):
        from apps.assessments.question_snapshots import pool_supply

        return pool_supply(obj)
