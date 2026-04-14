import hashlib
import hmac
import json

import pytest
from django.test import Client
from django.urls import reverse

from apps.commerce.models import Cart, Order, PaymentAttempt, ProgramAccessGrant, Refund, WebhookEvent
from apps.commerce.services import CheckoutService
from apps.core.models import Program
from apps.core.tests.factories import UserFactory
from apps.progression.models import Enrollment


pytestmark = pytest.mark.django_db


def _build_signature(secret: str, payload: dict) -> str:
    raw_body = json.dumps(payload).encode("utf-8")
    return hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha512).hexdigest()


def _create_program(
    code: str,
    *,
    price: int = 1000,
    currency: str = "KES",
    published: bool = True,
) -> Program:
    return Program.objects.create(
        name=f"Program {code}",
        code=code,
        level="beginner",
        is_published=published,
        custom_pricing={"price": price, "currency": currency},
    )


def _login_client(user):
    client = Client()
    client.force_login(user)
    return client


def _mark_paid(order: Order) -> Order:
    return CheckoutService.mark_order_paid(
        order,
        actor=order.user,
        provider_reference=order.reference,
    )


def test_cart_rejects_mixed_currency_items():
    user = UserFactory()
    client = _login_client(user)
    kes_program = _create_program("PAY-CART-001", currency="KES")
    usd_program = _create_program("PAY-CART-002", currency="USD")

    first_response = client.post(
        reverse("commerce:cart_add_item"),
        data=json.dumps({"programId": kes_program.id}),
        content_type="application/json",
    )
    second_response = client.post(
        reverse("commerce:cart_add_item"),
        data=json.dumps({"programId": usd_program.id}),
        content_type="application/json",
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 400
    assert second_response.json()["error"] == "mixed_currency"


@pytest.mark.parametrize(
    ("program_kwargs", "existing_enrollment", "expected_error"),
    [
        ({"published": False}, None, "program_unpublished"),
        ({"price": 0}, None, "program_free"),
        ({}, "active", "already_enrolled"),
    ],
)
def test_cart_add_rejects_unpurchasable_programs(program_kwargs, existing_enrollment, expected_error):
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-CART-003", **program_kwargs)

    if existing_enrollment:
        Enrollment.objects.create(
            user=user,
            program=program,
            status=existing_enrollment,
            access_source="paid",
        )

    response = client.post(
        reverse("commerce:cart_add_item"),
        data=json.dumps({"programId": program.id}),
        content_type="application/json",
    )

    assert response.status_code in {400, 404}
    assert response.json()["error"] == expected_error


def test_checkout_creates_multi_item_order_and_clears_cart():
    user = UserFactory()
    client = _login_client(user)
    program_one = _create_program("PAY-CHK-001", price=1200)
    program_two = _create_program("PAY-CHK-002", price=800)

    add_one = client.post(
        reverse("commerce:cart_add_item"),
        data=json.dumps({"programId": program_one.id}),
        content_type="application/json",
    )
    add_two = client.post(
        reverse("commerce:cart_add_item"),
        data=json.dumps({"programId": program_two.id}),
        content_type="application/json",
    )

    cart_id = add_two.json()["cart"]["id"]
    response = client.post(
        reverse("commerce:orders"),
        data=json.dumps({"paymentMethod": "paystack"}),
        content_type="application/json",
    )

    assert add_one.status_code == 201
    assert add_two.status_code == 201
    assert response.status_code == 201

    order_payload = response.json()["order"]
    checked_out_cart = Cart.objects.get(pk=cart_id)

    assert order_payload["status"] == "pending_payment"
    assert order_payload["totalMinor"] == 200000
    assert len(order_payload["items"]) == 2
    assert checked_out_cart.status == "checked_out"
    assert checked_out_cart.items.count() == 0


def test_checkout_preview_direct_returns_selected_program():
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-PREVIEW-001", price=1200)

    response = client.get(
        reverse("commerce:checkout_preview"),
        {"programIds[]": [program.id]},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "direct"
    assert payload["itemCount"] == 1
    assert payload["items"][0]["program"]["id"] == program.id
    assert payload["totalMinor"] == 120000


@pytest.mark.parametrize(
    ("program_kwargs", "expected_error"),
    [
        ({"published": False}, "program_unpublished"),
        ({"price": 0}, "program_free"),
    ],
)
def test_checkout_preview_direct_rejects_unpurchasable_programs(program_kwargs, expected_error):
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-PREVIEW-002", **program_kwargs)

    response = client.get(
        reverse("commerce:checkout_preview"),
        {"programIds[]": [program.id]},
    )

    assert response.status_code in {400, 404}
    assert response.json()["error"] == expected_error


def test_checkout_preview_direct_rejects_duplicate_programs():
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-PREVIEW-003", price=1500)

    response = client.get(
        reverse("commerce:checkout_preview"),
        {"programIds[]": [program.id, program.id]},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "duplicate_program"


def test_orders_with_program_ids_creates_direct_order_without_mutating_cart():
    user = UserFactory()
    client = _login_client(user)
    cart_program = _create_program("PAY-DIRECT-001", price=1000)
    direct_program = _create_program("PAY-DIRECT-002", price=2300)

    add_response = client.post(
        reverse("commerce:cart_add_item"),
        data=json.dumps({"programId": cart_program.id}),
        content_type="application/json",
    )
    cart_id = add_response.json()["cart"]["id"]

    response = client.post(
        reverse("commerce:orders"),
        data=json.dumps({"paymentMethod": "paystack", "programIds": [direct_program.id]}),
        content_type="application/json",
    )

    assert response.status_code == 201
    payload = response.json()["order"]
    assert payload["items"][0]["program"]["id"] == direct_program.id

    active_cart = Cart.objects.get(pk=cart_id)
    assert active_cart.status == Cart.STATUS_ACTIVE
    assert active_cart.items.count() == 1
    assert active_cart.items.first().program_id == cart_program.id


def test_direct_order_reuses_existing_unpaid_single_program_order():
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-DIRECT-003", price=999)

    first = client.post(
        reverse("commerce:orders"),
        data=json.dumps({"paymentMethod": "paystack", "programIds": [program.id]}),
        content_type="application/json",
    )
    second = client.post(
        reverse("commerce:orders"),
        data=json.dumps({"paymentMethod": "paystack", "programIds": [program.id]}),
        content_type="application/json",
    )

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["order"]["id"] == second.json()["order"]["id"]
    assert Order.objects.filter(user=user).count() == 1


def test_wishlist_add_remove_list_and_sync_are_idempotent():
    user = UserFactory()
    client = _login_client(user)
    program_one = _create_program("PAY-WISH-001", price=1200)
    program_two = _create_program("PAY-WISH-002", price=1300)

    add_one = client.post(
        reverse("commerce:wishlist_add_item"),
        data=json.dumps({"programId": program_one.id}),
        content_type="application/json",
    )
    add_duplicate = client.post(
        reverse("commerce:wishlist_add_item"),
        data=json.dumps({"programId": program_one.id}),
        content_type="application/json",
    )
    sync = client.post(
        reverse("commerce:wishlist_sync"),
        data=json.dumps({"programIds": [program_one.id, program_two.id, program_two.id]}),
        content_type="application/json",
    )
    remove_existing = client.delete(
        reverse("commerce:wishlist_remove_item", args=[program_one.id]),
    )
    remove_missing = client.delete(
        reverse("commerce:wishlist_remove_item", args=[program_one.id]),
    )
    listing = client.get(reverse("commerce:wishlist_list"))

    assert add_one.status_code == 201
    assert add_duplicate.status_code == 201
    assert sync.status_code == 200
    assert remove_existing.status_code == 200
    assert remove_missing.status_code == 200
    assert listing.status_code == 200
    assert listing.json()["wishlist"]["itemCount"] == 1
    assert listing.json()["wishlist"]["items"][0]["program"]["id"] == program_two.id


def test_paystack_initialize_endpoint_returns_access_code(monkeypatch):
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-INIT-001")
    order = CheckoutService.create_order_from_programs(user, [program], Order.PROVIDER_PAYSTACK)

    def fake_request(method, url, payload=None):
        return {
            "status": True,
            "data": {
                "authorization_url": "https://paystack.test/authorize/abc123",
                "access_code": "acc_abc123",
                "reference": order.reference,
            },
        }

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService._request", fake_request)

    response = client.post(reverse("commerce:order_paystack_initialize", args=[order.id]))

    order.refresh_from_db()

    assert response.status_code == 200
    assert response.json()["accessCode"] == "acc_abc123"
    assert response.json()["reference"] == order.reference
    assert order.status == "pending_payment"
    attempt = PaymentAttempt.objects.get(order=order, state="initialize")
    assert attempt.request_payload["channels"] == ["card", "mobile_money"]


def test_paystack_initialize_endpoint_requires_secret_key(settings):
    settings.PAYSTACK_SECRET_KEY = ""
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-INIT-002")
    order = CheckoutService.create_order_from_programs(user, [program], Order.PROVIDER_PAYSTACK)

    response = client.post(reverse("commerce:order_paystack_initialize", args=[order.id]))

    order.refresh_from_db()

    assert response.status_code == 502
    assert response.json()["error"] == "paystack_initialize_failed"
    assert order.status == "failed"


def test_paystack_callback_uses_shared_finalizer(client, monkeypatch):
    user = UserFactory()
    program = _create_program("PAY-CALLBACK-001")
    order = CheckoutService.create_order_from_programs(user, [program], Order.PROVIDER_PAYSTACK)
    client.force_login(user)

    def fake_request(method, url, payload=None):
        return {
            "status": True,
            "data": {
                "reference": order.reference,
                "status": "success",
                "amount": order.total_minor,
                "currency": order.currency,
                "paid_at": "2026-04-12T10:45:00Z",
            },
        }

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService._request", fake_request)

    response = client.get(reverse("commerce:paystack_callback"), {"reference": order.reference})

    order.refresh_from_db()

    assert response.status_code == 302
    assert response.url == reverse("progression:student.program", args=[program.id])
    assert order.status == "paid"
    assert Enrollment.objects.filter(user=user, program=program).exists()
    assert PaymentAttempt.objects.filter(order=order, state="callback_verify").count() == 1


def test_paystack_verify_endpoint_marks_order_paid(monkeypatch):
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-VERIFY-001")
    order = CheckoutService.create_order_from_programs(user, [program], Order.PROVIDER_PAYSTACK)

    def fake_request(method, url, payload=None):
        return {
            "status": True,
            "data": {
                "reference": order.reference,
                "status": "success",
                "amount": order.total_minor,
                "currency": order.currency,
                "paid_at": "2026-04-12T12:30:00Z",
            },
        }

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService._request", fake_request)

    response = client.post(
        reverse("commerce:order_paystack_verify", args=[order.id]),
        data=json.dumps({"reference": order.reference}),
        content_type="application/json",
    )

    order.refresh_from_db()

    assert response.status_code == 200
    assert response.json()["order"]["status"] == "paid"
    assert response.json()["finalized"] is True
    assert order.status == "paid"
    assert Enrollment.objects.filter(user=user, program=program, status="active").exists()


def test_paystack_verify_endpoint_rejects_amount_mismatch(monkeypatch):
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-VERIFY-002")
    order = CheckoutService.create_order_from_programs(user, [program], Order.PROVIDER_PAYSTACK)

    def fake_request(method, url, payload=None):
        return {
            "status": True,
            "data": {
                "reference": order.reference,
                "status": "success",
                "amount": order.total_minor - 1,
                "currency": order.currency,
                "paid_at": "2026-04-12T12:45:00Z",
            },
        }

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService._request", fake_request)

    response = client.post(
        reverse("commerce:order_paystack_verify", args=[order.id]),
        data=json.dumps({"reference": order.reference}),
        content_type="application/json",
    )

    order.refresh_from_db()

    assert response.status_code == 200
    assert response.json()["order"]["status"] == "failed"
    assert response.json()["finalized"] is False
    assert not Enrollment.objects.filter(user=user, program=program).exists()


def test_paystack_charge_mpesa_returns_provider_http_status(monkeypatch):
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-MPESA-001")
    order = CheckoutService.create_order_from_programs(user, [program], Order.PROVIDER_PAYSTACK)

    def fake_request(method, url, payload=None):
        return {
            "status": False,
            "message": "Invalid mobile money provider.",
            "_http_status": 400,
        }

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService._request", fake_request)

    response = client.post(
        reverse("commerce:order_paystack_charge_mpesa", args=[order.id]),
        data=json.dumps({"phone": "0712345678"}),
        content_type="application/json",
    )

    order.refresh_from_db()

    assert response.status_code == 400
    assert response.json()["ok"] is False
    assert response.json()["error"] == "paystack_charge_failed"
    assert order.status == "failed"


def test_paystack_webhook_marks_multi_item_order_paid_and_is_idempotent(settings):
    settings.PAYSTACK_SECRET_KEY = "sk_test_123"
    settings.PAYSTACK_WEBHOOK_SECRET = "whsec_test_123"

    user = UserFactory()
    program_one = _create_program("PAY-WEBHOOK-001")
    program_two = _create_program("PAY-WEBHOOK-002", price=2000)
    order = CheckoutService.create_order_from_programs(
        user,
        [program_one, program_two],
        Order.PROVIDER_PAYSTACK,
    )

    payload = {
        "event": "charge.success",
        "id": "evt_123",
        "data": {
            "reference": order.reference,
            "status": "success",
            "amount": order.total_minor,
            "currency": order.currency,
            "paid_at": "2026-04-12T10:15:00Z",
        },
    }
    signature = _build_signature(settings.PAYSTACK_WEBHOOK_SECRET, payload)
    client = Client(enforce_csrf_checks=True)

    first_response = client.post(
        reverse("commerce:paystack_webhook"),
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_X_PAYSTACK_SIGNATURE=signature,
    )
    second_response = client.post(
        reverse("commerce:paystack_webhook"),
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_X_PAYSTACK_SIGNATURE=signature,
    )

    order.refresh_from_db()

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert second_response.json() == {"ok": True, "duplicate": True}
    assert order.status == "paid"
    assert Enrollment.objects.filter(user=user, status="active").count() == 2
    assert ProgramAccessGrant.objects.filter(
        user=user,
        status="active",
    ).count() == 2
    assert WebhookEvent.objects.filter(reference=order.reference).count() == 1
    assert PaymentAttempt.objects.filter(order=order, state="webhook_charge.success").count() == 1


def test_invalid_signature_does_not_poison_valid_retry(settings):
    settings.PAYSTACK_SECRET_KEY = "sk_test_123"
    settings.PAYSTACK_WEBHOOK_SECRET = "whsec_test_123"

    user = UserFactory()
    program = _create_program("PAY-WEBHOOK-003")
    order = CheckoutService.create_order_from_programs(user, [program], Order.PROVIDER_PAYSTACK)

    payload = {
        "event": "charge.success",
        "id": "evt_retry_1",
        "data": {
            "reference": order.reference,
            "status": "success",
            "amount": order.total_minor,
            "currency": order.currency,
            "paid_at": "2026-04-12T10:20:00Z",
        },
    }

    client = Client(enforce_csrf_checks=True)
    invalid_response = client.post(
        reverse("commerce:paystack_webhook"),
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_X_PAYSTACK_SIGNATURE="bad_signature",
    )
    valid_response = client.post(
        reverse("commerce:paystack_webhook"),
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_X_PAYSTACK_SIGNATURE=_build_signature(settings.PAYSTACK_WEBHOOK_SECRET, payload),
    )

    order.refresh_from_db()

    assert invalid_response.status_code == 401
    assert valid_response.status_code == 200
    assert order.status == "paid"
    assert WebhookEvent.objects.filter(event_id="evt_retry_1").count() == 1


def test_offline_bank_transfer_requires_admin_mark_paid():
    student = UserFactory()
    admin = UserFactory(admin=True)
    student_client = _login_client(student)
    admin_client = _login_client(admin)
    program = _create_program("PAY-OFFLINE-001")

    student_client.post(
        reverse("commerce:cart_add_item"),
        data=json.dumps({"programId": program.id}),
        content_type="application/json",
    )
    checkout_response = student_client.post(
        reverse("commerce:orders"),
        data=json.dumps({"paymentMethod": "offline_bank_transfer"}),
        content_type="application/json",
    )
    order_id = checkout_response.json()["order"]["id"]

    mark_paid_response = admin_client.post(
        reverse("commerce:admin_mark_order_paid", args=[order_id]),
        data=json.dumps({}),
        content_type="application/json",
    )

    order = Order.objects.get(pk=order_id)

    assert checkout_response.status_code == 201
    assert order.status == "paid"
    assert mark_paid_response.status_code == 200
    assert Enrollment.objects.filter(user=student, program=program, status="active").exists()
    assert ProgramAccessGrant.objects.filter(
        user=student,
        program=program,
        status="active",
    ).exists()


def test_partial_refund_revokes_only_selected_program_access(monkeypatch):
    student = UserFactory()
    admin = UserFactory(admin=True)
    admin_client = _login_client(admin)
    program_one = _create_program("PAY-REFUND-001")
    program_two = _create_program("PAY-REFUND-002", price=3000)
    order = CheckoutService.create_order_from_programs(
        student,
        [program_one, program_two],
        Order.PROVIDER_PAYSTACK,
    )
    order = _mark_paid(order)
    target_item = order.items.get(program=program_one)

    def fake_create_refund(refund):
        return {
            "status": True,
            "data": {
                "id": "refund_123",
                "status": "processed",
            },
        }

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService.create_refund", fake_create_refund)

    response = admin_client.post(
        reverse("commerce:admin_refund_order", args=[order.id]),
        data=json.dumps({"orderItemIds": [target_item.id], "reason": "Requested by student"}),
        content_type="application/json",
    )

    order.refresh_from_db()
    target_item.refresh_from_db()
    other_item = order.items.get(program=program_two)
    refunded_grant = ProgramAccessGrant.objects.get(order_item=target_item)
    active_grant = ProgramAccessGrant.objects.get(order_item=other_item)
    refunded_enrollment = Enrollment.objects.get(user=student, program=program_one)
    other_enrollment = Enrollment.objects.get(user=student, program=program_two)

    assert response.status_code == 200
    assert order.status == "partially_refunded"
    assert target_item.status == "refunded"
    assert refunded_grant.status == "revoked"
    assert active_grant.status == "active"
    assert refunded_enrollment.status == "suspended"
    assert other_enrollment.status == "active"


def test_offline_full_refund_revokes_all_items_and_marks_order_refunded():
    student = UserFactory()
    admin = UserFactory(admin=True)
    admin_client = _login_client(admin)
    program_one = _create_program("PAY-REFUND-003")
    program_two = _create_program("PAY-REFUND-004", price=2200)
    order = CheckoutService.create_order_from_programs(
        student,
        [program_one, program_two],
        Order.PROVIDER_OFFLINE_BANK_TRANSFER,
    )
    order = _mark_paid(order)

    response = admin_client.post(
        reverse("commerce:admin_refund_order", args=[order.id]),
        data=json.dumps({"reason": "Manual bank transfer refund"}),
        content_type="application/json",
    )

    order.refresh_from_db()

    assert response.status_code == 200
    assert order.status == "refunded"
    assert Refund.objects.filter(order=order, status="processed").count() == 1
    assert ProgramAccessGrant.objects.filter(order_item__order=order, status="revoked").count() == 2
    assert Enrollment.objects.filter(user=student, status="suspended").count() == 2


def test_refund_request_rejects_items_with_open_refund(monkeypatch):
    student = UserFactory()
    admin = UserFactory(admin=True)
    admin_client = _login_client(admin)
    program = _create_program("PAY-REFUND-005")
    order = CheckoutService.create_order_from_programs(
        student,
        [program],
        Order.PROVIDER_PAYSTACK,
    )
    order = _mark_paid(order)

    def fake_create_refund(refund):
        return {
            "status": True,
            "data": {
                "id": "refund_open_1",
                "status": "needs_attention",
            },
        }

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService.create_refund", fake_create_refund)

    first_response = admin_client.post(
        reverse("commerce:admin_refund_order", args=[order.id]),
        data=json.dumps({"reason": "First refund attempt"}),
        content_type="application/json",
    )
    second_response = admin_client.post(
        reverse("commerce:admin_refund_order", args=[order.id]),
        data=json.dumps({"reason": "Duplicate refund attempt"}),
        content_type="application/json",
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json()["error"] == "refund_already_in_progress"
    assert Refund.objects.filter(order=order).count() == 1


def test_admin_mark_paid_rejects_refunded_offline_order():
    student = UserFactory()
    admin = UserFactory(admin=True)
    admin_client = _login_client(admin)
    program = _create_program("PAY-OFFLINE-002")
    order = CheckoutService.create_order_from_programs(
        student,
        [program],
        Order.PROVIDER_OFFLINE_BANK_TRANSFER,
    )
    order = _mark_paid(order)

    refund_response = admin_client.post(
        reverse("commerce:admin_refund_order", args=[order.id]),
        data=json.dumps({"reason": "Refund before accidental re-mark"}),
        content_type="application/json",
    )
    mark_paid_response = admin_client.post(
        reverse("commerce:admin_mark_order_paid", args=[order.id]),
        data=json.dumps({}),
        content_type="application/json",
    )

    grant = ProgramAccessGrant.objects.get(order_item__order=order)

    assert refund_response.status_code == 200
    assert mark_paid_response.status_code == 400
    assert mark_paid_response.json()["error"] == "mark_paid_invalid_status"
    assert grant.status == "revoked"


def test_program_checkout_initialize_creates_new_order_after_failed_attempt(monkeypatch):
    user = UserFactory()
    client = _login_client(user)
    program = _create_program("PAY-RETRY-003", price=1000)
    failed_order = CheckoutService.create_order_from_programs(
        user,
        [program],
        Order.PROVIDER_PAYSTACK,
    )
    CheckoutService.mark_order_failed(failed_order, reason="First initialization failed")
    program.custom_pricing = {"price": 1500, "currency": "KES"}
    program.save(update_fields=["custom_pricing", "updated_at"])

    seen = {}

    def fake_initialize_payment(order, *, callback_url, channels=None):
        seen["order_id"] = order.id
        seen["total_minor"] = order.total_minor
        return {
            "data": {
                "authorization_url": "https://paystack.test/authorize/retry",
            }
        }

    monkeypatch.setattr(
        "apps.commerce.views.PaystackGatewayService.initialize_payment",
        fake_initialize_payment,
    )

    response = client.post(reverse("commerce:checkout_initialize", args=[program.id]))

    failed_order.refresh_from_db()

    assert response.status_code == 302
    assert response.url == "https://paystack.test/authorize/retry"
    assert failed_order.status == "failed"
    assert seen["order_id"] != failed_order.id
    assert seen["total_minor"] == 150000
    assert Order.objects.filter(user=user, program=program).count() == 2


def test_paystack_refund_retry_processes_needs_attention_refund(monkeypatch):
    student = UserFactory()
    admin = UserFactory(admin=True)
    admin_client = _login_client(admin)
    program = _create_program("PAY-RETRY-001")
    order = CheckoutService.create_order_from_programs(student, [program], Order.PROVIDER_PAYSTACK)
    order = _mark_paid(order)

    def fake_create_refund(refund):
        return {
            "status": True,
            "data": {
                "id": "refund_retry_1",
                "status": "needs_attention",
            },
        }

    def fake_retry_refund(refund, refund_account_details):
        assert refund_account_details["account_number"] == "0123456789"
        return {
            "status": True,
            "data": {
                "id": "refund_retry_1",
                "status": "processed",
            },
        }

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService.create_refund", fake_create_refund)
    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService.retry_refund", fake_retry_refund)

    create_response = admin_client.post(
        reverse("commerce:admin_refund_order", args=[order.id]),
        data=json.dumps({"reason": "Needs payout account"}),
        content_type="application/json",
    )
    refund_id = create_response.json()["refund"]["id"]

    retry_response = admin_client.post(
        reverse("commerce:admin_retry_refund", args=[refund_id]),
        data=json.dumps(
            {
                "refundAccountDetails": {
                    "account_number": "0123456789",
                    "bank_code": "999",
                    "country_code": "KE",
                }
            }
        ),
        content_type="application/json",
    )

    refund = Refund.objects.get(pk=refund_id)
    order.refresh_from_db()

    assert create_response.status_code == 200
    assert retry_response.status_code == 200
    assert refund.status == "processed"
    assert order.status == "refunded"
    assert ProgramAccessGrant.objects.filter(order_item__order=order, status="revoked").count() == 1
