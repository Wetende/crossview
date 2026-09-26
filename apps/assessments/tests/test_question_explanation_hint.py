"""Question-level explanations and hints travel through every quiz path."""

from io import StringIO

import pytest
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone

from apps.assessments.models import Question, QuestionBank, Quiz, QuizAttempt
from apps.assessments.question_bank_service import QuestionBankService
from apps.assessments.question_snapshots import (
    ensure_attempt_runtime_state,
    serialize_attempt_questions,
    snapshot_as_question_data,
)
from apps.assessments.quiz_results import build_quiz_results_payload
from apps.assessments.text_normalization import normalize_assessment_rich_text
from apps.core.tests.factories import UserFactory
from apps.core.views import _clone_quiz, _sync_quiz_questions
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, InstructorAssignment
from apps.progression.tests.factories import ProgramFactory


EXPLANATION = '<p>Because <strong>2 + 2</strong> is <span data-type="inline-math" data-latex="4"></span>.</p>'
HINT = "<p>Count on your fingers.</p>"

BUILDER_QUESTIONS = {
    "mcq": {"options": ["Four", "Five"], "correct": 0},
    "mcq_multi": {"options": ["Two", "Four", "Six"], "correct_indices": [0, 1]},
    "true_false": {"correct": 0},
    "short_answer": {"keywords": ["four"], "manual_grading": False},
    "matching": {
        "pairs": [
            {"left_text": "2 + 2", "right_text": "4", "explanation": "Pair reason"}
        ]
    },
    "fill_blank": {
        "text": "Two plus two is {{blank}}.",
        "gaps": [
            {"gap_index": 0, "accepted_answers": ["four"], "explanation": "Gap reason"}
        ],
    },
    "ordering": {"items": ["One", "Two", "Three"]},
    "image_matching": {
        "image_pairs": [
            {
                "question_text": "Square",
                "answer_text": "Four sides",
                "explanation": "Image reason",
            }
        ]
    },
}


def builder_question(question_type, **extra):
    data = {
        "id": f"temp_{question_type}",
        "type": question_type,
        "text": f"A {question_type} question",
        "points": 1,
        **BUILDER_QUESTIONS[question_type],
        **extra,
    }
    return data


@pytest.fixture
def instructor():
    group, _ = Group.objects.get_or_create(name="Instructors")
    user = UserFactory(email="author@example.com")
    user.groups.add(group)
    return user


@pytest.fixture
def quiz_node(instructor):
    program = ProgramFactory()
    InstructorAssignment.objects.create(instructor=instructor, program=program)
    return CurriculumNode.objects.create(
        program=program,
        node_type="Session",
        title="Explained quiz",
        properties={"lesson_type": "quiz"},
        position=1,
        is_published=True,
    )


def start_attempt(quiz):
    learner = UserFactory()
    enrollment = Enrollment.objects.create(user=learner, program=quiz.node.program)
    attempt = QuizAttempt.objects.create(
        enrollment=enrollment,
        quiz=quiz,
        attempt_number=1,
        started_at=timezone.now(),
    )
    return learner, enrollment, attempt


@pytest.mark.django_db
def test_new_questions_default_to_blank_explanation_and_hint(quiz_node):
    quiz = Quiz.objects.create(node=quiz_node, title="Defaults")
    question = Question.objects.create(
        quiz=quiz, question_type="mcq", text="Plain", answer_data={}
    )

    question.refresh_from_db()
    assert question.explanation == ""
    assert question.hint == ""


def test_rich_text_normalizer_keeps_content_and_drops_empty_editor_markup():
    assert normalize_assessment_rich_text("  <p>Why</p> ") == "<p>Why</p>"
    assert normalize_assessment_rich_text("<p></p>") == ""
    assert normalize_assessment_rich_text("<p><br></p>") == ""
    assert normalize_assessment_rich_text("<p>&nbsp;</p>") == ""
    assert normalize_assessment_rich_text(None) == ""
    maths_only = '<p><span data-type="inline-math" data-latex="x^2"></span></p>'
    assert normalize_assessment_rich_text(maths_only) == maths_only
    image_only = '<p><img src="/media/a.png" alt=""></p>'
    assert normalize_assessment_rich_text(image_only) == image_only


@pytest.mark.django_db
@pytest.mark.parametrize("question_type", list(BUILDER_QUESTIONS))
def test_sync_round_trips_explanation_and_hint_for_every_type(
    quiz_node, question_type
):
    _sync_quiz_questions(
        quiz_node,
        [builder_question(question_type, explanation=EXPLANATION, hint=HINT)],
    )

    question = Quiz.objects.get(node=quiz_node).questions.get()
    assert question.question_type == question_type
    assert question.explanation == EXPLANATION
    assert question.hint == HINT

    quiz_node.refresh_from_db()
    saved = quiz_node.properties["questions"][0]
    assert saved["explanation"] == EXPLANATION
    assert saved["hint"] == HINT

    # The builder sends the saved question back with edits.
    _sync_quiz_questions(
        quiz_node,
        [{**saved, "explanation": "<p>Revised</p>", "hint": "<p></p>"}],
    )
    question.refresh_from_db()
    assert question.explanation == "<p>Revised</p>"
    assert question.hint == ""
    quiz_node.refresh_from_db()
    assert quiz_node.properties["questions"][0]["explanation"] == "<p>Revised</p>"
    assert quiz_node.properties["questions"][0]["hint"] == ""


@pytest.mark.django_db
def test_sync_keeps_pair_and_gap_explanations_alongside_question_explanation(
    quiz_node,
):
    _sync_quiz_questions(
        quiz_node,
        [
            builder_question("matching", explanation=EXPLANATION),
            builder_question("fill_blank", explanation=EXPLANATION),
            builder_question("image_matching", explanation=EXPLANATION),
        ],
    )

    matching, fill_blank, image_matching = Quiz.objects.get(
        node=quiz_node
    ).questions.order_by("position")
    assert matching.matching_pairs.get().explanation == "Pair reason"
    assert fill_blank.gap_answers.get().explanation == "Gap reason"
    assert image_matching.image_matching_pairs.get().explanation == "Image reason"
    assert {matching.explanation, fill_blank.explanation, image_matching.explanation} == {
        EXPLANATION
    }


@pytest.mark.django_db
def test_bank_entry_revision_copy_and_entry_payload_carry_both_fields(
    quiz_node, instructor
):
    _sync_quiz_questions(
        quiz_node, [builder_question("mcq", explanation=EXPLANATION, hint=HINT)]
    )
    quiz = Quiz.objects.get(node=quiz_node)
    bank = QuestionBank.objects.create(
        program=quiz_node.program, owner=instructor, name="Arithmetic"
    )
    service = QuestionBankService()

    entry = service.add_to_bank(quiz.questions.get(), instructor, bank=bank)

    assert entry.question_snapshot["explanation"] == EXPLANATION
    assert entry.question_snapshot["hint"] == HINT
    assert entry.revisions.get(version=1).snapshot["explanation"] == EXPLANATION
    data = snapshot_as_question_data(entry.question_snapshot)
    assert data["explanation"] == EXPLANATION
    assert data["hint"] == HINT

    service.update_entry(
        entry,
        actor=instructor,
        question_snapshot={
            **entry.question_snapshot,
            "explanation": "<p>Version two</p>",
            "hint": "",
        },
    )
    entry.refresh_from_db()
    assert entry.revisions.get(version=2).snapshot["explanation"] == "<p>Version two</p>"
    assert entry.revisions.get(version=2).snapshot["hint"] == ""
    assert entry.revisions.get(version=1).snapshot["hint"] == HINT

    copied = service.copy_from_bank(entry, quiz)
    assert copied.explanation == "<p>Version two</p>"
    assert copied.hint == ""


@pytest.mark.django_db
def test_bank_snapshot_saved_from_builder_json_keeps_both_fields(quiz_node, instructor):
    bank = QuestionBank.objects.create(
        program=quiz_node.program, owner=instructor, name="Snapshot bank"
    )

    entry = QuestionBankService().add_to_bank(
        None,
        instructor,
        bank=bank,
        question_snapshot={
            "question_type": "short_answer",
            "text": "Explain",
            "answer_data": {"keywords": [], "manual_grading": True},
            "explanation": EXPLANATION,
            "hint": HINT,
        },
    )

    assert entry.question_snapshot["explanation"] == EXPLANATION
    assert entry.question_snapshot["hint"] == HINT


@pytest.mark.django_db
def test_attempt_snapshot_keeps_the_explanation_the_learner_saw(quiz_node):
    _sync_quiz_questions(
        quiz_node, [builder_question("mcq", explanation=EXPLANATION, hint=HINT)]
    )
    quiz = Quiz.objects.get(node=quiz_node)
    quiz.answer_release_policy = Quiz.AnswerReleasePolicy.AFTER_EACH_ATTEMPT
    quiz.save(update_fields=["answer_release_policy"])
    _, enrollment, attempt = start_attempt(quiz)

    payload = serialize_attempt_questions(
        quiz, attempt, ensure_attempt_runtime_state(quiz, attempt)
    )
    row = attempt.question_snapshots.get()
    assert row.snapshot["explanation"] == EXPLANATION
    assert row.snapshot["hint"] == HINT

    # Learners get the hint before answering, never the explanation.
    assert payload[0]["hint"] == HINT
    assert "explanation" not in payload[0]

    Question.objects.filter(quiz=quiz).update(
        explanation="<p>Edited later</p>", hint="<p>Edited hint</p>"
    )
    attempt.answers = {str(payload[0]["id"]): "0"}
    attempt.submitted_at = timezone.now()
    attempt.save(update_fields=["answers", "submitted_at"])

    result = build_quiz_results_payload(quiz=quiz, enrollment=enrollment)
    assert result["questionReview"][0]["explanation"] == EXPLANATION


@pytest.mark.django_db
def test_learner_payload_omits_hint_when_blank(quiz_node):
    _sync_quiz_questions(quiz_node, [builder_question("true_false")])
    quiz = Quiz.objects.get(node=quiz_node)
    _, _, attempt = start_attempt(quiz)

    payload = serialize_attempt_questions(
        quiz, attempt, ensure_attempt_runtime_state(quiz, attempt)
    )

    assert "hint" not in payload[0]
    assert "explanation" not in payload[0]


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("policy", "passed", "released"),
    [
        (Quiz.AnswerReleasePolicy.AFTER_EACH_ATTEMPT, False, True),
        (Quiz.AnswerReleasePolicy.AFTER_PASS_OR_FINAL, True, True),
        (Quiz.AnswerReleasePolicy.AFTER_PASS_OR_FINAL, False, False),
        (Quiz.AnswerReleasePolicy.AFTER_FINAL_ATTEMPT, False, False),
        (Quiz.AnswerReleasePolicy.NEVER, True, False),
    ],
)
def test_results_explanation_follows_answer_release_policy(
    quiz_node, policy, passed, released
):
    _sync_quiz_questions(
        quiz_node, [builder_question("mcq", explanation=EXPLANATION, hint=HINT)]
    )
    quiz = Quiz.objects.get(node=quiz_node)
    quiz.answer_release_policy = policy
    quiz.max_attempts = 3
    quiz.save(update_fields=["answer_release_policy", "max_attempts"])
    _, enrollment, attempt = start_attempt(quiz)
    ensure_attempt_runtime_state(quiz, attempt)
    attempt.answers = {str(quiz.questions.get().id): "1"}
    attempt.submitted_at = timezone.now()
    attempt.passed = passed
    attempt.save(update_fields=["answers", "submitted_at", "passed"])

    result = build_quiz_results_payload(quiz=quiz, enrollment=enrollment)

    review = result["questionReview"][0]
    assert result["correctAnswersReleased"] is released
    if released:
        assert review["explanation"] == EXPLANATION
    else:
        assert review["explanation"] is None
        assert review["correctAnswer"] is None
    assert "hint" not in review


@pytest.mark.django_db
def test_student_quiz_start_json_includes_hint_but_not_explanation(quiz_node):
    _sync_quiz_questions(
        quiz_node, [builder_question("mcq", explanation=EXPLANATION, hint=HINT)]
    )
    quiz = Quiz.objects.get(node=quiz_node)
    quiz.is_published = True
    quiz.save(update_fields=["is_published"])
    learner = UserFactory()
    Enrollment.objects.create(
        user=learner, program=quiz_node.program, status="active"
    )

    from django.test import Client

    client = Client()
    client.force_login(learner)
    response = client.get(
        reverse("core:student.quiz_start", kwargs={"quiz_id": quiz.id}),
        {"response": "json"},
    )

    assert response.status_code == 200
    question = response.json()["questions"][0]
    assert question["hint"] == HINT
    assert "explanation" not in question
    assert EXPLANATION not in response.content.decode()


@pytest.mark.django_db
def test_clone_and_resync_keep_explanation_and_hint(quiz_node):
    _sync_quiz_questions(
        quiz_node,
        [builder_question("short_answer", explanation=EXPLANATION, hint=HINT)],
    )
    quiz = Quiz.objects.get(node=quiz_node)

    copy_node = CurriculumNode.objects.create(
        program=quiz_node.program,
        node_type="Session",
        title="Copy",
        properties={"lesson_type": "quiz"},
        position=2,
    )
    cloned = _clone_quiz(quiz, copy_node).questions.get()
    assert cloned.explanation == EXPLANATION
    assert cloned.hint == HINT

    quiz_node.properties = {"lesson_type": "quiz", "questions": []}
    quiz_node.save(update_fields=["properties"])
    call_command("resync_quiz_properties", stdout=StringIO())
    quiz_node.refresh_from_db()
    assert quiz_node.properties["questions"][0]["explanation"] == EXPLANATION
    assert quiz_node.properties["questions"][0]["hint"] == HINT
