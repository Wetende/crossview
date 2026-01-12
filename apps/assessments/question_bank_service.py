from django.db.models import Q
from apps.core.models import User
from .models import Question, QuestionBankEntry, Quiz, QuestionOption, QuestionMatchingPair, QuestionGapAnswer

class QuestionBankService:
    """
    Service for managing reusable question library.
    """
    
    def add_to_bank(self, question: Question, user: User, tags: list = None, subject_area: str = '', difficulty: str = 'medium') -> QuestionBankEntry:
        """
        Add a question to user's bank.
        """
        entry = QuestionBankEntry.objects.create(
            owner=user,
            question=question,
            tags=tags or [],
            subject_area=subject_area,
            difficulty=difficulty
        )
        return entry

    def copy_from_bank(self, entry: QuestionBankEntry, target_quiz: Quiz) -> Question:
        """
        Copy a bank question to a quiz.
        """
        original_q = entry.question
        
        # Create new question instance
        new_q = Question.objects.create(
            quiz=target_quiz,
            question_type=original_q.question_type,
            text=original_q.text,
            points=original_q.points,
            position=target_quiz.questions.count(),
            answer_data=original_q.answer_data
        )
        
        # Clone related objects
        for opt in original_q.options.all():
            QuestionOption.objects.create(
                question=new_q,
                text=opt.text,
                is_correct=opt.is_correct,
                position=opt.position
            )
            
        for pair in original_q.matching_pairs.all():
            QuestionMatchingPair.objects.create(
                question=new_q,
                left_text=pair.left_text,
                right_text=pair.right_text,
                position=pair.position
            )
            
        for gap in original_q.gap_answers.all():
            QuestionGapAnswer.objects.create(
                question=new_q,
                gap_index=gap.gap_index,
                accepted_answers=gap.accepted_answers
            )
            
        entry.usage_count += 1
        entry.save()
        
        return new_q

    def search_bank(self, user: User, query: str = None, tags: list = None) -> 'QuerySet[QuestionBankEntry]':
        """
        Search user's question bank.
        """
        queryset = QuestionBankEntry.objects.filter(owner=user)
        
        if query:
            queryset = queryset.filter(
                Q(question__text__icontains=query) |
                Q(subject_area__icontains=query)
            )
            
        if tags:
            # Simple tag filtering (contains any)
            # For exact matching logic might need more complex query
            for tag in tags:
                queryset = queryset.filter(tags__contains=tag)
                
        return queryset
