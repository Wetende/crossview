"""
Management command to seed demo data for testing and demonstration.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.tenants.models import PlatformSettings
from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program


User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with demo data (Users, Blueprint, Program)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('Creating Demo Data...'))
        
        # 1. Create or get Demo Blueprint
        blueprint, created = AcademicBlueprint.objects.get_or_create(
            name='Demo Blueprint',
            defaults={
                'hierarchy_structure': ['Program', 'Module', 'Lesson'],
                'grading_logic': {
                    'type': 'weighted',
                    'components': [
                        {'name': 'Assignment', 'weight': 0.3},
                        {'name': 'Exam', 'weight': 0.7}
                    ]
                },
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created Blueprint: {blueprint.name}'))
        else:
            self.stdout.write(f'  - Blueprint already exists: {blueprint.name}')

        # 2. Configure Platform Settings
        settings = PlatformSettings.get_settings()
        settings.institution_name = 'Demo Institution'
        settings.deployment_mode = PlatformSettings.DeploymentMode.ONLINE
        settings.active_blueprint = blueprint
        settings.is_setup_complete = True
        settings.save()
        self.stdout.write(self.style.SUCCESS('  ✓ Updated Platform Settings'))

        # 3. Create Demo Users
        demo_password = 'demo1234'
        users_data = [
            {
                'username': 'demo_admin',
                'email': 'demo@admin.com',
                'is_superuser': True,
                'is_staff': True,
            },
            {
                'username': 'demo_instructor',
                'email': 'demo@instructor.com',
                'is_superuser': False,
                'is_staff': True,  # Staff can access admin/instructor features
            },
            {
                'username': 'demo_student',
                'email': 'demo@student.com',
                'is_superuser': False,
                'is_staff': False,
            },
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'is_superuser': user_data['is_superuser'],
                    'is_staff': user_data['is_staff'],
                }
            )
            if created:
                user.set_password(demo_password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"  ✓ Created User: {user_data['email']}"))
            else:
                self.stdout.write(f"  - User already exists: {user_data['email']}")

        # 4. Create Demo Program
        program, created = Program.objects.get_or_create(
            name='Introduction to Demo',
            defaults={
                'blueprint': blueprint,
                'code': 'DEMO-101',
                'description': 'A demonstration program to explore the LMS features.',
                'is_published': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created Program: {program.name}'))
        else:
            self.stdout.write(f'  - Program already exists: {program.name}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Login Credentials:')
        self.stdout.write(f'  Admin:      demo@admin.com      / {demo_password}')
        self.stdout.write(f'  Instructor: demo@instructor.com / {demo_password}')
        self.stdout.write(f'  Student:    demo@student.com    / {demo_password}')
