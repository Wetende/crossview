import pytest
from django.core import mail
from django.urls import reverse

from apps.core.tests.factories import UserFactory
from apps.notifications.models import Notification
from apps.progression.models import Enrollment
from apps.progression.tests.factories import ProgramFactory


pytestmark = pytest.mark.django_db


def test_admin_announcement_delivers_once_per_learner(client):
    admin = UserFactory(is_staff=True)
    learner = UserFactory(email="learner@example.test")
    program = ProgramFactory()
    Enrollment.objects.create(user=learner, program=program, status="active")
    client.force_login(admin)

    response = client.post(
        reverse("core:admin.announcement_create"),
        data={
            "programId": program.id,
            "title": "Schedule update",
            "message": "The next lesson is available.",
        },
    )

    assert response.status_code == 302
    assert Notification.objects.filter(
        recipient=learner,
        notification_type="announcement",
    ).count() == 1
    assert len(mail.outbox) == 1
