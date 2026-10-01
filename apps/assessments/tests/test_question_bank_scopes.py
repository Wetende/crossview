from importlib import import_module

import pytest
from django.apps import apps as django_apps
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.assessments.models import (
    Question,
    QuestionBank,
    QuestionBankEntry,
    Quiz,
    QuizQuestionPool,
)
from apps.assessments.question_bank_service import QuestionBankService
from apps.assessments.serializers import QuestionBankSerializer
from apps.core.tests.factories import UserFactory
from apps.progression.models import InstructorAssignment
from apps.progression.tests.factories import CurriculumNodeFactory, ProgramFactory


SNAPSHOT = {
    "question_type": "true_false",
    "text": "The earth orbits the sun.",
    "points": 1,
    "answer_data": {"correct": True},
}


def make_quiz(program):
    node = CurriculumNodeFactory(program=program)
    return Quiz.objects.create(node=node, title="Scoped bank quiz")


def instructor_for(program):
    user = UserFactory()
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    InstructorAssignment.objects.create(instructor=user, program=program)
    return user


@pytest.mark.django_db
def test_banks_default_to_course_scope():
    bank = QuestionBank.objects.create(
        program=ProgramFactory(), owner=UserFactory(), name="Course bank"
    )

    assert bank.scope == QuestionBank.SCOPE_COURSE
    assert bank.is_archived is False


@pytest.mark.django_db
def test_course_scope_requires_program():
    with pytest.raises(IntegrityError), transaction.atomic():
        QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_COURSE, owner=UserFactory(), name="No course"
        )


@pytest.mark.django_db
@pytest.mark.parametrize("scope", ["instructor", "institution"])
def test_shared_scopes_cannot_belong_to_a_course(scope):
    with pytest.raises(IntegrityError), transaction.atomic():
        QuestionBank.objects.create(
            scope=scope, program=ProgramFactory(), owner=UserFactory(), name="Shared"
        )


@pytest.mark.django_db
def test_shared_scopes_are_valid_without_a_course():
    owner = UserFactory()
    library = QuestionBank.objects.create(
        scope=QuestionBank.SCOPE_INSTRUCTOR, owner=owner, name="My library"
    )
    shared = QuestionBank.objects.create(
        scope=QuestionBank.SCOPE_INSTITUTION, owner=None, name="Shared bank"
    )

    library.full_clean()
    shared.full_clean()
    assert str(library) == "My library (Instructor library)"
    assert str(shared) == "Shared bank (Shared)"


@pytest.mark.django_db
def test_instructor_library_requires_an_owner():
    bank = QuestionBank(scope=QuestionBank.SCOPE_INSTRUCTOR, owner=None, name="Orphan")

    with pytest.raises(ValidationError) as excinfo:
        bank.full_clean()

    assert "owner" in excinfo.value.message_dict


@pytest.mark.django_db
def test_clean_rejects_course_bank_without_program():
    bank = QuestionBank(scope=QuestionBank.SCOPE_COURSE, owner=UserFactory(), name="X")

    with pytest.raises(ValidationError) as excinfo:
        bank.full_clean()

    assert "program" in excinfo.value.message_dict


@pytest.mark.django_db
def test_deleting_owner_keeps_pooled_bank_and_its_entries():
    program = ProgramFactory()
    owner = instructor_for(program)
    bank = QuestionBank.objects.create(program=program, owner=owner, name="Pooled")
    entry = QuestionBankService().add_to_bank(
        question=None, user=owner, bank=bank, question_snapshot=SNAPSHOT
    )
    QuizQuestionPool.objects.create(quiz=make_quiz(program), bank=bank, question_count=1)

    owner.delete()

    bank.refresh_from_db()
    entry.refresh_from_db()
    assert bank.owner is None
    assert entry.owner is None
    assert entry.bank_id == bank.id


@pytest.mark.django_db
def test_question_stores_the_bank_version_it_was_copied_from():
    program = ProgramFactory()
    question = Question.objects.create(
        quiz=make_quiz(program),
        question_type="true_false",
        text="Copied",
        answer_data={"correct": True},
        source_bank_entry_version=3,
    )

    question.refresh_from_db()
    assert question.source_bank_entry_version == 3


@pytest.mark.django_db
def test_migration_backfills_versions_for_existing_copies():
    program = ProgramFactory()
    owner = instructor_for(program)
    bank = QuestionBank.objects.create(program=program, owner=owner, name="Legacy")
    entry = QuestionBankService().add_to_bank(
        question=None, user=owner, bank=bank, question_snapshot=SNAPSHOT
    )
    QuestionBankEntry.objects.filter(pk=entry.pk).update(snapshot_version=4)
    linked = Question.objects.create(
        quiz=make_quiz(program),
        question_type="true_false",
        text="Linked copy",
        answer_data={"correct": True},
        source_bank_entry=entry,
    )
    unlinked = Question.objects.create(
        quiz=make_quiz(program),
        question_type="true_false",
        text="Manual question",
        answer_data={"correct": True},
    )
    migration = import_module("apps.assessments.migrations.0022_question_bank_scopes")

    migration.backfill_source_versions(django_apps, None)

    linked.refresh_from_db()
    unlinked.refresh_from_db()
    assert linked.source_bank_entry_version == 4
    assert unlinked.source_bank_entry_version is None


@pytest.mark.django_db
def test_bank_serializer_handles_banks_without_course_or_owner():
    bank = QuestionBank.objects.create(
        scope=QuestionBank.SCOPE_INSTITUTION, owner=None, name="Shared bank"
    )

    data = QuestionBankSerializer(bank).data

    assert data["scope"] == QuestionBank.SCOPE_INSTITUTION
    assert data["is_archived"] is False
    assert data["program"] is None
    assert data["program_name"] is None
    assert data["owner_name"] is None
    assert data["entries_count"] == 0


@pytest.mark.django_db
def test_bank_serializer_reports_course_and_owner_names():
    owner = UserFactory(first_name="Ada", last_name="Lovelace")
    program = ProgramFactory(name="Circuits")
    bank = QuestionBank.objects.create(program=program, owner=owner, name="Course bank")

    data = QuestionBankSerializer(bank).data

    assert data["scope"] == QuestionBank.SCOPE_COURSE
    assert data["program"] == program.id
    assert data["program_name"] == "Circuits"
    assert data["owner_name"] == "Ada Lovelace"
