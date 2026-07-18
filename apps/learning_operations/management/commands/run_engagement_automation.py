from django.core.management.base import BaseCommand

from apps.learning_operations.engagement import generate_engagement_reminders
from apps.notifications.outbox import process_notification_outbox


class Command(BaseCommand):
    help = "Generate due learner reminders and deliver the notification outbox."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=200)

    def handle(self, *args, **options):
        events = generate_engagement_reminders()
        delivery = process_notification_outbox(limit=max(options["limit"], 1))
        self.stdout.write(
            "Matched {total} reminders; claimed {claimed}; sent {sent}; failed {failed}.".format(
                **events, **delivery
            )
        )
