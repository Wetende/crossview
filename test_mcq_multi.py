import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.assessments.models import Question, QuestionOption, Quiz

# Create a dummy quiz
quiz = Quiz.objects.create(title="Test Quiz")

# Create a question
q = Question.objects.create(
    quiz=quiz,
    question_type="mcq_multi",
    text="Test",
    points=3,
    answer_data={}
)

opt1 = QuestionOption.objects.create(question=q, text="A", is_correct=True, position=0)
opt2 = QuestionOption.objects.create(question=q, text="B", is_correct=True, position=1)
opt3 = QuestionOption.objects.create(question=q, text="C", is_correct=True, position=2)
opt4 = QuestionOption.objects.create(question=q, text="D", is_correct=False, position=3)

print("Options:", [(o.id, o.position, o.is_correct) for o in q.options.all()])

print("Answer as list of ints:", q.check_answer([0, 1, 2]))
print("Answer as list of strings (positions):", q.check_answer(["0", "1", "2"]))

print("Answer as list of ids:", q.check_answer([opt1.id, opt2.id, opt3.id]))
print("Answer as list of string ids:", q.check_answer([str(opt1.id), str(opt2.id), str(opt3.id)]))
