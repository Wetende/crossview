from django.test import TestCase
from django.urls import reverse

from apps.core.models import Program
from apps.curriculum.models import CurriculumNode


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
        self.assertEqual(data["props"]["programs"][0]["rating"], 4.0)
        self.assertEqual(data["props"]["programs"][0]["review_count"], 60)

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

    def test_public_programs_include_curriculum_metrics(self):
        program = Program.objects.create(
            name="DevOps Engineering Mastery",
            code="DEVOPS-401",
            level="Advanced",
            is_published=True,
        )
        module = CurriculumNode.objects.create(
            program=program,
            title="Module 1",
            node_type="Module",
            is_published=True,
        )
        CurriculumNode.objects.create(
            program=program,
            parent=module,
            title="Containers",
            node_type="Lesson",
            is_published=True,
            properties={"duration": "45m"},
        )
        CurriculumNode.objects.create(
            program=program,
            parent=module,
            title="CI/CD",
            node_type="Lesson",
            is_published=True,
            properties={"duration": "1h 15m"},
        )
        CurriculumNode.objects.create(
            program=program,
            parent=module,
            title="Module quiz",
            node_type="Lesson",
            is_published=True,
            properties={"lesson_type": "quiz", "duration": "30m"},
        )

        response = self.client.get(
            reverse("core:programs"),
            HTTP_X_INERTIA="true",
        )

        self.assertEqual(response.status_code, 200)
        course = response.json()["props"]["programs"][0]
        self.assertEqual(course["lecture_count"], 2)
        self.assertEqual(course["assessment_count"], 1)
        self.assertEqual(course["duration_hours"], 2)

    def test_public_programs_prefer_configured_duration_hours(self):
        program = Program.objects.create(
            name="Configured Duration Course",
            code="CONFIGURED-DURATION-001",
            duration_hours=60,
            is_published=True,
        )
        module = CurriculumNode.objects.create(
            program=program,
            title="Module 1",
            node_type="Module",
            is_published=True,
        )
        CurriculumNode.objects.create(
            program=program,
            parent=module,
            title="Short lesson",
            node_type="Lesson",
            is_published=True,
            properties={"duration": "45m"},
        )

        response = self.client.get(
            reverse("core:programs"),
            HTTP_X_INERTIA="true",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["props"]["programs"][0]["duration_hours"], 60)
