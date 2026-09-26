from __future__ import annotations

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

from apps.core.models import Program, User

from .question_bank_access import (
    can_create_bank,
    can_edit_bank,
    visible_entries,
    visible_question_banks,
)
from .models import (
    Question,
    QuestionBank,
    QuestionBankEntry,
    QuestionBankEntryRevision,
    QuestionBankUsage,
    QuestionGapAnswer,
    QuestionImageMatchingPair,
    QuestionMatchingPair,
    QuestionOption,
    Quiz,
)
from .question_snapshots import (
    build_question_snapshot,
    normalize_question_snapshot,
)


class QuestionBankService:
    """Persistent question-bank operations for course, library and shared banks."""

    def create_bank(
        self,
        owner: User,
        name: str,
        *,
        program: Program | None = None,
        scope: str = QuestionBank.SCOPE_COURSE,
        description: str = "",
        category: str = "",
    ) -> QuestionBank:
        if scope not in {value for value, _ in QuestionBank.SCOPE_CHOICES}:
            raise ValidationError("Select a valid question bank type.")
        if scope == QuestionBank.SCOPE_COURSE and program is None:
            raise ValidationError("Select the course this bank belongs to.")
        if not can_create_bank(owner, scope, program):
            raise PermissionDenied("You cannot create this kind of question bank.")
        bank = QuestionBank(
            scope=scope,
            program=program if scope == QuestionBank.SCOPE_COURSE else None,
            owner=owner,
            name=str(name or "").strip(),
            description=str(description or "").strip(),
            category=str(category or "").strip(),
        )
        bank.full_clean()
        bank.save()
        return bank

    def list_banks(self, user: User, *, program: Program | None = None, include_archived=False):
        return visible_question_banks(
            user, program=program, include_archived=include_archived
        )

    @transaction.atomic
    def add_to_bank(
        self,
        question: Question | None,
        user: User,
        bank: QuestionBank | None = None,
        tags: list | None = None,
        subject_area: str = "",
        category: str = "",
        difficulty: str = "medium",
        question_snapshot: dict | None = None,
    ) -> QuestionBankEntry:
        if question is None and not question_snapshot:
            raise ValidationError("Question content is required.")
        snapshot = normalize_question_snapshot(
            question_snapshot if question_snapshot is not None else build_question_snapshot(question)
        )
        valid_difficulties = {
            value for value, _ in QuestionBankEntry.DIFFICULTY_CHOICES
        }
        if difficulty not in valid_difficulties:
            raise ValidationError("Select a valid question difficulty.")
        if bank is not None:
            self._check_bank_accepts(user, bank, question)
        entry = QuestionBankEntry.objects.create(
            owner=user,
            question=question,
            bank=bank,
            tags=[str(tag).strip() for tag in (tags or []) if str(tag).strip()],
            subject_area=str(subject_area or "").strip(),
            category=str(category or "").strip(),
            difficulty=difficulty,
            question_snapshot=snapshot,
            snapshot_version=1,
        )
        QuestionBankEntryRevision.objects.create(
            entry=entry,
            version=1,
            snapshot=snapshot,
            changed_by=user,
        )
        return entry

    @transaction.atomic
    def update_entry(
        self,
        entry: QuestionBankEntry,
        *,
        actor: User,
        question_snapshot: dict | None = None,
        bank=None,
        category=None,
        subject_area=None,
        difficulty=None,
        tags=None,
    ) -> QuestionBankEntry:
        update_fields = ["updated_at"]
        if difficulty is not None and difficulty not in {
            value for value, _ in QuestionBankEntry.DIFFICULTY_CHOICES
        }:
            raise ValidationError("Select a valid question difficulty.")
        if bank is not None and bank.pk != entry.bank_id:
            if entry.bank_id and not can_edit_bank(actor, entry.bank):
                raise PermissionDenied("You cannot move questions out of this bank.")
            self._check_bank_accepts(actor, bank, entry.question)
        if question_snapshot is not None:
            entry.snapshot_version += 1
            entry.question_snapshot = normalize_question_snapshot(question_snapshot)
            update_fields.extend(["snapshot_version", "question_snapshot"])
            QuestionBankEntryRevision.objects.create(
                entry=entry,
                version=entry.snapshot_version,
                snapshot=entry.question_snapshot,
                changed_by=actor,
            )
        for field, value in {
            "bank": bank,
            "category": category,
            "subject_area": subject_area,
            "difficulty": difficulty,
            "tags": tags,
        }.items():
            if value is not None:
                if field == "tags":
                    value = [str(tag).strip() for tag in value if str(tag).strip()]
                elif field in {"category", "subject_area"}:
                    value = str(value or "").strip()
                setattr(entry, field, value)
                update_fields.append(field)
        entry.save(update_fields=list(dict.fromkeys(update_fields)))
        return entry

    @transaction.atomic
    def copy_from_bank(self, entry: QuestionBankEntry, target_quiz: Quiz) -> Question:
        snapshot = normalize_question_snapshot(entry.question_snapshot)
        new_question = Question.objects.create(
            quiz=target_quiz,
            question_type=snapshot["question_type"],
            text=snapshot["text"],
            points=snapshot["points"],
            position=target_quiz.questions.count(),
            answer_data=snapshot["answer_data"],
            explanation=snapshot["explanation"],
            hint=snapshot["hint"],
            source_bank_entry=entry,
            source_bank_entry_version=entry.snapshot_version,
        )
        for option in snapshot["options"]:
            QuestionOption.objects.create(
                question=new_question,
                text=option["text"],
                is_correct=option["is_correct"],
                position=option["position"],
            )
        for pair in snapshot["matching_pairs"]:
            QuestionMatchingPair.objects.create(
                question=new_question,
                left_text=pair["left_text"],
                right_text=pair["right_text"],
                explanation=pair["explanation"],
                position=pair["position"],
            )
        for gap in snapshot["gap_answers"]:
            QuestionGapAnswer.objects.create(
                question=new_question,
                gap_index=gap["gap_index"],
                accepted_answers=gap["accepted_answers"],
                explanation=gap["explanation"],
            )
        for pair in snapshot["image_matching_pairs"]:
            QuestionImageMatchingPair.objects.create(
                question=new_question,
                question_text=pair["question_text"],
                question_image=pair["question_image"],
                answer_text=pair["answer_text"],
                answer_image=pair["answer_image"],
                explanation=pair["explanation"],
                position=pair["position"],
            )
        _, created = QuestionBankUsage.objects.get_or_create(
            usage_type=QuestionBankUsage.COPY,
            entry=entry,
            quiz=target_quiz,
            question=new_question,
        )
        if created:
            QuestionBankEntry.objects.filter(pk=entry.pk).update(
                usage_count=F("usage_count") + 1,
                last_used_at=timezone.now(),
            )
        return new_question

    def _check_bank_accepts(self, user: User, bank: QuestionBank, question: Question | None):
        if not can_edit_bank(user, bank):
            raise PermissionDenied("You cannot add questions to this bank.")
        if (
            question is not None
            and bank.scope == QuestionBank.SCOPE_COURSE
            and question.quiz.node.program_id != bank.program_id
        ):
            raise ValidationError("Question and bank must belong to the same course.")

    def search_library(
        self,
        user: User,
        *,
        program: Program | None = None,
        scope: str | None = None,
        bank_id: int | None = None,
        owner_only: bool = False,
        include_archived: bool = False,
        query: str | None = None,
        category: str | None = None,
        question_type: str | None = None,
        difficulty: str | None = None,
        tags: list | None = None,
    ) -> list[QuestionBankEntry]:
        queryset = visible_entries(
            user, program=program, include_archived=include_archived
        )
        if scope:
            queryset = queryset.filter(bank__scope=scope)
        if bank_id:
            queryset = queryset.filter(bank_id=bank_id)
        if owner_only:
            queryset = queryset.filter(owner=user)
        if query:
            queryset = queryset.filter(
                Q(question_snapshot__text__icontains=query)
                | Q(subject_area__icontains=query)
                | Q(category__icontains=query)
            )
        if category:
            queryset = queryset.filter(
                Q(category__iexact=category) | Q(bank__category__iexact=category)
            )
        if question_type:
            queryset = queryset.filter(question_snapshot__question_type=question_type)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        entries = list(queryset.order_by("-created_at", "-id"))
        required_tags = {str(tag).strip().lower() for tag in (tags or []) if str(tag).strip()}
        if required_tags:
            entries = [
                entry
                for entry in entries
                if required_tags.issubset(
                    {str(tag).strip().lower() for tag in (entry.tags or [])}
                )
            ]
        return entries

    def list_categories(self, user: User, *, program: Program | None = None) -> list[str]:
        bank_categories = visible_question_banks(user, program=program).values_list(
            "category", flat=True
        )
        entry_categories = visible_entries(user, program=program).values_list(
            "category", flat=True
        )
        return sorted({value for value in [*bank_categories, *entry_categories] if value})
