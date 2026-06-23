import re
from html import escape

from django.utils.html import strip_tags


BLOCK_BREAK_PATTERN = re.compile(
    r"</(li|p|div|h[1-6]|tr|td|th|blockquote)>|<br\s*/?>",
    flags=re.IGNORECASE,
)


def extract_learning_outcome_items_from_html(raw_html: str) -> list[str]:
    """Derive plain-text items from rich-text learning outcomes HTML."""
    html = str(raw_html or "").strip()
    if not html:
        return []

    text_content = strip_tags(BLOCK_BREAK_PATTERN.sub("\n", html))
    return [line.strip() for line in text_content.splitlines() if line.strip()]


def resolve_learning_outcomes_html(raw_html: str, items=None) -> str:
    """Return canonical HTML, falling back to escaped legacy outcome items."""
    html = str(raw_html or "").strip()
    if html:
        return html

    clean_items = [str(item).strip() for item in (items or []) if str(item).strip()]
    if not clean_items:
        return ""

    list_items = "".join(f"<li>{escape(item)}</li>" for item in clean_items)
    return f"<ul>{list_items}</ul>"
