from django.http import Http404
from django.core.exceptions import ValidationError
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect
from inertia import render
from rest_framework import decorators, status, viewsets
from rest_framework.response import Response

from .models import (
    Quiz,
    Question,
    QuestionBankEntry,
    QuestionBankEntryRevision,
    QuestionBank,
    QuestionBankUsage,
    QuizQuestionPool,
    Rubric,
)
from .serializers import (
    QuizSerializer, QuestionSerializer, QuestionBankEntrySerializer,
    QuestionBankSerializer, QuizQuestionPoolSerializer, RubricSerializer
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
from apps.assessments.question_snapshots import (
    build_question_snapshot,
    normalize_question_snapshot,
    validate_quiz_question_pools,
)


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

    @decorators.action(detail=True, methods=['get', 'post'], url_path='question-pools')
    def question_pools(self, request, pk=None):
        quiz = self.get_object()
        if request.method == 'GET':
            pools = quiz.question_pools.select_related('bank').all()
            return Response(QuizQuestionPoolSerializer(pools, many=True).data)

        bank = get_object_or_404(
            QuestionBank,
            pk=request.data.get('bank'),
            program=quiz.node.program,
        )
        serializer = QuizQuestionPoolSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pool = serializer.save(
            quiz=quiz,
            bank=bank,
            created_by=request.user,
            position=quiz.question_pools.count(),
        )
        return Response(QuizQuestionPoolSerializer(pool).data, status=201)

    @decorators.action(
        detail=True,
        methods=['patch', 'delete'],
        url_path=r'question-pools/(?P<pool_id>[^/.]+)',
    )
    def question_pool_detail(self, request, pk=None, pool_id=None):
        quiz = self.get_object()
        pool = get_object_or_404(
            QuizQuestionPool.objects.select_related('bank'),
            pk=pool_id,
            quiz=quiz,
        )
        if request.method == 'DELETE':
            pool.delete()
            return Response(status=204)
        bank = pool.bank
        if 'bank' in request.data:
            bank = get_object_or_404(
                QuestionBank,
                pk=request.data.get('bank'),
                program=quiz.node.program,
            )
        serializer = QuizQuestionPoolSerializer(pool, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save(bank=bank)
        return Response(QuizQuestionPoolSerializer(updated).data)

    @decorators.action(detail=True, methods=['get'], url_path='question-pool-validation')
    def question_pool_validation(self, request, pk=None):
        quiz = self.get_object()
        issues = validate_quiz_question_pools(quiz)
        return Response({'valid': not issues, 'issues': issues})


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
            "bank__program_id",
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
        question = serializer.validated_data.get("question")
        question = self._get_accessible_question(question) if question else None
        bank = self._get_accessible_bank(serializer.validated_data.get("bank"))
        if question is None and not serializer.validated_data.get("question_snapshot"):
            raise Http404("Not found.")
        if question and bank and question.quiz.node.program_id != bank.program_id:
            raise Http404("Not found.")
        return question, bank

    def perform_create(self, serializer):
        question, bank = self._validated_bank_entry_relations(serializer)
        snapshot = serializer.validated_data.get("question_snapshot")
        if snapshot is None and question:
            snapshot = build_question_snapshot(question)
        else:
            snapshot = normalize_question_snapshot(snapshot)
        entry = serializer.save(
            owner=self.request.user,
            question=question,
            bank=bank,
            question_snapshot=snapshot,
            snapshot_version=1,
        )
        QuestionBankEntryRevision.objects.create(
            entry=entry,
            version=1,
            snapshot=snapshot,
            changed_by=self.request.user,
        )

    def perform_update(self, serializer):
        question = serializer.validated_data.get("question", serializer.instance.question)
        bank = serializer.validated_data.get("bank", serializer.instance.bank)
        save_kwargs = {
            "question": self._get_accessible_question(question) if question else None,
            "bank": self._get_accessible_bank(bank),
        }
        if "question_snapshot" in serializer.validated_data:
            save_kwargs["question_snapshot"] = normalize_question_snapshot(
                serializer.validated_data["question_snapshot"]
            )
        entry = serializer.save(
            **save_kwargs,
        )
        if "question_snapshot" in serializer.validated_data:
            entry.snapshot_version += 1
            entry.save(update_fields=["snapshot_version", "updated_at"])
            QuestionBankEntryRevision.objects.create(
                entry=entry,
                version=entry.snapshot_version,
                snapshot=entry.question_snapshot,
                changed_by=self.request.user,
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
        difficulty = request.query_params.get('difficulty', '')
        tags = [
            value.strip()
            for value in request.query_params.get('tags', '').split(',')
            if value.strip()
        ]

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
            question_type=question_type if question_type else None,
            difficulty=difficulty if difficulty else None,
            tags=tags,
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
        question_snapshot = request.data.get('questionSnapshot')
        bank_id = request.data.get('bank_id')
        category = request.data.get('category', '')

        if not question_id and not isinstance(question_snapshot, dict):
            return _api_error(
                "Please select a question to save.",
                status_code=400,
                code="question_required",
            )

        question = (
            self._get_program_question(program, question_id)
            if question_id
            else None
        )
        bank = self._get_program_bank(program, bank_id)
        if bank is None:
            return _api_error(
                "Please select a question bank.",
                status_code=400,
                code="bank_required",
            )

        service = QuestionBankService()
        entry = service.add_to_bank(
            question=question,
            question_snapshot=question_snapshot,
            user=request.user,
            bank=bank,
            category=category,
            difficulty=request.data.get('difficulty', 'medium'),
            tags=request.data.get('tags', [])
        )

        return Response(QuestionBankEntrySerializer(entry).data, status=201)

    def entry_detail(self, request, program_id=None, pk=None):
        program = self._get_accessible_program(program_id)
        entry = get_object_or_404(
            QuestionBankEntry.objects.select_related('bank', 'owner', 'question'),
            pk=pk,
            bank__program=program,
        )
        if request.method == 'GET':
            data = QuestionBankEntrySerializer(entry).data
            data['revisions'] = [
                {
                    'version': revision.version,
                    'createdAt': revision.created_at.isoformat(),
                    'changedBy': revision.changed_by_id,
                }
                for revision in entry.revisions.select_related('changed_by').all()
            ]
            return Response(data)
        if request.method == 'DELETE':
            if not (request.user.is_staff or request.user.is_superuser or entry.owner_id == request.user.id):
                return _api_error(
                    "Only the question owner or an administrator can delete it.",
                    status_code=403,
                    code="permission_denied",
                )
            entry.delete()
            return Response(status=204)

        bank = entry.bank
        if 'bank_id' in request.data:
            bank = self._get_program_bank(program, request.data.get('bank_id'))
        try:
            updated = QuestionBankService().update_entry(
                entry,
                actor=request.user,
                question_snapshot=request.data.get('questionSnapshot'),
                bank=bank,
                category=request.data.get('category') if 'category' in request.data else None,
                subject_area=(
                    request.data.get('subject_area')
                    if 'subject_area' in request.data
                    else None
                ),
                difficulty=(
                    request.data.get('difficulty')
                    if 'difficulty' in request.data
                    else None
                ),
                tags=request.data.get('tags') if 'tags' in request.data else None,
            )
        except ValidationError as exc:
            return _api_error(
                exc.messages[0], status_code=400, code="invalid_question"
            )
        return Response(QuestionBankEntrySerializer(updated).data)

    def bank_detail(self, request, program_id=None, pk=None):
        program = self._get_accessible_program(program_id)
        bank = get_object_or_404(QuestionBank, pk=pk, program=program)
        if request.method == 'GET':
            return Response(QuestionBankSerializer(bank).data)
        if request.method == 'DELETE':
            if not (request.user.is_staff or request.user.is_superuser or bank.owner_id == request.user.id):
                return _api_error(
                    "Only the bank owner or an administrator can delete it.",
                    status_code=403,
                    code="permission_denied",
                )
            if bank.quiz_pools.exists():
                return _api_error(
                    "Unlink this bank from active quiz pools before deleting it.",
                    status_code=409,
                    code="bank_in_use",
                )
            bank.delete()
            return Response(status=204)
        for field in ('name', 'description', 'category'):
            if field in request.data:
                setattr(bank, field, str(request.data.get(field) or '').strip())
        if not bank.name:
            return _api_error("Please enter a question bank name.", code="name_required")
        bank.save(update_fields=['name', 'description', 'category', 'updated_at'])
        return Response(QuestionBankSerializer(bank).data)

    def stats(self, request, program_id=None):
        program = self._get_accessible_program(program_id)
        entries = QuestionBankEntry.objects.filter(bank__program=program).select_related('bank')
        pools = QuizQuestionPool.objects.filter(
            quiz__node__program=program,
            is_active=True,
        ).select_related('bank', 'quiz')
        undersupplied = []
        quizzes = Quiz.objects.filter(question_pools__in=pools).distinct()
        for quiz in quizzes:
            for issue in validate_quiz_question_pools(quiz):
                undersupplied.append(
                    {
                        'poolId': issue['poolId'],
                        'quizId': quiz.id,
                        'bankId': issue['bankId'],
                        'required': issue['required'],
                        'available': issue['available'],
                    }
                )
        return Response(
            {
                'entries': [
                    {
                        'entryId': entry.id,
                        'bankId': entry.bank_id,
                        'usageCount': entry.usage_count,
                        'lastUsedAt': (
                            entry.last_used_at.isoformat() if entry.last_used_at else None
                        ),
                        'quizCopies': entry.quiz_copies.count(),
                        'attemptSelections': entry.usage_events.filter(
                            usage_type=QuestionBankUsage.ATTEMPT_SELECTION
                        ).count(),
                    }
                    for entry in entries
                ],
                'poolLinks': pools.count(),
                'undersuppliedPools': undersupplied,
            }
        )
