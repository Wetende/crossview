from unittest.mock import patch

from django.test import override_settings

from apps.core.templatetags import vite_tags


MANIFEST = {
    "src/main.jsx": {"file": "main-built.js", "css": ["main-built.css"]},
}


@override_settings(DEBUG=True, VITE_DEV_SERVER_URL="")
@patch.object(vite_tags, "get_manifest", return_value=MANIFEST)
def test_built_assets_are_default_even_when_another_server_uses_vite_port(get_manifest):
    with patch("socket.socket") as socket:
        socket.return_value.connect_ex.return_value = 0
        output = vite_tags.vite_assets("src/main.jsx")

    assert 'href="/static/dist/main-built.css"' in output
    assert 'src="/static/dist/main-built.js"' in output
    assert "@vite/client" not in output
    get_manifest.assert_called_once_with()


@override_settings(DEBUG=True, VITE_DEV_SERVER_URL="http://127.0.0.1:5174/")
def test_explicit_dev_server_enables_hot_reload():
    output = vite_tags.vite_assets("src/main.jsx")

    assert "http://127.0.0.1:5174/@react-refresh" in output
    assert 'src="http://127.0.0.1:5174/@vite/client"' in output
    assert 'src="http://127.0.0.1:5174/src/main.jsx"' in output


@override_settings(DEBUG=False, VITE_DEV_SERVER_URL="http://127.0.0.1:5174")
@patch.object(vite_tags, "get_manifest", return_value=MANIFEST)
def test_production_ignores_dev_server_setting(get_manifest):
    output = vite_tags.vite_assets("src/main.jsx")

    assert 'src="/static/dist/main-built.js"' in output
    assert "@vite/client" not in output
    get_manifest.assert_called_once_with()
