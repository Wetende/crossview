from django.core.management.base import BaseCommand

from apps.live_sessions.jobs import process_live_session_jobs


class Command(BaseCommand):
    help = "Process durable live-session provider synchronization jobs."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=100)

    def handle(self, *args, **options):
        result = process_live_session_jobs(limit=max(options["limit"], 1))
        self.stdout.write(
            self.style.SUCCESS(
                "Live-session jobs: "
                f"claimed={result['claimed']} "
                f"succeeded={result['succeeded']} "
                f"failed={result['failed']}"
            )
        )
