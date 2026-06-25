import pytest

from apps.core.services.pricing import (
    normalize_custom_pricing,
    resolve_pricing_recommendation,
    serialize_price_display,
)


def test_legacy_paid_pricing_normalizes_to_price_display_and_checkout_defaults():
    pricing = normalize_custom_pricing(
        {"price": 100},
        deployment_mode="online",
        platform_features={"payments": True},
    )

    assert pricing["price"] == 100.0
    assert pricing["currency"] == "KES"
    assert pricing["payment_collection"] == "both"
    assert pricing["card_display"] == "price"
    assert serialize_price_display(pricing)["allowsOnlineCheckout"] is True


@pytest.mark.parametrize("exam_body", ["KASNEB", "CDACC", "KNEC", "NITA", "ICM"])
def test_regulated_tvet_bodies_default_to_hidden_no_lms_payment(exam_body):
    recommendation = resolve_pricing_recommendation(
        deployment_mode="tvet",
        exam_body=exam_body,
        qualification_family="Diploma",
        platform_features={"payments": True},
    )

    assert recommendation["payment_collection"] == "none"
    assert recommendation["card_display"] == "hidden"


@pytest.mark.parametrize("deployment_mode", ["online", "theology"])
def test_online_style_free_courses_default_to_free_card_display(deployment_mode):
    pricing = normalize_custom_pricing(
        {},
        deployment_mode=deployment_mode,
        platform_features={"payments": True},
    )

    assert pricing["price"] == 0
    assert pricing["payment_collection"] == "none"
    assert pricing["card_display"] == "free"


def test_internal_courses_default_to_free_card_display():
    pricing = normalize_custom_pricing(
        {},
        deployment_mode="tvet",
        exam_body="Internal",
        qualification_family="Short Course",
        platform_features={"payments": True},
    )

    assert pricing["payment_collection"] == "none"
    assert pricing["card_display"] == "free"
