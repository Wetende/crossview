import pytest
from django.shortcuts import redirect
from django.urls import path
from inertia import render

from apps.core.inertia_errors import flash_inertia_errors


def _reject_view(request):
    flash_inertia_errors(request, {"title": "Title is required."})
    return redirect("/_inertia-errors/page/")


def _page_view(request):
    return render(request, "Test/Page", {})


urlpatterns = [
    path("_inertia-errors/reject/", _reject_view),
    path("_inertia-errors/page/", _page_view),
]

pytestmark = [pytest.mark.django_db, pytest.mark.urls(__name__)]


def test_flashed_errors_reach_the_next_inertia_page_once(client):
    response = client.post("/_inertia-errors/reject/")

    assert response.status_code == 302
    assert response["Location"] == "/_inertia-errors/page/"

    first_page = client.get(response["Location"], HTTP_X_INERTIA="true").json()
    assert first_page["component"] == "Test/Page"
    assert first_page["props"]["errors"] == {"title": "Title is required."}

    second_page = client.get(response["Location"], HTTP_X_INERTIA="true").json()
    assert second_page["props"]["errors"] == {}


def test_pages_share_empty_errors_by_default(client):
    page = client.get("/_inertia-errors/page/", HTTP_X_INERTIA="true").json()

    assert page["props"]["errors"] == {}
