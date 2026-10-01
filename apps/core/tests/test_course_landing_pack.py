"""Course landing page presentation pack: builder save, serializer and public payload."""

import json
from pathlib import Path

import pytest
from django.contrib.auth.models import Group
from django.contrib.messages import get_messages
from django.core.exceptions import ValidationError
from django.urls import reverse

from apps.certifications.models import (
    CertificateTemplate,
    CertificateTemplateAssignment,
)
from apps.core.intro_video import validate_intro_video_url
from apps.core.models import InstructorProfile, Program
from apps.core.tests.factories import UserFactory
from apps.core.views import serialize_program_data
from apps.learning_operations.models import CourseDeliveryProfile
from apps.progression.models import InstructorAssignment
from apps.progression.tests.factories import ProgramFactory

INVALID_INTRO_VIDEO_MESSAGE = (
    "Use a YouTube or Vimeo video link, or a direct HTTPS .mp4 or .webm file."
)
# Shared with frontend/src/utils/introVideoUrl.test.js.
INTRO_VIDEO_URLS = json.loads(
    (Path(__file__).parent / "fixtures" / "intro_video_urls.json").read_text()
)


@pytest.fixture
def instructor(db):
    user = UserFactory(first_name="Grace", last_name="Hopper")
    group, _ = Group.objects.get_or_create(name="Instructors")
    user.groups.add(group)
    return user


@pytest.fixture
def program(db):
    return ProgramFactory()


@pytest.fixture
def assignment(instructor, program):
    return InstructorAssignment.objects.create(
        instructor=instructor,
        program=program,
        role="Primary Instructor",
        is_primary=True,
    )


def _settings_url(program):
    return reverse(
        "core:instructor.program_update_settings", kwargs={"pk": program.id}
    )


def _post_main(client, program, **fields):
    return client.post(
        _settings_url(program),
        data={"tab": "settings", "section": "main", **fields},
        content_type="application/json",
    )


def _public_props(client, program):
    response = client.get(
        reverse("core:program_detail", kwargs={"slug": program.slug}),
        HTTP_X_INERTIA="true",
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["component"] == "Public/ProgramDetail"
    return payload["props"]


class TestIntroVideoUrlValidation:
    @pytest.mark.parametrize("url", INTRO_VIDEO_URLS["accepted"])
    def test_accepts_supported_sources(self, url):
        assert validate_intro_video_url(url) == url
        assert validate_intro_video_url(f"  {url}  ") == url

    def test_model_field_uses_the_same_rule(self):
        field = Program._meta.get_field("intro_video_url")
        field.run_validators("https://vimeo.com/76979871")
        with pytest.raises(ValidationError):
            field.run_validators("https://example.org/about")

    def test_blank_value_clears_the_field(self):
        assert validate_intro_video_url("   ") == ""
        assert validate_intro_video_url(None) == ""

    @pytest.mark.parametrize("url", INTRO_VIDEO_URLS["rejected"])
    def test_rejects_unsupported_sources(self, url):
        with pytest.raises(ValidationError) as exc:
            validate_intro_video_url(url)
        assert exc.value.messages == [INVALID_INTRO_VIDEO_MESSAGE]


@pytest.mark.django_db
class TestProgramLandingFields:
    def test_program_save_trims_landing_html(self, program):
        program.requirements_html = "  <ul><li>A laptop</li></ul>\n"
        program.audience_html = "\n <p>Career changers</p>  "
        program.save()

        program.refresh_from_db()
        assert program.requirements_html == "<ul><li>A laptop</li></ul>"
        assert program.audience_html == "<p>Career changers</p>"
        assert program.intro_video_url == ""

    def test_main_settings_saves_landing_fields(
        self, client, instructor, program, assignment
    ):
        client.force_login(instructor)
        response = _post_main(
            client,
            program,
            intro_video_url=" https://youtu.be/dQw4w9WgXcQ ",
            requirements_html=" <ul><li>A laptop</li></ul> ",
            audience_html="<p>Career changers</p>",
        )

        assert response.status_code == 302
        assert (
            response["Location"]
            == f"/instructor/programs/{program.id}/manage/?tab=settings&section=main"
        )
        program.refresh_from_db()
        assert program.intro_video_url == "https://youtu.be/dQw4w9WgXcQ"
        assert program.requirements_html == "<ul><li>A laptop</li></ul>"
        assert program.audience_html == "<p>Career changers</p>"

    def test_main_settings_can_clear_landing_fields(
        self, client, instructor, program, assignment
    ):
        program.intro_video_url = "https://vimeo.com/76979871"
        program.requirements_html = "<p>Old</p>"
        program.audience_html = "<p>Old</p>"
        program.save()

        client.force_login(instructor)
        _post_main(
            client,
            program,
            intro_video_url="",
            requirements_html="",
            audience_html="",
        )

        program.refresh_from_db()
        assert program.intro_video_url == ""
        assert program.requirements_html == ""
        assert program.audience_html == ""

    def test_main_settings_rejects_unsupported_intro_video_url(
        self, client, instructor, program, assignment
    ):
        program.name = "Original Name"
        program.intro_video_url = "https://vimeo.com/76979871"
        program.save()
        CourseDeliveryProfile.objects.update_or_create(
            program=program,
            defaults={"delivery_mode": CourseDeliveryProfile.IN_PERSON},
        )

        client.force_login(instructor)
        response = _post_main(
            client,
            program,
            name="Should Not Save",
            delivery_mode=CourseDeliveryProfile.SELF_PACED,
            intro_video_url="https://example.org/about",
            requirements_html="<p>Should not save</p>",
        )

        assert response.status_code == 302
        assert (
            response["Location"]
            == f"/instructor/programs/{program.id}/manage/?tab=settings&section=main"
        )
        assert [str(m) for m in get_messages(response.wsgi_request)] == [
            INVALID_INTRO_VIDEO_MESSAGE
        ]
        program.refresh_from_db()
        assert program.name == "Original Name"
        assert program.intro_video_url == "https://vimeo.com/76979871"
        assert program.requirements_html == ""
        assert (
            CourseDeliveryProfile.objects.get(program=program).delivery_mode
            == CourseDeliveryProfile.IN_PERSON
        )

    def test_other_sections_ignore_landing_fields(
        self, client, instructor, program, assignment
    ):
        client.force_login(instructor)
        client.post(
            _settings_url(program),
            data={
                "tab": "settings",
                "section": "reviews",
                "intro_video_url": "https://youtu.be/dQw4w9WgXcQ",
                "requirements_html": "<p>Ignored</p>",
            },
            content_type="application/json",
        )

        program.refresh_from_db()
        assert program.intro_video_url == ""
        assert program.requirements_html == ""

    def test_builder_serializer_returns_landing_fields(self, program):
        program.intro_video_url = "https://vimeo.com/76979871"
        program.requirements_html = "<p>A laptop</p>"
        program.audience_html = "<p>Career changers</p>"
        program.save()

        data = serialize_program_data(program)["program"]

        assert data["introVideoUrl"] == "https://vimeo.com/76979871"
        assert data["requirementsHtml"] == "<p>A laptop</p>"
        assert data["audienceHtml"] == "<p>Career changers</p>"


@pytest.mark.django_db
class TestPublicLandingPayload:
    def test_public_payload_includes_landing_content_and_facts(
        self, client, instructor, program, assignment
    ):
        program.intro_video_url = "https://youtu.be/dQw4w9WgXcQ"
        program.requirements_html = "<p>A laptop</p>"
        program.audience_html = "<p>Career changers</p>"
        program.level = "Beginner"
        program.duration_hours = 12
        program.exam_body = "Internal"
        program.award_type = "Certificate of Completion"
        program.access_duration_days = 90
        program.custom_pricing = {"price": 1500}
        program.save()
        CourseDeliveryProfile.objects.update_or_create(
            program=program,
            defaults={"delivery_mode": CourseDeliveryProfile.SELF_PACED},
        )
        CertificateTemplate.objects.create(name="Default", is_default=True)

        props = _public_props(client, program)
        assert props["enrollmentMode"] == "paid"
        data = props["program"]

        assert data["introVideoUrl"] == "https://youtu.be/dQw4w9WgXcQ"
        assert data["requirementsHtml"] == "<p>A laptop</p>"
        assert data["audienceHtml"] == "<p>Career changers</p>"
        assert data["facts"] == {
            "certificateOnCompletion": True,
            "examBody": "Internal",
            "awardType": "Certificate of Completion",
            "deliveryMode": "self_paced",
            "deliveryModeLabel": "Self-paced",
            "accessDurationDays": 90,
            "level": "Beginner",
            "durationHours": 12,
            "lessonCount": 0,
        }

    def test_public_payload_uses_empty_defaults(self, client, program):
        props = _public_props(client, program)
        data = props["program"]

        assert data["introVideoUrl"] == ""
        assert data["requirementsHtml"] == ""
        assert data["audienceHtml"] == ""
        assert data["instructor"] is None
        assert props["instructors"] == []
        assert data["facts"]["examBody"] == ""
        assert data["facts"]["awardType"] == ""
        assert data["facts"]["accessDurationDays"] is None

    def test_access_length_is_only_shown_for_paid_courses(self, client, program):
        # Expiry is only applied to paid access grants, so free enrolments
        # keep lifetime access whatever the course setting says.
        program.access_duration_days = 30
        program.save()

        props = _public_props(client, program)

        assert props["enrollmentMode"] == "free"
        assert props["program"]["facts"]["accessDurationDays"] is None

    def test_instructor_exposes_only_allowed_profile_fields(
        self, client, instructor, program, assignment
    ):
        InstructorProfile.objects.create(
            user=instructor,
            status="approved",
            bio="Teaches compilers.",
            job_title="Principal Engineer",
            linkedin_url="https://www.linkedin.com/in/example",
            resume_path="private/resume.pdf",
            teaching_experience="PRIVATE-EXPERIENCE",
            why_teach_here="PRIVATE-MOTIVATION",
            rejection_reason="PRIVATE-REJECTION",
        )

        props = _public_props(client, program)
        instructor_data = props["program"]["instructor"]

        assert instructor_data == {
            "name": "Grace Hopper",
            "jobTitle": "Principal Engineer",
            "bio": "Teaches compilers.",
            "linkedinUrl": "https://www.linkedin.com/in/example",
            "avatar": None,
        }
        serialized = json.dumps(props)
        for private_value in (
            "private/resume.pdf",
            "PRIVATE-EXPERIENCE",
            "PRIVATE-MOTIVATION",
            "PRIVATE-REJECTION",
        ):
            assert private_value not in serialized

    @pytest.mark.parametrize("status", ["draft", "pending_review", "rejected"])
    def test_unapproved_profile_details_stay_private(
        self, client, instructor, program, assignment, status
    ):
        InstructorProfile.objects.create(
            user=instructor,
            status=status,
            bio="Unreviewed bio",
            job_title="Unreviewed title",
            linkedin_url="https://www.linkedin.com/in/unreviewed",
        )

        instructor_data = _public_props(client, program)["program"]["instructor"]

        assert instructor_data == {
            "name": "Grace Hopper",
            "jobTitle": "",
            "bio": "",
            "linkedinUrl": "",
            "avatar": None,
        }

    def test_primary_instructor_is_presented_first(
        self, client, instructor, program
    ):
        co_instructor = UserFactory(first_name="Ada", last_name="Lovelace")
        InstructorAssignment.objects.create(
            instructor=co_instructor, program=program, role="Instructor"
        )
        InstructorAssignment.objects.create(
            instructor=instructor,
            program=program,
            role="Primary Instructor",
            is_primary=True,
        )

        props = _public_props(client, program)

        assert props["program"]["instructor"]["name"] == "Grace Hopper"
        assert props["instructors"] == [
            {"name": "Grace Hopper", "avatar": None, "role": "Primary Instructor"},
            {"name": "Ada Lovelace", "avatar": None, "role": "Instructor"},
        ]

    def test_instructor_names_never_fall_back_to_email(self, client, program):
        nameless = UserFactory(first_name="", last_name="")
        InstructorAssignment.objects.create(
            instructor=nameless, program=program, is_primary=True
        )

        props = _public_props(client, program)

        assert props["program"]["instructor"]["name"] == "Instructor"
        assert props["instructors"][0]["name"] == "Instructor"
        assert "id" not in props["instructors"][0]
        assert nameless.email not in json.dumps(props)

    def test_certificate_fact_requires_a_resolvable_template(self, client, program):
        facts = _public_props(client, program)["program"]["facts"]

        assert facts["certificateOnCompletion"] is False

    def test_certificate_fact_accepts_a_blueprint_template(self, client, program):
        CertificateTemplate.objects.create(
            name="Blueprint certificate", blueprint=program.blueprint
        )

        facts = _public_props(client, program)["program"]["facts"]

        assert facts["certificateOnCompletion"] is True

    def test_certificate_fact_follows_course_opt_out(self, client, program):
        CertificateTemplate.objects.create(name="Default", is_default=True)
        CertificateTemplateAssignment.objects.create(
            scope=CertificateTemplateAssignment.Scope.COURSE,
            program=program,
            issue_enabled=False,
        )

        facts = _public_props(client, program)["program"]["facts"]

        assert facts["certificateOnCompletion"] is False

    def test_certificate_fact_requires_blueprint_certificates(self, client, program):
        CertificateTemplate.objects.create(name="Default", is_default=True)
        program.blueprint.certificate_enabled = False
        program.blueprint.save(update_fields=["certificate_enabled"])

        facts = _public_props(client, program)["program"]["facts"]

        assert facts["certificateOnCompletion"] is False
