from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.assessments.models import QuizAttempt
from apps.assessments.official_results import get_official_quiz_attempt
from apps.progression.models import NodeCompletion
from apps.progression.services import ProgressionEngine


class Command(BaseCommand):
    help = "Recalculate submitted quiz attempt scores after grading logic fixes."

    def add_arguments(self, parser):
        parser.add_argument("--quiz-id", type=int, help="Limit to one quiz ID.")
        parser.add_argument("--node-id", type=int, help="Limit to quizzes on one node ID.")
        parser.add_argument(
            "--program-id",
            type=int,
            help="Limit to quizzes belonging to one program ID.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report changes without saving them.",
        )

    def handle(self, *args, **options):
        quiz_id = options.get("quiz_id")
        node_id = options.get("node_id")
        program_id = options.get("program_id")
        dry_run = options.get("dry_run")

        if not any([quiz_id, node_id, program_id]):
            raise CommandError("Provide --quiz-id, --node-id, or --program-id.")

        attempts = (
            QuizAttempt.objects.select_related(
                "quiz",
                "quiz__node",
                "enrollment",
                "enrollment__user",
            )
            .filter(submitted_at__isnull=False)
            .prefetch_related(
                "quiz__questions",
                "quiz__questions__options",
                "quiz__questions__matching_pairs",
                "quiz__questions__gap_answers",
                "quiz__questions__image_matching_pairs",
            )
            .order_by("id")
        )

        if quiz_id:
            attempts = attempts.filter(quiz_id=quiz_id)
        if node_id:
            attempts = attempts.filter(quiz__node_id=node_id)
        if program_id:
            attempts = attempts.filter(quiz__node__program_id=program_id)

        scanned = 0
        updated = 0
        unchanged = 0
        completions_marked = 0
        completions_removed = 0

        with transaction.atomic():
            for attempt in attempts:
                scanned += 1
                points_earned, points_possible, percentage, passed = (
                    attempt.calculate_score()
                )

                changed = (
                    attempt.points_earned != points_earned
                    or attempt.points_possible != points_possible
                    or float(attempt.score or 0) != float(percentage)
                    or attempt.passed != passed
                )

                if not changed:
                    unchanged += 1
                    continue

                updated += 1
                self.stdout.write(
                    "attempt={attempt_id} quiz={quiz_id} user={user} "
                    "score={old_score}->{new_score} passed={old_passed}->{new_passed}".format(
                        attempt_id=attempt.id,
                        quiz_id=attempt.quiz_id,
                        user=attempt.enrollment.user.email
                        or attempt.enrollment.user.username,
                        old_score=attempt.score,
                        new_score=percentage,
                        old_passed=attempt.passed,
                        new_passed=passed,
                    )
                )

                if dry_run:
                    continue

                attempt.points_earned = points_earned
                attempt.points_possible = points_possible
                attempt.score = percentage
                attempt.passed = passed
                attempt.save(
                    update_fields=[
                        "points_earned",
                        "points_possible",
                        "score",
                        "passed",
                    ]
                )

                completion_delta = self._sync_quiz_completion(attempt)
                completions_marked += completion_delta["marked"]
                completions_removed += completion_delta["removed"]

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write(
            self.style.SUCCESS(
                "Summary: scanned={scanned}, updated={updated}, unchanged={unchanged}, "
                "completions_marked={marked}, completions_removed={removed}, dry_run={dry_run}".format(
                    scanned=scanned,
                    updated=updated,
                    unchanged=unchanged,
                    marked=completions_marked,
                    removed=completions_removed,
                    dry_run=bool(dry_run),
                )
            )
        )

    def _sync_quiz_completion(self, attempt):
        node = attempt.quiz.node
        node_props = node.properties if isinstance(node.properties, dict) else {}
        lesson_type = str(node_props.get("lesson_type") or "").lower()
        node_type = str(node.node_type or "").lower()
        is_quiz_node = node_type == "quiz" or lesson_type == "quiz"
        if not is_quiz_node:
            return {"marked": 0, "removed": 0}

        official_attempt = get_official_quiz_attempt(attempt.enrollment, attempt.quiz)
        if official_attempt and official_attempt.passed is True:
            already_completed = NodeCompletion.objects.filter(
                enrollment=attempt.enrollment,
                node=node,
            ).exists()
            ProgressionEngine().mark_complete(
                enrollment=attempt.enrollment,
                node=node,
                completion_type="quiz_pass",
            )
            return {"marked": 0 if already_completed else 1, "removed": 0}

        removed, _ = NodeCompletion.objects.filter(
            enrollment=attempt.enrollment,
            node=node,
        ).delete()
        return {"marked": 0, "removed": removed}
