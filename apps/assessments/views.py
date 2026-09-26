import math

from django.http import Http404
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import Count, Q
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
from .question_bank_access import (
    can_delete_bank,
    can_delete_entry,
    can_edit_bank,
    can_edit_entry,
    can_use_bank,
    get_visible_bank_or_404,
    manageable_question_banks,
    visible_entries,
    visible_question_banks,
)
from .question_bank_service import QuestionBankService
from apps.curriculum.models import CurriculumNode
from apps.core.api_permissions import (
    IsInstructorOrStaff,
    get_object_in_instructor_scope,
    scope_queryset_to_instructor_programs,
)
from apps.core.models import Program
from apps.core.utils import is_admin
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

        bank = get_visible_bank_or_404(
            request.user, request.data.get('bank'), program=quiz.node.program
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
        if 'bank' in request.data and str(request.data.get('bank')) != str(pool.bank_id):
            bank = get_visible_bank_or_404(
                request.user, request.data.get('bank'), program=quiz.node.program
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
        return (
            visible_entries(self.request.user, include_archived=True)
            .filter(owner=self.request.user)
            .select_related(
                "question__quiz__node__program",
                "bank",
            )
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

        # This API files entries only into banks the caller owns.
        bank_id = getattr(bank, "pk", bank)
        bank = (
            visible_question_banks(self.request.user, include_archived=True)
            .filter(pk=bank_id, owner=self.request.user)
            .first()
        )
        if bank is None:
            raise Http404("Not found.")
        return bank

    def _check_question_fits_bank(self, question, bank):
        if (
            question
            and bank
            and bank.scope == QuestionBank.SCOPE_COURSE
            and question.quiz.node.program_id != bank.program_id
        ):
            raise Http404("Not found.")

    def _validated_bank_entry_relations(self, serializer):
        question = serializer.validated_data.get("question")
        question = self._get_accessible_question(question) if question else None
        bank = self._get_accessible_bank(serializer.validated_data.get("bank"))
        if question is None and not serializer.validated_data.get("question_snapshot"):
            raise Http404("Not found.")
        self._check_question_fits_bank(question, bank)
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
        if not can_edit_entry(self.request.user, serializer.instance):
            raise PermissionDenied("You cannot edit questions in this bank.")
        question = serializer.validated_data.get("question", serializer.instance.question)
        bank = serializer.validated_data.get("bank", serializer.instance.bank)
        save_kwargs = {
            "question": self._get_accessible_question(question) if question else None,
            "bank": self._get_accessible_bank(bank),
        }
        self._check_question_fits_bank(save_kwargs["question"], save_kwargs["bank"])
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

    def perform_destroy(self, instance):
        if not can_delete_entry(self.request.user, instance):
            raise PermissionDenied("You cannot delete questions in this bank.")
        instance.delete()

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
        if entry.bank_id and not can_use_bank(
            request.user, entry.bank, program=quiz.node.program
        ):
            raise Http404("Not found.")
        new_question = QuestionBankService().copy_from_bank(entry, quiz)
        return Response(QuestionSerializer(new_question).data, status=201)


def _positive_int(value, default):
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    return number if number > 0 else default


def _is_true(value) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes"}


class QuestionLibraryViewSet(viewsets.ViewSet):
    """
    Question library across every bank an instructor can use.

    Works without a course (the Question Library pages) or for one course
    (the course builder), where course banks are limited to that course.
    """
    permission_classes = [IsInstructorOrStaff]
    paginate_by_default = True
    default_page_size = 25
    max_page_size = 100

    def _get_accessible_program(self, program_id):
        return get_object_in_instructor_scope(
            Program.objects.all(),
            self.request.user,
            "id",
            pk=program_id,
        )

    def _program(self, program_id=None):
        """The course from the URL, or an optional ?program= / body program."""
        if program_id is None:
            program_id = self.request.query_params.get("program")
            if program_id in (None, "") and self.request.method != "GET":
                program_id = self.request.data.get("program")
            if program_id in (None, ""):
                return None
        return self._get_accessible_program(program_id)

    def _get_program_quiz(self, program, quiz_id):
        quiz = get_object_in_instructor_scope(
            Quiz.objects.select_related("node", "node__program"),
            self.request.user,
            "node__program_id",
            pk=quiz_id,
        )
        if program is not None and quiz.node.program_id != program.id:
            raise Http404("Not found.")
        return quiz

    def _get_program_question(self, program, question_id):
        question = get_object_in_instructor_scope(
            Question.objects.select_related("quiz", "quiz__node", "quiz__node__program"),
            self.request.user,
            "quiz__node__program_id",
            pk=question_id,
        )
        if program is not None and question.quiz.node.program_id != program.id:
            raise Http404("Not found.")
        return question

    def _get_program_bank(self, program, bank_id):
        if not bank_id:
            return None
        user = self.request.user
        if is_admin(user):
            bank = (
                manageable_question_banks(user)
                .filter(pk=_positive_int(bank_id, 0))
                .first()
            )
            if bank is None:
                raise Http404("Question bank not found.")
            return bank
        return get_visible_bank_or_404(
            user, bank_id, program=program, include_archived=True
        )

    def _serializer_context(self):
        return {"request": self.request}

    def _paginated_entries(self, entries):
        params = self.request.query_params
        page_size = min(
            _positive_int(params.get("page_size"), self.default_page_size),
            self.max_page_size,
        )
        page = _positive_int(params.get("page"), 1)
        total = len(entries)
        start = (page - 1) * page_size
        return {
            "count": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": max(1, math.ceil(total / page_size)),
            "results": QuestionBankEntrySerializer(
                entries[start:start + page_size],
                many=True,
                context=self._serializer_context(),
            ).data,
        }

    def list(self, request, program_id=None):
        """
        Search library questions.
        Query params: query, category, bank_id, question_type, difficulty, tags,
        scope, owner_only, program, page, page_size
        """
        program = self._program(program_id)
        params = request.query_params
        tags = [
            value.strip()
            for value in params.get('tags', '').split(',')
            if value.strip()
        ]
        raw_bank_id = params.get('bank_id')
        try:
            bank_id = int(raw_bank_id) if raw_bank_id else None
        except (TypeError, ValueError):
            return _api_error(
                "Question bank filter must be a valid ID.",
                status_code=400,
                code="invalid_bank_id",
            )

        entries = QuestionBankService().search_library(
            request.user,
            program=program,
            scope=params.get('scope') or None,
            bank_id=bank_id,
            owner_only=_is_true(params.get('owner_only')),
            include_archived=_is_true(params.get('include_archived')),
            query=params.get('query') or None,
            category=params.get('category') or None,
            question_type=params.get('question_type') or None,
            difficulty=params.get('difficulty') or None,
            tags=tags,
        )
        if self.paginate_by_default or 'page' in params or 'page_size' in params:
            return Response(self._paginated_entries(entries))
        return Response(
            QuestionBankEntrySerializer(
                entries, many=True, context=self._serializer_context()
            ).data
        )

    def banks(self, request, program_id=None):
        """
        List question banks the user can use.
        Query params: program, scope, q, include_archived, manage (admins only)
        """
        program = self._program(program_id)
        params = request.query_params
        include_archived = _is_true(params.get('include_archived'))
        if _is_true(params.get('manage')):
            if not is_admin(request.user):
                return _api_error(
                    "Only administrators can manage every question bank.",
                    status_code=403,
                    code="permission_denied",
                )
            banks = manageable_question_banks(request.user)
            if not include_archived:
                banks = banks.filter(is_archived=False)
        else:
            banks = QuestionBankService().list_banks(
                request.user, program=program, include_archived=include_archived
            )
        if params.get('scope'):
            banks = banks.filter(scope=params.get('scope'))
        if params.get('q'):
            banks = banks.filter(name__icontains=params.get('q'))
        return Response(
            QuestionBankSerializer(
                banks, many=True, context=self._serializer_context()
            ).data
        )

    def create_bank(self, request, program_id=None):
        """
        Create a question bank.
        Expects: { "name", "scope" (course|instructor|institution), "program" (course
        banks outside course routes), "description", "category" }
        """
        program = self._program(program_id)
        name = str(request.data.get('name') or '').strip()
        if not name:
            return _api_error(
                "Please enter a question bank name.",
                status_code=400,
                code="name_required",
            )

        try:
            bank = QuestionBankService().create_bank(
                owner=request.user,
                name=name,
                scope=request.data.get('scope') or QuestionBank.SCOPE_COURSE,
                program=program,
                description=request.data.get('description', ''),
                category=request.data.get('category', ''),
            )
        except PermissionDenied as exc:
            return _api_error(str(exc), status_code=403, code="permission_denied")
        except ValidationError as exc:
            return _api_error(exc.messages[0], status_code=400, code="invalid_bank")

        return Response(
            QuestionBankSerializer(bank, context=self._serializer_context()).data,
            status=201,
        )

    def promote_bank(self, request, program_id=None, pk=None):
        """Make a course bank or instructor library a shared bank (administrators)."""
        if not is_admin(request.user):
            return _api_error(
                "Only administrators can share a bank with every instructor.",
                status_code=403,
                code="permission_denied",
            )
        bank = self._get_program_bank(None, pk)
        if bank.scope != QuestionBank.SCOPE_INSTITUTION:
            bank.scope = QuestionBank.SCOPE_INSTITUTION
            bank.program = None
            bank.full_clean()
            bank.save(update_fields=['scope', 'program', 'updated_at'])
        return Response(
            QuestionBankSerializer(bank, context=self._serializer_context()).data
        )

    def categories(self, request, program_id=None):
        """
        Get the categories used by banks and questions the user can see.
        """
        program = self._program(program_id)
        categories = QuestionBankService().list_categories(request.user, program=program)
        return Response({"categories": categories})

    def add_to_quiz(self, request, program_id=None, pk=None):
        """
        Copy a question from the library to a quiz.
        Expects: { "quiz_id": 1 }
        """
        program = self._program(program_id)
        entry = get_object_or_404(visible_entries(request.user, program=program), pk=pk)
        quiz_id = request.data.get('quiz_id')

        if not quiz_id:
            return _api_error(
                "Please choose a quiz before adding this question.",
                status_code=400,
                code="quiz_required",
            )

        quiz = self._get_program_quiz(program, quiz_id)
        if entry.bank_id and not can_use_bank(
            request.user, entry.bank, program=quiz.node.program
        ):
            raise Http404("Not found.")

        new_question = QuestionBankService().copy_from_bank(entry, quiz)

        return Response(QuestionSerializer(new_question).data, status=201)

    def save_to_library(self, request, program_id=None):
        """
        Save a question to a bank.
        Expects: { "question_id" or "questionSnapshot", "bank_id", "category", ... }
        """
        program = self._program(program_id)
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

        try:
            entry = QuestionBankService().add_to_bank(
                question=question,
                question_snapshot=question_snapshot,
                user=request.user,
                bank=bank,
                category=category,
                subject_area=request.data.get('subject_area', ''),
                difficulty=request.data.get('difficulty', 'medium'),
                tags=request.data.get('tags', [])
            )
        except PermissionDenied as exc:
            return _api_error(str(exc), status_code=403, code="permission_denied")
        except ValidationError as exc:
            return _api_error(exc.messages[0], status_code=400, code="invalid_question")

        return Response(
            QuestionBankEntrySerializer(entry, context=self._serializer_context()).data,
            status=201,
        )

    def entry_detail(self, request, program_id=None, pk=None):
        program = self._program(program_id)
        entry = get_object_or_404(
            visible_entries(request.user, program=program, include_archived=True),
            pk=pk,
        )
        if request.method == 'GET':
            data = QuestionBankEntrySerializer(
                entry, context=self._serializer_context()
            ).data
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
            if not can_delete_entry(request.user, entry):
                return _api_error(
                    "Only the question owner or an administrator can delete it.",
                    status_code=403,
                    code="permission_denied",
                )
            entry.delete()
            return Response(status=204)

        if not can_edit_entry(request.user, entry):
            return _api_error(
                "You cannot edit questions in this bank.",
                status_code=403,
                code="permission_denied",
            )
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
        except PermissionDenied as exc:
            return _api_error(str(exc), status_code=403, code="permission_denied")
        except ValidationError as exc:
            return _api_error(
                exc.messages[0], status_code=400, code="invalid_question"
            )
        return Response(
            QuestionBankEntrySerializer(updated, context=self._serializer_context()).data
        )

    def bank_detail(self, request, program_id=None, pk=None):
        program = self._program(program_id)
        bank = self._get_program_bank(program, pk)
        context = self._serializer_context()
        if request.method == 'GET':
            return Response(QuestionBankSerializer(bank, context=context).data)
        if request.method == 'DELETE':
            if not can_delete_bank(request.user, bank):
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
        if not can_edit_bank(request.user, bank):
            return _api_error(
                "You cannot edit this question bank.",
                status_code=403,
                code="permission_denied",
            )
        for field in ('name', 'description', 'category'):
            if field in request.data:
                setattr(bank, field, str(request.data.get(field) or '').strip())
        if 'is_archived' in request.data:
            bank.is_archived = _is_true(request.data.get('is_archived'))
        if not bank.name:
            return _api_error("Please enter a question bank name.", code="name_required")
        bank.save(update_fields=['name', 'description', 'category', 'is_archived', 'updated_at'])
        return Response(QuestionBankSerializer(bank, context=context).data)

    def stats(self, request, program_id=None):
        program = self._program(program_id)
        bank_id = _positive_int(request.query_params.get('bank_id'), None)
        entries = visible_entries(request.user, program=program)
        pools = QuizQuestionPool.objects.filter(is_active=True).select_related('bank', 'quiz')
        if program is not None:
            pools = pools.filter(quiz__node__program=program)
        else:
            pools = scope_queryset_to_instructor_programs(
                pools, request.user, 'quiz__node__program_id'
            )
        if bank_id:
            entries = entries.filter(bank_id=bank_id)
            pools = pools.filter(bank_id=bank_id)
        entries = entries.annotate(
            quiz_copy_count=Count('quiz_copies', distinct=True),
            attempt_selection_count=Count(
                'usage_events',
                filter=Q(usage_events__usage_type=QuestionBankUsage.ATTEMPT_SELECTION),
                distinct=True,
            ),
        )
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
                        'quizCopies': entry.quiz_copy_count,
                        'attemptSelections': entry.attempt_selection_count,
                    }
                    for entry in entries
                ],
                'poolLinks': pools.count(),
                'undersuppliedPools': undersupplied,
            }
        )


class ProgramQuestionLibraryViewSet(QuestionLibraryViewSet):
    """Course-builder routes: the same library, limited to one course."""
    paginate_by_default = False
