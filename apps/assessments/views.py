from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Quiz, Question, QuestionBankEntry
from .serializers import (
    QuizSerializer, QuestionSerializer, QuestionBankEntrySerializer
)
from apps.curriculum.models import CurriculumNode

class QuizViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Quizzes.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter by node_id if provided.
        """
        queryset = super().get_queryset()
        node_id = self.request.query_params.get('node_id')
        if node_id:
            queryset = queryset.filter(node_id=node_id)
        return queryset

    def perform_create(self, serializer):
        # Additional validation or logic could go here
        serializer.save()


class QuestionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Questions.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        quiz_id = self.request.query_params.get('quiz_id')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        return queryset

    @decorators.action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Reorder questions for a quiz.
        Expects: { "quiz_id": 1, "order": [q1_id, q2_id, ...] }
        """
        quiz_id = request.data.get('quiz_id')
        order = request.data.get('order', [])
        
        if not quiz_id:
            return Response({"error": "quiz_id required"}, status=400)
            
        questions = Question.objects.filter(quiz_id=quiz_id)
        q_map = {q.id: q for q in questions}
        
        updated = []
        for idx, q_id in enumerate(order):
            if q_id in q_map:
                question = q_map[q_id]
                question.position = idx
                updated.append(question)
                
        Question.objects.bulk_update(updated, ['position'])
        return Response({"status": "reordered"})


class QuestionBankViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Question Bank.
    """
    serializer_class = QuestionBankEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuestionBankEntry.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @decorators.action(detail=True, methods=['post'])
    def add_to_quiz(self, request, pk=None):
        """
        Copy a bank question to a specific quiz.
        Expects: { "quiz_id": 1 }
        """
        entry = self.get_object()
        quiz_id = request.data.get('quiz_id')
        quiz = get_object_or_404(Quiz, pk=quiz_id)
        
        # Clone question logic (simplified)
        original_q = entry.question
        new_q = Question.objects.create(
            quiz=quiz,
            question_type=original_q.question_type,
            text=original_q.text,
            points=original_q.points,
            position=quiz.questions.count(),
            answer_data=original_q.answer_data
        )
        
        # Clone related objects
        for opt in original_q.options.all():
            opt.pk = None
            opt.question = new_q
            opt.save()
            
        for pair in original_q.matching_pairs.all():
            pair.pk = None
            pair.question = new_q
            pair.save()
            
        for gap in original_q.gap_answers.all():
            gap.pk = None
            gap.question = new_q
            gap.save()
            
        entry.usage_count += 1
        entry.save()
        
        return Response(QuestionSerializer(new_q).data, status=201)
