from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from email.utils import formataddr, parseaddr
from urllib.parse import urljoin, urlsplit

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import EmailMultiAlternatives
from django.core.validators import validate_email
from django.template.loader import render_to_string


logger = logging.getLogger(__name__)
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


@dataclass(frozen=True)
class RenderedEmail:
    text: str
    html: str
    from_email: str
    reply_to: list[str]


def _absolute_url(value: str) -> str:
    candidate = str(value or "").strip()
    if not candidate:
        return ""
    parsed = urlsplit(candidate)
    if parsed.scheme:
        return candidate if parsed.scheme in {"http", "https"} else ""
    base_url = str(getattr(settings, "PLATFORM_PUBLIC_BASE_URL", "")).rstrip("/")
    if not base_url:
        return candidate
    return urljoin(f"{base_url}/", candidate.lstrip("/"))


def _color(value: str, fallback: str) -> str:
    candidate = str(value or "").strip()
    return candidate if HEX_COLOR.fullmatch(candidate) else fallback


def _contrast_color(background: str) -> str:
    red, green, blue = (
        int(background[index : index + 2], 16) for index in (1, 3, 5)
    )
    luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
    return "#111827" if luminance > 0.6 else "#FFFFFF"


def _email_address(value: str) -> str:
    _, address = parseaddr(str(value or "").strip())
    if not address:
        return ""
    try:
        validate_email(address)
    except ValidationError:
        return ""
    return address


def _platform_branding() -> dict:
    fallback = {
        "institution_name": "Learning Platform",
        "tagline": "",
        "contact_email": "",
        "logo_url": "",
        "primary_color": "#2563EB",
        "secondary_color": "#1D4ED8",
    }
    try:
        from apps.platform.models import PlatformSettings

        platform = PlatformSettings.get_settings()
    except Exception:
        logger.exception("Unable to load platform branding for transactional email.")
        return fallback
    return {
        "institution_name": platform.institution_name or fallback["institution_name"],
        "tagline": platform.tagline or "",
        "contact_email": _email_address(platform.contact_email),
        "logo_url": _absolute_url(
            getattr(settings, "EMAIL_LOGO_URL", "") or platform.get_logo_url()
        ),
        "primary_color": _color(platform.primary_color, fallback["primary_color"]),
        "secondary_color": _color(
            platform.secondary_color, fallback["secondary_color"]
        ),
    }


def _sender(branding: dict, override: str | None) -> str:
    configured = override or getattr(settings, "DEFAULT_FROM_EMAIL", "")
    configured_name, address = parseaddr(str(configured or "").strip())
    if not address:
        return str(configured or "")
    name = (
        str(getattr(settings, "EMAIL_FROM_NAME", "")).strip()
        or configured_name
        or branding["institution_name"]
    )
    return formataddr((name, address))


def _reply_to(branding: dict, values) -> list[str]:
    if values is None:
        values = [
            getattr(settings, "DEFAULT_REPLY_TO_EMAIL", "")
            or branding["contact_email"]
        ]
    elif isinstance(values, str):
        values = [values]
    return [address for value in values if (address := _email_address(value))]


def render_branded_email(
    *, subject: str, message: str, action_url: str = "", action_label: str = "",
    preheader: str = "", digest_items: list[dict] | None = None,
    from_email: str | None = None, reply_to=None,
) -> RenderedEmail:
    branding = _platform_branding()
    primary_color = branding["primary_color"]
    secondary_color = branding["secondary_color"]
    normalized_items = [
        {
            "subject": str(item.get("subject", "")),
            "message": str(item.get("message", "")),
            "action_url": _absolute_url(item.get("action_url", "")),
            "action_label": str(item.get("action_label", "View details")),
        }
        for item in (digest_items or [])
    ]
    context = {
        **branding,
        "subject": subject,
        "message": message,
        "preheader": preheader or message[:140],
        "action_url": _absolute_url(action_url),
        "action_label": action_label or "View details",
        "digest_items": normalized_items,
        "primary_text_color": _contrast_color(primary_color),
        "secondary_text_color": _contrast_color(secondary_color),
    }
    html = render_to_string(
        getattr(settings, "EMAIL_LAYOUT_TEMPLATE", "emails/platform_message.html"),
        context,
    )
    return RenderedEmail(
        text=message,
        html=html,
        from_email=_sender(branding, from_email),
        reply_to=_reply_to(branding, reply_to),
    )


def send_branded_email(
    *, subject: str, message: str, recipient_list: list[str],
    action_url: str = "", action_label: str = "", preheader: str = "",
    digest_items: list[dict] | None = None, html_message: str | None = None,
    from_email: str | None = None, reply_to=None, fail_silently: bool = False,
) -> int:
    rendered = render_branded_email(
        subject=subject,
        message=message,
        action_url=action_url,
        action_label=action_label,
        preheader=preheader,
        digest_items=digest_items,
        from_email=from_email,
        reply_to=reply_to,
    )
    email = EmailMultiAlternatives(
        subject=subject,
        body=rendered.text,
        from_email=rendered.from_email,
        to=recipient_list,
        reply_to=rendered.reply_to,
    )
    email.attach_alternative(html_message or rendered.html, "text/html")
    return email.send(fail_silently=fail_silently)
