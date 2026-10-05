from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal

from django.utils import timezone


class ReportFilterError(ValueError):
    """Raised when a report URL contains an invalid filter value."""


CSV_FORMULA_PREFIXES = ("=", "+", "-", "@")
CSV_FORMULA_WHITESPACE = " \t\r\n"


def parse_selected_ids(raw_value: str | None) -> list[str]:
    if not raw_value:
        return []
    selected_ids: list[str] = []
    for token in str(raw_value).split(","):
        token = token.strip()
        if token:
            selected_ids.append(token)
    return selected_ids


def selected_numeric_ids(selected_ids: list[str]) -> list[int]:
    numeric_ids = []
    for value in selected_ids:
        token = str(value).strip()
        if token.isdigit():
            numeric_ids.append(int(token))
    return numeric_ids


def parse_positive_int_filter(value, label: str) -> int | None:
    if value in ("", None):
        return None
    token = str(value).strip()
    if not token.isdigit():
        raise ReportFilterError(f"Invalid {label} filter.")
    parsed = int(token)
    if parsed < 1:
        raise ReportFilterError(f"Invalid {label} filter.")
    return parsed


def clean_filters(raw_filters: dict) -> dict:
    ignored = {"format", "ids", "_", "page"}
    return {
        key: value
        for key, value in raw_filters.items()
        if key not in ignored and value not in ("", None)
    }


def date_range_filter(queryset, field_name: str, filters: dict):
    date_from = filters.get("date_from") or filters.get("from")
    date_to = filters.get("date_to") or filters.get("to")
    if date_from:
        queryset = queryset.filter(**{f"{field_name}__gte": date_from})
    if date_to:
        queryset = queryset.filter(**{f"{field_name}__lte": date_to})
    return queryset


def display_datetime(value) -> str:
    if not value:
        return "-"
    if isinstance(value, datetime):
        value = timezone.localtime(value) if timezone.is_aware(value) else value
        return value.strftime("%Y-%m-%d %H:%M")
    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")
    return str(value)


def parse_date_boundary(value: str | None, *, end_of_day: bool = False):
    if not value:
        return None
    try:
        parsed = date.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None
    boundary_time = time.max if end_of_day else time.min
    return timezone.make_aware(datetime.combine(parsed, boundary_time))


def display_money(amount_minor: int | None, currency: str | None = "") -> str:
    amount = Decimal(amount_minor or 0) / Decimal("100")
    code = str(currency or "").upper()
    return f"{code} {amount:,.2f}".strip()


def escape_csv_cell(value) -> str:
    if value is None:
        return ""
    text = str(value)
    stripped = text.lstrip(CSV_FORMULA_WHITESPACE)
    if stripped.startswith(CSV_FORMULA_PREFIXES):
        return f"'{text}"
    return text


def request_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
