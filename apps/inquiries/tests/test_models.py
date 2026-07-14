import pytest

from apps.core.tests.factories import UserFactory
from apps.inquiries.models import Inquiry

pytestmark = pytest.mark.django_db


def test_mark_resolved_records_status_actor_and_timestamp():
    staff_user = UserFactory(admin=True)
    inquiry = Inquiry.objects.create(
        name="Question Sender",
        email="sender@example.com",
        message="A question.",
    )

    inquiry.mark_resolved(user=staff_user)
    inquiry.refresh_from_db()

    assert inquiry.status == Inquiry.Status.RESOLVED
    assert inquiry.resolved_by == staff_user
    assert inquiry.resolved_at is not None
