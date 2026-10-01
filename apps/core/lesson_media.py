"""Serve inline lesson images when the host has no media alias."""

from pathlib import Path

from django.conf import settings
from django.views.static import serve


def serve_lesson_image(request, path):
    # Keep this fallback confined to lesson images, never the full media tree.
    return serve(request, path, document_root=Path(settings.MEDIA_ROOT) / 'lesson_images')
