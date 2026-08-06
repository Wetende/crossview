import json

import pytest
from django.test import Client
from django.urls import reverse

from apps.commerce.models import Order
from apps.commerce.services import CheckoutService
from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.platform.models import PlatformSettings
from apps.progression.models import Enrollment, EnrollmentIntent


pytestmark = pytest.mark.django_db


def create_program(*, code: str, price: int) -> Program:
    platform = PlatformSettings.get_settings()
    platform.deployment_mode = "online"
    platform.features = {
        **(platform.features or {}),
        "payments": True,
        "enrollment_mode": "open",
    }
    platform.save(update_fields=["deployment_mode", "features", "updated_at"])
    return Program.objects.create(
        name=f"Course {code}",
        code=code,
        level="beginner",
        is_published=True,
        custom_pricing={
            "price": price,
            "currency": "KES",
            "payment_collection": "online" if price else "none",
            "card_display": "price" if price else "free",
        },
    )


def test_anonymous_capture_saves_lead_before_login():
    program = create_program(code="INTENT-FREE-ANON", price=0)

    response = Client().post(
        reverse("progression:enrollment_intent.capture", args=[program.id]),
        data={
            "name": "Mary Learner",
            "email": "mary@example.com",
            "phone": "0712 345 678",
        },
    )

    intent = EnrollmentIntent.objects.get()
    assert response.status_code == 302
    assert response.url.startswith("/login/?next=")
    assert intent.email == "mary@example.com"
    assert intent.status == EnrollmentIntent.STATUS_AWAITING_IDENTITY
    assert intent.user is None


def test_authenticated_free_capture_auto_enrolls():
    program = create_program(code="INTENT-FREE-AUTH", price=0)
    user = UserFactory(email="free@example.com", phone="")
    client = Client()
    client.force_login(user)

    response = client.post(
        reverse("progression:enrollment_intent.capture", args=[program.id]),
        data={"name": "Ignored Name", "email": "other@example.com", "phone": "0700111222"},
    )

    intent = EnrollmentIntent.objects.get()
    enrollment = Enrollment.objects.get(user=user, program=program)
    assert response.status_code == 302
    assert response.url == f"/student/programs/{program.id}/"
    assert intent.email == user.email
    assert intent.status == EnrollmentIntent.STATUS_ENROLLED
    assert intent.enrollment == enrollment
    assert enrollment.access_source == "free"


def test_paid_capture_links_order_and_converts_after_confirmed_payment():
    program = create_program(code="INTENT-PAID", price=1250)
    user = UserFactory(email="paid@example.com", phone="0700111222")
    client = Client()
    client.force_login(user)

    capture_response = client.post(
        reverse("progression:enrollment_intent.capture", args=[program.id]),
        data={"name": user.get_full_name(), "email": user.email, "phone": user.phone},
    )
    intent = EnrollmentIntent.objects.get()

    assert capture_response.status_code == 302
    assert "enrollmentIntentId=" in capture_response.url
    assert intent.status == EnrollmentIntent.STATUS_AWAITING_PAYMENT

    order_response = client.post(
        reverse("commerce:orders"),
        data=json.dumps(
            {
                "paymentMethod": "paystack",
                "programIds": [program.id],
                "enrollmentIntentId": intent.id,
            }
        ),
        content_type="application/json",
    )
    assert order_response.status_code == 201

    order = Order.objects.get(pk=order_response.json()["order"]["id"])
    intent.refresh_from_db()
    assert intent.order == order

    CheckoutService.mark_order_paid(
        order,
        actor=user,
        provider_reference="paystack-confirmed",
    )

    intent.refresh_from_db()
    assert intent.status == EnrollmentIntent.STATUS_ENROLLED
    assert intent.enrollment == Enrollment.objects.get(user=user, program=program)
    assert intent.converted_at is not None
