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
VITE_DEV_PORTS = [5173, 5174]  # Check multiple ports


def get_manifest():
    """Load the Vite manifest - always reload in DEBUG mode."""
    if settings.DEBUG:
        # Always reload in debug mode
        if MANIFEST_PATH.exists():
            with open(MANIFEST_PATH) as f:
                return json.load(f)
        return {}
    
    # Production: cache the manifest
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

    for port in VITE_DEV_PORTS:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            result = sock.connect_ex(("localhost", port))
            sock.close()
            if result == 0:
                return port  # Return the port that's running
        except:
            pass
    return False


def get_vite_dev_server():
    """Get the Vite dev server URL."""
    port = is_vite_dev_running()
    if port:
        return f"http://localhost:{port}"
    return None


@register.simple_tag
def vite_assets(entry: str):
    """
    Load Vite assets - automatically detects dev vs production.

    Usage: {% vite_assets 'src/main.jsx' %}
    """
    # Check if Vite dev server is running (development mode)
    dev_server = get_vite_dev_server()
    if dev_server:
        return mark_safe(
            f"""
    <script type="module">
        import RefreshRuntime from '{dev_server}/@react-refresh'
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {{}}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <script type="module" src="{dev_server}/@vite/client"></script>
    <script type="module" src="{dev_server}/{entry}"></script>
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
