from django.http import Http404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from inertia import render
from rest_framework import decorators, status, viewsets
from rest_framework.response import Response

from .models import Quiz, Question, QuestionBankEntry, QuestionBank, Rubric
from .serializers import (
    QuizSerializer, QuestionSerializer, QuestionBankEntrySerializer,
    QuestionBankSerializer, RubricSerializer
)
from .question_bank_service import QuestionBankService
from apps.curriculum.models import CurriculumNode
from apps.core.api_permissions import (
    IsInstructorOrStaff,
    get_object_in_instructor_scope,
    scope_queryset_to_instructor_programs,
)
from apps.core.models import Program
from apps.assessments.services import RubricService


def _api_error(
    message: str,
    *,
    status_code: int = 400,
    code: str = "request_failed",
):
    return Response(
        {
            "code": code,
            "message": message,
            "error": message,
        },
        status=status_code,
    )


@login_required
def rubric_list(request):
    """
    Inertia view for listing rubrics.
    """
    service = RubricService()
    rubrics = service.get_accessible_rubrics(request.user)

    return render(request, 'Assessments/Rubrics/Index', {
        'rubrics': RubricSerializer(rubrics, many=True).data,
        'can_create': True,  # Permissions are handled by service, but UI might need a toggle
    })


@login_required
def rubric_create(request):
    """
    Inertia view for creating a rubric.
    """
    if request.method == 'POST':
        # Inertia submits JSON, so we use request.body via DRF serializer or manually
        # Standard Django request.POST handles form data, but Inertia sends JSON.
        # However, with inertia-django, if content type is json, it's parsed.
        # For complex nested JSON like 'dimensions', using the Serializer is easiest.
        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return _api_error(
                "We could not read your request. "
                "Please refresh and try again.",
                status_code=400,
                code="invalid_request",
            )

        # Security Check: Scope Permissions
        scope = data.get('scope', 'course')
        if scope == 'global' and not request.user.is_superuser:
            return _api_error(
                "Only superadmins can create global rubrics.",
                status_code=403,
                code="permission_denied",
            )

        if scope == 'program':
            if not (request.user.is_staff or request.user.is_superuser):
                return _api_error(
                    "Only admins can create program rubrics.",
                    status_code=403,
                    code="permission_denied",
                )

            # For admins, ensure they provide a program (optional check)
            program_id = data.get('program')
            if not program_id:
                return _api_error(
                    "Please select a program for this rubric.",
                    status_code=400,
                    code="program_required",
                )

        serializer = RubricSerializer(data=data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            messages.success(request, 'Rubric created successfully.')
            return redirect('assessments:rubric_list')

        # Return errors
        return render(request, 'Assessments/Rubrics/Create', {
            'errors': serializer.errors,
            'old_input': data
        })

    return render(request, 'Assessments/Rubrics/Create', {})


@login_required
def rubric_edit(request, pk):
    """
    Inertia view for editing a rubric.
    """
    service = RubricService()
    # Ensure user can access this rubric
    rubric = get_object_or_404(service.get_accessible_rubrics(request.user), pk=pk)

    if request.method == 'POST':
        import json
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
             return _api_error(
                 "We could not read your request. Please refresh and try again.",
                 status_code=400,
                 code="invalid_request",
             )

        # Security Check: Scope Modification
        new_scope = data.get('scope', rubric.scope)
        if new_scope != rubric.scope:
             # Validate permission to change to new scope
            if new_scope == 'global' and not request.user.is_superuser:
                return _api_error(
                    "Only superadmins can create global rubrics.",
                    status_code=403,
                    code="permission_denied",
                )
            if new_scope == 'program' and not (request.user.is_staff or request.user.is_superuser):
                return _api_error(
                    "Only admins can create program rubrics.",
                    status_code=403,
                    code="permission_denied",
                )

        serializer = RubricSerializer(rubric, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            messages.success(request, 'Rubric updated successfully.')
            return redirect('assessments:rubric_list')

        return render(request, 'Assessments/Rubrics/Edit', {
            'rubric': RubricSerializer(rubric).data,
            'errors': serializer.errors
        })

    return render(request, 'Assessments/Rubrics/Edit', {
        'rubric': RubricSerializer(rubric).data
    })


class QuizViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Quizzes.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsInstructorOrStaff]

    def get_queryset(self):
        """
        Filter by node_id if provided.
        """
        queryset = scope_queryset_to_instructor_programs(
            Quiz.objects.select_related("node", "node__program"),
            self.request.user,
            "node__program_id",
        )
        node_id = self.request.query_params.get('node_id')
        if node_id:
            queryset = queryset.filter(node_id=node_id)
        return queryset

    def _get_accessible_node(self, node):
        node_id = getattr(node, "pk", node)
        return get_object_in_instructor_scope(
            CurriculumNode.objects.select_related("program"),
            self.request.user,
            "program_id",
            pk=node_id,
        )

    def perform_create(self, serializer):
        node = self._get_accessible_node(serializer.validated_data["node"])
        serializer.save(node=node)

    def perform_update(self, serializer):
        node = serializer.validated_data.get("node", serializer.instance.node)
        serializer.save(node=self._get_accessible_node(node))


class QuestionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Questions.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsInstructorOrStaff]

    def get_queryset(self):
        queryset = scope_queryset_to_instructor_programs(
            Question.objects.select_related("quiz", "quiz__node", "quiz__node__program"),
            self.request.user,
            "quiz__node__program_id",
        )
        quiz_id = self.request.query_params.get('quiz_id')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        return queryset

    def _get_accessible_quiz(self, quiz):
        quiz_id = getattr(quiz, "pk", quiz)
        return get_object_in_instructor_scope(
            Quiz.objects.select_related("node", "node__program"),
            self.request.user,
            "node__program_id",
            pk=quiz_id,
        )

    def perform_create(self, serializer):
        quiz = self._get_accessible_quiz(serializer.validated_data["quiz"])
        serializer.save(quiz=quiz)

    def perform_update(self, serializer):
        quiz = serializer.validated_data.get("quiz", serializer.instance.quiz)
        serializer.save(quiz=self._get_accessible_quiz(quiz))

    @decorators.action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Reorder questions for a quiz.
        Expects: { "quiz_id": 1, "order": [q1_id, q2_id, ...] }
        """
        quiz_id = request.data.get('quiz_id')
        order = request.data.get('order', [])

        if not quiz_id:
            return _api_error(
                "Please choose a quiz before reordering questions.",
                status_code=400,
                code="quiz_required",
            )

        quiz = self._get_accessible_quiz(quiz_id)
        questions = Question.objects.filter(quiz=quiz)
        q_map = {q.id: q for q in questions}

        invalid_ids = []
        normalized_order = []
        for q_id in order:
            try:
                normalized_q_id = int(q_id)
            except (TypeError, ValueError):
                invalid_ids.append(q_id)
                continue
            if normalized_q_id not in q_map:
                invalid_ids.append(q_id)
                continue
            normalized_order.append(normalized_q_id)

        if invalid_ids:
            return _api_error(
                "Question order included questions outside the selected quiz.",
                status_code=400,
                code="invalid_question_ids",
            )

        updated = []
        for idx, q_id in enumerate(normalized_order):
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
    permission_classes = [IsInstructorOrStaff]

    def get_queryset(self):
        queryset = QuestionBankEntry.objects.select_related(
            "question",
            "question__quiz",
            "question__quiz__node",
            "question__quiz__node__program",
            "bank",
        ).filter(owner=self.request.user)
        return scope_queryset_to_instructor_programs(
            queryset,
            self.request.user,
            "question__quiz__node__program_id",
        )

    def _get_accessible_question(self, question):
        question_id = getattr(question, "pk", question)
        return get_object_in_instructor_scope(
            Question.objects.select_related("quiz", "quiz__node", "quiz__node__program"),
            self.request.user,
            "quiz__node__program_id",
            pk=question_id,
        )

    def _get_accessible_quiz(self, quiz):
        quiz_id = getattr(quiz, "pk", quiz)
        return get_object_in_instructor_scope(
            Quiz.objects.select_related("node", "node__program"),
            self.request.user,
            "node__program_id",
            pk=quiz_id,
        )

    def _get_accessible_bank(self, bank):
        if bank is None:
            return None

        bank_id = getattr(bank, "pk", bank)
        bank = get_object_in_instructor_scope(
            QuestionBank.objects.select_related("program"),
            self.request.user,
            "program_id",
            pk=bank_id,
            owner=self.request.user,
        )
        return bank

    def _validated_bank_entry_relations(self, serializer):
        question = self._get_accessible_question(serializer.validated_data["question"])
        bank = self._get_accessible_bank(serializer.validated_data.get("bank"))
        return question, bank

    def perform_create(self, serializer):
        question, bank = self._validated_bank_entry_relations(serializer)
        serializer.save(owner=self.request.user, question=question, bank=bank)

    def perform_update(self, serializer):
        question = serializer.validated_data.get("question", serializer.instance.question)
        bank = serializer.validated_data.get("bank", serializer.instance.bank)
        serializer.save(
            question=self._get_accessible_question(question),
            bank=self._get_accessible_bank(bank),
        )

    @decorators.action(detail=True, methods=['post'])
    def add_to_quiz(self, request, pk=None):
        """
        Copy a bank question to a specific quiz.
        Expects: { "quiz_id": 1 }
        """
        entry = self.get_object()
        quiz_id = request.data.get('quiz_id')
        if not quiz_id:
            return _api_error(
                "Please choose a quiz before adding this question.",
                status_code=400,
                code="quiz_required",
            )

        quiz = self._get_accessible_quiz(quiz_id)
        new_question = QuestionBankService().copy_from_bank(entry, quiz)
        return Response(QuestionSerializer(new_question).data, status=201)


class ProgramQuestionLibraryViewSet(viewsets.ViewSet):
    """
    API endpoint for program-scoped Question Library.
    All instructors on a program can access and share questions.
    """
    permission_classes = [IsInstructorOrStaff]

    def _get_accessible_program(self, program_id):
        return get_object_in_instructor_scope(
            Program.objects.all(),
            self.request.user,
            "id",
            pk=program_id,
        )

    def _get_program_quiz(self, program, quiz_id):
        quiz = get_object_in_instructor_scope(
            Quiz.objects.select_related("node", "node__program"),
            self.request.user,
            "node__program_id",
            pk=quiz_id,
        )
        if quiz.node.program_id != program.id:
            raise Http404("Not found.")
        return quiz

    def _get_program_question(self, program, question_id):
        question = get_object_in_instructor_scope(
            Question.objects.select_related("quiz", "quiz__node", "quiz__node__program"),
            self.request.user,
            "quiz__node__program_id",
            pk=question_id,
        )
        if question.quiz.node.program_id != program.id:
            raise Http404("Not found.")
        return question

    def _get_program_bank(self, program, bank_id):
        if not bank_id:
            return None

        bank = get_object_in_instructor_scope(
            QuestionBank.objects.select_related("program"),
            self.request.user,
            "program_id",
            pk=bank_id,
        )
        if bank.program_id != program.id:
            raise Http404("Not found.")
        return bank

    def list(self, request, program_id=None):
        """
        Search questions in a program's library.
        Query params: query, category, bank_id, question_type
        """
        program = self._get_accessible_program(program_id)

        # Get query params
        query = request.query_params.get('query', '')
        category = request.query_params.get('category', '')
        raw_bank_id = request.query_params.get('bank_id')
        question_type = request.query_params.get('question_type', '')

        try:
            bank_id = int(raw_bank_id) if raw_bank_id else None
        except (TypeError, ValueError):
            return _api_error(
                "Question bank filter must be a valid ID.",
                status_code=400,
                code="invalid_bank_id",
            )

        service = QuestionBankService()
        entries = service.search_program_library(
            program=program,
            query=query if query else None,
            category=category if category else None,
            bank_id=bank_id,
            question_type=question_type if question_type else None
        )

        serializer = QuestionBankEntrySerializer(entries, many=True)
        return Response(serializer.data)

    @decorators.action(detail=False, methods=['get'])
    def banks(self, request, program_id=None):
        """
        List all question banks for a program.
        """
        program = self._get_accessible_program(program_id)
        service = QuestionBankService()
        banks = service.get_program_banks(program)
        serializer = QuestionBankSerializer(banks, many=True)
        return Response(serializer.data)

    @decorators.action(detail=False, methods=['post'])
    def create_bank(self, request, program_id=None):
        """
        Create a new question bank for a program.
        Expects: { "name": "Bank Name", "description": "...", "category": "..." }
        """
        program = self._get_accessible_program(program_id)

        name = request.data.get('name', '').strip()
        if not name:
            return _api_error(
                "Please enter a question bank name.",
                status_code=400,
                code="name_required",
            )

        service = QuestionBankService()
        bank = service.create_bank(
            program=program,
            owner=request.user,
            name=name,
            description=request.data.get('description', ''),
            category=request.data.get('category', '')
        )

        return Response(QuestionBankSerializer(bank).data, status=201)

    @decorators.action(detail=False, methods=['get'])
    def categories(self, request, program_id=None):
        """
        Get all unique categories for a program's questions.
        """
        program = self._get_accessible_program(program_id)
        service = QuestionBankService()
        categories = service.get_categories(program)
        return Response({"categories": categories})

    @decorators.action(detail=True, methods=['post'], url_path='add-to-quiz')
    def add_to_quiz(self, request, program_id=None, pk=None):
        """
        Copy a question from the library to a quiz.
        Expects: { "quiz_id": 1 }
        """
        program = self._get_accessible_program(program_id)
        entry = get_object_or_404(QuestionBankEntry, pk=pk, bank__program=program)
        quiz_id = request.data.get('quiz_id')

        if not quiz_id:
            return _api_error(
                "Please choose a quiz before adding this question.",
                status_code=400,
                code="quiz_required",
            )

        quiz = self._get_program_quiz(program, quiz_id)

        service = QuestionBankService()
        new_question = service.copy_from_bank(entry, quiz)

        return Response(QuestionSerializer(new_question).data, status=201)

    @decorators.action(detail=False, methods=['post'], url_path='save-to-library')
    def save_to_library(self, request, program_id=None):
        """
        Save a question to the program's library.
        Expects: { "question_id": 1, "bank_id": 1, "category": "..." }
        """
        program = self._get_accessible_program(program_id)
        question_id = request.data.get('question_id')
        bank_id = request.data.get('bank_id')
        category = request.data.get('category', '')

        if not question_id:
            return _api_error(
                "Please select a question to save.",
                status_code=400,
                code="question_required",
            )

        question = self._get_program_question(program, question_id)
        bank = self._get_program_bank(program, bank_id)

        service = QuestionBankService()
        entry = service.add_to_bank(
            question=question,
            user=request.user,
            bank=bank,
            category=category,
            difficulty=request.data.get('difficulty', 'medium'),
            tags=request.data.get('tags', [])
        )

        return Response(QuestionBankEntrySerializer(entry).data, status=201)
