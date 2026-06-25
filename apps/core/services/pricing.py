"""Course pricing policy helpers.

The public price label, checkout availability, and per-course defaults are
deployment-aware but remain stored in Program.custom_pricing for v1.
"""

from __future__ import annotations

from typing import Any


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
    return max(0.0, numeric)


def _normalise_code(value: Any) -> str:
    return str(value or "").strip().lower()


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

    recommendation = resolve_pricing_recommendation(
        deployment_mode=deployment_mode,
        exam_body=exam_body,
        qualification_family=qualification_family,
        platform_features=platform_features,
        price=price,
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
            PAYMENT_COLLECTION_OFFLINE if price > 0 else PAYMENT_COLLECTION_NONE
        )

    if price <= 0:
        payment_collection = PAYMENT_COLLECTION_NONE

    card_display = str(
        normalized.get("card_display") or recommendation["card_display"]
    ).strip().lower()
    if card_display not in VALID_CARD_DISPLAYS:
        card_display = recommendation["card_display"]

    if price > 0 and card_display == CARD_DISPLAY_FREE:
        card_display = CARD_DISPLAY_PRICE
    if price <= 0 and card_display == CARD_DISPLAY_PRICE:
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

    return normalized


def get_program_pricing(
    program,
    *,
    deployment_mode: str = "custom",
    platform_features: dict | None = None,
    currency_code: str = "KES",
) -> dict:
    return normalize_custom_pricing(
        program.custom_pricing or {},
        deployment_mode=deployment_mode,
        exam_body=getattr(program, "exam_body", None),
        qualification_family=getattr(program, "qualification_family", None),
        platform_features=platform_features,
        currency_code=currency_code,
    )


def serialize_price_display(pricing: dict) -> dict:
    price = _to_non_negative_number(pricing.get("price"), default=0) or 0
    card_display = pricing.get("card_display") or (
        CARD_DISPLAY_PRICE if price > 0 else CARD_DISPLAY_FREE
    )
    payment_collection = pricing.get("payment_collection") or PAYMENT_COLLECTION_NONE

    show_price = card_display == CARD_DISPLAY_PRICE and price > 0
    show_free = card_display == CARD_DISPLAY_FREE

    return {
        "cardDisplay": card_display,
        "paymentCollection": payment_collection,
        "price": price,
        "originalPrice": pricing.get("original_price"),
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
    price = _to_non_negative_number(pricing.get("price"), default=0) or 0
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
