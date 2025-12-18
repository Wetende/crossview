"""
Django management command for migrating legacy course data to blueprint structure.

Usage:
    python manage.py migrate_legacy_blueprint --program-id=1
    python manage.py migrate_legacy_blueprint --program-id=1 --dry-run
    python manage.py migrate_legacy_blueprint --program-id=1 --rollback
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.blueprints.legacy_migration import LegacyMigrationService
from apps.core.models import Program


class Command(BaseCommand):
    help = 'Migrate legacy course/section/lesson data to blueprint curriculum nodes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--program-id',
            type=int,
            help='ID of the program to migrate',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview migration without making changes',
        )
        parser.add_argument(
            '--rollback',
            action='store_true',
            help='Rollback a previous migration',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Migrate all programs without blueprints',
        )

    def handle(self, *args, **options):
        service = LegacyMigrationService()
        
        if options['rollback']:
            self._handle_rollback(options, service)
            return
        
        if options['all']:
            self._handle_all(options, service)
            return
        
        if not options['program_id']:
            raise CommandError('Please provide --program-id or --all')
        
        self._handle_single(options, service)

    def _handle_single(self, options, service):
        """Handle migration of a single program."""
        program_id = options['program_id']
        dry_run = options['dry_run']
        
        try:
            program = Program.objects.get(pk=program_id)
        except Program.DoesNotExist:
            raise CommandError(f'Program with ID {program_id} does not exist')
        
        if program.blueprint and not dry_run:
            self.stdout.write(
                self.style.WARNING(f'Program "{program.name}" already has a blueprint assigned')
            )
            return
        
        self.stdout.write(f'Migrating program: {program.name}')
        
        if dry_run:
            self.stdout.write(self.style.NOTICE('DRY RUN - No changes will be made'))
        
        # In a real scenario, you would fetch actual course/section/lesson data
        # from the legacy tables. For now, we'll show the structure.
        self.stdout.write(
            self.style.NOTICE(
                'Note: This command expects legacy Course, Section, and Lesson models. '
                'Implement data fetching based on your legacy schema.'
            )
        )
        
        # Example structure for demonstration
        # In production, replace with actual database queries
        courses = []  # Fetch from legacy Course model
        sections = []  # Fetch from legacy Section model
        lessons = []  # Fetch from legacy Lesson model
        
        if not courses:
            self.stdout.write(
                self.style.WARNING('No legacy data found. Skipping migration.')
            )
            return
        
        report = service.migrate_full_structure(
            courses, sections, lessons, program, dry_run=dry_run
        )
        
        self._print_report(report)

    def _handle_all(self, options, service):
        """Handle migration of all programs without blueprints."""
        dry_run = options['dry_run']
        
        programs = Program.objects.filter(blueprint__isnull=True)
        
        if not programs.exists():
            self.stdout.write(self.style.SUCCESS('No programs need migration'))
            return
        
        self.stdout.write(f'Found {programs.count()} programs to migrate')
        
        if dry_run:
            self.stdout.write(self.style.NOTICE('DRY RUN - No changes will be made'))
        
        for program in programs:
            self.stdout.write(f'\nMigrating: {program.name}')
            # Similar to _handle_single, fetch and migrate data
            self.stdout.write(self.style.NOTICE('  Skipped - implement data fetching'))

    def _handle_rollback(self, options, service):
        """Handle rollback of a migration."""
        if not options['program_id']:
            raise CommandError('Please provide --program-id for rollback')
        
        program_id = options['program_id']
        
        try:
            program = Program.objects.get(pk=program_id)
        except Program.DoesNotExist:
            raise CommandError(f'Program with ID {program_id} does not exist')
        
        self.stdout.write(f'Rolling back migration for: {program.name}')
        
        with transaction.atomic():
            service.rollback_migration(program)
        
        self.stdout.write(self.style.SUCCESS('Rollback complete'))

    def _print_report(self, report):
        """Print migration report."""
        self.stdout.write('\n--- Migration Report ---')
        self.stdout.write(f'Courses migrated: {report.courses_migrated}')
        self.stdout.write(f'Sections migrated: {report.sections_migrated}')
        self.stdout.write(f'Lessons migrated: {report.lessons_migrated}')
        self.stdout.write(f'Total nodes created: {report.courses_migrated + report.sections_migrated + report.lessons_migrated}')
        
        if report.errors:
            self.stdout.write(self.style.ERROR(f'\nErrors ({len(report.errors)}):'))
            for error in report.errors:
                self.stdout.write(self.style.ERROR(f'  - {error}'))
        else:
            self.stdout.write(self.style.SUCCESS('\nMigration completed successfully!'))
