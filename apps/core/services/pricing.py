"""Course pricing policy helpers.

The public price label, checkout availability, and per-course defaults are
deployment-aware but remain stored in Program.custom_pricing for v1.
"""

from __future__ import annotations

from datetime import UTC, datetime
from math import isfinite
from typing import Any

from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.dateparse import parse_datetime


PAYMENT_COLLECTION_NONE = "none"
PAYMENT_COLLECTION_ONLINE = "online"
PAYMENT_COLLECTION_OFFLINE = "offline"
PAYMENT_COLLECTION_BOTH = "both"

CARD_DISPLAY_FREE = "free"
CARD_DISPLAY_PRICE = "price"
CARD_DISPLAY_HIDDEN = "hidden"

VALID_PAYMENT_COLLECTIONS = {
    PAYMENT_COLLECTION_NONE,
    PAYMENT_COLLECTION_ONLINE,
    PAYMENT_COLLECTION_OFFLINE,
    PAYMENT_COLLECTION_BOTH,
}
VALID_CARD_DISPLAYS = {
    CARD_DISPLAY_FREE,
    CARD_DISPLAY_PRICE,
    CARD_DISPLAY_HIDDEN,
}

REGULATED_TVET_BODIES = {"KASNEB", "CDACC", "KNEC", "NITA", "ICM"}
ONLINE_CAPABLE_DEPLOYMENT_MODES = {"online", "theology"}
ONLINE_CAPABLE_BODIES = {"INTERNAL"}
PAYSTACK_PAYMENT_METHOD = "paystack"
OFFLINE_PAYMENT_METHOD = "offline_bank_transfer"
ONLINE_COURSE_DELIVERY_MODES = {"self_paced", "live_online", "blended"}


def _to_non_negative_number(
    value: Any,
    *,
    default: float | None = 0,
    allow_none: bool = False,
) -> float | None:
    if value in (None, ""):
        return None if allow_none else default
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None if allow_none else default
    if not isfinite(numeric):
        return None if allow_none else default
    return max(0.0, numeric)


def _normalise_code(value: Any) -> str:
    return str(value or "").strip().lower()


def _parse_sale_datetime(value: Any, *, strict: bool = False) -> datetime | None:
    if value in (None, ""):
        return None
    parsed = (
        value
        if isinstance(value, datetime)
        else parse_datetime(str(value).strip())
    )
    if parsed is None:
        if strict:
            raise ValidationError("Enter a valid sale date and time.")
        return None
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_default_timezone())
    return parsed.astimezone(UTC)


def _serialize_sale_datetime(value: datetime | None) -> str | None:
    return value.astimezone(UTC).isoformat() if value else None


def validate_custom_pricing(
    pricing_data: dict | None,
    *,
    deployment_mode: str = "custom",
    exam_body: str | None = None,
    qualification_family: str | None = None,
    platform_features: dict | None = None,
    currency_code: str = "KES",
    course_delivery_mode: str | None = None,
) -> dict:
    """Validate teacher-entered pricing and return its normalized representation."""

    source = pricing_data if isinstance(pricing_data, dict) else {}
    for key, label in (
        ("price", "Sale/current price"),
        ("original_price", "Regular price"),
    ):
        value = source.get(key)
        if value in (None, ""):
            continue
        if isinstance(value, bool):
            raise ValidationError(f"{label} must be a number.")
        try:
            numeric = float(value)
        except (TypeError, ValueError) as exc:
            raise ValidationError(f"{label} must be a number.") from exc
        if not isfinite(numeric):
            raise ValidationError(f"{label} must be a finite number.")
        if numeric < 0:
            raise ValidationError(f"{label} cannot be negative.")

    price = float(source.get("price") or 0)
    original_value = source.get("original_price")
    original_price = (
        float(original_value) if original_value not in (None, "") else None
    )
    if original_price is not None and original_price <= price:
        raise ValidationError("Regular price must be greater than the sale price.")
    if len(str(source.get("price_info") or "").strip()) > 500:
        raise ValidationError("Price information cannot exceed 500 characters.")

    starts_raw = source.get("sale_starts_at")
    ends_raw = source.get("sale_ends_at")
    if bool(starts_raw) != bool(ends_raw):
        raise ValidationError("A scheduled sale requires both a start and end date.")
    starts_at = _parse_sale_datetime(starts_raw, strict=True)
    ends_at = _parse_sale_datetime(ends_raw, strict=True)
    if starts_at and ends_at:
        if starts_at >= ends_at:
            raise ValidationError("Sale end must be after the sale start.")
        if original_price is None:
            raise ValidationError("A scheduled sale requires a regular price.")
        if course_delivery_mode not in ONLINE_COURSE_DELIVERY_MODES:
            raise ValidationError(
                "Scheduled public sales require a self-paced, live-online, or blended course."
            )

    normalized = normalize_custom_pricing(
        source,
        deployment_mode=deployment_mode,
        exam_body=exam_body,
        qualification_family=qualification_family,
        platform_features=platform_features,
        currency_code=currency_code,
        course_delivery_mode=course_delivery_mode,
    )
    if starts_at and ends_at and normalized["payment_collection"] not in {
        PAYMENT_COLLECTION_ONLINE,
        PAYMENT_COLLECTION_BOTH,
    }:
        raise ValidationError("Scheduled public sales require online checkout.")
    for derived_key in ("effective_price", "regular_price", "sale_active"):
        normalized.pop(derived_key, None)
    return normalized


def online_payments_enabled(platform_features: dict | None = None) -> bool:
    return bool((platform_features or {}).get("payments"))


def online_payment_supported_for_context(
    *,
    deployment_mode: str = "custom",
    exam_body: str | None = None,
    qualification_family: str | None = None,
) -> bool:
    """Return whether the course context is allowed to choose online checkout."""

    del qualification_family
    mode = _normalise_code(deployment_mode) or "custom"
    body_key = str(exam_body or "").strip().upper()

    if body_key in REGULATED_TVET_BODIES:
        return False
    return mode in ONLINE_CAPABLE_DEPLOYMENT_MODES or body_key in ONLINE_CAPABLE_BODIES


def online_payment_selectable(
    *,
    deployment_mode: str = "custom",
    exam_body: str | None = None,
    qualification_family: str | None = None,
    platform_features: dict | None = None,
) -> bool:
    """Return whether a teacher can select online payment for this course."""

    if str(exam_body or "").strip().upper() in REGULATED_TVET_BODIES:
        return False
    return online_payment_supported_for_context(
        deployment_mode=deployment_mode,
        exam_body=exam_body,
        qualification_family=qualification_family,
    ) or online_payments_enabled(platform_features)


def resolve_pricing_recommendation(
    *,
    deployment_mode: str = "custom",
    exam_body: str | None = None,
    qualification_family: str | None = None,
    platform_features: dict | None = None,
    price: Any = 0,
) -> dict:
    """Return the recommended pricing policy for course context."""

    mode = _normalise_code(deployment_mode) or "custom"
    body = str(exam_body or "").strip()
    body_key = body.upper()
    family = str(qualification_family or "").strip()
    amount = _to_non_negative_number(price, default=0) or 0
    has_price = amount > 0
    payments_enabled = online_payments_enabled(platform_features)
    online_supported = online_payment_selectable(
        deployment_mode=deployment_mode,
        exam_body=exam_body,
        qualification_family=qualification_family,
        platform_features=platform_features,
    )

    def policy(
        *,
        payment_collection: str,
        card_display: str,
        reason: str,
    ) -> dict:
        return {
            "payment_collection": payment_collection,
            "card_display": card_display,
            "online_payment_supported": online_supported,
            "platform_payments_enabled": payments_enabled,
            "reason": reason,
        }

    if body_key in REGULATED_TVET_BODIES:
        return policy(
            payment_collection=PAYMENT_COLLECTION_NONE,
            card_display=CARD_DISPLAY_HIDDEN,
            reason=f"{body} courses usually use admissions or manual fee handling.",
        )

    if body_key == "INTERNAL":
        return policy(
            payment_collection=(
                PAYMENT_COLLECTION_BOTH if has_price else PAYMENT_COLLECTION_NONE
            ),
            card_display=CARD_DISPLAY_PRICE if has_price else CARD_DISPLAY_FREE,
            reason=(
                f"Internal {family or 'courses'} can be free or paid with "
                "online checkout and/or offline payment."
            ),
        )

    if mode in {"cbc", "driving"}:
        return policy(
            payment_collection=PAYMENT_COLLECTION_NONE,
            card_display=CARD_DISPLAY_HIDDEN,
            reason=(
                "This deployment usually handles access or fees outside public "
                "course cards."
            ),
        )

    if mode == "tvet":
        return policy(
            payment_collection=PAYMENT_COLLECTION_NONE,
            card_display=CARD_DISPLAY_HIDDEN,
            reason="TVET courses default to admissions-style fee handling.",
        )

    if mode in {"online", "theology"}:
        return policy(
            payment_collection=(
                PAYMENT_COLLECTION_BOTH if has_price else PAYMENT_COLLECTION_NONE
            ),
            card_display=CARD_DISPLAY_PRICE if has_price else CARD_DISPLAY_FREE,
            reason=(
                "Online-style courses can be free or paid; paid courses can use "
                "checkout and/or offline payment."
            ),
        )

    return policy(
        payment_collection=(
            PAYMENT_COLLECTION_BOTH
            if has_price and online_supported
            else PAYMENT_COLLECTION_OFFLINE
            if has_price
            else PAYMENT_COLLECTION_NONE
        ),
        card_display=CARD_DISPLAY_PRICE if has_price else CARD_DISPLAY_FREE,
        reason="Custom deployments start simple and can be overridden per course.",
    )


def normalize_custom_pricing(
    pricing_data: dict | None,
    *,
    deployment_mode: str = "custom",
    exam_body: str | None = None,
    qualification_family: str | None = None,
    platform_features: dict | None = None,
    currency_code: str = "KES",
    course_delivery_mode: str | None = None,
    now: datetime | None = None,
) -> dict:
    """Normalize custom_pricing while preserving unknown metadata keys."""

    source = pricing_data if isinstance(pricing_data, dict) else {}
    normalized = {**source}

    price = _to_non_negative_number(normalized.get("price"), default=0) or 0
    original_price = _to_non_negative_number(
        normalized.get("original_price"),
        allow_none=True,
    )
    legacy_sale_price = _to_non_negative_number(
        normalized.get("sale_price"),
        allow_none=True,
    )

    if original_price is None and legacy_sale_price is not None:
        if price and legacy_sale_price < price:
            original_price = price
            price = legacy_sale_price
        else:
            original_price = legacy_sale_price

    sale_starts_raw = normalized.get("sale_starts_at")
    sale_ends_raw = normalized.get("sale_ends_at")
    schedule_requested = bool(sale_starts_raw or sale_ends_raw)
    sale_starts_at = _parse_sale_datetime(sale_starts_raw)
    sale_ends_at = _parse_sale_datetime(sale_ends_raw)
    complete_schedule = bool(sale_starts_at and sale_ends_at)
    valid_schedule = bool(complete_schedule and sale_starts_at < sale_ends_at)

    configured_chargeable_price = max(price, original_price or 0)
    recommendation = resolve_pricing_recommendation(
        deployment_mode=deployment_mode,
        exam_body=exam_body,
        qualification_family=qualification_family,
        platform_features=platform_features,
        price=configured_chargeable_price,
    )

    payment_collection = str(
        normalized.get("payment_collection")
        or recommendation["payment_collection"]
    ).strip().lower()
    if payment_collection not in VALID_PAYMENT_COLLECTIONS:
        payment_collection = recommendation["payment_collection"]

    if not online_payment_selectable(
        deployment_mode=deployment_mode,
        exam_body=exam_body,
        qualification_family=qualification_family,
        platform_features=platform_features,
    ) and payment_collection in {
        PAYMENT_COLLECTION_ONLINE,
        PAYMENT_COLLECTION_BOTH,
    }:
        payment_collection = (
            PAYMENT_COLLECTION_OFFLINE
            if configured_chargeable_price > 0
            else PAYMENT_COLLECTION_NONE
        )

    if configured_chargeable_price <= 0:
        payment_collection = PAYMENT_COLLECTION_NONE

    card_display = str(
        normalized.get("card_display") or recommendation["card_display"]
    ).strip().lower()
    if card_display not in VALID_CARD_DISPLAYS:
        card_display = recommendation["card_display"]

    if configured_chargeable_price > 0 and card_display == CARD_DISPLAY_FREE:
        card_display = CARD_DISPLAY_PRICE
    if configured_chargeable_price <= 0 and card_display == CARD_DISPLAY_PRICE:
        card_display = CARD_DISPLAY_FREE

    normalized["price"] = price
    normalized["currency"] = str(
        normalized.get("currency") or currency_code or "KES"
    ).upper()
    normalized["payment_collection"] = payment_collection
    normalized["card_display"] = card_display
    normalized.pop("sale_price", None)

    if original_price is None or original_price <= 0:
        normalized.pop("original_price", None)
    else:
        normalized["original_price"] = original_price

    if complete_schedule:
        normalized["sale_starts_at"] = _serialize_sale_datetime(sale_starts_at)
        normalized["sale_ends_at"] = _serialize_sale_datetime(sale_ends_at)
    else:
        normalized.pop("sale_starts_at", None)
        normalized.pop("sale_ends_at", None)

    price_info = str(normalized.get("price_info") or "").strip()
    if price_info:
        normalized["price_info"] = price_info
    else:
        normalized.pop("price_info", None)

    has_discount = bool(original_price is not None and original_price > price)
    schedule_eligible = bool(
        valid_schedule
        and course_delivery_mode in ONLINE_COURSE_DELIVERY_MODES
        and payment_collection
        in {PAYMENT_COLLECTION_ONLINE, PAYMENT_COLLECTION_BOTH}
    )
    current_time = now or timezone.now()
    if timezone.is_naive(current_time):
        current_time = timezone.make_aware(
            current_time, timezone.get_default_timezone()
        )
    sale_active = bool(
        has_discount
        and (
            not schedule_requested
            or (
                schedule_eligible
                and sale_starts_at <= current_time.astimezone(UTC) < sale_ends_at
            )
        )
    )
    effective_price = price
    if has_discount and schedule_requested and not sale_active:
        effective_price = original_price
    normalized["effective_price"] = effective_price
    normalized["regular_price"] = original_price if has_discount else price
    normalized["sale_active"] = sale_active

    return normalized


def get_program_pricing(
    program,
    *,
    deployment_mode: str = "custom",
    platform_features: dict | None = None,
    currency_code: str = "KES",
    now: datetime | None = None,
) -> dict:
    from apps.learning_operations.services import get_course_delivery_profile

    course_delivery_mode = get_course_delivery_profile(program).delivery_mode
    return normalize_custom_pricing(
        program.custom_pricing or {},
        deployment_mode=deployment_mode,
        exam_body=getattr(program, "exam_body", None),
        qualification_family=getattr(program, "qualification_family", None),
        platform_features=platform_features,
        currency_code=currency_code,
        course_delivery_mode=course_delivery_mode,
        now=now,
    )


def serialize_price_display(pricing: dict) -> dict:
    price = _to_non_negative_number(
        pricing.get("effective_price", pricing.get("price")), default=0
    ) or 0
    card_display = pricing.get("card_display") or (
        CARD_DISPLAY_PRICE if price > 0 else CARD_DISPLAY_FREE
    )
    if card_display == CARD_DISPLAY_PRICE and price <= 0:
        card_display = CARD_DISPLAY_FREE
    elif card_display == CARD_DISPLAY_FREE and price > 0:
        card_display = CARD_DISPLAY_PRICE
    payment_collection = pricing.get("payment_collection") or PAYMENT_COLLECTION_NONE

    show_price = card_display == CARD_DISPLAY_PRICE and price > 0
    show_free = card_display == CARD_DISPLAY_FREE

    return {
        "cardDisplay": card_display,
        "paymentCollection": payment_collection,
        "price": price,
        "originalPrice": pricing.get("original_price"),
        "effectivePrice": price,
        "regularPrice": pricing.get("regular_price", pricing.get("original_price")),
        "saleActive": bool(pricing.get("sale_active")),
        "saleStartsAt": pricing.get("sale_starts_at"),
        "saleEndsAt": pricing.get("sale_ends_at"),
        "priceInfo": pricing.get("price_info", ""),
        "currency": pricing.get("currency") or "KES",
        "showFree": show_free,
        "showPrice": show_price,
        "isHidden": card_display == CARD_DISPLAY_HIDDEN,
        "isPaid": price > 0,
        "allowsOnlineCheckout": payment_collection
        in {PAYMENT_COLLECTION_ONLINE, PAYMENT_COLLECTION_BOTH}
        and price > 0,
        "allowsOfflinePayment": payment_collection
        in {PAYMENT_COLLECTION_OFFLINE, PAYMENT_COLLECTION_BOTH}
        and price > 0,
    }


def serialize_program_price_display(
    program,
    *,
    deployment_mode: str = "custom",
    platform_features: dict | None = None,
    currency_code: str = "KES",
) -> dict:
    return serialize_price_display(
        get_program_pricing(
            program,
            deployment_mode=deployment_mode,
            platform_features=platform_features,
            currency_code=currency_code,
        )
    )


def get_available_payment_methods(pricing: dict) -> list[str]:
    price = _to_non_negative_number(
        pricing.get("effective_price", pricing.get("price")), default=0
    ) or 0
    if price <= 0:
        return []

    payment_collection = pricing.get("payment_collection") or PAYMENT_COLLECTION_NONE
    methods = []
    if payment_collection in {PAYMENT_COLLECTION_ONLINE, PAYMENT_COLLECTION_BOTH}:
        methods.append(PAYSTACK_PAYMENT_METHOD)
    if payment_collection in {PAYMENT_COLLECTION_OFFLINE, PAYMENT_COLLECTION_BOTH}:
        methods.append(OFFLINE_PAYMENT_METHOD)
    return methods


def payment_method_allowed(pricing: dict, payment_method: str) -> bool:
    return payment_method in get_available_payment_methods(pricing)
