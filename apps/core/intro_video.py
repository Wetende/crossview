"""Validation for the course intro video shown on the public course page.

Only links the course page player can actually play are accepted: a YouTube
or Vimeo video, or a direct HTTPS .mp4/.webm file. The builder mirrors these
rules in ``frontend/src/utils/introVideoUrl.js``; both are checked against
``apps/core/tests/fixtures/intro_video_urls.json``.
"""

import re
from urllib.parse import parse_qs, urlsplit

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator

INTRO_VIDEO_URL_MAX_LENGTH = 500
INVALID_INTRO_VIDEO_URL_MESSAGE = (
    "Use a YouTube or Vimeo video link, or a direct HTTPS .mp4 or .webm file."
)

_SCHEME_RE = re.compile(r"^https?://", re.IGNORECASE)
_DOMAIN_RE = re.compile(
    r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9]{1,59})$"
)
_IPV4_RE = re.compile(
    r"^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$"
)
_YOUTUBE_ID = r"[A-Za-z0-9_-]{11}"
_YOUTUBE_ID_RE = re.compile(rf"^{_YOUTUBE_ID}$")
_YOUTUBE_PATH_RE = re.compile(rf"^/(?:shorts|embed)/{_YOUTUBE_ID}/?$")
_YOUTU_BE_PATH_RE = re.compile(rf"^/{_YOUTUBE_ID}/?$")
_VIMEO_PATH_RE = re.compile(r"^/(?:video/)?\d+(?:/[A-Za-z0-9_-]+)?/?$")
_DIRECT_FILE_RE = re.compile(r"\.(?:mp4|webm)$", re.IGNORECASE)
_url_validator = URLValidator(schemes=["http", "https"])


def _host_matches(hostname: str, domain: str) -> bool:
    return hostname == domain or hostname.endswith(f".{domain}")


def _is_valid_hostname(hostname: str) -> bool:
    return (
        hostname == "localhost"
        or bool(_IPV4_RE.match(hostname))
        or bool(_DOMAIN_RE.match(hostname))
    )


def _is_playable(url: str) -> bool:
    if (
        len(url) > INTRO_VIDEO_URL_MAX_LENGTH
        or re.search(r"[\s\\]", url)
        or not _SCHEME_RE.match(url)
    ):
        return False
    try:
        _url_validator(url)
        parts = urlsplit(url)
        parts.port  # Raises ValueError for an out-of-range port.
    except (ValidationError, ValueError):
        return False

    hostname = parts.hostname or ""
    if parts.username is not None or parts.password is not None:
        return False
    if not _is_valid_hostname(hostname):
        return False

    if _host_matches(hostname, "youtube.com") or _host_matches(
        hostname, "youtube-nocookie.com"
    ):
        if parts.path == "/watch":
            video_id = parse_qs(parts.query).get("v", [""])[0]
            return bool(_YOUTUBE_ID_RE.match(video_id))
        return bool(_YOUTUBE_PATH_RE.match(parts.path))
    if hostname == "youtu.be":
        return bool(_YOUTU_BE_PATH_RE.match(parts.path))
    if _host_matches(hostname, "vimeo.com"):
        return bool(_VIMEO_PATH_RE.match(parts.path))

    return (
        parts.scheme == "https"
        and "#" not in url
        and bool(_DIRECT_FILE_RE.search(parts.path))
    )


def validate_intro_video_url(value) -> str:
    """Return the trimmed URL, or raise ValidationError when it cannot play.

    Blank values are allowed and clear the intro video.
    """
    url = str(value or "").strip()
    if not url:
        return ""
    if not _is_playable(url):
        raise ValidationError(INVALID_INTRO_VIDEO_URL_MESSAGE)
    return url
