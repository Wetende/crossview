import logging

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST
from inertia import render

from apps.core.models import Program
from apps.core.services.course_prerequisites import CoursePrerequisiteService
from apps.core.utils import get_post_data, is_admin

from .exceptions import CommerceError
from .models import Order, Refund, SettlementParty
from .services import (
    CartService,
    CheckoutService,
    OfflinePaymentService,
    PaystackGatewayService,
    PayoutService,
    RefundService,
    WishlistService,
    build_paystack_callback_url,
    program_price_minor,
    program_payment_method_allowed,
    serialize_cart,
    serialize_order,
    serialize_payout,
    serialize_refund,
)

logger = logging.getLogger(__name__)


def _json_error(error: CommerceError):
    return JsonResponse(
        {
            "ok": False,
            "error": error.code,
            "message": error.message,
        },
        status=error.status_code,
    )


def _json_ok(payload: dict, *, status: int = 200):
    return JsonResponse({"ok": True, **payload}, status=status)


def _require_admin(request):
    if not is_admin(request.user):
        return JsonResponse(
            {
                "ok": False,
                "error": "forbidden",
                "message": "Admin access is required.",
            },
            status=403,
        )
    return None


def _lookup_program(program_id: int) -> Program:
    program = Program.objects.filter(pk=program_id).first()
    if not program:
        raise CommerceError("Program not found.", code="program_not_found", status_code=404)
    return program


def _serialize_orders(queryset, *, include_refunds: bool = False):
    return [
        serialize_order(order, include_refunds=include_refunds)
        for order in queryset
    ]


@login_required
def program_checkout(request, pk: int):
    program = Program.objects.filter(pk=pk, is_published=True).first()
    if not program:
        messages.error(request, "Program not found.")
        return redirect("core:programs")

    amount_minor, currency = program_price_minor(program)
    if amount_minor <= 0:
        messages.error(request, "This program does not require paid checkout.")
        return redirect(f"/programs/{program.slug}/")
    if not program_payment_method_allowed(program, Order.PROVIDER_PAYSTACK):
        messages.error(request, "This program does not support online checkout.")
        return redirect(f"/programs/{program.slug}/")

    prerequisite_evaluation = CoursePrerequisiteService.evaluate(request.user, program)
    if prerequisite_evaluation.required and not prerequisite_evaluation.eligible:
        messages.error(request, prerequisite_evaluation.blocking_message)
        return redirect(f"/programs/{program.slug}/")

    pending_order = (
        Order.objects.filter(
            user=request.user,
            program=program,
            status__in=[
                Order.STATUS_CREATED,
                Order.STATUS_PENDING_PAYMENT,
                Order.STATUS_PENDING_MANUAL_PAYMENT,
            ],
        )
        .order_by("-created_at")
        .first()
    )

    return render(
        request,
        "Payments/Checkout",
        {
            "program": {
                "id": program.id,
                "name": program.name,
                "thumbnail": program.thumbnail.url if program.thumbnail else None,
            },
            "price": {
                "amountMinor": amount_minor,
                "currency": currency,
            },
            "pendingOrder": (
                {
                    "id": pending_order.id,
                    "reference": pending_order.reference,
                    "status": pending_order.status,
                }
                if pending_order
                else None
            ),
            "paystack": {
                "publicKey": settings.PAYSTACK_PUBLIC_KEY,
            },
        },
    )


@login_required
@require_POST
def program_checkout_initialize(request, pk: int):
    try:
        program = _lookup_program(pk)
        prerequisite_evaluation = CoursePrerequisiteService.evaluate(
            request.user,
            program,
        )
        if prerequisite_evaluation.required and not prerequisite_evaluation.eligible:
            raise CommerceError(
                prerequisite_evaluation.blocking_message,
                code="prerequisites_required",
            )
        order = (
            Order.objects.filter(
                user=request.user,
                program=program,
                provider=Order.PROVIDER_PAYSTACK,
                status__in=[
                    Order.STATUS_CREATED,
                    Order.STATUS_PENDING_PAYMENT,
                ],
            )
            .order_by("-created_at")
            .first()
        )
        if not order:
            order = CheckoutService.create_order_from_programs(
                request.user,
                [program],
                Order.PROVIDER_PAYSTACK,
                metadata={"source": "legacy_program_checkout"},
            )

        response = PaystackGatewayService.initialize_payment(
            order,
            callback_url=build_paystack_callback_url(request),
        )
    except CommerceError as error:
        messages.error(request, error.message)
        return redirect("commerce:checkout", pk=pk)

    authorization_url = (response.get("data") or {}).get("authorization_url")
    if not authorization_url:
        messages.error(request, "Missing Paystack authorization URL.")
        return redirect("commerce:checkout", pk=pk)

    return redirect(authorization_url)


@login_required
def paystack_callback(request):
    reference = request.GET.get("reference") or request.GET.get("trxref")
    if not reference:
        messages.error(request, "Missing payment reference.")
        return redirect("core:programs")

    order = Order.objects.filter(reference=reference, user=request.user).first()
    if not order:
        messages.error(request, "Order not found.")
        return redirect("core:programs")

    order, verify_response, finalized = PaystackGatewayService.verify_and_finalize_order(
        order,
        reference,
        state="callback_verify",
        payload_source="callback",
    )

    if order.status == Order.STATUS_PAID:
        messages.success(request, "Payment verified. Access has been granted.")
        if order.program_id:
            return redirect("progression:student.program", pk=order.program_id)
        return redirect("commerce:student_orders")

    verify_data = verify_response.get("data") or {}
    provider_status = str(verify_data.get("status") or "").lower()
    if provider_status in {"failed", "reversed"}:
        messages.error(request, "Payment was not completed. You can try again.")
        if order.program_id:
            return redirect("commerce:checkout", pk=order.program_id)
        return redirect("commerce:student_orders")

    messages.info(
        request,
        "Payment is pending confirmation. We will update your access shortly.",
    )
    if order.program_id:
        return redirect(f"/programs/{order.program.slug}/")
    return redirect("commerce:student_orders")


@csrf_exempt
@require_POST
def paystack_webhook(request):
    result = PaystackGatewayService.process_webhook(
        raw_body=request.body or b"",
        signature=request.headers.get("x-paystack-signature", ""),
    )
    if not result.get("ok"):
        return JsonResponse(
            {"ok": False, "error": result.get("error", "webhook_error")},
            status=result.get("status_code", 400),
        )
    if result.get("duplicate"):
        return JsonResponse({"ok": True, "duplicate": True})
    return JsonResponse(
        {
            "ok": True,
            "handled": result.get("handled", False),
            "event": result.get("event_type", ""),
        },
        status=result.get("status_code", 200),
    )


@login_required
@require_GET
def cart_detail(request):
    cart = CartService.get_or_create_active_cart(request.user)
    return _json_ok({"cart": serialize_cart(cart)})


@login_required
@require_POST
def cart_add_item(request):
    try:
        data = get_post_data(request)
        program_id = data.get("programId") or data.get("program_id")
        if not program_id:
            raise CommerceError("programId is required.", code="program_id_required")
        program = _lookup_program(int(program_id))
        cart = CartService.add_program(request.user, program)
        return _json_ok({"cart": serialize_cart(cart)}, status=201)
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_http_methods(["DELETE"])
def cart_remove_item(request, program_id: int):
    try:
        cart = CartService.remove_program(request.user, program_id)
        return _json_ok({"cart": serialize_cart(cart)})
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_POST
def cart_clear(request):
    cart = CartService.clear_cart(request.user)
    return _json_ok({"cart": serialize_cart(cart)})


@login_required
@require_http_methods(["GET", "POST"])
def commerce_orders(request):
    if request.method == "GET":
        orders = CheckoutService.list_user_orders(request.user)[:100]
        return _json_ok({"orders": _serialize_orders(orders)})

    try:
        data = get_post_data(request)
        payment_method = (
            data.get("paymentMethod")
            or data.get("payment_method")
            or Order.PROVIDER_PAYSTACK
        )
        raw_program_ids = data.get("programIds") or data.get("program_ids")
        if raw_program_ids is not None:
            raw_values = raw_program_ids if isinstance(raw_program_ids, list) else [raw_program_ids]
            try:
                program_ids = [int(program_id) for program_id in raw_values]
            except (TypeError, ValueError):
                raise CommerceError("programIds must be integers.", code="invalid_program_ids")
            if not program_ids:
                raise CommerceError("No programs selected for checkout.", code="empty_checkout")
            programs = [_lookup_program(program_id) for program_id in program_ids]
            order = CheckoutService.create_order_from_programs(
                request.user,
                programs,
                payment_method,
                metadata={"source": "direct_checkout"},
            )
        else:
            order = CheckoutService.create_order_from_cart(request.user, payment_method)
        payload = {"order": serialize_order(order)}
        if payment_method == Order.PROVIDER_OFFLINE_BANK_TRANSFER:
            payload["offlinePayment"] = OfflinePaymentService.instructions_payload()
        return _json_ok(payload, status=201)
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_GET
def commerce_order_detail(request, order_id: int):
    try:
        order = CheckoutService.get_user_order(request.user, order_id)
        return _json_ok({"order": serialize_order(order)})
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_GET
def commerce_order_status(request, order_id: int):
    try:
        order = CheckoutService.get_user_order(request.user, order_id)
        return _json_ok(
            {
                "order": {
                    "id": order.id,
                    "reference": order.reference,
                    "status": order.status,
                    "provider": order.provider,
                    "paidAt": order.paid_at.isoformat() if order.paid_at else None,
                    "refundedMinor": order.refunded_minor,
                    "totalMinor": order.total_minor,
                }
            }
        )
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_POST
def commerce_order_paystack_initialize(request, order_id: int):
    try:
        order = CheckoutService.get_user_order(request.user, order_id)
        data = get_post_data(request)
        channels = data.get("channels")
        
        response = PaystackGatewayService.initialize_payment(
            order,
            callback_url="",
            channels=channels if isinstance(channels, list) else None,
        )
        response_data = response.get("data") or {}
        return _json_ok(
            {
                "order": serialize_order(CheckoutService.get_user_order(request.user, order_id)),
                "accessCode": response_data.get("access_code"),
                "authorizationUrl": response_data.get("authorization_url"),
                "reference": response_data.get("reference") or order.reference,
                "providerReference": response_data.get("reference") or order.reference,
            }
        )
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_POST
def commerce_order_paystack_charge_mpesa(request, order_id: int):
    try:
        order = CheckoutService.get_user_order(request.user, order_id)
        data = get_post_data(request)
        raw_phone = str(data.get("phone") or "").strip()
        
        if not raw_phone:
            raise CommerceError("Phone number is required for M-Pesa payments.", code="missing_phone")
            
        clean_phone = "".join(c for c in raw_phone if c.isdigit() or c == "+")
        if clean_phone.startswith("0"):
            clean_phone = f"+254{clean_phone[1:]}"
        elif clean_phone.startswith("254"):
            clean_phone = f"+{clean_phone}"
        elif not clean_phone.startswith("+"):
            clean_phone = f"+254{clean_phone}"
            
        response = PaystackGatewayService.charge_mpesa(
            order,
            phone_number=clean_phone,
        )
        
        response_data = response.get("data") or {}
        display_text = response_data.get("display_text") or "Please check your phone to complete the payment."
        status_flag = response_data.get("status") or ""
        
        return _json_ok(
            {
                "order": serialize_order(CheckoutService.get_user_order(request.user, order_id)),
                "reference": response_data.get("reference") or order.reference,
                "providerReference": response_data.get("reference") or order.reference,
                "statusText": display_text,
                "providerStatus": status_flag,
            }
        )
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_POST
def commerce_order_paystack_verify(request, order_id: int):
    try:
        order = CheckoutService.get_user_order(request.user, order_id)
        data = get_post_data(request)
        reference = (
            data.get("reference")
            or data.get("providerReference")
            or order.provider_reference
            or order.reference
        )
        order, verify_response, finalized = PaystackGatewayService.verify_and_finalize_order(
            order,
            str(reference),
            state="popup_verify",
            payload_source="popup_verify",
        )
        provider_status = str((verify_response.get("data") or {}).get("status") or "").lower()
        return _json_ok(
            {
                "order": serialize_order(order),
                "finalized": finalized,
                "transactionStatus": provider_status,
            }
        )
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_GET
def checkout_preview(request):
    try:
        raw_program_ids = request.GET.getlist("programIds[]") or request.GET.getlist("programIds")
        program_ids = [int(program_id) for program_id in raw_program_ids] if raw_program_ids else None
        preview = CheckoutService.get_checkout_preview(request.user, program_ids=program_ids)
        return _json_ok(preview)
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_GET
def wishlist_list(request):
    return _json_ok({"wishlist": WishlistService.serialize_list(request.user)})


@login_required
@require_POST
def wishlist_add_item(request):
    try:
        data = get_post_data(request)
        program_id = data.get("programId") or data.get("program_id")
        if not program_id:
            raise CommerceError("programId is required.", code="program_id_required")
        program = _lookup_program(int(program_id))
        _, _ = WishlistService.add_program(request.user, program)
        return _json_ok({"wishlist": WishlistService.serialize_list(request.user)}, status=201)
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_http_methods(["DELETE"])
def wishlist_remove_item(request, program_id: int):
    WishlistService.remove_program(request.user, program_id)
    return _json_ok({"wishlist": WishlistService.serialize_list(request.user)})


@login_required
@require_POST
def wishlist_sync(request):
    try:
        data = get_post_data(request)
        raw_program_ids = data.get("programIds") or data.get("program_ids") or []
        if not isinstance(raw_program_ids, list):
            raise CommerceError("programIds must be a list.", code="invalid_program_ids")
        merged_count = WishlistService.sync_program_ids(request.user, raw_program_ids)
        return _json_ok(
            {
                "wishlist": WishlistService.serialize_list(request.user),
                "mergedCount": merged_count,
            }
        )
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_GET
def student_orders(request):
    """Inertia shell — orders are fetched client-side via commerceApi.getOrders()."""
    return render(request, "Student/Orders", {})


@login_required
@require_GET
def student_order_detail(request, order_id: int):
    try:
        order = CheckoutService.get_user_order(request.user, order_id)
        return _json_ok({"order": serialize_order(order)})
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_GET
def admin_commerce_orders(request):
    admin_response = _require_admin(request)
    if admin_response:
        return admin_response

    orders = CheckoutService.list_admin_orders(
        status=request.GET.get("status", ""),
        provider=request.GET.get("provider", ""),
    )[:200]
    return _json_ok({"orders": _serialize_orders(orders, include_refunds=True)})


@login_required
@require_POST
def admin_mark_order_paid(request, order_id: int):
    admin_response = _require_admin(request)
    if admin_response:
        return admin_response

    try:
        order = CheckoutService.get_order(order_id)
        if order.provider != Order.PROVIDER_OFFLINE_BANK_TRANSFER:
            raise CommerceError(
                "Only offline bank transfer orders can be manually marked paid.",
                code="mark_paid_invalid_provider",
            )
        if order.status != Order.STATUS_PENDING_MANUAL_PAYMENT:
            raise CommerceError(
                "Only pending offline bank transfer orders can be manually marked paid.",
                code="mark_paid_invalid_status",
            )
        order = CheckoutService.mark_order_paid(order, actor=request.user)
        return _json_ok({"order": serialize_order(order)})
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_POST
def admin_cancel_order(request, order_id: int):
    admin_response = _require_admin(request)
    if admin_response:
        return admin_response

    try:
        data = get_post_data(request)
        order = CheckoutService.get_order(order_id)
        order = CheckoutService.cancel_order(
            order,
            actor=request.user,
            reason=str(data.get("reason") or ""),
        )
        return _json_ok({"order": serialize_order(order)})
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_POST
def admin_refund_order(request, order_id: int):
    admin_response = _require_admin(request)
    if admin_response:
        return admin_response

    try:
        data = get_post_data(request)
        order = CheckoutService.get_order(order_id)
        raw_item_ids = data.get("orderItemIds") or data.get("order_item_ids")
        if raw_item_ids is None:
            order_item_ids = None
        elif isinstance(raw_item_ids, list):
            order_item_ids = [int(item_id) for item_id in raw_item_ids]
        else:
            order_item_ids = [int(raw_item_ids)]

        refund = RefundService.request_refund(
            order,
            actor=request.user,
            order_item_ids=order_item_ids,
            reason=str(data.get("reason") or ""),
            notes=str(data.get("notes") or ""),
            refund_account_details=data.get("refundAccountDetails") or data.get("refund_account_details") or {},
        )
        return _json_ok({"refund": serialize_refund(refund)})
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_POST
def admin_retry_refund(request, refund_id: int):
    admin_response = _require_admin(request)
    if admin_response:
        return admin_response

    try:
        data = get_post_data(request)
        refund = Refund.objects.select_related("order").prefetch_related("items").filter(pk=refund_id).first()
        if not refund:
            raise CommerceError("Refund not found.", code="refund_not_found", status_code=404)
        refund = RefundService.retry_refund(
            refund,
            actor=request.user,
            refund_account_details=data.get("refundAccountDetails")
            or data.get("refund_account_details")
            or {},
        )
        return _json_ok({"refund": serialize_refund(refund)})
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_http_methods(["GET", "POST"])
def admin_commerce_payouts(request):
    admin_response = _require_admin(request)
    if admin_response:
        return admin_response

    if request.method == "GET":
        payouts = [serialize_payout(payout) for payout in PayoutService.list_payouts()[:200]]
        return _json_ok(
            {
                "payouts": payouts,
                "settlementParties": PayoutService.settlement_party_payloads(),
            }
        )

    try:
        data = get_post_data(request)
        settlement_party_id = data.get("settlementPartyId") or data.get("settlement_party_id")
        if not settlement_party_id:
            raise CommerceError(
                "settlementPartyId is required.",
                code="settlement_party_id_required",
            )
        settlement_party = SettlementParty.objects.filter(pk=int(settlement_party_id)).first()
        if not settlement_party:
            raise CommerceError(
                "Settlement party not found.",
                code="settlement_party_not_found",
                status_code=404,
            )
        payout = PayoutService.create_payout(
            settlement_party,
            amount_minor=int(data.get("amountMinor") or data.get("amount_minor") or 0),
            currency=str(data.get("currency") or "KES"),
            actor=request.user,
            notes=str(data.get("notes") or ""),
        )
        return _json_ok({"payout": serialize_payout(payout)}, status=201)
    except CommerceError as error:
        return _json_error(error)


@login_required
@require_POST
def admin_send_payout(request, payout_id: int):
    admin_response = _require_admin(request)
    if admin_response:
        return admin_response

    try:
        payout = PayoutService.get_payout(payout_id)
        payout = PayoutService.send_payout(payout, actor=request.user)
        return _json_ok({"payout": serialize_payout(payout)})
    except CommerceError as error:
        return _json_error(error)


# =============================================================================
# Inertia Page Shells (client-side data fetching via commerceApi.js)
# =============================================================================


@login_required
@require_GET
def cart_page(request):
    """Render the cart Inertia page shell."""
    return render(request, "Commerce/Cart", {})


@login_required
@require_GET
def checkout_page(request):
    """Render the checkout Inertia page shell with Paystack public key."""
    return render(
        request,
        "Commerce/Checkout",
        {
            "paystack": {
                "publicKey": getattr(settings, "PAYSTACK_PUBLIC_KEY", ""),
            },
            "checkout": {
                "mode": request.GET.get("mode") or "cart",
                "programId": request.GET.get("programId"),
            },
        },
    )


@login_required
@require_GET
def order_detail_page(request, order_id: int):
    """Render the order detail Inertia page shell."""
    return render(
        request,
        "Commerce/OrderDetail",
        {
            "orderId": order_id,
            "paystack": {
                "publicKey": getattr(settings, "PAYSTACK_PUBLIC_KEY", ""),
            },
        },
    )


@login_required
@require_GET
def admin_commerce_orders_page(request):
    """Render the admin orders Inertia page shell."""
    admin_err = _require_admin(request)
    if admin_err:
        return admin_err
    return render(request, "Admin/Commerce/Orders", {})


@require_GET
def wishlist_page(request):
    return render(request, "Public/Wishlist", {})
