from django.core.management.base import BaseCommand

from apps.notifications.outbox import process_notification_outbox


class Command(BaseCommand):
    help = "Deliver due instant emails and learning notification digests."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=200)

    def handle(self, *args, **options):
        result = process_notification_outbox(limit=max(options["limit"], 1))
        self.stdout.write(
            f"Claimed {result['claimed']}; sent {result['sent']}; failed {result['failed']}."
        )
