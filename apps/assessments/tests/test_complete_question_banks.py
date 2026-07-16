from decimal import Decimal
from unittest.mock import patch

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone

from apps.assessments.models import (
    Question,
    QuestionBank,
    QuestionBankEntry,
    QuestionBankUsage,
    QuestionOption,
    Quiz,
    QuizAttempt,
    QuizQuestionPool,
)
from apps.assessments.question_bank_service import QuestionBankService
from apps.assessments.question_snapshots import (
    ensure_attempt_runtime_state,
    pool_supply,
    serialize_attempt_questions,
    validate_quiz_question_pools,
)
from apps.assessments.quiz_results import build_quiz_results_payload
from apps.core.tests.factories import UserFactory
from apps.curriculum.models import CurriculumNode
from apps.curriculum.services import CoursePublishValidationService
from apps.progression.models import Enrollment, InstructorAssignment
from apps.progression.tests.factories import ProgramFactory


@pytest.fixture
def instructors():
    group, _ = Group.objects.get_or_create(name="Instructors")
    owner = UserFactory(email="owner@example.com")
    colleague = UserFactory(email="colleague@example.com")
    owner.groups.add(group)
    colleague.groups.add(group)
    return owner, colleague


@pytest.fixture
def question_context(instructors):
    owner, colleague = instructors
    program = ProgramFactory()
    InstructorAssignment.objects.create(instructor=owner, program=program)
    InstructorAssignment.objects.create(instructor=colleague, program=program)
    node = CurriculumNode.objects.create(
        program=program,
        node_type="Session",
        title="Bank quiz",
        properties={"lesson_type": "quiz"},
        position=1,
        is_published=True,
    )
    quiz = Quiz.objects.create(
        node=node,
        title="Bank quiz",
        max_attempts=3,
        pass_threshold=50,
        is_published=True,
    )
    bank = QuestionBank.objects.create(
        program=program,
        owner=owner,
        name="Reusable questions",
        category="Foundations",
    )
    return owner, colleague, program, quiz, bank


def create_bank_entry(owner, bank, quiz, text, *, correct=0, tags=None, difficulty="medium"):
    question = Question.objects.create(
        quiz=quiz,
        question_type="mcq",
        text=text,
        points=2,
        position=quiz.questions.count(),
        answer_data={"correct": correct},
    )
    QuestionOption.objects.create(
        question=question,
        text="Correct" if correct == 0 else "Wrong",
        is_correct=correct == 0,
        position=0,
    )
    QuestionOption.objects.create(
        question=question,
        text="Correct" if correct == 1 else "Wrong",
        is_correct=correct == 1,
        position=1,
    )
    return QuestionBankService().add_to_bank(
        question=question,
        user=owner,
        bank=bank,
        category="Foundations",
        tags=tags or ["core"],
        difficulty=difficulty,
    )


@pytest.mark.django_db
def test_bank_snapshot_and_revision_survive_source_deletion(question_context):
    owner, _, _, quiz, bank = question_context
    entry = create_bank_entry(owner, bank, quiz, "Persistent question")
    original_question_id = entry.question_id

    Question.objects.get(pk=original_question_id).delete()
    entry.refresh_from_db()

    assert entry.question is None
    assert entry.question_snapshot["text"] == "Persistent question"
    assert entry.question_snapshot["options"][0]["is_correct"] is True
    assert entry.revisions.get(version=1).snapshot == entry.question_snapshot

    QuestionBankService().update_entry(
        entry,
        actor=owner,
        question_snapshot={
            **entry.question_snapshot,
            "text": "Updated persistent question",
        },
    )
    entry.refresh_from_db()
    assert entry.snapshot_version == 2
    assert entry.revisions.count() == 2
    assert entry.revisions.get(version=1).snapshot["text"] == "Persistent question"


@pytest.mark.django_db
def test_copy_uses_snapshot_and_tracks_origin(question_context):
    owner, _, program, quiz, bank = question_context
    entry = create_bank_entry(owner, bank, quiz, "Copy me")
    destination_node = CurriculumNode.objects.create(
        program=program,
        node_type="Session",
        title="Destination",
        properties={},
        position=2,
        is_published=True,
    )
    destination = Quiz.objects.create(node=destination_node, title="Destination")
    entry.question.delete()
    entry.refresh_from_db()

    copied = QuestionBankService().copy_from_bank(entry, destination)

    assert copied.text == "Copy me"
    assert copied.source_bank_entry == entry
    assert list(copied.options.values_list("text", flat=True)) == ["Correct", "Wrong"]
    entry.refresh_from_db()
    assert entry.usage_count == 1
    assert QuestionBankUsage.objects.filter(
        entry=entry,
        question=copied,
        usage_type=QuestionBankUsage.COPY,
    ).exists()


@pytest.mark.django_db
def test_assigned_instructor_can_edit_but_only_owner_can_delete(
    client, question_context
):
    owner, colleague, program, quiz, bank = question_context
    entry = create_bank_entry(owner, bank, quiz, "Shared question")
    url = reverse(
        "assessments:program-question-entry-detail",
        kwargs={"program_id": program.id, "pk": entry.id},
    )
    client.force_login(colleague)

    edited = client.patch(
        url,
        data={"difficulty": "hard", "tags": ["shared", "advanced"]},
        content_type="application/json",
    )
    denied = client.delete(url)

    assert edited.status_code == 200
    assert edited.json()["difficulty"] == "hard"
    assert denied.status_code == 403
    client.force_login(owner)
    assert client.delete(url).status_code == 204


@pytest.mark.django_db
def test_library_api_creates_snapshot_only_question_and_filters(
    client, question_context
):
    owner, _, program, _, bank = question_context
    client.force_login(owner)
    create_url = reverse(
        "assessments:program-question-entry-create",
        kwargs={"program_id": program.id},
    )
    response = client.post(
        create_url,
        data={
            "bank_id": bank.id,
            "category": "Foundations",
            "difficulty": "easy",
            "tags": ["core", "intro"],
            "questionSnapshot": {
                "question_type": "true_false",
                "text": "The bank is persistent.",
                "points": 1,
                "answer_data": {"correct": True},
            },
        },
        content_type="application/json",
    )

    assert response.status_code == 201
    entry = QuestionBankEntry.objects.get(pk=response.json()["id"])
    assert entry.question is None
    list_url = reverse(
        "assessments:program-question-library",
        kwargs={"program_id": program.id},
    )
    filtered = client.get(
        list_url,
        {"difficulty": "easy", "question_type": "true_false", "tags": "intro"},
    )
    assert filtered.status_code == 200
    assert [item["id"] for item in filtered.json()] == [entry.id]


@pytest.mark.django_db
def test_pool_validation_reports_insufficient_unique_questions(question_context):
    owner, _, _, quiz, bank = question_context
    create_bank_entry(owner, bank, quiz, "Only question", tags=["core"])
    pool = QuizQuestionPool.objects.create(
        quiz=quiz,
        bank=bank,
        question_count=2,
        tags=["core"],
        created_by=owner,
    )

    assert pool_supply(pool) == 1
    assert validate_quiz_question_pools(quiz) == [
        {
            "poolId": pool.id,
            "bankId": bank.id,
            "bankName": bank.name,
            "required": 2,
            "available": 1,
        }
    ]
    validation = CoursePublishValidationService().validate_for_publish(quiz.node.program)
    assert any(
        issue["type"] == "undersupplied_question_pool"
        for issue in validation["errors"]
    )


@pytest.mark.django_db
def test_attempt_pool_selection_is_stable_and_resampled(question_context):
    owner, _, _, quiz, bank = question_context
    entries = [
        create_bank_entry(owner, bank, quiz, f"Question {index}")
        for index in range(3)
    ]
    # Pool tests use bank questions only; remove their source quiz copies.
    quiz.questions.all().delete()
    QuizQuestionPool.objects.create(
        quiz=quiz,
        bank=bank,
        question_count=2,
        created_by=owner,
    )
    learner = UserFactory()
    enrollment = Enrollment.objects.create(user=learner, program=quiz.node.program)
    first = QuizAttempt.objects.create(
        enrollment=enrollment,
        quiz=quiz,
        attempt_number=1,
        started_at=timezone.now(),
    )
    second = QuizAttempt.objects.create(
        enrollment=enrollment,
        quiz=quiz,
        attempt_number=2,
        started_at=timezone.now(),
    )

    with patch("apps.assessments.question_snapshots.random.SystemRandom.sample") as sample:
        sample.side_effect = [[entries[0], entries[1]], [entries[1], entries[2]]]
        first_state = ensure_attempt_runtime_state(quiz, first)
        first_payload = serialize_attempt_questions(quiz, first, first_state)
        repeat_payload = serialize_attempt_questions(
            quiz, first, ensure_attempt_runtime_state(quiz, first)
        )
        second_payload = serialize_attempt_questions(
            quiz, second, ensure_attempt_runtime_state(quiz, second)
        )

    assert first_payload == repeat_payload
    assert {item["id"] for item in first_payload} == {-entries[0].id, -entries[1].id}
    assert {item["id"] for item in second_payload} == {-entries[1].id, -entries[2].id}
    assert sample.call_count == 2


@pytest.mark.django_db
def test_scoring_and_review_use_immutable_attempt_snapshot(question_context):
    owner, _, _, quiz, bank = question_context
    entry = create_bank_entry(owner, bank, quiz, "Immutable grading")
    quiz.questions.all().delete()
    QuizQuestionPool.objects.create(
        quiz=quiz,
        bank=bank,
        question_count=1,
        created_by=owner,
    )
    learner = UserFactory()
    enrollment = Enrollment.objects.create(user=learner, program=quiz.node.program)
    attempt = QuizAttempt.objects.create(
        enrollment=enrollment,
        quiz=quiz,
        attempt_number=1,
        started_at=timezone.now(),
    )
    payload = serialize_attempt_questions(
        quiz, attempt, ensure_attempt_runtime_state(quiz, attempt)
    )
    question = payload[0]
    assert all("is_correct" not in option for option in question["options"])
    correct_option = next(
        option
        for option in attempt.question_snapshots.get().snapshot["options"]
        if option["is_correct"]
    )
    attempt.answers = {str(question["id"]): str(correct_option["key"])}
    attempt.submitted_at = timezone.now()
    attempt.save(update_fields=["answers", "submitted_at"])

    changed = {**entry.question_snapshot}
    changed["text"] = "Changed after attempt"
    changed["options"] = [
        {**option, "is_correct": not option["is_correct"]}
        for option in changed["options"]
    ]
    QuestionBankService().update_entry(entry, actor=owner, question_snapshot=changed)

    earned, possible, score, passed = attempt.calculate_score()
    attempt.points_earned = earned
    attempt.points_possible = possible
    attempt.score = score
    attempt.passed = passed
    attempt.save(update_fields=["points_earned", "points_possible", "score", "passed"])
    result = build_quiz_results_payload(quiz=quiz, enrollment=enrollment)

    assert earned == Decimal("2.00")
    assert score == 100
    assert passed is True
    assert result["questionReview"][0]["questionText"] == "Immutable grading"
    assert result["questionReview"][0]["isCorrect"] is True
