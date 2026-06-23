from django.test import TestCase
from django.urls import reverse

from apps.core.models import Program


class PublicProgramsPageTests(TestCase):
    def test_public_programs_page_returns_published_programs(self):
        Program.objects.create(
            name="Visible Program",
            code="VISIBLE-PROGRAM-001",
            level="beginner",
            is_published=True,
        )

        response = self.client.get(
            reverse("core:programs"),
            HTTP_X_INERTIA="true",
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["component"], "Public/Programs")
        self.assertEqual(len(data["props"]["programs"]), 1)
        self.assertEqual(data["props"]["programs"][0]["name"], "Visible Program")

    def test_public_programs_groups_only_present_canonical_levels(self):
        Program.objects.create(
            name="AI Course",
            code="AI-COURSE-001",
            level="Beginner",
            is_published=True,
        )
        Program.objects.create(
            name="No Level Course",
            code="NO-LEVEL-COURSE-001",
            level="",
            is_published=True,
        )

        response = self.client.get(
            reverse("core:programs"),
            HTTP_X_INERTIA="true",
        )

        self.assertEqual(response.status_code, 200)
        props = response.json()["props"]
        self.assertEqual(
            props["groupedPrograms"],
            [
                {
                    "value": "Beginner",
                    "label": "Beginner",
                    "programs": [props["programs"][0]],
                }
            ],
        )
        self.assertEqual(props["courseLevels"], [{"value": "Beginner", "label": "Beginner"}])
        self.assertEqual(len(props["programs"]), 2)
