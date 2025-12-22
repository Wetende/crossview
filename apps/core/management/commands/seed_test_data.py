"""
Seed test data for development and testing.

Usage:
    python manage.py seed_test_data
    python manage.py seed_test_data --clear  # Clear existing test data first
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.core.models import User, Program
from apps.tenants.models import Tenant
from apps.blueprints.models import AcademicBlueprint
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, NodeCompletion


class Command(BaseCommand):
    help = "Seed test data for development"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing test data before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.clear_test_data()

        self.seed_data()
        self.stdout.write(self.style.SUCCESS("Test data seeded successfully!"))

    def clear_test_data(self):
        """Clear existing test data."""
        self.stdout.write("Clearing existing test data...")

        # Delete in order to respect foreign keys
        NodeCompletion.objects.all().delete()
        Enrollment.objects.all().delete()
        CurriculumNode.objects.all().delete()
        Program.objects.all().delete()
        AcademicBlueprint.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        Tenant.objects.all().delete()

        self.stdout.write(self.style.WARNING("Test data cleared."))

    def seed_data(self):
        """Seed test data."""

        # 1. Create tenant
        tenant, _ = Tenant.objects.get_or_create(
            subdomain="demo",
            defaults={
                "name": "Demo Institution",
                "admin_email": "admin@demo.com",
                "is_active": True,
                "settings": {"registration_enabled": True},
            },
        )
        self.stdout.write(f"  ✓ Tenant: {tenant.name}")

        # 2. Create test student user
        student, created = User.objects.get_or_create(
            email="student@demo.com",
            defaults={
                "username": "student@demo.com",
                "first_name": "Test",
                "last_name": "Student",
                "tenant": tenant,
            },
        )
        if created:
            student.set_password("Student123!")
            student.save()
            self.stdout.write(f"  ✓ Student user: student@demo.com / Student123!")
        else:
            self.stdout.write(f"  ✓ Student user exists: student@demo.com")

        # 3. Create admin user
        admin, created = User.objects.get_or_create(
            email="admin@demo.com",
            defaults={
                "username": "admin@demo.com",
                "first_name": "Admin",
                "last_name": "User",
                "tenant": tenant,
                "is_staff": True,
            },
        )
        if created:
            admin.set_password("Admin123!")
            admin.save()
            self.stdout.write(f"  ✓ Admin user: admin@demo.com / Admin123!")
        else:
            self.stdout.write(f"  ✓ Admin user exists: admin@demo.com")

        # 4. Create blueprint
        blueprint, _ = AcademicBlueprint.objects.get_or_create(
            tenant=tenant,
            name="Theology Program Blueprint",
            defaults={
                "description": "Blueprint for theology programs",
                "hierarchy_structure": ["Year", "Unit", "Session"],
                "grading_logic": {
                    "type": "weighted",
                    "components": [
                        {"name": "CAT", "weight": 0.3},
                        {"name": "Exam", "weight": 0.7},
                    ],
                },
                "progression_rules": {"sequential": False},
                "gamification_enabled": False,
                "certificate_enabled": True,
            },
        )
        self.stdout.write(f"  ✓ Blueprint: {blueprint.name}")

        # 5. Create program
        program, _ = Program.objects.get_or_create(
            tenant=tenant,
            name="Diploma in Theology",
            defaults={
                "code": "DTH-001",
                "description": "A comprehensive diploma program in theological studies.",
                "blueprint": blueprint,
                "is_published": True,
            },
        )
        self.stdout.write(f"  ✓ Program: {program.name}")

        # 6. Create curriculum structure
        self._create_curriculum(program)

        # 7. Create enrollment
        enrollment, _ = Enrollment.objects.get_or_create(
            user=student,
            program=program,
            defaults={
                "status": "active",
                "enrolled_at": timezone.now(),
            },
        )
        self.stdout.write(f"  ✓ Enrollment: {student.email} -> {program.name}")

        # 8. Create some completions
        self._create_completions(enrollment)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS("Test accounts created:"))
        self.stdout.write(f"  Student: student@demo.com / Student123!")
        self.stdout.write(f"  Admin:   admin@demo.com / Admin123!")
        self.stdout.write(self.style.SUCCESS("=" * 50))

    def _create_curriculum(self, program):
        """Create curriculum nodes for the program."""
        # Check if curriculum already exists
        if CurriculumNode.objects.filter(program=program).exists():
            self.stdout.write("  ✓ Curriculum already exists")
            return

        # Year 1
        year1 = CurriculumNode.objects.create(
            program=program,
            node_type="Year",
            title="Year 1: Foundations",
            code="Y1",
            position=0,
            is_published=True,
        )

        # Unit 1.1
        unit1 = CurriculumNode.objects.create(
            program=program,
            parent=year1,
            node_type="Unit",
            title="Introduction to Theology",
            code="U1.1",
            position=0,
            is_published=True,
        )

        # Sessions for Unit 1.1
        sessions = [
            (
                "What is Theology?",
                "Introduction to the study of theology and its importance.",
            ),
            (
                "History of Theological Thought",
                "Overview of major theological movements through history.",
            ),
            (
                "Methods in Theology",
                "Different approaches and methods used in theological study.",
            ),
        ]
        for i, (title, desc) in enumerate(sessions):
            CurriculumNode.objects.create(
                program=program,
                parent=unit1,
                node_type="Session",
                title=title,
                code=f"S1.1.{i+1}",
                description=desc,
                properties={
                    "content_html": f"<h2>{title}</h2><p>{desc}</p><p>This is sample content for the session.</p>"
                },
                position=i,
                is_published=True,
            )

        # Unit 1.2
        unit2 = CurriculumNode.objects.create(
            program=program,
            parent=year1,
            node_type="Unit",
            title="Biblical Studies",
            code="U1.2",
            position=1,
            is_published=True,
        )

        # Sessions for Unit 1.2
        sessions2 = [
            ("Old Testament Overview", "Survey of the Old Testament books and themes."),
            ("New Testament Overview", "Survey of the New Testament books and themes."),
        ]
        for i, (title, desc) in enumerate(sessions2):
            CurriculumNode.objects.create(
                program=program,
                parent=unit2,
                node_type="Session",
                title=title,
                code=f"S1.2.{i+1}",
                description=desc,
                properties={
                    "content_html": f"<h2>{title}</h2><p>{desc}</p><p>This is sample content for the session.</p>"
                },
                position=i,
                is_published=True,
            )

        self.stdout.write(f"  ✓ Curriculum: 1 Year, 2 Units, 5 Sessions")

    def _create_completions(self, enrollment):
        """Create some node completions for the enrollment."""
        # Get first two sessions
        sessions = CurriculumNode.objects.filter(
            program=enrollment.program,
            node_type="Session",
        ).order_by("position")[:2]

        for session in sessions:
            NodeCompletion.objects.get_or_create(
                enrollment=enrollment,
                node=session,
                defaults={
                    "completion_type": "view",
                    "completed_at": timezone.now(),
                },
            )

        self.stdout.write(
            f"  ✓ Completions: {sessions.count()} sessions marked complete"
        )
