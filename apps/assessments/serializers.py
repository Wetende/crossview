"""
Assessment result serializers for export and API responses.
"""
from typing import Dict, Any
import json
from rest_framework import serializers

from apps.assessments.models import (
    AssessmentResult, Quiz, Question, 
    QuestionOption, QuestionMatchingPair, 
    QuestionGapAnswer, QuestionBankEntry
)


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
        fields = ['id', 'left_text', 'right_text', 'position']


class QuestionGapAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionGapAnswer
        fields = ['id', 'gap_index', 'accepted_answers']


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
        
    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        pairs_data = validated_data.pop('matching_pairs', [])
        gaps_data = validated_data.pop('gap_answers', [])
        
        question = Question.objects.create(**validated_data)
        
        for opt in options_data:
            QuestionOption.objects.create(question=question, **opt)
            
        for pair in pairs_data:
            QuestionMatchingPair.objects.create(question=question, **pair)
            
        for gap in gaps_data:
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
                QuestionOption.objects.create(question=instance, **opt)
                
        if pairs_data:
            instance.matching_pairs.all().delete()
            for pair in pairs_data:
                QuestionMatchingPair.objects.create(question=instance, **pair)
                
        if gaps_data:
            instance.gap_answers.all().delete()
            for gap in gaps_data:
                QuestionGapAnswer.objects.create(question=instance, **gap)
                
        return instance


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'node', 'title', 'description', 'time_limit_minutes',
            'max_attempts', 'pass_threshold', 'randomize_questions',
            'show_answers_after_submit', 'retake_penalty_percent',
            'shuffle_options', 'is_published', 'questions',
            'created_at', 'updated_at'
        ]


class QuestionBankEntrySerializer(serializers.ModelSerializer):
    question_data = QuestionSerializer(source='question', read_only=True)
    
    class Meta:
        model = QuestionBankEntry
        fields = [
            'id', 'owner', 'question', 'question_data',
            'subject_area', 'difficulty', 'tags', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['owner', 'usage_count']

