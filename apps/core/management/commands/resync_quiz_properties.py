"""
One-time management command to resync all quiz node properties from DB records.
Fixes stale <p> tags and corrupted option text in node.properties.questions.

Usage: python manage.py resync_quiz_properties
"""
from django.core.management.base import BaseCommand

from apps.assessments.text_normalization import true_false_choice_to_index


class Command(BaseCommand):
    help = "Resync quiz node.properties.questions from DB records"

    def handle(self, *args, **options):
        from apps.assessments.models import Quiz
        from apps.curriculum.models import CurriculumNode

        quiz_nodes = CurriculumNode.objects.filter(
            node_type__iexact="quiz"
        ) | CurriculumNode.objects.filter(
            properties__lesson_type="quiz"
        )

        count = 0
        for node in quiz_nodes:
            try:
                quiz = Quiz.objects.get(node=node)
            except Quiz.DoesNotExist:
                self.stdout.write(f"  SKIP node {node.id} '{node.title}' — no Quiz record")
                continue

            db_questions = (
                quiz.questions.all()
                .prefetch_related("options", "matching_pairs", "gap_answers", "image_matching_pairs")
                .order_by("position")
            )
            rebuilt = []
            for q in db_questions:
                entry = {
                    "id": f"q_{q.id}",
                    "db_id": q.id,
                    "type": q.question_type,
                    "text": q.text,
                    "points": q.points,
                }
                if q.question_type in ("mcq", "mcq_multi"):
                    opts = list(q.options.all().order_by("position"))
                    entry["options"] = [o.text for o in opts]
                    if q.question_type == "mcq":
                        c = next((o for o in opts if o.is_correct), None)
                        entry["correct"] = c.position if c else 0
                    else:
                        entry["correct_indices"] = [o.position for o in opts if o.is_correct]
                elif q.question_type == "true_false":
                    entry["correct"] = true_false_choice_to_index(
                        q.answer_data.get("correct"),
                        default=0,
                    )
                    opts = list(q.options.all().order_by("position"))
                    if opts:
                        entry["options"] = [o.text for o in opts]
                elif q.question_type == "short_answer":
                    entry["keywords"] = q.answer_data.get("keywords", [])
                    entry["manual_grading"] = q.answer_data.get("manual_grading", True)
                elif q.question_type == "matching":
                    pairs = list(q.matching_pairs.all().order_by("position"))
                    entry["pairs"] = [
                        {"left_text": p.left_text, "right_text": p.right_text,
                         "explanation": p.explanation, "position": p.position}
                        for p in pairs
                    ]
                elif q.question_type == "fill_blank":
                    gaps = list(q.gap_answers.all().order_by("gap_index"))
                    entry["gaps"] = [
                        {"gap_index": g.gap_index, "accepted_answers": g.accepted_answers,
                         "explanation": g.explanation}
                        for g in gaps
                    ]
                elif q.question_type == "ordering":
                    entry["items"] = q.answer_data.get("items", [])
                    entry["explanations"] = q.answer_data.get("explanations", {})
                elif q.question_type == "image_matching":
                    img_pairs = list(q.image_matching_pairs.all().order_by("position"))
                    entry["image_pairs"] = [
                        {"question_text": p.question_text, "question_image": p.question_image,
                         "answer_text": p.answer_text, "answer_image": p.answer_image,
                         "explanation": p.explanation, "position": p.position}
                        for p in img_pairs
                    ]
                rebuilt.append(entry)

            node.properties["questions"] = rebuilt
            node.properties["quiz_id"] = quiz.id
            node.save(update_fields=["properties"])
            count += 1
            self.stdout.write(f"  OK  node {node.id} '{node.title}' — {len(rebuilt)} questions rebuilt")

        self.stdout.write(self.style.SUCCESS(f"\nDone. Resynced {count} quiz node(s)."))
