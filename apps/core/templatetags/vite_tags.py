"""
Vite template tags for loading assets - handles both dev and production.
"""

import json
from pathlib import Path

from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()

MANIFEST_PATH = Path(settings.BASE_DIR) / "static" / "dist" / ".vite" / "manifest.json"
VITE_DEV_SERVER = "http://localhost:5173"


def get_manifest():
    """Load and cache the Vite manifest."""
    if not hasattr(get_manifest, "_cache"):
        get_manifest._cache = None

    if get_manifest._cache is None and MANIFEST_PATH.exists():
        with open(MANIFEST_PATH) as f:
            get_manifest._cache = json.load(f)

    return get_manifest._cache or {}


def is_vite_dev_running():
    """Check if Vite dev server is running (only in DEBUG mode)."""
    if not settings.DEBUG:
        return False

    import socket

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex(("localhost", 5173))
        sock.close()
        return result == 0
    except:
        return False


@register.simple_tag
def vite_assets(entry: str):
    """
    Load Vite assets - automatically detects dev vs production.

    Usage: {% vite_assets 'src/main.jsx' %}
    """
    # Check if Vite dev server is running (development mode)
    if is_vite_dev_running():
        return mark_safe(
            f"""
    <script type="module">
        import RefreshRuntime from '{VITE_DEV_SERVER}/@react-refresh'
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {{}}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <script type="module" src="{VITE_DEV_SERVER}/@vite/client"></script>
    <script type="module" src="{VITE_DEV_SERVER}/{entry}"></script>
"""
        )

    # Production mode - load from manifest
    manifest = get_manifest()

    if not manifest:
        return mark_safe("<!-- Vite manifest not found. Run 'npm run build' -->")

    entry_data = manifest.get(entry, {})
    if not entry_data:
        return mark_safe(f"<!-- Entry '{entry}' not found in manifest -->")

    tags = []

    # Add CSS files
    for css_file in entry_data.get("css", []):
        tags.append(f'<link rel="stylesheet" href="/static/dist/{css_file}">')

    # Add the JS file
    js_file = entry_data.get("file")
    if js_file:
        tags.append(f'<script type="module" src="/static/dist/{js_file}"></script>')

    return mark_safe("\n    ".join(tags))


# Keep the old tag for backwards compatibility
@register.simple_tag
def vite_asset(entry: str):
    """Alias for vite_assets."""
    return vite_assets(entry)
