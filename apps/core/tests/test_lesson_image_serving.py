import importlib

import pytest
from django.test import override_settings
from django.urls import clear_url_caches
from PIL import Image


@pytest.fixture
def production_media(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    with override_settings(DEBUG=False, SECURE_SSL_REDIRECT=False):
        import config.urls
        importlib.reload(config.urls)
        clear_url_caches()
        yield tmp_path
    importlib.reload(config.urls)
    clear_url_caches()


@pytest.mark.parametrize('extension,content_type', [('png', 'image/png'), ('jpg', 'image/jpeg'), ('gif', 'image/gif'), ('webp', 'image/webp')])
def test_stored_lesson_image_loads_in_production(client, production_media, extension, content_type):
    image = production_media / 'lesson_images' / '1' / '2' / f'image.{extension}'
    image.parent.mkdir(parents=True)
    Image.new('RGB', (2, 2), color='blue').save(image)
    response = client.get(f'/media/lesson_images/1/2/image.{extension}')
    assert response.status_code == 200
    assert response['Content-Type'] == content_type
    assert b''.join(response.streaming_content) == image.read_bytes()


def test_lesson_image_route_cannot_serve_other_media(client, production_media):
    private = production_media / 'private.txt'
    private.write_bytes(b'private')
    response = client.get('/media/lesson_images/../private.txt')
    assert response.status_code == 400


def test_missing_lesson_image_returns_404(client, production_media):
    assert client.get('/media/lesson_images/1/2/missing.png').status_code == 404
