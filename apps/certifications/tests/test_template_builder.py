import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from django.urls import reverse

from apps.certifications.models import (
    CertificateTemplate,
    CertificateTemplateVersion,
)
from apps.certifications.rendering import fit_text_font_size, layout_to_html
from apps.certifications.template_builder import (
    clone_template,
    create_blank_template,
    publish_template,
    save_template,
    validate_layout,
)
from apps.core.models import User


pytestmark = pytest.mark.django_db


@pytest.fixture
def staff_user():
    return User.objects.create_user(
        username="certificate-admin",
        email="certificate-admin@example.com",
        password="test-password",
        is_staff=True,
    )


@pytest.fixture
def other_staff():
    return User.objects.create_user(
        username="other-certificate-admin",
        email="other-certificate-admin@example.com",
        password="test-password",
        is_staff=True,
    )


def test_seeded_starters_are_protected_visual_templates():
    starters = CertificateTemplate.objects.filter(is_starter=True)

    assert starters.count() == 10
    assert set(starters.values_list("name", flat=True)) == {
        "Classic Formal",
        "Modern Blue",
        "Minimal Professional",
        "Academic Gold",
        "Participation",
        "Elegant Teal",
        "Geometric Navy",
        "Golden Horizon",
        "Creative Coral",
        "Emerald Grid",
    }
    assert all(starter.visibility == "system" for starter in starters)
    assert all(starter.owner_id is None for starter in starters)
    assert all(starter.current_version.is_published for starter in starters)


def test_cloning_starter_creates_independent_private_draft(staff_user):
    starter = CertificateTemplate.objects.get(name="Modern Blue", is_starter=True)

    copied = clone_template(
        source=starter,
        name="Sales Academy Certificate",
        user=staff_user,
    )

    assert copied.owner == staff_user
    assert copied.visibility == CertificateTemplate.Visibility.PRIVATE
    assert copied.status == CertificateTemplate.Status.DRAFT
    assert copied.source_template == starter
    assert copied.current_version.layout == starter.current_version.layout
    assert copied.current_version.pk != starter.current_version.pk

    copied_layout = copied.current_version.layout
    copied_layout["background"]["color"] = "#123456"
    copied.current_version.layout = copied_layout
    copied.current_version.save()
    starter.current_version.refresh_from_db()
    assert starter.current_version.layout["background"]["color"] != "#123456"


def test_staff_cannot_edit_another_staff_members_private_template(
    staff_user,
    other_staff,
):
    template = create_blank_template(
        name="Owned template",
        orientation="landscape",
        user=staff_user,
    )

    with pytest.raises(PermissionDenied):
        save_template(
            template=template,
            name=template.name,
            layout=template.current_version.layout,
            user=other_staff,
        )


def test_edit_after_publish_creates_new_draft_version(staff_user):
    template = create_blank_template(
        name="Versioned template",
        orientation="portrait",
        user=staff_user,
    )
    original_layout = template.current_version.layout
    publish_template(template=template, user=staff_user)

    changed_layout = {
        **original_layout,
        "background": {"color": "#f0f4ff", "image": None},
    }
    template, draft = save_template(
        template=template,
        name="Versioned template",
        layout=changed_layout,
        user=staff_user,
    )

    assert template.status == CertificateTemplate.Status.DRAFT
    assert template.current_version_number == 2
    assert draft.version_number == 2
    assert draft.is_published is False
    assert template.versions.get(version_number=1).is_published is True
    assert template.versions.get(version_number=1).layout == original_layout


def test_saving_unchanged_published_template_does_not_create_duplicate(staff_user):
    template = create_blank_template(
        name="Stable published template",
        orientation="landscape",
        user=staff_user,
    )
    publish_template(template=template, user=staff_user)

    template, version = save_template(
        template=template,
        name=template.name,
        layout=template.current_version.layout,
        user=staff_user,
    )

    assert version.version_number == 1
    assert version.is_published is True
    assert template.versions.count() == 1


def test_layout_validation_rejects_element_outside_printable_page():
    with pytest.raises(ValidationError):
        validate_layout(
            {
                "elements": [
                    {
                        "id": "outside",
                        "type": "text",
                        "x": 290,
                        "y": 10,
                        "width": 20,
                        "height": 10,
                        "content": "Outside",
                    }
                ]
            },
            width_mm=297,
            height_mm=210,
        )


def test_layout_validation_preserves_bounded_text_fitting_and_asset_styles():
    layout = validate_layout(
        {
            "elements": [
                {
                    "id": "long-student-name",
                    "name": "Learner name",
                    "type": "dynamic_text",
                    "x": 20,
                    "y": 40,
                    "width": 90,
                    "height": 18,
                    "content": "{{student_name}}",
                    "styles": {
                        "fontSize": 30,
                        "minFontSize": 11,
                        "maxFontSize": 34,
                        "autoShrink": True,
                        "singleLine": True,
                        "textOverflow": "ellipsis",
                        "fontStyle": "italic",
                        "textDecoration": "underline",
                        "textTransform": "uppercase",
                        "opacity": 0.8,
                    },
                },
                {
                    "id": "logo",
                    "name": "Institution logo",
                    "type": "image",
                    "x": 20,
                    "y": 70,
                    "width": 30,
                    "height": 20,
                    "content": "",
                    "styles": {
                        "objectFit": "cover",
                        "opacity": 0.75,
                        "borderWidth": 2,
                        "borderColor": "#123456",
                        "borderRadius": 8,
                    },
                },
            ]
        },
        width_mm=297,
        height_mm=210,
    )

    text = layout["elements"][0]
    assert text["name"] == "Learner name"
    assert text["styles"]["minFontSize"] == 11
    assert text["styles"]["maxFontSize"] == 34
    assert text["styles"]["autoShrink"] is True
    assert text["styles"]["singleLine"] is True
    assert text["styles"]["fontStyle"] == "italic"
    assert text["styles"]["textDecoration"] == "underline"
    assert text["styles"]["textTransform"] == "uppercase"

    image = layout["elements"][1]
    assert image["styles"] == {
        "objectFit": "cover",
        "opacity": 0.75,
        "borderColor": "#123456",
        "borderWidth": 2,
        "borderRadius": 8,
    }


def test_long_multilingual_text_shrinks_and_renders_with_matching_font_size():
    element = {
        "id": "student",
        "type": "dynamic_text",
        "x": 20,
        "y": 40,
        "width": 85,
        "height": 18,
        "content": "{{student_name}}",
        "styles": {
            "fontFamily": "Albert Sans",
            "fontSize": 30,
            "minFontSize": 10,
            "maxFontSize": 30,
            "autoShrink": True,
            "singleLine": True,
            "lineHeight": 1.2,
            "letterSpacing": 0,
        },
    }
    learner_name = "José-María 王小明 Abdulrahman Abdullahi-Wanyonyi"

    fit = fit_text_font_size(
        text=learner_name,
        element=element,
        page_width_mm=297,
        page_height_mm=210,
    )
    document = layout_to_html(
        layout={"elements": [element]},
        width_mm=297,
        height_mm=210,
        data={"student_name": learner_name},
    )

    assert 10 <= fit["font_size"] < 30
    assert learner_name in document
    assert f"font-size:{fit['font_size']}px" in document
    assert "white-space:nowrap" in document
    assert "text-overflow:ellipsis" in document
    assert (
        '<div style="width:100%;overflow:hidden;white-space:nowrap;'
        'text-overflow:ellipsis;">'
    ) in document


def test_non_staff_user_cannot_open_template_gallery(client):
    user = User.objects.create_user(
        username="learner",
        email="learner@example.com",
        password="test-password",
    )
    client.force_login(user)

    response = client.get(
        reverse("certifications:admin.certificate_templates"),
        secure=True,
    )

    assert response.status_code == 403


def test_clone_endpoint_never_changes_system_starter(client, staff_user):
    starter = CertificateTemplate.objects.get(name="Classic Formal", is_starter=True)
    original_layout = starter.current_version.layout
    client.force_login(staff_user)

    response = client.post(
        reverse(
            "certifications:admin.certificate_template.clone",
            kwargs={"template_id": starter.id},
        ),
        {"name": "My classic certificate"},
        secure=True,
    )

    assert response.status_code == 302
    clone = CertificateTemplate.objects.get(
        owner=staff_user,
        name="My classic certificate",
    )
    assert response.url == reverse(
        "certifications:admin.certificate_template.builder",
        kwargs={"template_id": clone.id},
    )
    starter.refresh_from_db()
    assert starter.current_version.layout == original_layout


def test_system_starter_cannot_be_opened_in_editor(client, staff_user):
    starter = CertificateTemplate.objects.get(name="Participation", is_starter=True)
    client.force_login(staff_user)

    response = client.get(
        reverse(
            "certifications:admin.certificate_template.builder",
            kwargs={"template_id": starter.id},
        ),
        secure=True,
    )

    assert response.status_code == 302
    assert response.url == reverse("certifications:admin.certificate_templates")


def test_portrait_blank_template_fits_page(staff_user):
    template = create_blank_template(
        name="Portrait",
        orientation=CertificateTemplateVersion.Orientation.PORTRAIT,
        user=staff_user,
    )

    assert float(template.current_version.width_mm) == 210
    assert float(template.current_version.height_mm) == 297
    for element in template.current_version.layout["elements"]:
        assert element["x"] + element["width"] <= 210
        assert element["y"] + element["height"] <= 297
