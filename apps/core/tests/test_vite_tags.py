from django.test import override_settings

from apps.core.templatetags import vite_tags


@override_settings(DEBUG=True)
def test_vite_detection_checks_loopback_hosts(monkeypatch):
    attempts = []

    class FakeSocket:
        def settimeout(self, _timeout):
            return None

        def connect_ex(self, address):
            attempts.append(address)
            return 0 if address == ("localhost", 5173) else 1

        def close(self):
            return None

    monkeypatch.setattr("socket.socket", lambda *_args: FakeSocket())

    assert vite_tags.is_vite_dev_running() == ("localhost", 5173)
    assert attempts == [
        ("127.0.0.1", 5173),
        ("127.0.0.1", 5174),
        ("localhost", 5173),
    ]


def test_vite_dev_server_uses_detected_host(monkeypatch):
    monkeypatch.setattr(
        vite_tags,
        "is_vite_dev_running",
        lambda: ("127.0.0.1", 5174),
    )

    assert vite_tags.get_vite_dev_server() == "http://127.0.0.1:5174"
