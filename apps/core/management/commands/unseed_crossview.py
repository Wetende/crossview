from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.platform.models import PlatformSettings

User = get_user_model()

class Command(BaseCommand):
    help = 'Removes seeded data from Crossview (reverses seed_crossview and codeum_seed)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('Removing Crossview Seed Data...'))

        # 1. Delete Seeded Programs (Explicitly, as Blueprint deletion sets them to NULL)
        programs_to_delete = [
            # From seed_crossview
            'Certificate in Biblical Studies', 'Diploma in Pastoral Ministry',
            'Diploma in Christian Counseling', 'Certificate in Youth Ministry',
            'Bachelor of Theology', 'Diploma in Worship Arts',
            'Certificate in Missions & Evangelism', 'Advanced Diploma in Church Leadership',
            'Certificate in Children\'s Ministry', 'Diploma in Biblical Languages',
            
            # From codeum_seed
            'Full Stack Web Development', 'Python for Data Science',
            'Introduction to Cloud Computing', 'Mobile App Development',
            'Cybersecurity Fundamentals', 'UI/UX Design Masterclass',
            'DevOps Engineering', 'Blockchain & Web3 Basics',
            'AI & Machine Learning', 'Digital Marketing Strategy'
        ]
        deleted_progs, _ = Program.objects.filter(name__in=programs_to_delete).delete()
        if deleted_progs > 0:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Deleted {deleted_progs} Seeded Programs'))

        # 2. Delete Blueprints
        blueprints_to_delete = ['Theology/Bible School', 'Tech Bootcamp']
        deleted_count, _ = AcademicBlueprint.objects.filter(name__in=blueprints_to_delete).delete()
        if deleted_count > 0:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Deleted {deleted_count} objects related to Blueprints: {", ".join(blueprints_to_delete)}'))
        else:
            self.stdout.write(self.style.WARNING(f'  - No blueprints found matching: {", ".join(blueprints_to_delete)}'))

        # 2. Delete Users
        users_to_delete = [
            'admin@admin.com',
            'john@instructor.com', 'mary@instructor.com',
            'peter@student.com', 'grace@student.com', 
            'david@student.com', 'sarah@student.com', 'james@student.com'
        ]
        
        # Also clean up by username if email doesn't match for some reason, based on seed scripts
        usernames_to_delete = [email.split('@')[0] for email in users_to_delete]
        usernames_to_delete.append('crossview_admin') # Specific admin username in seed

        deleted_users, _ = User.objects.filter(email__in=users_to_delete).delete()
        # Note: We don't delete by username blindly to avoid accidental deletes of real users if they picked similar names, 
        # but the seed data is specific enough. 
        # Actually, let's stick to email as primary key for seed data identity.
        
        if deleted_users > 0:
             self.stdout.write(self.style.SUCCESS(f'  ✓ Deleted {deleted_users} Users'))
        else:
             self.stdout.write(self.style.WARNING('  - No seed users found'))

        # 3. Delete Groups
        try:
            group = Group.objects.get(name='Instructors')
            if group.user_set.count() == 0:
                group.delete()
                self.stdout.write(self.style.SUCCESS('  ✓ Deleted empty "Instructors" Group'))
            else:
                self.stdout.write(self.style.WARNING('  - "Instructors" Group not empty, skipping delete'))
        except Group.DoesNotExist:
            pass

        # 4. Reset Platform Settings (Optional but good for "clean state")
        # We won't fully reset it to avoid breaking the site if they want to keep the config,
        # but we can log that it might point to a deleted blueprint if we aren't careful.
        # However, checking models.py: active_blueprint is SET_NULL, so it should be fine.
        
        self.stdout.write(self.style.SUCCESS('Unseed Complete! Database cleaned of demo data.'))
