from django.test import RequestFactory

from apps.core.utils import (
    get_post_data,
    get_requested_inertia_props,
    should_render_inertia_prop,
)


def test_get_requested_inertia_props_returns_none_without_header():
    request = RequestFactory().get("/programs/")

    assert get_requested_inertia_props(request) is None


def test_get_requested_inertia_props_parses_partial_header():
    request = RequestFactory().get(
        "/programs/",
        HTTP_X_INERTIA_PARTIAL_DATA="programs, groupedPrograms, filters",
    )

    assert get_requested_inertia_props(request) == {
        "programs",
        "groupedPrograms",
        "filters",
    }


def test_should_render_inertia_prop_respects_requested_props():
    request = RequestFactory().get(
        "/programs/",
        HTTP_X_INERTIA_PARTIAL_DATA="programs, filters",
    )

    assert should_render_inertia_prop(request, "programs") is True
    assert should_render_inertia_prop(request, "pagination", "filters") is True
    assert should_render_inertia_prop(request, "categories") is False


def test_get_post_data_handles_form_data_after_post_has_been_read():
    request = RequestFactory().post(
        "/instructor/programs/7/manage/settings/",
        data={
            "tab": "settings",
            "section": "main",
            "faq": '[{"question": "Q1", "answer": "A1"}]',
        },
    )

    assert request.POST["tab"] == "settings"

    assert get_post_data(request) == {
        "tab": "settings",
        "section": "main",
        "faq": [{"question": "Q1", "answer": "A1"}],
    }


def test_get_post_data_handles_json_request_body():
    request = RequestFactory().post(
        "/instructor/programs/7/manage/settings/",
        data='{"tab": "settings", "section": "main"}',
        content_type="application/json",
    )

    assert get_post_data(request) == {
        "tab": "settings",
        "section": "main",
    }
