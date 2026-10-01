import pytest

from apps.assessments.models import Question, QuestionBank, Quiz
from apps.assessments.quiz_properties import build_quiz_question_properties
from apps.core.tests.factories import UserFactory
from apps.progression.tests.factories import CurriculumNodeFactory, ProgramFactory


@pytest.mark.django_db
def test_rebuilt_properties_keep_the_copied_bank_version():
    """AI edits rebuild quiz properties; the builder's update badge needs the version."""
    program = ProgramFactory()
    bank = QuestionBank.objects.create(program=program, owner=UserFactory(), name="Course bank")
    entry = bank.entries.create(
        owner=bank.owner,
        question_snapshot={"question_type": "true_false", "text": "Copied", "points": 1},
        snapshot_version=3,
    )
    quiz = Quiz.objects.create(node=CurriculumNodeFactory(program=program), title="Quiz")
    Question.objects.create(
        quiz=quiz,
        question_type="true_false",
        text="Copied",
        answer_data={"correct": True},
        source_bank_entry=entry,
        source_bank_entry_version=2,
    )

    [question] = build_quiz_question_properties(quiz)

    assert question["libraryEntryId"] == entry.id
    assert question["libraryEntryVersion"] == 2


@pytest.mark.django_db
def test_rebuilt_properties_keep_explanation_and_hint():
    """AI edits rebuild quiz properties; the next builder save must not blank them."""
    quiz = Quiz.objects.create(node=CurriculumNodeFactory(), title="Quiz")
    Question.objects.create(
        quiz=quiz,
        question_type="true_false",
        text="Water boils at 100 C at sea level.",
        answer_data={"correct": True},
        explanation="<p>At 1 atm, $T = 100^\\circ C$.</p>",
        hint="<p>Think about sea-level pressure.</p>",
    )

    [question] = build_quiz_question_properties(quiz)

    assert question["explanation"] == "<p>At 1 atm, $T = 100^\\circ C$.</p>"
    assert question["hint"] == "<p>Think about sea-level pressure.</p>"
