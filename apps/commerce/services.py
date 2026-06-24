import hashlib
import hmac
import json
import logging
import uuid
from datetime import timedelta
from urllib import error as url_error
from urllib import request as url_request

from django.conf import settings
from django.db import transaction
from django.db.models import Prefetch, Q, Sum
from django.urls import reverse
from django.utils import timezone

from apps.core.models import Program, User
from apps.core.services.course_prerequisites import CoursePrerequisiteService
from apps.progression.models import Enrollment, EnrollmentRequest

from .exceptions import CommerceError
from .models import (
    BeneficiaryPayout,
    Cart,
    CartItem,
    CommerceConfiguration,
    Order,
    OrderEvent,
    OrderItem,
    PaymentAttempt,
    ProgramAccessGrant,
    ProgramRevenueShare,
    Refund,
    RefundItem,
    RevenueLedgerEntry,
    SettlementParty,
    WebhookEvent,
    WishlistItem,
)

logger = logging.getLogger(__name__)

PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize"
PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify/{reference}"
PAYSTACK_REFUND_URL = "https://api.paystack.co/refund"
PAYSTACK_REFUND_RETRY_URL = (
    "https://api.paystack.co/refund/retry_with_customer_details/{refund_id}"
)
PAYSTACK_TRANSFER_RECIPIENT_URL = "https://api.paystack.co/transferrecipient"
PAYSTACK_TRANSFER_URL = "https://api.paystack.co/transfer"
PAYSTACK_CHARGE_URL = "https://api.paystack.co/charge"

PAYSTACK_POPUP_CHANNELS = ["card", "mobile_money"]
PAYSTACK_PAYOUT_HOLD_STATUSES = {
    BeneficiaryPayout.STATUS_PENDING_APPROVAL,
    BeneficiaryPayout.STATUS_PROCESSING,
    BeneficiaryPayout.STATUS_PAID,
}


def program_price_minor(program: Program) -> tuple[int, str]:
    custom_pricing = program.custom_pricing or {}
    amount = custom_pricing.get("price", 0) or 0
    currency = str(custom_pricing.get("currency", "KES") or "KES").upper()

    try:
        amount_float = float(amount)
    except (TypeError, ValueError):
        amount_float = 0

    return max(0, int(round(amount_float * 100))), currency


def program_public_url(program: Program) -> str:
    return f"/programs/{program.slug}/"


def build_paystack_dedupe_key(
    event: str,
    event_id: str = "",
    reference: str = "",
    refund_reference: str = "",
) -> str:
    normalized_event = str(event or "").strip().lower() or "unknown"
    normalized_event_id = str(event_id or "").strip()
    normalized_reference = str(reference or "").strip()
    normalized_refund_reference = str(refund_reference or "").strip()

    if normalized_event_id:
        return f"paystack:event:{normalized_event_id}"
    if normalized_refund_reference:
        return f"paystack:refund:{normalized_refund_reference}:event:{normalized_event}"
    if normalized_reference:
        return f"paystack:reference:{normalized_reference}:event:{normalized_event}"
    return f"paystack:fallback:{normalized_event}:{uuid.uuid4().hex}"


def write_order_event(
    order: Order,
    event_type: str,
    *,
    actor: User | None = None,
    refund: Refund | None = None,
    message: str = "",
    payload: dict | None = None,
) -> OrderEvent:
    return OrderEvent.objects.create(
        order=order,
        refund=refund,
        actor=actor,
        event_type=event_type,
        message=message,
        payload=payload or {},
    )


def serialize_cart_item(item: CartItem) -> dict:
    return {
        "id": item.id,
        "amountMinor": item.amount_minor,
        "currency": item.currency,
        "program": {
            "id": item.program_id,
            "name": item.program.name if item.program_id else "",
            "code": item.program.code if item.program_id else "",
            "slug": item.program.slug if item.program_id else "",
            "publicUrl": program_public_url(item.program) if item.program_id else "",
        },
        "createdAt": item.created_at.isoformat() if item.created_at else None,
    }


def serialize_cart(cart: Cart | None) -> dict:
    if not cart:
        return {
            "id": None,
            "status": Cart.STATUS_ACTIVE,
            "currency": "",
            "itemCount": 0,
            "totalMinor": 0,
            "items": [],
        }

    items = list(cart.items.select_related("program").all())
    total_minor = sum(item.amount_minor for item in items)
    return {
        "id": cart.id,
        "status": cart.status,
        "currency": cart.currency,
        "itemCount": len(items),
        "totalMinor": total_minor,
        "items": [serialize_cart_item(item) for item in items],
        "createdAt": cart.created_at.isoformat() if cart.created_at else None,
        "updatedAt": cart.updated_at.isoformat() if cart.updated_at else None,
    }


def serialize_wishlist_item(item: WishlistItem) -> dict:
    amount_minor, currency = program_price_minor(item.program)
    return {
        "id": item.id,
        "program": {
            "id": item.program_id,
            "name": item.program.name if item.program_id else "",
            "code": item.program.code if item.program_id else "",
            "slug": item.program.slug if item.program_id else "",
            "publicUrl": program_public_url(item.program) if item.program_id else "",
            "thumbnail": item.program.thumbnail.url
            if item.program_id and item.program.thumbnail
            else None,
        },
        "amountMinor": amount_minor,
        "currency": currency,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
    }


def serialize_order_item(item: OrderItem) -> dict:
    return {
        "id": item.id,
        "status": item.status,
        "amountMinor": item.amount_minor,
        "refundedMinor": item.refunded_minor,
        "currency": item.currency,
        "program": {
            "id": item.program_id,
            "name": item.program_name,
            "code": item.program_code,
            "slug": item.program.slug if item.program_id else "",
            "publicUrl": program_public_url(item.program) if item.program_id else "",
        },
        "paidAt": item.paid_at.isoformat() if item.paid_at else None,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
    }


def serialize_refund(refund: Refund, *, include_items: bool = True) -> dict:
    items = list(
        refund.items.select_related("order_item").all() if include_items else []
    )
    return {
        "id": refund.id,
        "status": refund.status,
        "provider": refund.provider,
        "amountMinor": refund.amount_minor,
        "providerRefundId": refund.provider_refund_id,
        "reason": refund.reason,
        "notes": refund.notes,
        "processedAt": refund.processed_at.isoformat() if refund.processed_at else None,
        "createdAt": refund.created_at.isoformat() if refund.created_at else None,
        "items": [
            {
                "id": refund_item.id,
                "orderItemId": refund_item.order_item_id,
                "amountMinor": refund_item.amount_minor,
                "status": refund_item.status,
                "processedAt": (
                    refund_item.processed_at.isoformat()
                    if refund_item.processed_at
                    else None
                ),
            }
            for refund_item in items
        ],
    }


def serialize_order(
    order: Order, *, include_items: bool = True, include_refunds: bool = True
) -> dict:
    items = list(order.items.select_related("program").all() if include_items else [])
    refunds = (
        list(order.refunds.prefetch_related("items").all()) if include_refunds else []
    )
    primary_item = items[0] if items else None
    return {
        "id": order.id,
        "reference": order.reference,
        "provider": order.provider,
        "status": order.status,
        "currency": order.currency,
        "subtotalMinor": order.subtotal_minor,
        "taxMinor": order.tax_minor,
        "totalMinor": order.total_minor,
        "amountMinor": order.amount_minor,
        "refundedMinor": order.refunded_minor,
        "providerReference": order.provider_reference,
        "paidAt": order.paid_at.isoformat() if order.paid_at else None,
        "cancelledAt": order.cancelled_at.isoformat() if order.cancelled_at else None,
        "createdAt": order.created_at.isoformat() if order.created_at else None,
        "updatedAt": order.updated_at.isoformat() if order.updated_at else None,
        "cartId": order.cart_id,
        "program": (
            {
                "id": primary_item.program_id,
                "name": primary_item.program_name,
                "code": primary_item.program_code,
            }
            if primary_item
            else None
        ),
        "items": [serialize_order_item(item) for item in items],
        "refunds": [serialize_refund(refund) for refund in refunds],
    }


def serialize_settlement_party(party: SettlementParty) -> dict:
    return {
        "id": party.id,
        "partyType": party.party_type,
        "displayName": party.display_name,
        "userId": party.user_id,
        "email": party.email,
        "phone": party.phone,
        "payoutMethod": party.payout_method,
        "destinationDetails": party.destination_details or {},
        "active": party.active,
        "paystackRecipientCode": party.paystack_recipient_code,
        "createdAt": party.created_at.isoformat() if party.created_at else None,
        "updatedAt": party.updated_at.isoformat() if party.updated_at else None,
    }


def serialize_program_revenue_share(share: ProgramRevenueShare) -> dict:
    return {
        "id": share.id,
        "programId": share.program_id,
        "settlementPartyId": share.settlement_party_id,
        "shareBps": share.share_bps,
        "active": share.active,
        "createdAt": share.created_at.isoformat() if share.created_at else None,
        "updatedAt": share.updated_at.isoformat() if share.updated_at else None,
    }


def serialize_payout(payout: BeneficiaryPayout) -> dict:
    party = payout.settlement_party
    return {
        "id": payout.id,
        "status": payout.status,
        "provider": payout.provider,
        "amountMinor": payout.amount_minor,
        "currency": payout.currency,
        "reference": payout.reference,
        "providerReference": payout.provider_reference,
        "failureReason": payout.failure_reason,
        "processedAt": payout.processed_at.isoformat() if payout.processed_at else None,
        "createdAt": payout.created_at.isoformat() if payout.created_at else None,
        "updatedAt": payout.updated_at.isoformat() if payout.updated_at else None,
        "settlementParty": serialize_settlement_party(party) if party else None,
    }


class CartService:
    @staticmethod
    def get_active_cart(user: User) -> Cart | None:
        return (
            Cart.objects.filter(user=user, status=Cart.STATUS_ACTIVE)
            .prefetch_related("items__program")
            .first()
        )

    @staticmethod
    def get_or_create_active_cart(user: User) -> Cart:
        cart = CartService.get_active_cart(user)
        if cart:
            return cart
        return Cart.objects.create(user=user, status=Cart.STATUS_ACTIVE)

    @staticmethod
    def _validate_program_can_be_purchased(
        user: User, program: Program
    ) -> tuple[int, str]:
        if not program.is_published:
            raise CommerceError(
                "Program is not available for purchase.",
                code="program_unpublished",
                status_code=404,
            )

        amount_minor, currency = program_price_minor(program)
        if amount_minor <= 0:
            raise CommerceError(
                "Free programs cannot be added to cart.", code="program_free"
            )

        if (
            ProgramAccessGrant.objects.filter(
                user=user,
                program=program,
                status=ProgramAccessGrant.STATUS_ACTIVE,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
            .exists()
        ):
            raise CommerceError(
                "You already have paid access to this program.", code="already_enrolled"
            )

        if Enrollment.objects.filter(
            user=user,
            program=program,
            status__in=["active", "completed"],
        ).exists():
            raise CommerceError(
                "You are already enrolled in this program.", code="already_enrolled"
            )

        prerequisite_evaluation = CoursePrerequisiteService.evaluate(user, program)
        if prerequisite_evaluation.required and not prerequisite_evaluation.eligible:
            raise CommerceError(
                prerequisite_evaluation.blocking_message,
                code="prerequisites_required",
            )

        return amount_minor, currency

    @staticmethod
    def add_program(user: User, program: Program) -> Cart:
        amount_minor, currency = CartService._validate_program_can_be_purchased(
            user, program
        )
        with transaction.atomic():
            cart = (
                Cart.objects.select_for_update()
                .filter(
                    user=user,
                    status=Cart.STATUS_ACTIVE,
                )
                .first()
            )
            if not cart:
                cart = Cart.objects.create(user=user, status=Cart.STATUS_ACTIVE)

            if cart.items.filter(program=program).exists():
                raise CommerceError(
                    "Program is already in your active cart.", code="program_in_cart"
                )

            if cart.currency and cart.currency != currency:
                raise CommerceError(
                    "All cart items must use the same currency.",
                    code="mixed_currency",
                )

            if not cart.currency:
                cart.currency = currency
                cart.save(update_fields=["currency", "updated_at"])

            CartItem.objects.create(
                cart=cart,
                program=program,
                amount_minor=amount_minor,
                currency=currency,
            )

        return CartService.get_or_create_active_cart(user)

    @staticmethod
    def remove_program(user: User, program_id: int) -> Cart:
        with transaction.atomic():
            cart = (
                Cart.objects.select_for_update()
                .filter(
                    user=user,
                    status=Cart.STATUS_ACTIVE,
                )
                .first()
            )
            if not cart:
                raise CommerceError(
                    "Active cart not found.", code="cart_not_found", status_code=404
                )

            deleted, _ = cart.items.filter(program_id=program_id).delete()
            if deleted == 0:
                raise CommerceError(
                    "Program is not in your cart.",
                    code="cart_item_not_found",
                    status_code=404,
                )

            if not cart.items.exists():
                cart.currency = ""
                cart.save(update_fields=["currency", "updated_at"])

        return CartService.get_or_create_active_cart(user)

    @staticmethod
    def clear_cart(user: User) -> Cart:
        with transaction.atomic():
            cart = (
                Cart.objects.select_for_update()
                .filter(
                    user=user,
                    status=Cart.STATUS_ACTIVE,
                )
                .first()
            )
            if not cart:
                return CartService.get_or_create_active_cart(user)

            cart.items.all().delete()
            cart.currency = ""
            cart.save(update_fields=["currency", "updated_at"])

        return CartService.get_or_create_active_cart(user)


class WishlistService:
    @staticmethod
    def list_items(user: User) -> list[WishlistItem]:
        return list(
            WishlistItem.objects.filter(user=user)
            .select_related("program")
            .order_by("-created_at")
        )

    @staticmethod
    def serialize_list(user: User) -> dict:
        items = WishlistService.list_items(user)
        program_ids = [item.program_id for item in items if item.program_id]

        from collections import defaultdict
        from apps.curriculum.models import CurriculumNode

        stats_by_program_id = defaultdict(
            lambda: {"lesson_count": 0, "duration_minutes": 0}
        )
        assessment_types = {"quiz", "assignment", "practicum", "peer_review"}

        if program_ids:
            leaf_nodes = CurriculumNode.objects.filter(
                program_id__in=program_ids,
                is_published=True,
                children__isnull=True,
            ).values_list("program_id", "node_type", "properties")

            for program_id, node_type, properties in leaf_nodes:
                node_type_norm = (node_type or "").strip().lower()
                props = properties if isinstance(properties, dict) else {}
                lesson_type_norm = str(props.get("lesson_type") or "").strip().lower()
                if (
                    node_type_norm in assessment_types
                    or lesson_type_norm in assessment_types
                ):
                    continue
                stats_by_program_id[program_id]["lesson_count"] += 1
                minutes = props.get("duration_minutes", 0)
                try:
                    minutes_int = int(minutes) if minutes is not None else 0
                except (TypeError, ValueError):
                    minutes_int = 0
                stats_by_program_id[program_id]["duration_minutes"] += max(
                    0, minutes_int
                )

        def _serialize(item):
            base = serialize_wishlist_item(item)
            if item.program:
                stats = stats_by_program_id[item.program_id]
                duration_hours = (
                    round(stats["duration_minutes"] / 60.0, 1)
                    if stats["duration_minutes"]
                    else 0
                )
                price_data = item.program.custom_pricing or {}
                base["program"].update(
                    {
                        "description": item.program.description or "",
                        "category": item.program.category or "",
                        "badge_type": item.program.badge_type,
                        "lecture_count": stats["lesson_count"],
                        "duration_hours": duration_hours,
                        "rating": 4.5,
                        "price": price_data.get("price", 0),
                        "original_price": price_data.get("original_price"),
                    }
                )
            return base

        return {
            "items": [_serialize(item) for item in items],
            "itemCount": len(items),
        }

    @staticmethod
    def add_program(user: User, program: Program) -> tuple[WishlistItem, bool]:
        if not program.is_published:
            raise CommerceError(
                "Program is not available.", code="program_unpublished", status_code=404
            )
        item, created = WishlistItem.objects.get_or_create(
            user=user,
            program=program,
        )
        return item, created

    @staticmethod
    def remove_program(user: User, program_id: int) -> bool:
        deleted, _ = WishlistItem.objects.filter(
            user=user, program_id=program_id
        ).delete()
        return bool(deleted)

    @staticmethod
    def sync_program_ids(user: User, program_ids: list[int]) -> int:
        if not program_ids:
            return 0
        normalized_ids = []
        seen = set()
        for raw_id in program_ids:
            try:
                program_id = int(raw_id)
            except (TypeError, ValueError):
                continue
            if program_id <= 0 or program_id in seen:
                continue
            seen.add(program_id)
            normalized_ids.append(program_id)
        if not normalized_ids:
            return 0

        programs = list(
            Program.objects.filter(id__in=normalized_ids, is_published=True)
        )
        existing_ids = set(
            WishlistItem.objects.filter(
                user=user, program_id__in=[p.id for p in programs]
            ).values_list("program_id", flat=True)
        )
        to_create = [
            WishlistItem(user=user, program=program)
            for program in programs
            if program.id not in existing_ids
        ]
        if to_create:
            WishlistItem.objects.bulk_create(to_create)
        return len(to_create)


class AccessGrantService:
    @staticmethod
    def _approved_payment_expiry(program: Program, paid_at):
        if not program.access_duration_days:
            return None
        return paid_at + timedelta(days=int(program.access_duration_days))

    @staticmethod
    def grant_for_order_item(
        order_item: OrderItem, *, paid_at=None
    ) -> ProgramAccessGrant | None:
        order = order_item.order
        program = order_item.program
        if not program:
            return None

        paid_at = paid_at or timezone.now()
        expires_at = AccessGrantService._approved_payment_expiry(program, paid_at)

        enrollment, _ = Enrollment.objects.get_or_create(
            user=order.user,
            program=program,
            defaults={
                "status": "active",
                "access_source": "paid",
                "expires_at": expires_at,
            },
        )

        enrollment_update_fields = []
        if enrollment.status in {"withdrawn", "suspended"}:
            enrollment.status = "active"
            enrollment_update_fields.append("status")
        if enrollment.access_source != "paid":
            enrollment.access_source = "paid"
            enrollment_update_fields.append("access_source")
        if expires_at and enrollment.expires_at != expires_at:
            enrollment.expires_at = expires_at
            enrollment_update_fields.append("expires_at")
        if enrollment_update_fields:
            enrollment.save(update_fields=enrollment_update_fields + ["updated_at"])

        grant, _ = ProgramAccessGrant.objects.get_or_create(
            order_item=order_item,
            defaults={
                "user": order.user,
                "program": program,
                "enrollment": enrollment,
                "status": ProgramAccessGrant.STATUS_ACTIVE,
                "granted_at": paid_at,
                "expires_at": expires_at,
                "metadata": {
                    "order_id": order.id,
                    "reference": order.reference,
                },
            },
        )

        grant_update_fields = []
        if grant.user_id != order.user_id:
            grant.user = order.user
            grant_update_fields.append("user")
        if grant.program_id != program.id:
            grant.program = program
            grant_update_fields.append("program")
        if grant.enrollment_id != enrollment.id:
            grant.enrollment = enrollment
            grant_update_fields.append("enrollment")
        if grant.status != ProgramAccessGrant.STATUS_ACTIVE:
            grant.status = ProgramAccessGrant.STATUS_ACTIVE
            grant.revoked_at = None
            grant_update_fields.extend(["status", "revoked_at"])
        if grant.expires_at != expires_at:
            grant.expires_at = expires_at
            grant_update_fields.append("expires_at")
        if grant_update_fields:
            grant.save(update_fields=grant_update_fields + ["updated_at"])

        pending_request = EnrollmentRequest.objects.filter(
            user=order.user,
            program=program,
            status="pending",
        ).first()
        if pending_request:
            pending_request.status = "approved"
            pending_request.reviewed_at = paid_at
            pending_request.reviewer_notes = (
                pending_request.reviewer_notes
                or "Automatically approved after confirmed payment."
            )
            pending_request.save(
                update_fields=[
                    "status",
                    "reviewed_at",
                    "reviewer_notes",
                    "updated_at",
                ]
            )

        if order.enrollment_id != enrollment.id:
            order.enrollment = enrollment
            order.save(update_fields=["enrollment", "updated_at"])

        return grant

    @staticmethod
    def revoke_for_order_item(
        order_item: OrderItem, *, reason: str = ""
    ) -> ProgramAccessGrant | None:
        grant = (
            ProgramAccessGrant.objects.filter(order_item=order_item)
            .select_related(
                "enrollment",
                "program",
            )
            .first()
        )
        if not grant:
            return None

        if grant.status != ProgramAccessGrant.STATUS_REVOKED:
            grant.status = ProgramAccessGrant.STATUS_REVOKED
            grant.revoked_at = timezone.now()
            metadata = grant.metadata or {}
            if reason:
                metadata["revoke_reason"] = reason
            grant.metadata = metadata
            grant.save(update_fields=["status", "revoked_at", "metadata", "updated_at"])

        active_grants_exist = (
            ProgramAccessGrant.objects.filter(
                user=grant.user,
                program=grant.program,
                status=ProgramAccessGrant.STATUS_ACTIVE,
            )
            .exclude(pk=grant.pk)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
            .exists()
        )

        enrollment = (
            grant.enrollment
            or Enrollment.objects.filter(
                user=grant.user,
                program=grant.program,
            ).first()
        )
        if (
            enrollment
            and not active_grants_exist
            and enrollment.access_source == "paid"
            and enrollment.status != "suspended"
        ):
            enrollment.status = "suspended"
            enrollment.save(update_fields=["status", "updated_at"])

        return grant


class CheckoutService:
    order_prefetch = Prefetch(
        "items",
        queryset=OrderItem.objects.select_related("program").order_by("id"),
    )
    refund_prefetch = Prefetch(
        "refunds",
        queryset=Refund.objects.prefetch_related("items").order_by("-created_at"),
    )

    @staticmethod
    def _configuration() -> CommerceConfiguration:
        return CommerceConfiguration.get_solo()

    @staticmethod
    def _validate_payment_method(payment_method: str):
        payment_method = str(payment_method or "").strip()
        if payment_method not in {
            Order.PROVIDER_PAYSTACK,
            Order.PROVIDER_OFFLINE_BANK_TRANSFER,
        }:
            raise CommerceError(
                "Unsupported payment method.", code="unsupported_payment_method"
            )

        if not CheckoutService._configuration().is_method_enabled(payment_method):
            raise CommerceError(
                "Payment method is disabled.", code="payment_method_disabled"
            )

    @staticmethod
    def _build_reference(prefix: str = "ord") -> str:
        return f"{prefix}-{uuid.uuid4().hex[:20]}"

    @staticmethod
    def _validate_programs_for_checkout(
        user: User, programs: list[Program]
    ) -> list[tuple[Program, int, str]]:
        if not programs:
            raise CommerceError(
                "No programs selected for checkout.", code="empty_checkout"
            )

        prepared_items = []
        currencies = set()
        seen_program_ids = set()
        for program in programs:
            if program.id in seen_program_ids:
                raise CommerceError(
                    "Duplicate programs are not allowed in checkout.",
                    code="duplicate_program",
                )
            seen_program_ids.add(program.id)
            amount_minor, currency = CartService._validate_program_can_be_purchased(
                user, program
            )
            prepared_items.append((program, amount_minor, currency))
            currencies.add(currency)

        if len(currencies) != 1:
            raise CommerceError(
                "All checkout items must share the same currency.",
                code="mixed_currency",
            )

        return prepared_items

    @staticmethod
    def get_checkout_preview(user: User, program_ids: list[int] | None = None) -> dict:
        if program_ids:
            normalized_ids = []
            for raw_id in program_ids:
                try:
                    program_id = int(raw_id)
                except (TypeError, ValueError):
                    raise CommerceError(
                        "programIds must be integers.", code="invalid_program_ids"
                    )
                if program_id <= 0:
                    raise CommerceError(
                        "programIds must be positive integers.",
                        code="invalid_program_ids",
                    )
                normalized_ids.append(program_id)
            if not normalized_ids:
                raise CommerceError(
                    "No programs selected for checkout.", code="empty_checkout"
                )

            program_map = Program.objects.in_bulk(set(normalized_ids))
            missing_ids = [
                program_id
                for program_id in normalized_ids
                if program_id not in program_map
            ]
            if missing_ids:
                raise CommerceError(
                    "Program not found.", code="program_not_found", status_code=404
                )
            programs = [program_map[program_id] for program_id in normalized_ids]
            prepared_items = CheckoutService._validate_programs_for_checkout(
                user, programs
            )
            items = [
                {
                    "program": {
                        "id": program.id,
                        "name": program.name,
                        "code": program.code or "",
                        "slug": program.slug,
                        "publicUrl": program_public_url(program),
                    },
                    "amountMinor": amount_minor,
                    "currency": item_currency,
                }
                for program, amount_minor, item_currency in prepared_items
            ]
            total_minor = sum(amount_minor for _, amount_minor, _ in prepared_items)
            currency = prepared_items[0][2] if prepared_items else ""
            return {
                "mode": "direct",
                "items": items,
                "itemCount": len(items),
                "totalMinor": total_minor,
                "currency": currency,
            }

        cart = CartService.get_or_create_active_cart(user)
        serialized = serialize_cart(cart)
        return {
            "mode": "cart",
            "items": serialized.get("items", []),
            "itemCount": serialized.get("itemCount", 0),
            "totalMinor": serialized.get("totalMinor", 0),
            "currency": serialized.get("currency", ""),
        }

    @staticmethod
    def create_order_from_cart(user: User, payment_method: str) -> Order:
        CheckoutService._validate_payment_method(payment_method)
        with transaction.atomic():
            cart = (
                Cart.objects.select_for_update()
                .filter(
                    user=user,
                    status=Cart.STATUS_ACTIVE,
                )
                .prefetch_related("items__program")
                .first()
            )
            if not cart:
                raise CommerceError(
                    "Your cart is empty.", code="cart_not_found", status_code=404
                )

            cart_items = list(cart.items.select_related("program").all())
            if not cart_items:
                raise CommerceError("Your cart is empty.", code="empty_cart")

            programs = [item.program for item in cart_items]
            prepared_items = CheckoutService._validate_programs_for_checkout(
                user, programs
            )
            currency = prepared_items[0][2]
            subtotal_minor = sum(amount_minor for _, amount_minor, _ in prepared_items)
            order = Order.objects.create(
                user=user,
                cart=cart,
                provider=payment_method,
                status=(
                    Order.STATUS_PENDING_PAYMENT
                    if payment_method == Order.PROVIDER_PAYSTACK
                    else Order.STATUS_PENDING_MANUAL_PAYMENT
                ),
                amount_minor=subtotal_minor,
                subtotal_minor=subtotal_minor,
                total_minor=subtotal_minor,
                currency=currency,
                reference=CheckoutService._build_reference(),
                metadata={"source": "cart_checkout"},
            )

            for program, amount_minor, item_currency in prepared_items:
                OrderItem.objects.create(
                    order=order,
                    program=program,
                    program_name=program.name,
                    program_code=program.code or "",
                    amount_minor=amount_minor,
                    currency=item_currency,
                    status=OrderItem.STATUS_PENDING,
                )

            if len(prepared_items) == 1:
                order.program = prepared_items[0][0]
                order.save(update_fields=["program", "updated_at"])

            cart.status = Cart.STATUS_CHECKED_OUT
            cart.checked_out_at = timezone.now()
            cart.save(update_fields=["status", "checked_out_at", "updated_at"])
            cart.items.all().delete()

            write_order_event(
                order,
                "order_created",
                actor=user,
                message="Order created from cart checkout.",
                payload={"payment_method": payment_method},
            )

        return CheckoutService.get_order(order.id)

    @staticmethod
    def create_order_from_programs(
        user: User,
        programs: list[Program],
        payment_method: str,
        *,
        metadata: dict | None = None,
    ) -> Order:
        CheckoutService._validate_payment_method(payment_method)
        prepared_items = CheckoutService._validate_programs_for_checkout(user, programs)
        currency = prepared_items[0][2]
        subtotal_minor = sum(amount_minor for _, amount_minor, _ in prepared_items)

        with transaction.atomic():
            if len(prepared_items) == 1:
                single_program = prepared_items[0][0]
                reusable_order = (
                    Order.objects.filter(
                        user=user,
                        provider=payment_method,
                        status__in=[
                            Order.STATUS_CREATED,
                            Order.STATUS_PENDING_PAYMENT,
                            Order.STATUS_PENDING_MANUAL_PAYMENT,
                        ],
                    )
                    .prefetch_related("items__program")
                    .order_by("-created_at")
                    .first()
                )
                if reusable_order:
                    items = list(reusable_order.items.all())
                    if (
                        len(items) == 1
                        and items[0].program_id == single_program.id
                        and reusable_order.total_minor == subtotal_minor
                        and reusable_order.currency == currency
                    ):
                        return CheckoutService.get_order(reusable_order.id)

            order = Order.objects.create(
                user=user,
                provider=payment_method,
                status=(
                    Order.STATUS_PENDING_PAYMENT
                    if payment_method == Order.PROVIDER_PAYSTACK
                    else Order.STATUS_PENDING_MANUAL_PAYMENT
                ),
                amount_minor=subtotal_minor,
                subtotal_minor=subtotal_minor,
                total_minor=subtotal_minor,
                currency=currency,
                reference=CheckoutService._build_reference(),
                metadata=metadata or {"source": "direct_checkout"},
            )

            for program, amount_minor, item_currency in prepared_items:
                OrderItem.objects.create(
                    order=order,
                    program=program,
                    program_name=program.name,
                    program_code=program.code or "",
                    amount_minor=amount_minor,
                    currency=item_currency,
                    status=OrderItem.STATUS_PENDING,
                )

            if len(prepared_items) == 1:
                order.program = prepared_items[0][0]
                order.save(update_fields=["program", "updated_at"])

            write_order_event(
                order,
                "order_created",
                actor=user,
                message="Order created from program selection.",
                payload={"payment_method": payment_method},
            )

        return CheckoutService.get_order(order.id)

    @staticmethod
    def validate_failed_order_retry(order: Order) -> None:
        if order.status != Order.STATUS_FAILED:
            return

        current_order = CheckoutService.get_order(order.id)
        items = list(current_order.items.select_related("program").all())
        if not items or any(not item.program_id for item in items):
            raise CommerceError(
                "This failed order can no longer be retried. Please start checkout again.",
                code="failed_order_stale",
            )

        prepared_items = CheckoutService._validate_programs_for_checkout(
            current_order.user,
            [item.program for item in items if item.program_id],
        )
        expected_items = sorted(
            (program.id, amount_minor, currency)
            for program, amount_minor, currency in prepared_items
        )
        existing_items = sorted(
            (item.program_id, item.amount_minor, item.currency) for item in items
        )
        expected_total_minor = sum(
            amount_minor for _, amount_minor, _ in prepared_items
        )
        expected_currency = prepared_items[0][2]

        if (
            expected_items != existing_items
            or expected_total_minor != current_order.total_minor
            or expected_currency != current_order.currency
        ):
            raise CommerceError(
                "This failed order is out of date. Please start checkout again.",
                code="failed_order_stale",
            )

    @staticmethod
    def get_order(order_id: int) -> Order:
        return (
            Order.objects.select_related("user", "program", "enrollment", "cart")
            .prefetch_related(
                CheckoutService.order_prefetch, CheckoutService.refund_prefetch
            )
            .get(pk=order_id)
        )

    @staticmethod
    def get_user_order(user: User, order_id: int) -> Order:
        order = (
            Order.objects.filter(user=user)
            .select_related("user", "program", "enrollment", "cart")
            .prefetch_related(
                CheckoutService.order_prefetch, CheckoutService.refund_prefetch
            )
            .filter(pk=order_id)
            .first()
        )
        if not order:
            raise CommerceError(
                "Order not found.", code="order_not_found", status_code=404
            )
        return order

    @staticmethod
    def list_user_orders(user: User):
        return (
            Order.objects.filter(user=user)
            .select_related("program")
            .prefetch_related(CheckoutService.order_prefetch)
            .order_by("-created_at")
        )

    @staticmethod
    def list_admin_orders(*, status: str = "", provider: str = ""):
        queryset = (
            Order.objects.select_related("user", "program")
            .prefetch_related(
                CheckoutService.order_prefetch, CheckoutService.refund_prefetch
            )
            .order_by("-created_at")
        )
        if status:
            queryset = queryset.filter(status=status)
        if provider:
            queryset = queryset.filter(provider=provider)
        return queryset

    @staticmethod
    def mark_order_paid(
        order: Order,
        *,
        actor: User | None = None,
        paid_at=None,
        provider_reference: str = "",
        payload: dict | None = None,
    ) -> Order:
        paid_at = paid_at or timezone.now()
        with transaction.atomic():
            locked_order = (
                Order.objects.select_for_update()
                .select_related("user", "program", "enrollment")
                .prefetch_related("items__program")
                .get(pk=order.pk)
            )

            if locked_order.status == Order.STATUS_CANCELLED:
                raise CommerceError(
                    "Cancelled orders cannot be marked paid.", code="order_cancelled"
                )

            if (
                provider_reference
                and locked_order.provider_reference != provider_reference
            ):
                locked_order.provider_reference = provider_reference

            if locked_order.status in {
                Order.STATUS_CREATED,
                Order.STATUS_PENDING_PAYMENT,
                Order.STATUS_PENDING_MANUAL_PAYMENT,
                Order.STATUS_FAILED,
            }:
                locked_order.status = Order.STATUS_PAID

            if not locked_order.paid_at:
                locked_order.paid_at = paid_at

            locked_order.amount_minor = locked_order.total_minor
            locked_order.save(
                update_fields=[
                    "provider_reference",
                    "status",
                    "paid_at",
                    "amount_minor",
                    "updated_at",
                ]
            )

            updated_items = []
            for item in locked_order.items.all():
                if item.status == OrderItem.STATUS_REFUNDED:
                    continue

                item.status = OrderItem.STATUS_PAID
                item.paid_at = item.paid_at or paid_at
                item.save(update_fields=["status", "paid_at", "updated_at"])
                AccessGrantService.grant_for_order_item(item, paid_at=paid_at)
                RevenueLedgerService.record_payment_share_for_order_item(item)
                updated_items.append(item.id)

            write_order_event(
                locked_order,
                "order_paid",
                actor=actor,
                message="Order marked as paid.",
                payload={
                    "provider_reference": provider_reference,
                    "payment_payload": payload or {},
                    "item_ids": updated_items,
                },
            )

        return CheckoutService.get_order(order.pk)

    @staticmethod
    def mark_order_failed(
        order: Order, *, payload: dict | None = None, reason: str = ""
    ) -> Order:
        with transaction.atomic():
            locked_order = Order.objects.select_for_update().get(pk=order.pk)
            if locked_order.status == Order.STATUS_PAID:
                return CheckoutService.get_order(locked_order.pk)

            locked_order.status = Order.STATUS_FAILED
            locked_order.save(update_fields=["status", "updated_at"])
            write_order_event(
                locked_order,
                "order_failed",
                message=reason or "Order payment failed.",
                payload=payload or {},
            )

        return CheckoutService.get_order(order.pk)

    @staticmethod
    def cancel_order(
        order: Order, *, actor: User | None = None, reason: str = ""
    ) -> Order:
        with transaction.atomic():
            locked_order = (
                Order.objects.select_for_update()
                .prefetch_related("items")
                .get(pk=order.pk)
            )
            if locked_order.status in {
                Order.STATUS_PAID,
                Order.STATUS_PARTIALLY_REFUNDED,
                Order.STATUS_REFUNDED,
            }:
                raise CommerceError(
                    "Paid orders cannot be cancelled.", code="order_not_cancellable"
                )

            locked_order.status = Order.STATUS_CANCELLED
            locked_order.cancelled_at = timezone.now()
            locked_order.save(update_fields=["status", "cancelled_at", "updated_at"])
            locked_order.items.filter(status=OrderItem.STATUS_PENDING).update(
                status=OrderItem.STATUS_CANCELLED,
                updated_at=timezone.now(),
            )

            write_order_event(
                locked_order,
                "order_cancelled",
                actor=actor,
                message=reason or "Order cancelled.",
            )

        return CheckoutService.get_order(order.pk)

    @staticmethod
    def recompute_order_refund_totals(order: Order) -> Order:
        with transaction.atomic():
            locked_order = (
                Order.objects.select_for_update()
                .prefetch_related("items")
                .get(pk=order.pk)
            )
            refunded_minor = sum(
                item.refunded_minor for item in locked_order.items.all()
            )
            locked_order.refunded_minor = refunded_minor
            locked_order.amount_minor = locked_order.total_minor

            if refunded_minor <= 0:
                if locked_order.paid_at:
                    locked_order.status = Order.STATUS_PAID
            elif refunded_minor >= locked_order.total_minor:
                locked_order.status = Order.STATUS_REFUNDED
            else:
                locked_order.status = Order.STATUS_PARTIALLY_REFUNDED

            locked_order.save(
                update_fields=["refunded_minor", "amount_minor", "status", "updated_at"]
            )

        return CheckoutService.get_order(order.pk)


class PaystackGatewayService:
    @staticmethod
    def _secret_key() -> str:
        return settings.PAYSTACK_SECRET_KEY or ""

    @staticmethod
    def _webhook_secret() -> str:
        return settings.PAYSTACK_WEBHOOK_SECRET or settings.PAYSTACK_SECRET_KEY or ""

    @staticmethod
    def _request(method: str, url: str, payload: dict | None = None) -> dict:
        secret_key = PaystackGatewayService._secret_key()
        if not secret_key:
            return {
                "status": False,
                "message": "Paystack secret key is not configured.",
            }

        body = (
            json.dumps(payload or {}).encode("utf-8") if payload is not None else None
        )
        req = url_request.Request(
            url,
            method=method,
            data=body,
            headers={
                "Authorization": f"Bearer {secret_key}",
                "Content-Type": "application/json",
                "User-Agent": "SharedLMS-Server/1.0",
            },
        )
        try:
            with url_request.urlopen(req, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        except url_error.HTTPError as exc:
            raw = exc.read().decode("utf-8") if hasattr(exc, "read") else ""
            try:
                response_payload = json.loads(raw)
                if isinstance(response_payload, dict):
                    response_payload.setdefault("_http_status", exc.code)
                    return response_payload
                return {
                    "status": False,
                    "message": "Unexpected response format from Paystack.",
                    "_http_status": exc.code,
                }
            except Exception:
                return {
                    "status": False,
                    "message": raw or str(exc),
                    "_http_status": exc.code,
                }
        except Exception as exc:  # pragma: no cover - network exception fallback
            return {"status": False, "message": str(exc)}

    @staticmethod
    def initialize_payment(
        order: Order, *, callback_url: str, channels: list[str] | None = None
    ) -> dict:
        if order.provider != Order.PROVIDER_PAYSTACK:
            raise CommerceError(
                "Order is not configured for Paystack.", code="invalid_provider"
            )

        CheckoutService.validate_failed_order_retry(order)

        if order.status in {
            Order.STATUS_PAID,
            Order.STATUS_REFUNDED,
            Order.STATUS_PARTIALLY_REFUNDED,
            Order.STATUS_CANCELLED,
        }:
            raise CommerceError(
                "Order can no longer be initialized for payment.",
                code="order_not_payable",
            )

        payload = {
            "email": order.user.email or f"user-{order.user_id}@example.com",
            "amount": order.total_minor,
            "currency": order.currency,
            "reference": order.reference,
            "channels": channels if channels is not None else PAYSTACK_POPUP_CHANNELS,
            "metadata": {
                "user_id": order.user_id,
                "order_id": order.id,
                "order_reference": order.reference,
                "item_ids": list(order.items.values_list("id", flat=True)),
            },
        }
        if callback_url:
            payload["callback_url"] = callback_url
        response = PaystackGatewayService._request(
            "POST", PAYSTACK_INITIALIZE_URL, payload
        )
        PaymentAttempt.objects.create(
            order=order,
            provider=Order.PROVIDER_PAYSTACK,
            state="initialize",
            provider_reference=order.reference,
            request_payload=payload,
            response_payload=response if isinstance(response, dict) else {},
        )

        if not response.get("status"):
            CheckoutService.mark_order_failed(
                order,
                payload=response if isinstance(response, dict) else {},
                reason="Failed to initialize Paystack transaction.",
            )
            raise CommerceError(
                response.get("message") or "Unable to initialize payment.",
                code="paystack_initialize_failed",
                status_code=502,
            )

        order.status = Order.STATUS_PENDING_PAYMENT
        order.provider_reference = (
            (response.get("data") or {}).get("reference")
            or order.provider_reference
            or order.reference
        )
        order.save(update_fields=["status", "provider_reference", "updated_at"])
        write_order_event(
            order,
            "paystack_initialized",
            actor=order.user,
            message="Paystack transaction initialized.",
            payload=response if isinstance(response, dict) else {},
        )
        return response

    @staticmethod
    def charge_mpesa(order: Order, *, phone_number: str) -> dict:
        if order.provider != Order.PROVIDER_PAYSTACK:
            raise CommerceError(
                "Order is not configured for Paystack.", code="invalid_provider"
            )

        CheckoutService.validate_failed_order_retry(order)

        if order.status in {
            Order.STATUS_PAID,
            Order.STATUS_REFUNDED,
            Order.STATUS_PARTIALLY_REFUNDED,
            Order.STATUS_CANCELLED,
        }:
            raise CommerceError(
                "Order can no longer be charged.", code="order_not_payable"
            )

        payload = {
            "email": order.user.email or f"user-{order.user_id}@example.com",
            "amount": order.total_minor,
            "currency": order.currency,
            "reference": order.reference,
            "mobile_money": {"phone": phone_number, "provider": "mpesa"},
            "metadata": {
                "user_id": order.user_id,
                "order_id": order.id,
                "order_reference": order.reference,
                "item_ids": list(order.items.values_list("id", flat=True)),
                "custom_flow": "charge_mpesa",
            },
        }

        response = PaystackGatewayService._request("POST", PAYSTACK_CHARGE_URL, payload)
        PaymentAttempt.objects.create(
            order=order,
            provider=Order.PROVIDER_PAYSTACK,
            state="charge_mpesa",
            provider_reference=order.reference,
            request_payload=payload,
            response_payload=response if isinstance(response, dict) else {},
        )

        if not response.get("status"):
            CheckoutService.mark_order_failed(
                order,
                payload=response if isinstance(response, dict) else {},
                reason="Failed to charge M-Pesa.",
            )
            provider_status_code = response.get("_http_status")
            try:
                error_status_code = int(provider_status_code)
            except (TypeError, ValueError):
                error_status_code = 502
            if error_status_code < 400 or error_status_code > 599:
                error_status_code = 502
            raise CommerceError(
                response.get("message") or "Unable to initiate M-Pesa charge.",
                code="paystack_charge_failed",
                status_code=error_status_code,
            )

        order.status = Order.STATUS_PENDING_PAYMENT
        order.provider_reference = (
            (response.get("data") or {}).get("reference")
            or order.provider_reference
            or order.reference
        )
        order.save(update_fields=["status", "provider_reference", "updated_at"])
        write_order_event(
            order,
            "paystack_mpesa_charged",
            actor=order.user,
            message="Paystack M-Pesa STK push initiated.",
            payload=response if isinstance(response, dict) else {},
        )
        return response

    @staticmethod
    def verify_payment(
        reference: str,
        *,
        order: Order | None = None,
        state: str = "verify",
    ) -> dict:
        response = PaystackGatewayService._request(
            "GET",
            PAYSTACK_VERIFY_URL.format(reference=reference),
        )
        PaymentAttempt.objects.create(
            order=order,
            provider=Order.PROVIDER_PAYSTACK,
            state=state,
            provider_reference=reference,
            request_payload={"reference": reference},
            response_payload=response if isinstance(response, dict) else {},
        )
        return response

    @staticmethod
    def verify_and_finalize_order(
        order: Order,
        reference: str,
        *,
        state: str = "verify",
        payload_source: str = "verify",
    ) -> tuple[Order, dict, bool]:
        response = PaystackGatewayService.verify_payment(
            reference, order=order, state=state
        )
        response_data = response.get("data") or {}
        transaction_status = str(response_data.get("status") or "").lower()
        finalized = False

        if response.get("status") and transaction_status == "success":
            finalized = PaystackGatewayService._finalize_successful_charge(
                order,
                response_data,
                response if isinstance(response, dict) else {},
                source=payload_source,
            )
        elif transaction_status in {"failed", "reversed"}:
            CheckoutService.mark_order_failed(
                order,
                payload=response if isinstance(response, dict) else {},
                reason=f"Paystack verification returned {transaction_status or 'failed'}.",
            )

        refreshed_order = CheckoutService.get_order(order.id)
        return refreshed_order, response, finalized

    @staticmethod
    def _verify_signature(raw_body: bytes, signature: str) -> bool:
        secret = PaystackGatewayService._webhook_secret()
        if not secret or not signature:
            return False
        digest = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha512).hexdigest()
        return hmac.compare_digest(signature, digest)

    @staticmethod
    def _parse_paid_at(data: dict) -> timezone.datetime:
        paid_at_raw = data.get("paid_at") or data.get("paidAt")
        paid_at = timezone.now()
        if not paid_at_raw:
            return paid_at
        parsed = timezone.datetime.fromisoformat(
            str(paid_at_raw).replace("Z", "+00:00")
        )
        if parsed.tzinfo is None:
            parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
        return parsed

    @staticmethod
    def _normalize_currency(value: str | None) -> str:
        return str(value or "").upper().strip()

    @staticmethod
    def _minor_amount(value) -> int:
        try:
            return int(value or 0)
        except (TypeError, ValueError):
            return 0

    @staticmethod
    def _extract_refund_identifier(data: dict) -> str:
        if data.get("id"):
            return str(data.get("id"))
        refund = data.get("refund") or {}
        if isinstance(refund, dict) and refund.get("id"):
            return str(refund.get("id"))
        return ""

    @staticmethod
    def _extract_transaction_reference(data: dict) -> str:
        transaction_data = data.get("transaction") or {}
        if isinstance(transaction_data, dict):
            if transaction_data.get("reference"):
                return str(transaction_data.get("reference"))
            if transaction_data.get("id"):
                return str(transaction_data.get("id"))
        if data.get("reference"):
            return str(data.get("reference"))
        if data.get("transaction"):
            return str(data.get("transaction"))
        return ""

    @staticmethod
    def _extract_transfer_reference(data: dict) -> str:
        if data.get("reference"):
            return str(data.get("reference"))
        recipient = data.get("recipient") or {}
        if isinstance(recipient, dict) and recipient.get("reference"):
            return str(recipient.get("reference"))
        return ""

    @staticmethod
    def _transaction_matches_order(order: Order, reference: str) -> bool:
        reference = str(reference or "").strip()
        return reference in {
            str(order.reference or "").strip(),
            str(order.provider_reference or "").strip(),
        }

    @staticmethod
    def _validate_successful_transaction(order: Order, data: dict) -> tuple[bool, str]:
        transaction_reference = str(data.get("reference") or "").strip()
        transaction_status = str(data.get("status") or "").lower().strip()
        amount_minor = PaystackGatewayService._minor_amount(data.get("amount"))
        currency = PaystackGatewayService._normalize_currency(data.get("currency"))

        if transaction_status != "success":
            return False, "transaction_status_not_success"
        if (
            transaction_reference
            and not PaystackGatewayService._transaction_matches_order(
                order, transaction_reference
            )
        ):
            return False, "reference_mismatch"
        if amount_minor != order.total_minor:
            return False, "amount_mismatch"
        if currency and currency != PaystackGatewayService._normalize_currency(
            order.currency
        ):
            return False, "currency_mismatch"
        return True, ""

    @staticmethod
    def _record_charge_attempt(order: Order, event: str, payload: dict):
        PaymentAttempt.objects.create(
            order=order,
            provider=Order.PROVIDER_PAYSTACK,
            state=f"webhook_{event}",
            provider_reference=order.reference,
            request_payload={"event": event},
            response_payload=payload if isinstance(payload, dict) else {},
        )

    @staticmethod
    def _finalize_successful_charge(
        order: Order,
        data: dict,
        payload: dict,
        *,
        source: str,
    ) -> bool:
        is_valid, failure_code = (
            PaystackGatewayService._validate_successful_transaction(order, data)
        )
        if not is_valid:
            write_order_event(
                order,
                "paystack_validation_failed",
                message=f"Paystack {source} failed validation: {failure_code}.",
                payload=payload if isinstance(payload, dict) else {},
            )
            if order.status not in {
                Order.STATUS_PAID,
                Order.STATUS_PARTIALLY_REFUNDED,
                Order.STATUS_REFUNDED,
            }:
                CheckoutService.mark_order_failed(
                    order,
                    payload=payload if isinstance(payload, dict) else {},
                    reason=f"Paystack validation failed: {failure_code}.",
                )
            return False

        CheckoutService.mark_order_paid(
            order,
            paid_at=PaystackGatewayService._parse_paid_at(data),
            provider_reference=str(data.get("reference") or order.reference),
            payload={
                "source": source,
                **(payload if isinstance(payload, dict) else {}),
            },
        )
        return True

    @staticmethod
    def _handle_charge_event(
        order: Order, event: str, data: dict, payload: dict
    ) -> bool:
        PaystackGatewayService._record_charge_attempt(order, event, payload)

        if event == "charge.success":
            return PaystackGatewayService._finalize_successful_charge(
                order,
                data,
                payload,
                source="webhook",
            )

        CheckoutService.mark_order_failed(
            order,
            payload=payload,
            reason=f"Paystack event received: {event}",
        )
        return True

    @staticmethod
    def _build_transfer_recipient_payload(
        settlement_party: SettlementParty, *, currency: str
    ) -> dict:
        destination_details = settlement_party.destination_details or {}
        account_number = str(destination_details.get("account_number") or "").strip()
        bank_code = str(destination_details.get("bank_code") or "").strip()

        if not account_number or not bank_code:
            raise CommerceError(
                "Settlement party destination details must include account_number and bank_code.",
                code="settlement_destination_incomplete",
            )

        return {
            "type": settlement_party.payout_method,
            "name": settlement_party.display_name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": currency,
            "metadata": {
                "settlement_party_id": settlement_party.id,
                "party_type": settlement_party.party_type,
            },
        }

    @staticmethod
    def create_transfer_recipient(
        settlement_party: SettlementParty,
        *,
        currency: str,
        payout: BeneficiaryPayout | None = None,
    ) -> dict:
        payload = PaystackGatewayService._build_transfer_recipient_payload(
            settlement_party,
            currency=currency,
        )
        response = PaystackGatewayService._request(
            "POST",
            PAYSTACK_TRANSFER_RECIPIENT_URL,
            payload,
        )
        PaymentAttempt.objects.create(
            payout=payout,
            provider=Order.PROVIDER_PAYSTACK,
            state="transfer_recipient_create",
            provider_reference=settlement_party.paystack_recipient_code
            or settlement_party.display_name,
            request_payload=payload,
            response_payload=response if isinstance(response, dict) else {},
        )

        response_data = response.get("data") or {}
        recipient_code = str(response_data.get("recipient_code") or "")
        if response.get("status") and recipient_code:
            settlement_party.paystack_recipient_code = recipient_code
            settlement_party.save(
                update_fields=["paystack_recipient_code", "updated_at"]
            )
        return response

    @staticmethod
    def initiate_transfer(payout: BeneficiaryPayout) -> dict:
        payout = BeneficiaryPayout.objects.select_related("settlement_party").get(
            pk=payout.pk
        )
        settlement_party = payout.settlement_party

        if not settlement_party.paystack_recipient_code:
            recipient_response = PaystackGatewayService.create_transfer_recipient(
                settlement_party,
                currency=payout.currency,
                payout=payout,
            )
            if not recipient_response.get("status"):
                raise CommerceError(
                    recipient_response.get("message")
                    or "Unable to create payout recipient.",
                    code="paystack_recipient_create_failed",
                    status_code=502,
                )

        reference = payout.reference or f"payout-{uuid.uuid4().hex[:20]}"
        payload = {
            "source": "balance",
            "amount": payout.amount_minor,
            "recipient": settlement_party.paystack_recipient_code,
            "reference": reference,
            "reason": payout.metadata.get("notes")
            or f"Payout for {settlement_party.display_name}",
        }
        response = PaystackGatewayService._request(
            "POST", PAYSTACK_TRANSFER_URL, payload
        )
        PaymentAttempt.objects.create(
            payout=payout,
            provider=Order.PROVIDER_PAYSTACK,
            state="transfer_initiate",
            provider_reference=reference,
            request_payload=payload,
            response_payload=response if isinstance(response, dict) else {},
        )
        return response

    @staticmethod
    def create_refund(refund: Refund) -> dict:
        transaction_reference = (
            refund.order.provider_reference or refund.order.reference
        )
        payload = {
            "transaction": transaction_reference,
            "amount": refund.amount_minor,
            "currency": refund.order.currency,
            "customer_note": refund.reason
            or f"Refund for order {refund.order.reference}",
            "merchant_note": refund.notes
            or refund.reason
            or f"Refund for order {refund.order.reference}",
        }
        response = PaystackGatewayService._request("POST", PAYSTACK_REFUND_URL, payload)
        PaymentAttempt.objects.create(
            order=refund.order,
            refund=refund,
            provider=Order.PROVIDER_PAYSTACK,
            state="refund_create",
            provider_reference=transaction_reference,
            request_payload=payload,
            response_payload=response if isinstance(response, dict) else {},
        )
        return response

    @staticmethod
    def retry_refund(refund: Refund, *, refund_account_details: dict) -> dict:
        if not refund.provider_refund_id:
            raise CommerceError(
                "Refund is missing a Paystack refund id.",
                code="refund_retry_unavailable",
            )

        payload = {"refund_account_details": refund_account_details or {}}
        response = PaystackGatewayService._request(
            "POST",
            PAYSTACK_REFUND_RETRY_URL.format(refund_id=refund.provider_refund_id),
            payload,
        )
        PaymentAttempt.objects.create(
            order=refund.order,
            refund=refund,
            provider=Order.PROVIDER_PAYSTACK,
            state="refund_retry",
            provider_reference=refund.provider_refund_id,
            request_payload=payload,
            response_payload=response if isinstance(response, dict) else {},
        )
        return response

    @staticmethod
    def process_webhook(
        *,
        raw_body: bytes,
        signature: str,
    ) -> dict:
        if not PaystackGatewayService._verify_signature(raw_body, signature):
            return {
                "ok": False,
                "status_code": 401,
                "error": "invalid_signature",
                "duplicate": False,
                "handled": False,
                "event_type": "",
            }

        try:
            payload = json.loads(raw_body.decode("utf-8") or "{}")
        except Exception:
            return {
                "ok": False,
                "status_code": 400,
                "error": "invalid_payload",
                "duplicate": False,
                "handled": False,
                "event_type": "",
            }

        event = str(payload.get("event") or "")
        data = payload.get("data") or {}
        reference = PaystackGatewayService._extract_transaction_reference(data)
        event_id = str(payload.get("id") or "")
        refund_reference = PaystackGatewayService._extract_refund_identifier(data)
        transfer_reference = PaystackGatewayService._extract_transfer_reference(data)
        if event.startswith("transfer.") and transfer_reference:
            reference = transfer_reference

        dedupe_key = build_paystack_dedupe_key(
            event,
            event_id=event_id,
            reference=reference,
            refund_reference=refund_reference,
        )

        event_obj, created = WebhookEvent.objects.get_or_create(
            dedupe_key=dedupe_key,
            defaults={
                "provider": Order.PROVIDER_PAYSTACK,
                "event_type": event,
                "event_id": event_id,
                "reference": reference,
                "refund_reference": refund_reference,
                "signature_valid": True,
                "payload": payload if isinstance(payload, dict) else {},
            },
        )
        if not created and event_obj.processed_at:
            return {
                "ok": True,
                "status_code": 200,
                "duplicate": True,
                "handled": True,
                "event_type": event_obj.event_type,
            }
        if not created:
            event_obj.event_type = event or event_obj.event_type
            event_obj.event_id = event_id or event_obj.event_id
            event_obj.reference = reference or event_obj.reference
            event_obj.refund_reference = refund_reference or event_obj.refund_reference
            event_obj.signature_valid = True
            event_obj.payload = (
                payload if isinstance(payload, dict) else event_obj.payload
            )
            event_obj.save(
                update_fields=[
                    "event_type",
                    "event_id",
                    "reference",
                    "refund_reference",
                    "signature_valid",
                    "payload",
                    "updated_at",
                ]
            )

        handled = False
        known_events = {
            "charge.success",
            "charge.failed",
            "refund.pending",
            "refund.processing",
            "refund.processed",
            "refund.failed",
            "refund.needs_attention",
            "refund.needs-attention",
            "transfer.success",
            "transfer.failed",
            "transfer.reversed",
            "bank.transfer.rejected",
        }

        with transaction.atomic():
            if event in {"charge.success", "charge.failed"}:
                order = (
                    Order.objects.select_for_update()
                    .filter(Q(reference=reference) | Q(provider_reference=reference))
                    .first()
                )
                if order:
                    PaystackGatewayService._handle_charge_event(
                        order, event, data, payload
                    )
                handled = True
            elif event in {
                "refund.pending",
                "refund.processing",
                "refund.processed",
                "refund.failed",
                "refund.needs_attention",
                "refund.needs-attention",
            }:
                RefundService.process_paystack_refund_event(
                    payload=payload if isinstance(payload, dict) else {},
                    event=event,
                )
                handled = True
            elif event in {"transfer.success", "transfer.failed", "transfer.reversed"}:
                PayoutService.process_paystack_transfer_event(
                    payload=payload if isinstance(payload, dict) else {},
                    event=event,
                )
                handled = True
            elif event == "bank.transfer.rejected":
                if reference:
                    order = (
                        Order.objects.select_for_update()
                        .filter(
                            Q(reference=reference) | Q(provider_reference=reference)
                        )
                        .first()
                    )
                    if order:
                        PaymentAttempt.objects.create(
                            order=order,
                            provider=Order.PROVIDER_PAYSTACK,
                            state="webhook_bank.transfer.rejected",
                            provider_reference=reference,
                            request_payload={"event": event},
                            response_payload=payload
                            if isinstance(payload, dict)
                            else {},
                        )
                        if order.status not in {
                            Order.STATUS_PAID,
                            Order.STATUS_PARTIALLY_REFUNDED,
                            Order.STATUS_REFUNDED,
                        }:
                            CheckoutService.mark_order_failed(
                                order,
                                payload=payload if isinstance(payload, dict) else {},
                                reason="Paystack bank transfer was rejected.",
                            )
                        write_order_event(
                            order,
                            "paystack_bank_transfer_rejected",
                            message="Paystack reported a rejected bank transfer.",
                            payload=payload if isinstance(payload, dict) else {},
                        )
                handled = True

            event_obj.processed_at = timezone.now()
            event_obj.save(update_fields=["processed_at", "updated_at"])

        return {
            "ok": True,
            "status_code": 200,
            "duplicate": False,
            "handled": handled or event in known_events,
            "event_type": event,
        }


class OfflinePaymentService:
    @staticmethod
    def get_configuration() -> CommerceConfiguration:
        return CommerceConfiguration.get_solo()

    @staticmethod
    def instructions_payload() -> dict:
        config = OfflinePaymentService.get_configuration()
        return {
            "bankDetails": config.offline_bank_details or {},
            "instructions": config.offline_payment_instructions or "",
        }


class RefundService:
    @staticmethod
    def _lock_refund(refund_id: int) -> Refund:
        return (
            Refund.objects.select_for_update()
            .select_related("order", "requested_by", "processed_by")
            .prefetch_related("items__order_item__program")
            .get(pk=refund_id)
        )

    @staticmethod
    def _refundable_items(order: Order):
        return order.items.exclude(status=OrderItem.STATUS_REFUNDED)

    @staticmethod
    def _has_open_refund_for_items(order_item_ids: list[int]) -> bool:
        return (
            RefundItem.objects.filter(order_item_id__in=order_item_ids)
            .exclude(refund__status__in=[Refund.STATUS_FAILED, Refund.STATUS_CANCELLED])
            .exists()
        )

    @staticmethod
    def request_refund(
        order: Order,
        *,
        actor: User | None,
        order_item_ids: list[int] | None = None,
        reason: str = "",
        notes: str = "",
        refund_account_details: dict | None = None,
    ) -> Refund:
        if order.status not in {Order.STATUS_PAID, Order.STATUS_PARTIALLY_REFUNDED}:
            raise CommerceError(
                "Only paid orders can be refunded.", code="order_not_refundable"
            )

        if order_item_ids == []:
            raise CommerceError(
                "No order items selected for refund.", code="refund_items_missing"
            )

        with transaction.atomic():
            locked_order = (
                Order.objects.select_for_update()
                .select_related("user")
                .prefetch_related("items__program")
                .get(pk=order.pk)
            )
            if locked_order.status not in {
                Order.STATUS_PAID,
                Order.STATUS_PARTIALLY_REFUNDED,
            }:
                raise CommerceError(
                    "Only paid orders can be refunded.", code="order_not_refundable"
                )

            selected_item_ids = (
                order_item_ids
                if order_item_ids is not None
                else list(locked_order.items.values_list("id", flat=True))
            )
            target_items = list(
                locked_order.items.select_for_update()
                .filter(id__in=selected_item_ids)
                .select_related("program")
            )
            if not target_items:
                raise CommerceError(
                    "No order items selected for refund.", code="refund_items_missing"
                )

            if RefundService._has_open_refund_for_items(
                [item.id for item in target_items]
            ):
                raise CommerceError(
                    "A refund is already in progress for one or more selected items.",
                    code="refund_already_in_progress",
                )

            for item in target_items:
                if (
                    item.status == OrderItem.STATUS_REFUNDED
                    or item.refunded_minor >= item.amount_minor
                ):
                    raise CommerceError(
                        f"Program '{item.program_name}' has already been refunded.",
                        code="item_already_refunded",
                    )

            amount_minor = sum(
                item.amount_minor - item.refunded_minor for item in target_items
            )
            refund = Refund.objects.create(
                order=locked_order,
                requested_by=actor,
                provider=locked_order.provider,
                status=Refund.STATUS_PENDING,
                amount_minor=amount_minor,
                reason=reason,
                notes=notes,
                metadata={"refund_account_details": refund_account_details or {}},
            )
            for item in target_items:
                RefundItem.objects.create(
                    refund=refund,
                    order_item=item,
                    amount_minor=item.amount_minor - item.refunded_minor,
                )

            write_order_event(
                locked_order,
                "refund_requested",
                actor=actor,
                refund=refund,
                message="Refund requested.",
                payload={"order_item_ids": [item.id for item in target_items]},
            )

        if locked_order.provider == Order.PROVIDER_OFFLINE_BANK_TRANSFER:
            with transaction.atomic():
                locked_refund = RefundService._lock_refund(refund.id)
                locked_refund.status = Refund.STATUS_PROCESSED
                locked_refund.processed_by = actor
                locked_refund.processed_at = timezone.now()
                locked_refund.save(
                    update_fields=[
                        "status",
                        "processed_by",
                        "processed_at",
                        "updated_at",
                    ]
                )
            RefundService.apply_processed_refund(refund.id, actor=actor)
            return Refund.objects.prefetch_related("items").get(pk=refund.id)

        response = PaystackGatewayService.create_refund(refund)
        with transaction.atomic():
            locked_refund = RefundService._lock_refund(refund.id)
            response_data = response.get("data") or {}
            provider_refund_id = str(response_data.get("id") or "")
            paystack_status = str(response_data.get("status") or "").lower()
            locked_refund.provider_refund_id = provider_refund_id
            if response.get("status"):
                if paystack_status == "processed":
                    locked_refund.status = Refund.STATUS_PROCESSED
                    locked_refund.processed_at = timezone.now()
                elif paystack_status in {"processing", "pending"}:
                    locked_refund.status = Refund.STATUS_PROCESSING
                elif paystack_status in {"failed", "reversed"}:
                    locked_refund.status = Refund.STATUS_FAILED
                elif paystack_status in {"needs_attention", "needs-attention"}:
                    locked_refund.status = Refund.STATUS_NEEDS_ATTENTION
                else:
                    locked_refund.status = Refund.STATUS_PROCESSING
            else:
                locked_refund.status = Refund.STATUS_NEEDS_ATTENTION
            locked_refund.metadata = {
                **(locked_refund.metadata or {}),
                "paystack_response": response if isinstance(response, dict) else {},
            }
            locked_refund.save(
                update_fields=[
                    "provider_refund_id",
                    "status",
                    "processed_at",
                    "metadata",
                    "updated_at",
                ]
            )

        if (
            response.get("status")
            and str((response.get("data") or {}).get("status") or "").lower()
            == "processed"
        ):
            RefundService.apply_processed_refund(refund.id, actor=actor)

        return Refund.objects.prefetch_related("items").get(pk=refund.id)

    @staticmethod
    def apply_processed_refund(refund_id: int, *, actor: User | None = None) -> Refund:
        with transaction.atomic():
            refund = RefundService._lock_refund(refund_id)
            if refund.status != Refund.STATUS_PROCESSED:
                refund.status = Refund.STATUS_PROCESSED
                refund.processed_at = refund.processed_at or timezone.now()
                refund.processed_by = refund.processed_by or actor
                refund.save(
                    update_fields=[
                        "status",
                        "processed_at",
                        "processed_by",
                        "updated_at",
                    ]
                )

            processed_at = refund.processed_at or timezone.now()
            for refund_item in refund.items.all():
                order_item = refund_item.order_item
                if refund_item.status != RefundItem.STATUS_PROCESSED:
                    refund_item.status = RefundItem.STATUS_PROCESSED
                    refund_item.processed_at = processed_at
                    refund_item.save(
                        update_fields=["status", "processed_at", "updated_at"]
                    )

                if order_item.refunded_minor < order_item.amount_minor:
                    order_item.refunded_minor = order_item.amount_minor
                    order_item.status = OrderItem.STATUS_REFUNDED
                    order_item.save(
                        update_fields=["refunded_minor", "status", "updated_at"]
                    )

                AccessGrantService.revoke_for_order_item(
                    order_item,
                    reason=refund.reason or "Refund processed.",
                )
                RevenueLedgerService.record_refund_reversal_for_refund_item(refund_item)

            CheckoutService.recompute_order_refund_totals(refund.order)
            write_order_event(
                refund.order,
                "refund_processed",
                actor=actor,
                refund=refund,
                message="Refund processed.",
                payload={"refund_id": refund.id},
            )

        return Refund.objects.prefetch_related("items").get(pk=refund_id)

    @staticmethod
    def retry_refund(
        refund: Refund,
        *,
        actor: User | None,
        refund_account_details: dict,
    ) -> Refund:
        if refund.provider != Order.PROVIDER_PAYSTACK:
            raise CommerceError(
                "Only Paystack refunds can be retried.",
                code="refund_retry_invalid_provider",
            )
        if refund.status != Refund.STATUS_NEEDS_ATTENTION:
            raise CommerceError(
                "Refund does not require retry.", code="refund_retry_invalid_status"
            )

        response = PaystackGatewayService.retry_refund(
            refund,
            refund_account_details=refund_account_details,
        )
        with transaction.atomic():
            locked_refund = RefundService._lock_refund(refund.id)
            response_data = response.get("data") or {}
            paystack_status = str(response_data.get("status") or "").lower()
            locked_refund.processed_by = actor
            locked_refund.metadata = {
                **(locked_refund.metadata or {}),
                "paystack_retry_response": response
                if isinstance(response, dict)
                else {},
                "refund_account_details": refund_account_details,
            }
            if response.get("status"):
                if paystack_status == "processed":
                    locked_refund.status = Refund.STATUS_PROCESSED
                    locked_refund.processed_at = timezone.now()
                elif paystack_status in {"processing", "pending"}:
                    locked_refund.status = Refund.STATUS_PROCESSING
                elif paystack_status in {"needs_attention", "needs-attention"}:
                    locked_refund.status = Refund.STATUS_NEEDS_ATTENTION
                else:
                    locked_refund.status = Refund.STATUS_FAILED
            else:
                locked_refund.status = Refund.STATUS_FAILED
            locked_refund.save(
                update_fields=[
                    "processed_by",
                    "status",
                    "processed_at",
                    "metadata",
                    "updated_at",
                ]
            )

        if (
            response.get("status")
            and str((response.get("data") or {}).get("status") or "").lower()
            == "processed"
        ):
            RefundService.apply_processed_refund(refund.id, actor=actor)

        return Refund.objects.prefetch_related("items").get(pk=refund.id)

    @staticmethod
    def process_paystack_refund_event(*, payload: dict, event: str):
        data = payload.get("data") or {}
        refund_reference = PaystackGatewayService._extract_refund_identifier(data)
        if not refund_reference:
            return None

        refund = (
            Refund.objects.select_related("order")
            .filter(provider_refund_id=refund_reference)
            .first()
        )
        if not refund:
            return None

        PaymentAttempt.objects.create(
            order=refund.order,
            refund=refund,
            provider=Order.PROVIDER_PAYSTACK,
            state=f"webhook_{event}",
            provider_reference=refund_reference,
            request_payload={"event": event},
            response_payload=payload if isinstance(payload, dict) else {},
        )

        with transaction.atomic():
            locked_refund = RefundService._lock_refund(refund.id)
            response_status = str(data.get("status") or "").lower()
            locked_refund.metadata = {
                **(locked_refund.metadata or {}),
                "latest_webhook": payload if isinstance(payload, dict) else {},
            }

            if event == "refund.processed" or response_status == "processed":
                locked_refund.status = Refund.STATUS_PROCESSED
                refunded_at_raw = data.get("refunded_at")
                processed_at = timezone.now()
                if refunded_at_raw:
                    processed_at = timezone.datetime.fromisoformat(
                        str(refunded_at_raw).replace("Z", "+00:00")
                    )
                    if processed_at.tzinfo is None:
                        processed_at = timezone.make_aware(
                            processed_at,
                            timezone.get_current_timezone(),
                        )
                locked_refund.processed_at = processed_at
                locked_refund.save(
                    update_fields=["status", "processed_at", "metadata", "updated_at"]
                )
            elif event == "refund.failed" or response_status == "failed":
                locked_refund.status = Refund.STATUS_FAILED
                locked_refund.save(update_fields=["status", "metadata", "updated_at"])
                write_order_event(
                    locked_refund.order,
                    "refund_failed",
                    refund=locked_refund,
                    message="Refund failed according to Paystack.",
                    payload=payload,
                )
                return locked_refund
            elif event == "refund.pending" or response_status == "pending":
                locked_refund.status = Refund.STATUS_PROCESSING
                locked_refund.save(update_fields=["status", "metadata", "updated_at"])
                return locked_refund
            elif event == "refund.processing" or response_status == "processing":
                locked_refund.status = Refund.STATUS_PROCESSING
                locked_refund.save(update_fields=["status", "metadata", "updated_at"])
                return locked_refund
            elif event in {
                "refund.needs_attention",
                "refund.needs-attention",
            } or response_status in {"needs_attention", "needs-attention"}:
                locked_refund.status = Refund.STATUS_NEEDS_ATTENTION
                locked_refund.save(update_fields=["status", "metadata", "updated_at"])
                return locked_refund

        if locked_refund.status == Refund.STATUS_PROCESSED:
            return RefundService.apply_processed_refund(locked_refund.id)
        return locked_refund


class RevenueLedgerService:
    @staticmethod
    def _party_snapshot(settlement_party: SettlementParty) -> dict:
        return {
            "id": settlement_party.id,
            "display_name": settlement_party.display_name,
            "party_type": settlement_party.party_type,
            "user_id": settlement_party.user_id,
            "email": settlement_party.email,
            "phone": settlement_party.phone,
            "payout_method": settlement_party.payout_method,
            "destination_details": settlement_party.destination_details or {},
        }

    @staticmethod
    def record_payment_share_for_order_item(order_item: OrderItem):
        if not order_item.program_id:
            return []

        shares = (
            ProgramRevenueShare.objects.select_related("settlement_party")
            .filter(
                program_id=order_item.program_id,
                active=True,
                settlement_party__active=True,
            )
            .order_by("id")
        )

        created_entries = []
        for share in shares:
            amount_minor = (order_item.amount_minor * share.share_bps) // 10000
            if amount_minor <= 0:
                continue

            entry, _ = RevenueLedgerEntry.objects.get_or_create(
                external_key=f"payment-share:{order_item.id}:{share.settlement_party_id}",
                defaults={
                    "settlement_party": share.settlement_party,
                    "program_id": order_item.program_id,
                    "order": order_item.order,
                    "order_item": order_item,
                    "direction": RevenueLedgerEntry.DIRECTION_CREDIT,
                    "entry_type": RevenueLedgerEntry.ENTRY_PAYMENT_SHARE,
                    "amount_minor": amount_minor,
                    "currency": order_item.currency,
                    "share_bps_snapshot": share.share_bps,
                    "settlement_party_snapshot": RevenueLedgerService._party_snapshot(
                        share.settlement_party
                    ),
                    "metadata": {
                        "order_reference": order_item.order.reference,
                    },
                },
            )
            created_entries.append(entry)

        return created_entries

    @staticmethod
    def record_refund_reversal_for_refund_item(refund_item: RefundItem):
        order_item = refund_item.order_item
        order_item_id = refund_item.order_item_id
        if not order_item_id:
            return []

        payment_entries = RevenueLedgerEntry.objects.filter(
            order_item_id=order_item_id,
            direction=RevenueLedgerEntry.DIRECTION_CREDIT,
            entry_type=RevenueLedgerEntry.ENTRY_PAYMENT_SHARE,
        ).order_by("id")

        created_entries = []
        item_amount_minor = max(order_item.amount_minor, 1)
        for payment_entry in payment_entries:
            reversal_amount = (
                payment_entry.amount_minor * refund_item.amount_minor
            ) // item_amount_minor
            if reversal_amount <= 0:
                continue

            entry, _ = RevenueLedgerEntry.objects.get_or_create(
                external_key=f"refund-reversal:{refund_item.id}:{payment_entry.settlement_party_id}",
                defaults={
                    "settlement_party": payment_entry.settlement_party,
                    "program_id": order_item.program_id,
                    "order": order_item.order,
                    "order_item": order_item,
                    "refund": refund_item.refund,
                    "refund_item": refund_item,
                    "direction": RevenueLedgerEntry.DIRECTION_DEBIT,
                    "entry_type": RevenueLedgerEntry.ENTRY_REFUND_REVERSAL,
                    "amount_minor": reversal_amount,
                    "currency": refund_item.order_item.currency,
                    "share_bps_snapshot": payment_entry.share_bps_snapshot,
                    "settlement_party_snapshot": payment_entry.settlement_party_snapshot
                    or RevenueLedgerService._party_snapshot(
                        payment_entry.settlement_party
                    ),
                    "metadata": {
                        "refund_id": refund_item.refund_id,
                    },
                },
            )
            created_entries.append(entry)

        return created_entries

    @staticmethod
    def balance_by_currency(settlement_party: SettlementParty) -> dict[str, dict]:
        ledger_rows = (
            RevenueLedgerEntry.objects.filter(settlement_party=settlement_party)
            .values("currency", "direction")
            .annotate(total_minor=Sum("amount_minor"))
        )
        payout_rows = (
            BeneficiaryPayout.objects.filter(
                settlement_party=settlement_party,
                status__in=PAYSTACK_PAYOUT_HOLD_STATUSES,
            )
            .values("currency")
            .annotate(total_minor=Sum("amount_minor"))
        )

        balances: dict[str, dict] = {}
        for row in ledger_rows:
            currency = row["currency"] or "KES"
            balances.setdefault(
                currency,
                {
                    "creditsMinor": 0,
                    "debitsMinor": 0,
                    "reservedMinor": 0,
                    "availableMinor": 0,
                },
            )
            if row["direction"] == RevenueLedgerEntry.DIRECTION_CREDIT:
                balances[currency]["creditsMinor"] = row["total_minor"] or 0
            else:
                balances[currency]["debitsMinor"] = row["total_minor"] or 0

        for row in payout_rows:
            currency = row["currency"] or "KES"
            balances.setdefault(
                currency,
                {
                    "creditsMinor": 0,
                    "debitsMinor": 0,
                    "reservedMinor": 0,
                    "availableMinor": 0,
                },
            )
            balances[currency]["reservedMinor"] = row["total_minor"] or 0

        for currency, values in balances.items():
            values["availableMinor"] = (
                values["creditsMinor"] - values["debitsMinor"] - values["reservedMinor"]
            )

        return balances

    @staticmethod
    def available_balance_minor(
        settlement_party: SettlementParty, currency: str
    ) -> int:
        balances = RevenueLedgerService.balance_by_currency(settlement_party)
        return balances.get(currency.upper(), {}).get("availableMinor", 0)


class PayoutService:
    @staticmethod
    def _lock_payout(payout_id: int) -> BeneficiaryPayout:
        return (
            BeneficiaryPayout.objects.select_for_update()
            .select_related("settlement_party", "requested_by", "processed_by")
            .get(pk=payout_id)
        )

    @staticmethod
    def _payout_base_queryset():
        return BeneficiaryPayout.objects.select_related("settlement_party").order_by(
            "-created_at"
        )

    @staticmethod
    def list_payouts():
        return PayoutService._payout_base_queryset()

    @staticmethod
    def get_payout(payout_id: int) -> BeneficiaryPayout:
        payout = PayoutService._payout_base_queryset().filter(pk=payout_id).first()
        if not payout:
            raise CommerceError(
                "Payout not found.", code="payout_not_found", status_code=404
            )
        return payout

    @staticmethod
    def list_settlement_parties():
        return SettlementParty.objects.filter(active=True).order_by(
            "party_type", "display_name"
        )

    @staticmethod
    def settlement_party_payloads():
        payloads = []
        for party in PayoutService.list_settlement_parties():
            payloads.append(
                {
                    **serialize_settlement_party(party),
                    "balances": RevenueLedgerService.balance_by_currency(party),
                }
            )
        return payloads

    @staticmethod
    def _lock_settlement_party(settlement_party_id: int) -> SettlementParty:
        return SettlementParty.objects.select_for_update().get(pk=settlement_party_id)

    @staticmethod
    def create_payout(
        settlement_party: SettlementParty,
        *,
        amount_minor: int,
        currency: str,
        actor: User | None,
        notes: str = "",
    ) -> BeneficiaryPayout:
        currency = str(currency or "KES").upper()
        amount_minor = int(amount_minor or 0)

        with transaction.atomic():
            locked_party = PayoutService._lock_settlement_party(settlement_party.id)
            if not locked_party.active:
                raise CommerceError(
                    "Settlement party is inactive.",
                    code="settlement_party_inactive",
                )
            if amount_minor <= 0:
                raise CommerceError(
                    "Payout amount must be greater than zero.",
                    code="invalid_payout_amount",
                )

            available_minor = RevenueLedgerService.available_balance_minor(
                locked_party, currency
            )
            if available_minor < amount_minor:
                raise CommerceError(
                    "Payout amount exceeds available balance.",
                    code="payout_amount_exceeds_balance",
                )

            return BeneficiaryPayout.objects.create(
                settlement_party=locked_party,
                requested_by=actor,
                provider=Order.PROVIDER_PAYSTACK,
                status=BeneficiaryPayout.STATUS_PENDING_APPROVAL,
                amount_minor=amount_minor,
                currency=currency,
                metadata={
                    "notes": notes,
                    "destination_snapshot": locked_party.destination_details or {},
                    "settlement_party_snapshot": RevenueLedgerService._party_snapshot(
                        locked_party
                    ),
                },
            )

    @staticmethod
    def send_payout(
        payout: BeneficiaryPayout, *, actor: User | None
    ) -> BeneficiaryPayout:
        with transaction.atomic():
            locked_payout = PayoutService._lock_payout(payout.id)
            if locked_payout.status != BeneficiaryPayout.STATUS_PENDING_APPROVAL:
                raise CommerceError(
                    "Only pending-approval payouts can be sent.",
                    code="payout_not_sendable",
                )
            locked_payout.processed_by = actor
            locked_payout.reference = (
                locked_payout.reference or f"payout-{uuid.uuid4().hex[:20]}"
            )
            locked_payout.status = BeneficiaryPayout.STATUS_PROCESSING
            locked_payout.failure_reason = ""
            locked_payout.save(
                update_fields=[
                    "processed_by",
                    "reference",
                    "status",
                    "failure_reason",
                    "updated_at",
                ]
            )

        try:
            response = PaystackGatewayService.initiate_transfer(
                PayoutService.get_payout(payout.id)
            )
        except Exception as error:
            failure_reason = (
                error.message
                if isinstance(error, CommerceError)
                else str(error) or "Transfer failed."
            )
            with transaction.atomic():
                locked_payout = PayoutService._lock_payout(payout.id)
                locked_payout.status = BeneficiaryPayout.STATUS_FAILED
                locked_payout.failure_reason = failure_reason
                locked_payout.save(
                    update_fields=["status", "failure_reason", "updated_at"]
                )
            raise

        response_data = response.get("data") or {}
        transfer_status = str(response_data.get("status") or "").lower()

        with transaction.atomic():
            locked_payout = PayoutService._lock_payout(payout.id)
            locked_payout.provider_reference = str(
                response_data.get("transfer_code")
                or locked_payout.provider_reference
                or ""
            )
            locked_payout.metadata = {
                **(locked_payout.metadata or {}),
                "transfer_response": response if isinstance(response, dict) else {},
            }

            if response.get("status"):
                if transfer_status == "success":
                    locked_payout.status = BeneficiaryPayout.STATUS_PAID
                    locked_payout.processed_at = timezone.now()
                    locked_payout.failure_reason = ""
                elif transfer_status == "reversed":
                    locked_payout.status = BeneficiaryPayout.STATUS_REVERSED
                    locked_payout.processed_at = timezone.now()
                elif transfer_status == "failed":
                    locked_payout.status = BeneficiaryPayout.STATUS_FAILED
                    locked_payout.failure_reason = (
                        response.get("message") or "Transfer failed."
                    )
                else:
                    locked_payout.status = BeneficiaryPayout.STATUS_PROCESSING
                    locked_payout.failure_reason = ""
            else:
                locked_payout.status = BeneficiaryPayout.STATUS_FAILED
                locked_payout.failure_reason = (
                    response.get("message") or "Transfer failed."
                )

            locked_payout.save(
                update_fields=[
                    "provider_reference",
                    "status",
                    "processed_at",
                    "failure_reason",
                    "metadata",
                    "updated_at",
                ]
            )

        return PayoutService.get_payout(payout.id)

    @staticmethod
    def process_paystack_transfer_event(*, payload: dict, event: str):
        data = payload.get("data") or {}
        reference = PaystackGatewayService._extract_transfer_reference(data)
        if not reference:
            return None

        payout = (
            BeneficiaryPayout.objects.select_related("settlement_party")
            .filter(reference=reference)
            .first()
        )
        if not payout:
            return None

        PaymentAttempt.objects.create(
            payout=payout,
            provider=Order.PROVIDER_PAYSTACK,
            state=f"webhook_{event}",
            provider_reference=reference,
            request_payload={"event": event},
            response_payload=payload if isinstance(payload, dict) else {},
        )

        with transaction.atomic():
            locked_payout = PayoutService._lock_payout(payout.id)
            locked_payout.provider_reference = str(
                data.get("transfer_code") or locked_payout.provider_reference or ""
            )
            locked_payout.metadata = {
                **(locked_payout.metadata or {}),
                "latest_webhook": payload if isinstance(payload, dict) else {},
            }

            if event == "transfer.success":
                locked_payout.status = BeneficiaryPayout.STATUS_PAID
                locked_payout.processed_at = timezone.now()
                locked_payout.failure_reason = ""
            elif event == "transfer.failed":
                locked_payout.status = BeneficiaryPayout.STATUS_FAILED
                locked_payout.failure_reason = (
                    str(data.get("complete_message") or "")
                    or "Transfer failed according to Paystack."
                )
            elif event == "transfer.reversed":
                locked_payout.status = BeneficiaryPayout.STATUS_REVERSED
                locked_payout.processed_at = timezone.now()
                locked_payout.failure_reason = (
                    str(data.get("complete_message") or "")
                    or "Transfer reversed by Paystack."
                )

            locked_payout.save(
                update_fields=[
                    "provider_reference",
                    "metadata",
                    "status",
                    "processed_at",
                    "failure_reason",
                    "updated_at",
                ]
            )

        return PayoutService.get_payout(payout.id)


def build_paystack_callback_url(request) -> str:
    configured = settings.PAYSTACK_CALLBACK_URL or ""
    if configured:
        return configured
    return request.build_absolute_uri(reverse("commerce:paystack_callback"))
