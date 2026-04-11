import pytest
from django.core.cache import cache

from apps.platform.models import (
    PLATFORM_COURSE_LEVELS_CACHE_KEY,
    PLATFORM_PAYLOAD_CACHE_KEY,
    PlatformSettings,
)


@pytest.mark.django_db
def test_platform_cache_keys_are_invalidated_on_save():
    cache.clear()

    settings = PlatformSettings.get_settings()
    settings.institution_name = "First Academy"
    settings.course_levels = [{"value": "beginner", "label": "Beginner"}]
    settings.public_content = {
        "heroHeadline": "Build your future with confidence",
        "footerDescription": "Flexible programs for modern learners.",
    }
    settings.social_links = {"linkedin": "https://linkedin.com/company/crossview"}
    settings.save()

    initial_payload = PlatformSettings.get_cached_platform_payload()
    initial_levels = PlatformSettings.get_cached_course_levels()

    assert initial_payload["institutionName"] == "First Academy"
    assert initial_payload["publicContent"]["heroHeadline"] == (
        "Build your future with confidence"
    )
    assert initial_payload["socialLinks"]["linkedin"] == (
        "https://linkedin.com/company/crossview"
    )
    assert initial_levels == [{"value": "beginner", "label": "Beginner"}]
    assert cache.get(PLATFORM_PAYLOAD_CACHE_KEY) is not None
    assert cache.get(PLATFORM_COURSE_LEVELS_CACHE_KEY) is not None

    settings.institution_name = "Updated Academy"
    settings.course_levels = [{"value": "advanced", "label": "Advanced"}]
    settings.public_content = {
        "heroHeadline": "Grow with practical learning",
        "mission": "Support learners with flexible, practical education.",
    }
    settings.social_links = {"youtube": "https://youtube.com/@crossview"}
    settings.save()

    assert cache.get(PLATFORM_PAYLOAD_CACHE_KEY) is None
    assert cache.get(PLATFORM_COURSE_LEVELS_CACHE_KEY) is None

    refreshed_payload = PlatformSettings.get_cached_platform_payload()
    refreshed_levels = PlatformSettings.get_cached_course_levels()

    assert refreshed_payload["institutionName"] == "Updated Academy"
    assert refreshed_payload["publicContent"]["mission"] == (
        "Support learners with flexible, practical education."
    )
    assert refreshed_payload["socialLinks"]["youtube"] == (
        "https://youtube.com/@crossview"
    )
    assert refreshed_levels == [{"value": "advanced", "label": "Advanced"}]
