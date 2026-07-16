from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

from apps.core.models import Program, User

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
    """Program-scoped persistent question-bank operations."""

    def create_bank(
        self,
        program: Program,
        owner: User,
        name: str,
        description: str = "",
        category: str = "",
    ) -> QuestionBank:
        return QuestionBank.objects.create(
            program=program,
            owner=owner,
            name=str(name or "").strip(),
            description=str(description or "").strip(),
            category=str(category or "").strip(),
        )

    def get_program_banks(self, program: Program):
        return QuestionBank.objects.filter(program=program).order_by("name")

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
        if question and bank and question.quiz.node.program_id != bank.program_id:
            raise ValidationError("Question and bank must belong to the same course.")
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
            source_bank_entry=entry,
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

    def search_program_library(
        self,
        program: Program,
        query: str | None = None,
        category: str | None = None,
        bank_id: int | None = None,
        question_type: str | None = None,
        difficulty: str | None = None,
        tags: list | None = None,
    ):
        queryset = QuestionBankEntry.objects.filter(bank__program=program).select_related(
            "question", "bank", "owner"
        )
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
        if bank_id:
            queryset = queryset.filter(bank_id=bank_id)
        if question_type:
            queryset = queryset.filter(question_snapshot__question_type=question_type)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        entries = list(queryset.order_by("-created_at"))
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

    def get_categories(self, program: Program) -> list[str]:
        bank_categories = QuestionBank.objects.filter(program=program).values_list(
            "category", flat=True
        )
        entry_categories = QuestionBankEntry.objects.filter(
            bank__program=program
        ).values_list("category", flat=True)
        return sorted({value for value in [*bank_categories, *entry_categories] if value})

    def search_bank(self, user: User, query: str = None, tags: list = None):
        queryset = QuestionBankEntry.objects.filter(owner=user)
        if query:
            queryset = queryset.filter(
                Q(question_snapshot__text__icontains=query)
                | Q(subject_area__icontains=query)
            )
        entries = list(queryset)
        if tags:
            required = {str(tag).strip().lower() for tag in tags}
            entries = [
                entry
                for entry in entries
                if required.issubset({str(tag).strip().lower() for tag in entry.tags})
            ]
        return entries
