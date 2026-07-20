from datetime import datetime, timedelta, timezone as datetime_timezone
import re
from urllib.parse import urlparse
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db import migrations


def _duration_minutes(value):
    source = str(value or "").lower()
    hours = re.search(r"(\d+(?:\.\d+)?)\s*(?:h|hr|hour)", source)
    minutes = re.search(r"(\d+(?:\.\d+)?)\s*(?:m|min|minute)", source)
    total = float(hours.group(1)) * 60 if hours else 0
    total += float(minutes.group(1)) if minutes else 0
    return int(total)


def _provider_and_kind(url):
    hostname = (urlparse(url).hostname or "").lower()
    if hostname in {"youtube.com", "www.youtube.com", "youtu.be"}:
        return "youtube", "live_stream"
    if hostname in {"vimeo.com", "www.vimeo.com", "player.vimeo.com"}:
        return "vimeo", "live_stream"
    if hostname == "meet.google.com":
        return "google_meet", "live_meeting"
    if hostname == "zoom.us" or hostname.endswith(".zoom.us"):
        return "zoom", "live_meeting"
    if hostname == "teams.microsoft.com" or hostname.endswith(".teams.microsoft.com"):
        return "teams", "live_meeting"
    return "custom", "live_meeting"


def backfill_legacy_live_classes(apps, schema_editor):
    CurriculumNode = apps.get_model("curriculum", "CurriculumNode")
    Session = apps.get_model("live_sessions", "ScheduledLearningSession")
    from apps.live_sessions.crypto import encrypt_session_secret

    for node in CurriculumNode.objects.filter(properties__lesson_type="live_class").iterator():
        properties = dict(node.properties or {})
        timezone_name = {"PST": "America/Los_Angeles", "EST": "America/New_York"}.get(
            str(properties.get("timezone") or ""),
            str(properties.get("timezone") or "UTC"),
        )
        try:
            zone = ZoneInfo(timezone_name)
            starts_at = datetime.fromisoformat(
                f"{properties.get('start_date')}T{properties.get('start_time')}"
            ).replace(tzinfo=zone)
        except (TypeError, ValueError, ZoneInfoNotFoundError):
            continue
        try:
            ends_at = datetime.fromisoformat(
                f"{properties.get('end_date')}T{properties.get('end_time')}"
            ).replace(tzinfo=zone)
        except (TypeError, ValueError):
            duration = _duration_minutes(properties.get("duration"))
            if not duration:
                continue
            ends_at = starts_at + timedelta(minutes=duration)
        if ends_at <= starts_at:
            continue

        join_url = str(properties.get("video_url") or "").strip()
        if not join_url.startswith("https://"):
            continue
        provider, kind = _provider_and_kind(join_url)
        passcode = str(properties.get("meeting_password") or "")
        session = Session.objects.create(
            node=node,
            kind=kind,
            provider=provider,
            title=node.title,
            summary=node.description or "",
            starts_at=starts_at.astimezone(datetime_timezone.utc),
            ends_at=ends_at.astimezone(datetime_timezone.utc),
            source_timezone=timezone_name,
            join_url=join_url,
            passcode_ciphertext=encrypt_session_secret(passcode) if passcode else "",
        )
        properties.pop("meeting_password", None)
        properties["scheduled_session_id"] = session.id
        properties["session_kind"] = kind
        properties["provider"] = provider
        properties["timezone"] = timezone_name
        node.properties = properties
        node.save(update_fields=["properties"])


class Migration(migrations.Migration):
    dependencies = [("live_sessions", "0001_initial")]
    operations = [
        migrations.RunPython(backfill_legacy_live_classes, migrations.RunPython.noop)
    ]
