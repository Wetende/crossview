from django.core.management.base import BaseCommand

from apps.google_classroom.jobs import process_classroom_jobs


class Command(BaseCommand):
    help = "Process durable Google Classroom roster, content, and grade jobs."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=100)

    def handle(self, *args, **options):
        result = process_classroom_jobs(limit=max(options["limit"], 1))
        self.stdout.write(
            "Claimed {claimed}; succeeded {succeeded}; failed {failed}.".format(**result)
        )
