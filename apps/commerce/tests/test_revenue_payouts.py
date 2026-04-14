import hashlib
import hmac
import json

import pytest
from django.test import Client
from django.urls import reverse

from apps.commerce.exceptions import CommerceError
from apps.commerce.models import (
    BeneficiaryPayout,
    Order,
    ProgramRevenueShare,
    Refund,
    RevenueLedgerEntry,
    SettlementParty,
)
from apps.commerce.services import CheckoutService, PayoutService, RefundService
from apps.core.models import Program
from apps.core.tests.factories import UserFactory


pytestmark = pytest.mark.django_db


def _build_signature(secret: str, payload: dict) -> str:
    raw_body = json.dumps(payload).encode("utf-8")
    return hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha512).hexdigest()


def _create_program(code: str, *, price: int = 1000, currency: str = "KES") -> Program:
    return Program.objects.create(
        name=f"Program {code}",
        code=code,
        level="beginner",
        is_published=True,
        custom_pricing={"price": price, "currency": currency},
    )


def _mark_paid(order: Order) -> Order:
    return CheckoutService.mark_order_paid(
        order,
        actor=order.user,
        provider_reference=order.reference,
    )


def test_mark_paid_and_refund_create_revenue_ledger_entries(monkeypatch):
    student = UserFactory()
    instructor = SettlementParty.objects.create(
        party_type=SettlementParty.TYPE_INSTRUCTOR,
        display_name="Instructor Share",
        payout_method=SettlementParty.PAYOUT_METHOD_KEPSS,
        destination_details={"account_number": "1234567890", "bank_code": "011"},
    )
    partner = SettlementParty.objects.create(
        party_type=SettlementParty.TYPE_PARTNER,
        display_name="Partner Share",
        payout_method=SettlementParty.PAYOUT_METHOD_MOBILE_MONEY,
        destination_details={"account_number": "254700000001", "bank_code": "MPESA"},
    )
    program = _create_program("REV-001", price=1000)
    ProgramRevenueShare.objects.create(program=program, settlement_party=instructor, share_bps=3000)
    ProgramRevenueShare.objects.create(program=program, settlement_party=partner, share_bps=2000)

    order = CheckoutService.create_order_from_programs(student, [program], Order.PROVIDER_PAYSTACK)
    order = _mark_paid(order)

    credit_entries = RevenueLedgerEntry.objects.filter(
        order=order,
        entry_type=RevenueLedgerEntry.ENTRY_PAYMENT_SHARE,
    ).order_by("settlement_party_id")

    assert credit_entries.count() == 2
    assert list(credit_entries.values_list("amount_minor", flat=True)) == [30000, 20000]

    def fake_create_refund(refund):
        return {"status": True, "data": {"id": "refund_ledger_1", "status": "processed"}}

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService.create_refund", fake_create_refund)

    refund = RefundService.request_refund(order, actor=student, reason="Student requested refund")

    debit_entries = RevenueLedgerEntry.objects.filter(
        refund=refund,
        entry_type=RevenueLedgerEntry.ENTRY_REFUND_REVERSAL,
    ).order_by("settlement_party_id")

    assert refund.status == Refund.STATUS_PROCESSED
    assert debit_entries.count() == 2
    assert list(debit_entries.values_list("amount_minor", flat=True)) == [30000, 20000]


def test_admin_payout_create_send_and_transfer_webhook(settings, monkeypatch):
    settings.PAYSTACK_SECRET_KEY = "sk_test_123"
    settings.PAYSTACK_WEBHOOK_SECRET = "whsec_test_123"

    student = UserFactory()
    admin = UserFactory(admin=True)
    settlement_party = SettlementParty.objects.create(
        party_type=SettlementParty.TYPE_INSTRUCTOR,
        display_name="Instructor Payout",
        payout_method=SettlementParty.PAYOUT_METHOD_KEPSS,
        destination_details={"account_number": "1234567890", "bank_code": "011"},
    )
    program = _create_program("REV-002", price=1000)
    ProgramRevenueShare.objects.create(program=program, settlement_party=settlement_party, share_bps=5000)

    order = CheckoutService.create_order_from_programs(student, [program], Order.PROVIDER_PAYSTACK)
    _mark_paid(order)

    def fake_request(method, url, payload=None):
        if url.endswith("/transferrecipient"):
            return {
                "status": True,
                "data": {
                    "recipient_code": "RCP_TEST_1",
                },
            }
        if url.endswith("/transfer"):
            return {
                "status": True,
                "data": {
                    "transfer_code": "TRF_TEST_1",
                    "status": "processing",
                },
            }
        raise AssertionError(f"Unexpected Paystack URL: {url}")

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService._request", fake_request)

    client = Client()
    client.force_login(admin)

    create_response = client.post(
        reverse("commerce:admin_payouts"),
        data=json.dumps(
            {
                "settlementPartyId": settlement_party.id,
                "amountMinor": 50000,
                "currency": "KES",
                "notes": "First instructor payout",
            }
        ),
        content_type="application/json",
    )
    payout_id = create_response.json()["payout"]["id"]

    send_response = client.post(
        reverse("commerce:admin_send_payout", args=[payout_id]),
        data=json.dumps({}),
        content_type="application/json",
    )

    payout = BeneficiaryPayout.objects.get(pk=payout_id)
    assert create_response.status_code == 201
    assert send_response.status_code == 200
    assert payout.status == BeneficiaryPayout.STATUS_PROCESSING
    assert payout.reference
    assert payout.provider_reference == "TRF_TEST_1"
    settlement_party.refresh_from_db()
    assert settlement_party.paystack_recipient_code == "RCP_TEST_1"

    payload = {
        "event": "transfer.success",
        "id": "evt_transfer_1",
        "data": {
            "reference": payout.reference,
            "transfer_code": "TRF_TEST_1",
            "status": "success",
        },
    }
    webhook_response = Client(enforce_csrf_checks=True).post(
        reverse("commerce:paystack_webhook"),
        data=json.dumps(payload),
        content_type="application/json",
        HTTP_X_PAYSTACK_SIGNATURE=_build_signature(settings.PAYSTACK_WEBHOOK_SECRET, payload),
    )

    payout.refresh_from_db()

    assert webhook_response.status_code == 200
    assert payout.status == BeneficiaryPayout.STATUS_PAID


def test_send_payout_marks_processing_before_transfer_request(monkeypatch):
    student = UserFactory()
    admin = UserFactory(admin=True)
    settlement_party = SettlementParty.objects.create(
        party_type=SettlementParty.TYPE_INSTRUCTOR,
        display_name="Processing Guard",
        payout_method=SettlementParty.PAYOUT_METHOD_KEPSS,
        destination_details={"account_number": "1234567890", "bank_code": "011"},
    )
    program = _create_program("REV-004", price=1000)
    ProgramRevenueShare.objects.create(program=program, settlement_party=settlement_party, share_bps=5000)

    order = CheckoutService.create_order_from_programs(student, [program], Order.PROVIDER_PAYSTACK)
    _mark_paid(order)
    payout = PayoutService.create_payout(
        settlement_party,
        amount_minor=50000,
        currency="KES",
        actor=admin,
        notes="Verify processing guard",
    )

    def fake_initiate_transfer(payout_to_send):
        current = BeneficiaryPayout.objects.get(pk=payout_to_send.pk)
        assert current.status == BeneficiaryPayout.STATUS_PROCESSING
        return {
            "status": True,
            "data": {
                "transfer_code": "TRF_TEST_2",
                "status": "processing",
            },
        }

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService.initiate_transfer", fake_initiate_transfer)

    payout = PayoutService.send_payout(payout, actor=admin)

    assert payout.status == BeneficiaryPayout.STATUS_PROCESSING
    assert payout.provider_reference == "TRF_TEST_2"


def test_negative_balance_blocks_new_payout_after_refund(monkeypatch):
    student = UserFactory()
    admin = UserFactory(admin=True)
    settlement_party = SettlementParty.objects.create(
        party_type=SettlementParty.TYPE_PARTNER,
        display_name="Revenue Partner",
        payout_method=SettlementParty.PAYOUT_METHOD_MOBILE_MONEY,
        destination_details={"account_number": "254700000002", "bank_code": "MPESA"},
    )
    program = _create_program("REV-003", price=1000)
    ProgramRevenueShare.objects.create(program=program, settlement_party=settlement_party, share_bps=10000)

    order = CheckoutService.create_order_from_programs(student, [program], Order.PROVIDER_PAYSTACK)
    order = _mark_paid(order)

    payout = PayoutService.create_payout(
        settlement_party,
        amount_minor=100000,
        currency="KES",
        actor=admin,
        notes="Reserve all available balance",
    )

    def fake_create_refund(refund):
        return {"status": True, "data": {"id": "refund_ledger_2", "status": "processed"}}

    monkeypatch.setattr("apps.commerce.services.PaystackGatewayService.create_refund", fake_create_refund)
    RefundService.request_refund(order, actor=admin, reason="Reverse after reserved payout")

    with pytest.raises(CommerceError):
        PayoutService.create_payout(
            settlement_party,
            amount_minor=1,
            currency="KES",
            actor=admin,
            notes="Should fail because balance is negative",
        )

    payout.refresh_from_db()
    assert payout.status == BeneficiaryPayout.STATUS_PENDING_APPROVAL
