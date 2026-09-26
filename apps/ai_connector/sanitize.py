"""Server-side cleaning for AI-written rich text before it is stored."""

import html

import nh3
from django.utils.html import strip_tags

from apps.assessments.text_normalization import normalize_assessment_text

# Matches the formatting the course builder's rich-text editor produces.
ALLOWED_TAGS = {
    "p", "br", "hr", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "sub", "sup", "span",
    "ul", "ol", "li", "blockquote", "pre", "code",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
}
ALLOWED_ATTRIBUTES = {
    "*": {"style"},
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "width", "height"},
    "th": {"colspan", "rowspan"},
    "td": {"colspan", "rowspan"},
}
ALLOWED_STYLE_PROPERTIES = {"text-align", "color"}
URL_SCHEMES = {"http", "https", "mailto"}


def clean_html(value) -> str:
    """Return safe HTML: scripts, event handlers and unsafe URLs are removed."""
    return nh3.clean(
        str(value or ""),
        tags=ALLOWED_TAGS,
        clean_content_tags={"script", "style"},
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=URL_SCHEMES,
        filter_style_properties=ALLOWED_STYLE_PROPERTIES,
        link_rel="noopener noreferrer",
    ).strip()


def plain_text(value) -> str:
    """Collapse markup and whitespace to a single line of text."""
    return normalize_assessment_text(value)


def html_to_text(value) -> str:
    return " ".join(html.unescape(strip_tags(str(value or ""))).split())
