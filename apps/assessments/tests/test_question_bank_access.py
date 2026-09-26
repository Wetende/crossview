from types import SimpleNamespace

import pytest
from django.contrib.auth.models import Group
from django.core.exceptions import PermissionDenied, ValidationError
from django.http import Http404
from django.utils import timezone

from apps.assessments.models import (
    Question,
    QuestionBank,
    QuestionBankEntry,
    Quiz,
    QuizAttempt,
    QuizQuestionPool,
)
from apps.assessments.question_bank_access import (
    can_create_bank,
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
from apps.assessments.question_bank_service import QuestionBankService
from apps.assessments.question_snapshots import (
    ensure_attempt_question_snapshots,
    sync_quiz_pools_from_properties,
    validate_quiz_question_pools,
)
from apps.core.tests.factories import UserFactory
from apps.progression.models import Enrollment, InstructorAssignment
from apps.progression.tests.factories import CurriculumNodeFactory, ProgramFactory


def snapshot(text):
    return {
        "question_type": "true_false",
        "text": text,
        "points": 1,
        "answer_data": {"correct": True},
    }


def add_entry(user, bank, text, *, tags=None):
    return QuestionBankService().add_to_bank(
        question=None,
        user=user,
        bank=bank,
        question_snapshot=snapshot(text),
        tags=tags or [],
    )


def make_quiz(program, title="Quiz"):
    return Quiz.objects.create(node=CurriculumNodeFactory(program=program), title=title)


@pytest.fixture
def people():
    group, _ = Group.objects.get_or_create(name="Instructors")
    owner = UserFactory()
    colleague = UserFactory()
    outsider = UserFactory()
    for user in (owner, colleague, outsider):
        user.groups.add(group)
    admin = UserFactory(is_staff=True)
    learner = UserFactory()
    program = ProgramFactory()
    other_program = ProgramFactory()
    InstructorAssignment.objects.create(instructor=owner, program=program)
    InstructorAssignment.objects.create(instructor=colleague, program=program)
    InstructorAssignment.objects.create(instructor=outsider, program=other_program)
    return SimpleNamespace(
        owner=owner,
        colleague=colleague,
        outsider=outsider,
        admin=admin,
        learner=learner,
        program=program,
        other_program=other_program,
    )


@pytest.fixture
def banks(people):
    return SimpleNamespace(
        course=QuestionBank.objects.create(
            program=people.program, owner=people.owner, name="Course bank"
        ),
        library=QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_INSTRUCTOR, owner=people.owner, name="Owner library"
        ),
        shared=QuestionBank.objects.create(
            scope=QuestionBank.SCOPE_INSTITUTION, owner=people.admin, name="Shared bank"
        ),
        archived=QuestionBank.objects.create(
            program=people.program, owner=people.owner, name="Old bank", is_archived=True
        ),
    )


def bank_names(queryset):
    return {bank.name for bank in queryset}


@pytest.mark.django_db
@pytest.mark.parametrize(
    "who, expected",
    [
        ("owner", {"Course bank", "Owner library", "Shared bank"}),
        ("colleague", {"Course bank", "Shared bank"}),
        ("outsider", {"Shared bank"}),
        ("admin", {"Course bank", "Shared bank"}),
        ("learner", set()),
    ],
)
def test_visible_banks_follow_scope_rules(people, banks, who, expected):
    assert bank_names(visible_question_banks(getattr(people, who))) == expected


@pytest.mark.django_db
def test_archived_banks_are_hidden_unless_requested(people, banks):
    assert "Old bank" not in bank_names(visible_question_banks(people.owner))
    assert "Old bank" in bank_names(
        visible_question_banks(people.owner, include_archived=True)
    )


@pytest.mark.django_db
def test_program_filter_limits_course_banks_only(people, banks):
    assert bank_names(
        visible_question_banks(people.owner, program=people.other_program)
    ) == {"Owner library", "Shared bank"}
    assert bank_names(
        visible_question_banks(people.outsider, program=people.program)
    ) == {"Shared bank"}


@pytest.mark.django_db
def test_visible_banks_report_entry_counts(people, banks):
    add_entry(people.owner, banks.course, "One")
    add_entry(people.owner, banks.course, "Two")

    course = visible_question_banks(people.owner).get(pk=banks.course.pk)

    assert course.entries_count_annotated == 2


@pytest.mark.django_db
def test_admins_can_manage_every_bank(people, banks):
    assert bank_names(manageable_question_banks(people.admin)) == {
        "Course bank",
        "Owner library",
        "Shared bank",
        "Old bank",
    }
    assert "Owner library" not in bank_names(manageable_question_banks(people.colleague))


@pytest.mark.django_db
@pytest.mark.parametrize(
    "bank_key, who, can_edit, can_delete",
    [
        ("course", "owner", True, True),
        ("course", "colleague", True, False),
        ("course", "outsider", False, False),
        ("course", "admin", True, True),
        ("library", "owner", True, True),
        ("library", "colleague", False, False),
        ("library", "admin", True, True),
        ("shared", "owner", False, False),
        ("shared", "admin", True, True),
    ],
)
def test_bank_edit_and_delete_rules(people, banks, bank_key, who, can_edit, can_delete):
    bank = getattr(banks, bank_key)
    user = getattr(people, who)

    assert can_edit_bank(user, bank) is can_edit
    assert can_delete_bank(user, bank) is can_delete


@pytest.mark.django_db
def test_bank_creation_rules(people):
    assert can_create_bank(people.owner, QuestionBank.SCOPE_COURSE, people.program)
    assert not can_create_bank(people.owner, QuestionBank.SCOPE_COURSE, people.other_program)
    assert not can_create_bank(people.owner, QuestionBank.SCOPE_COURSE, None)
    assert can_create_bank(people.owner, QuestionBank.SCOPE_INSTRUCTOR)
    assert not can_create_bank(people.owner, QuestionBank.SCOPE_INSTITUTION)
    assert can_create_bank(people.admin, QuestionBank.SCOPE_INSTITUTION)
    assert not can_create_bank(people.learner, QuestionBank.SCOPE_INSTRUCTOR)


@pytest.mark.django_db
def test_bank_use_rules(people, banks):
    assert can_use_bank(people.owner, banks.library, program=people.other_program)
    assert not can_use_bank(people.colleague, banks.library, program=people.program)
    assert can_use_bank(people.outsider, banks.shared, program=people.other_program)
    assert not can_use_bank(people.owner, banks.course, program=people.other_program)
    assert not can_use_bank(people.owner, banks.archived, program=people.program)


@pytest.mark.django_db
def test_invisible_or_malformed_bank_ids_raise_not_found(people, banks):
    with pytest.raises(Http404):
        get_visible_bank_or_404(people.colleague, banks.library.pk)
    with pytest.raises(Http404):
        get_visible_bank_or_404(people.owner, "not-a-number")

    assert get_visible_bank_or_404(people.owner, str(banks.library.pk)) == banks.library


@pytest.mark.django_db
def test_visible_entries_follow_bank_visibility(people, banks):
    course_entry = add_entry(people.owner, banks.course, "Course question")
    library_entry = add_entry(people.owner, banks.library, "Library question")
    shared_entry = add_entry(people.admin, banks.shared, "Shared question")
    loose_entry = add_entry(people.owner, None, "Loose question")
    add_entry(people.owner, banks.archived, "Archived question")

    assert set(visible_entries(people.owner)) == {
        course_entry,
        library_entry,
        shared_entry,
        loose_entry,
    }
    assert set(visible_entries(people.colleague)) == {course_entry, shared_entry}
    assert set(visible_entries(people.owner, program=people.other_program)) == {
        library_entry,
        shared_entry,
        loose_entry,
    }


@pytest.mark.django_db
def test_entry_edit_and_delete_rules(people, banks):
    course_entry = add_entry(people.owner, banks.course, "Course question")
    shared_entry = add_entry(people.admin, banks.shared, "Shared question")
    loose_entry = add_entry(people.owner, None, "Loose question")

    assert can_edit_entry(people.colleague, course_entry)
    assert not can_delete_entry(people.colleague, course_entry)
    assert can_delete_entry(people.owner, course_entry)
    assert not can_edit_entry(people.owner, shared_entry)
    assert not can_delete_entry(people.owner, shared_entry)
    assert can_edit_entry(people.admin, shared_entry)
    assert can_delete_entry(people.admin, shared_entry)
    assert can_edit_entry(people.owner, loose_entry)
    assert not can_edit_entry(people.colleague, loose_entry)


@pytest.mark.django_db
def test_service_creates_library_banks_without_a_course(people):
    bank = QuestionBankService().create_bank(
        owner=people.owner, name="  My library  ", scope=QuestionBank.SCOPE_INSTRUCTOR
    )

    assert bank.scope == QuestionBank.SCOPE_INSTRUCTOR
    assert bank.program is None
    assert bank.name == "My library"


@pytest.mark.django_db
def test_service_refuses_banks_the_user_cannot_create(people):
    service = QuestionBankService()

    with pytest.raises(PermissionDenied):
        service.create_bank(
            owner=people.owner, name="Shared", scope=QuestionBank.SCOPE_INSTITUTION
        )
    with pytest.raises(PermissionDenied):
        service.create_bank(owner=people.owner, name="Other", program=people.other_program)
    with pytest.raises(ValidationError):
        service.create_bank(owner=people.owner, name="No course")
    with pytest.raises(ValidationError):
        service.create_bank(owner=people.owner, name="Odd", scope="everyone")


@pytest.mark.django_db
def test_service_blocks_adding_to_banks_the_user_cannot_edit(people, banks):
    with pytest.raises(PermissionDenied):
        add_entry(people.owner, banks.shared, "Not mine to add")


@pytest.mark.django_db
def test_library_banks_accept_questions_from_any_taught_course(people, banks):
    quiz = make_quiz(people.program)
    question = Question.objects.create(
        quiz=quiz,
        question_type="true_false",
        text="From a course quiz",
        answer_data={"correct": True},
    )

    entry = QuestionBankService().add_to_bank(
        question=question, user=people.owner, bank=banks.library
    )

    assert entry.bank == banks.library


@pytest.mark.django_db
def test_course_banks_only_accept_questions_from_their_course(people):
    other_bank = QuestionBank.objects.create(
        program=people.other_program, owner=people.admin, name="Other course bank"
    )
    question = Question.objects.create(
        quiz=make_quiz(people.program),
        question_type="true_false",
        text="Wrong course",
        answer_data={"correct": True},
    )

    with pytest.raises(ValidationError):
        QuestionBankService().add_to_bank(
            question=question, user=people.admin, bank=other_bank
        )


@pytest.mark.django_db
def test_moving_an_entry_requires_edit_rights_on_both_banks(people, banks):
    entry = add_entry(people.owner, banks.course, "Movable")
    service = QuestionBankService()

    moved = service.update_entry(entry, actor=people.owner, bank=banks.library)
    assert moved.bank == banks.library

    colleague_entry = add_entry(people.colleague, banks.course, "Colleague question")
    with pytest.raises(PermissionDenied):
        service.update_entry(colleague_entry, actor=people.colleague, bank=banks.shared)


@pytest.mark.django_db
def test_copy_records_the_bank_version(people, banks):
    service = QuestionBankService()
    entry = add_entry(people.owner, banks.library, "Versioned")
    service.update_entry(entry, actor=people.owner, question_snapshot=snapshot("Version two"))
    entry.refresh_from_db()

    copy = service.copy_from_bank(entry, make_quiz(people.other_program))

    assert copy.source_bank_entry_version == 2
    assert copy.text == "Version two"


@pytest.mark.django_db
def test_library_search_respects_visibility_and_filters(people, banks):
    course_entry = add_entry(people.owner, banks.course, "Ohm's law", tags=["Core"])
    library_entry = add_entry(people.owner, banks.library, "Kirchhoff", tags=["core"])
    add_entry(people.admin, banks.shared, "Safety first")
    add_entry(people.owner, banks.archived, "Archived law")
    service = QuestionBankService()

    assert set(service.search_library(people.colleague, query="law")) == {course_entry}
    assert set(
        service.search_library(people.owner, scope=QuestionBank.SCOPE_INSTRUCTOR)
    ) == {library_entry}
    assert set(service.search_library(people.owner, tags=["CORE"])) == {
        course_entry,
        library_entry,
    }
    assert set(
        service.search_library(people.owner, program=people.other_program, tags=["core"])
    ) == {library_entry}


@pytest.mark.django_db
def test_categories_come_from_visible_banks_and_entries(people, banks):
    banks.shared.category = "Safety"
    banks.shared.save(update_fields=["category"])
    QuestionBankService().add_to_bank(
        question=None,
        user=people.owner,
        bank=banks.library,
        question_snapshot=snapshot("Tagged"),
        category="Circuits",
    )

    assert QuestionBankService().list_categories(people.owner) == ["Circuits", "Safety"]
    assert QuestionBankService().list_categories(people.colleague) == ["Safety"]


@pytest.mark.django_db
def test_pool_sync_keeps_existing_links_the_editor_cannot_see(people, banks):
    add_entry(people.owner, banks.library, "Private pool question")
    quiz = make_quiz(people.program)
    pool = QuizQuestionPool.objects.create(quiz=quiz, bank=banks.library, question_count=1)

    canonical = sync_quiz_pools_from_properties(
        quiz,
        [{"poolId": pool.id, "bankId": banks.library.id, "questionCount": 1}],
        actor=people.colleague,
    )

    assert [item["poolId"] for item in canonical] == [pool.id]
    assert quiz.question_pools.count() == 1


@pytest.mark.django_db
def test_pool_sync_refuses_new_links_to_banks_the_editor_cannot_see(people, banks):
    quiz = make_quiz(people.program)

    canonical = sync_quiz_pools_from_properties(
        quiz,
        [{"bankId": banks.library.id, "questionCount": 1}],
        actor=people.colleague,
    )

    assert canonical == []
    assert quiz.question_pools.count() == 0


@pytest.mark.django_db
def test_pool_sync_links_library_and_shared_banks_for_their_users(people, banks):
    quiz = make_quiz(people.other_program)

    canonical = sync_quiz_pools_from_properties(
        quiz,
        [
            {"bankId": banks.library.id, "questionCount": 1},
            {"bankId": banks.shared.id, "questionCount": 1},
        ],
        actor=people.owner,
    )

    assert [item["bankId"] for item in canonical] == [banks.library.id, banks.shared.id]


@pytest.mark.django_db
def test_system_pool_sync_keeps_course_banks_without_an_actor(people, banks):
    quiz = make_quiz(people.program)

    canonical = sync_quiz_pools_from_properties(
        quiz,
        [
            {"bankId": banks.course.id, "questionCount": 1},
            {"bankId": banks.library.id, "questionCount": 1},
        ],
    )

    assert [item["bankId"] for item in canonical] == [banks.course.id]


@pytest.mark.django_db
def test_validation_reports_pools_that_overdraw_a_shared_bank(people, banks):
    for index in range(3):
        add_entry(people.owner, banks.library, f"Shared supply {index}")
    quiz = make_quiz(people.program)
    QuizQuestionPool.objects.create(quiz=quiz, bank=banks.library, question_count=2)
    QuizQuestionPool.objects.create(quiz=quiz, bank=banks.library, question_count=2, position=1)

    assert validate_quiz_question_pools(quiz) == [
        {
            "poolId": None,
            "bankId": banks.library.id,
            "bankName": banks.library.name,
            "required": 4,
            "available": 3,
        }
    ]


@pytest.mark.django_db
def test_attempts_draw_the_most_constrained_pool_first(people, banks):
    for index in range(8):
        add_entry(people.owner, banks.library, f"Wide {index}", tags=["wide"])
    narrow_ids = {
        add_entry(people.owner, banks.library, f"Narrow {index}", tags=["narrow"]).id
        for index in range(2)
    }
    quiz = make_quiz(people.program)
    wide = QuizQuestionPool.objects.create(
        quiz=quiz, bank=banks.library, question_count=8, position=0
    )
    narrow = QuizQuestionPool.objects.create(
        quiz=quiz, bank=banks.library, question_count=2, tags=["narrow"], position=1
    )
    enrollment = Enrollment.objects.create(user=UserFactory(), program=people.program)

    assert validate_quiz_question_pools(quiz) == []
    for number in range(1, 16):
        attempt = QuizAttempt.objects.create(
            enrollment=enrollment,
            quiz=quiz,
            attempt_number=number,
            started_at=timezone.now(),
        )
        rows = ensure_attempt_question_snapshots(quiz, attempt)

        assert [row.source_pool_id for row in rows] == [wide.id] * 8 + [narrow.id] * 2
        assert {row.source_bank_entry_id for row in rows[8:]} == narrow_ids
        assert [row.position for row in rows] == list(range(10))


@pytest.mark.django_db
def test_pool_sync_reports_supply_left_after_questions_copied_into_the_quiz(people, banks):
    entries = [add_entry(people.owner, banks.library, f"Supply {index}") for index in range(2)]
    quiz = make_quiz(people.program)
    QuestionBankService().copy_from_bank(entries[0], quiz)

    canonical = sync_quiz_pools_from_properties(
        quiz,
        [{"bankId": banks.library.id, "questionCount": 2}],
        actor=people.owner,
    )

    assert canonical[0]["availableQuestions"] == 1
    assert validate_quiz_question_pools(quiz)[0]["available"] == 1
