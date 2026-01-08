"""
Management command to seed Crossview Theology School data.
Creates full simulation: students, instructors, admin, curriculum, assessments, announcements.
"""
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone

from apps.platform.models import PlatformSettings
from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.assessments.models import AssessmentResult
from apps.progression.models import InstructorAssignment, Enrollment, NodeCompletion, Announcement
from apps.practicum.models import Rubric, PracticumSubmission, SubmissionReview


User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds Crossview Theology School with full simulation data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('Creating Crossview Theology School Data...'))
        
        # 1. Create Theology Blueprint
        blueprint, created = AcademicBlueprint.objects.get_or_create(
            name='Theology/Bible School',
            defaults={
                'hierarchy_structure': ['Course', 'Module', 'Lesson', 'Session'],
                'grading_logic': {
                    'type': 'weighted',
                    'components': [
                        {'name': 'Assignments', 'weight': 30, 'maxScore': 100},
                        {'name': 'Midterm', 'weight': 20, 'maxScore': 100},
                        {'name': 'Final Exam', 'weight': 40, 'maxScore': 100},
                        {'name': 'Participation', 'weight': 10, 'maxScore': 100},
                    ],
                    'passingScore': 50,
                },
                'certificate_enabled': True,
            }
        )
        self._log(created, 'Blueprint', blueprint.name)

        # 2. Configure Platform Settings
        settings = PlatformSettings.get_settings()
        settings.institution_name = 'Crossview'
        settings.tagline = 'Equipping Leaders for Kingdom Service'
        settings.deployment_mode = PlatformSettings.DeploymentMode.THEOLOGY
        settings.active_blueprint = blueprint
        settings.is_setup_complete = True
        settings.save()
        self.stdout.write(self.style.SUCCESS('  ✓ Updated Platform Settings'))

        # 3. Create Groups
        instructors_group, _ = Group.objects.get_or_create(name='Instructors')

        # 4. Create Users
        password = 'crossview2024'
        
        # Admin
        admin = self._create_user(
            email='admin@admin.com', username='crossview_admin',
            first_name='Admin', last_name='User',
            is_staff=True, is_superuser=False, password=password
        )

        # Instructors
        instructors_data = [
            {'email': 'john@instructor.com', 'first_name': 'John', 'last_name': 'Wanjiku'},
            {'email': 'mary@instructor.com', 'first_name': 'Mary', 'last_name': 'Otieno'},
        ]
        instructors = []
        for data in instructors_data:
            instructor = self._create_user(
                email=data['email'], username=data['email'].split('@')[0],
                first_name=data['first_name'], last_name=data['last_name'],
                password=password
            )
            instructor.groups.add(instructors_group)
            instructors.append(instructor)

        # Students
        students_data = [
            {'email': 'peter@student.com', 'first_name': 'Peter', 'last_name': 'Kamau'},
            {'email': 'grace@student.com', 'first_name': 'Grace', 'last_name': 'Muthoni'},
            {'email': 'david@student.com', 'first_name': 'David', 'last_name': 'Omondi'},
            {'email': 'sarah@student.com', 'first_name': 'Sarah', 'last_name': 'Wambui'},
            {'email': 'james@student.com', 'first_name': 'James', 'last_name': 'Kiprop'},
        ]
        students = []
        for data in students_data:
            student = self._create_user(
                email=data['email'], username=data['email'].split('@')[0],
                first_name=data['first_name'], last_name=data['last_name'],
                password=password
            )
            students.append(student)

        # 5. Create Programs with Curriculum
        programs = self._create_all_programs(blueprint, instructors)

        # 6. Enroll Students and Create Progress for all programs
        all_enrollments = []
        for program in programs:
            enrollments = []
            for student in students:
                enrollment, created = Enrollment.objects.get_or_create(
                    user=student, program=program,
                    defaults={'status': 'active'}
                )
                enrollments.append(enrollment)
                if created:
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Enrolled {student.email} in {program.name}"))
            all_enrollments.extend(enrollments)
            
            # 7. Create Assessment Results (Grades)
            self._create_assessment_results(program, enrollments, instructors[0])

            # 8. Create Node Completions (Progress)
            self._create_node_completions(program, enrollments)

        # 9. Create Announcements for first program
        self._create_announcements(programs[0], instructors)

        # 10. Create Practicum Data
        self._create_practicum_data(programs[0], all_enrollments[:5], instructors[0])

        # Summary
        self._print_summary(students_data, instructors_data, password)

    def _log(self, created, entity_type, name):
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created {entity_type}: {name}'))
        else:
            self.stdout.write(f'  - {entity_type} already exists: {name}')

    def _create_user(self, email, username, first_name, last_name, password, is_staff=False, is_superuser=False):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'is_staff': is_staff,
                'is_superuser': is_superuser,
            }
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created User: {email}"))
        return user

    def _create_all_programs(self, blueprint, instructors):
        """Create both programs with full curriculum."""
        programs = []
        
        # Program 1: Certificate in Biblical Studies
        program1 = self._create_program(
            blueprint, instructors,
            name='Certificate in Biblical Studies',
            code='CBS-101',
            description='Foundation course covering Old and New Testament survey, biblical interpretation, and Christian doctrine.'
        )
        self._create_cbs_curriculum(program1)
        programs.append(program1)
        
        # Program 2: Diploma in Pastoral Ministry
        program2 = self._create_program(
            blueprint, instructors,
            name='Diploma in Pastoral Ministry',
            code='DPM-201',
            description='Comprehensive training for pastoral leadership, counseling, and church administration.'
        )
        self._create_dpm_curriculum(program2)
        programs.append(program2)
        
        return programs

    def _create_program(self, blueprint, instructors, name, code, description):
        program, created = Program.objects.get_or_create(
            name=name,
            defaults={
                'blueprint': blueprint,
                'code': code,
                'description': description,
                'is_published': True,
            }
        )
        self._log(created, 'Program', program.name)

        # Assign instructors
        for instructor in instructors:
            InstructorAssignment.objects.get_or_create(
                instructor=instructor, program=program,
                defaults={'is_primary': instructor == instructors[0]}
            )
        return program

    def _create_cbs_curriculum(self, program):
        """Create curriculum for Certificate in Biblical Studies."""
        courses = [
            {
                'title': 'Old Testament Survey',
                'code': 'OTS-101',
                'description': 'A comprehensive study of the Old Testament books, themes, and theology.',
                'modules': [
                    {
                        'title': 'The Pentateuch',
                        'lessons': [
                            {'title': 'Introduction to Genesis', 'sessions': ['Creation Narrative', 'The Fall and Its Consequences', 'The Flood and Covenant']},
                            {'title': 'Exodus and Liberation', 'sessions': ['Moses and the Burning Bush', 'The Plagues', 'The Passover']},
                            {'title': 'Leviticus, Numbers & Deuteronomy', 'sessions': ['Sacrificial System', 'Wilderness Journey', 'Renewal of Covenant']},
                        ]
                    },
                    {
                        'title': 'Historical Books',
                        'lessons': [
                            {'title': 'Joshua and Judges', 'sessions': ['Conquest of Canaan', 'The Judges Cycle']},
                            {'title': 'The United Monarchy', 'sessions': ['Rise of Saul', 'David\'s Kingdom', 'Solomon\'s Wisdom']},
                        ]
                    },
                ]
            },
            {
                'title': 'New Testament Survey',
                'code': 'NTS-101',
                'description': 'Overview of the New Testament with emphasis on the Gospels and Epistles.',
                'modules': [
                    {
                        'title': 'The Gospels',
                        'lessons': [
                            {'title': 'The Synoptic Gospels', 'sessions': ['Matthew: King\'s Gospel', 'Mark: Servant Gospel', 'Luke: Physician\'s Account']},
                            {'title': 'The Gospel of John', 'sessions': ['Signs and Discourses', 'The "I Am" Statements']},
                        ]
                    },
                    {
                        'title': 'Acts and Epistles',
                        'lessons': [
                            {'title': 'Book of Acts', 'sessions': ['Pentecost', 'Missionary Journeys']},
                            {'title': 'Pauline Epistles', 'sessions': ['Romans: Righteousness', 'Corinthians: Church Life', 'Galatians: Freedom']},
                        ]
                    },
                ]
            },
        ]
        self._build_curriculum_tree(program, courses)
        self.stdout.write(self.style.SUCCESS(f'  ✓ Created CBS curriculum (2 courses, 4 modules, 9 lessons, 24 sessions)'))

    def _create_dpm_curriculum(self, program):
        """Create curriculum for Diploma in Pastoral Ministry."""
        courses = [
            {
                'title': 'Pastoral Leadership',
                'code': 'PL-201',
                'description': 'Biblical foundations and practical skills for effective pastoral leadership.',
                'modules': [
                    {
                        'title': 'Biblical Foundations of Leadership',
                        'lessons': [
                            {'title': 'Servant Leadership Model', 'sessions': ['Jesus as Leader', 'Washing Feet', 'Leading by Example']},
                            {'title': 'Old Testament Leaders', 'sessions': ['Moses: Reluctant Leader', 'David: Heart After God', 'Nehemiah: Visionary']},
                        ]
                    },
                    {
                        'title': 'Practical Leadership Skills',
                        'lessons': [
                            {'title': 'Team Building', 'sessions': ['Identifying Gifts', 'Delegation', 'Conflict Resolution']},
                            {'title': 'Vision Casting', 'sessions': ['Hearing from God', 'Communicating Vision', 'Strategic Planning']},
                        ]
                    },
                ]
            },
            {
                'title': 'Biblical Counseling',
                'code': 'BC-201',
                'description': 'Principles and practice of counseling from a biblical perspective.',
                'modules': [
                    {
                        'title': 'Foundations of Biblical Counseling',
                        'lessons': [
                            {'title': 'The Sufficiency of Scripture', 'sessions': ['Scripture and Counseling', 'Heart Change Model']},
                            {'title': 'Understanding Human Nature', 'sessions': ['Created in God\'s Image', 'Effects of Sin', 'Hope in Christ']},
                        ]
                    },
                    {
                        'title': 'Counseling Practice',
                        'lessons': [
                            {'title': 'Marriage Counseling', 'sessions': ['Pre-Marital Prep', 'Crisis Intervention', 'Restoration']},
                            {'title': 'Grief and Trauma', 'sessions': ['Walking Through Loss', 'Finding Comfort', 'Moving Forward']},
                        ]
                    },
                ]
            },
            {
                'title': 'Homiletics',
                'code': 'HOM-201',
                'description': 'The art and science of preaching.',
                'modules': [
                    {
                        'title': 'Sermon Preparation',
                        'lessons': [
                            {'title': 'Biblical Interpretation', 'sessions': ['Exegesis Principles', 'Context Study', 'Application']},
                            {'title': 'Sermon Structure', 'sessions': ['Introduction', 'Body Development', 'Conclusion and Call']},
                        ]
                    },
                    {
                        'title': 'Sermon Delivery',
                        'lessons': [
                            {'title': 'Public Speaking', 'sessions': ['Voice and Tone', 'Body Language', 'Audience Connection']},
                            {'title': 'Different Sermon Types', 'sessions': ['Expository', 'Topical', 'Narrative']},
                        ]
                    },
                ]
            },
            {
                'title': 'Church Administration',
                'code': 'CA-201',
                'description': 'Managing church operations biblically and efficiently.',
                'modules': [
                    {
                        'title': 'Church Governance',
                        'lessons': [
                            {'title': 'Church Polity', 'sessions': ['Elder-Led', 'Congregational', 'Episcopal Models']},
                            {'title': 'Church Membership', 'sessions': ['Joining Process', 'Discipline', 'Discipleship']},
                        ]
                    },
                    {
                        'title': 'Church Operations',
                        'lessons': [
                            {'title': 'Financial Stewardship', 'sessions': ['Budgeting', 'Reporting', 'Accountability']},
                            {'title': 'Ministry Planning', 'sessions': ['Annual Calendar', 'Events Management', 'Volunteer Coordination']},
                        ]
                    },
                ]
            },
        ]
        self._build_curriculum_tree(program, courses)
        self.stdout.write(self.style.SUCCESS(f'  ✓ Created DPM curriculum (4 courses, 8 modules, 16 lessons, 48 sessions)'))

    def _build_curriculum_tree(self, program, courses):
        """Build curriculum tree from course data."""
        for course_data in courses:
            course = self._create_node(program, None, 'Course', course_data['title'], course_data['code'], course_data['description'])
            for module_data in course_data['modules']:
                module = self._create_node(program, course, 'Module', module_data['title'])
                for lesson_data in module_data['lessons']:
                    lesson = self._create_node(program, module, 'Lesson', lesson_data['title'])
                    for session_title in lesson_data['sessions']:
                        self._create_node(program, lesson, 'Session', session_title)

    def _create_node(self, program, parent, node_type, title, code=None, description=None):
        node, created = CurriculumNode.objects.get_or_create(
            program=program,
            parent=parent,
            node_type=node_type,
            title=title,
            defaults={
                'code': code,
                'description': description,
                'is_published': True,
                'properties': {
                    'objectives': [f'Understand {title}'],
                    'content': f'Content for {title}',
                } if node_type == 'Session' else {},
            }
        )
        return node

    def _create_assessment_results(self, program, enrollments, graded_by):
        """Create grade data for students on course-level nodes."""
        courses = CurriculumNode.objects.filter(program=program, node_type='Course')
        
        for enrollment in enrollments:
            for course in courses:
                # Generate random but realistic grades
                assignments = random.randint(60, 95)
                midterm = random.randint(55, 90)
                final_exam = random.randint(50, 92)
                participation = random.randint(70, 100)
                
                # Calculate weighted total
                total = (assignments * 0.30) + (midterm * 0.20) + (final_exam * 0.40) + (participation * 0.10)
                status = 'Pass' if total >= 50 else 'Fail'
                
                # Determine letter grade
                if total >= 80: letter_grade = 'A'
                elif total >= 70: letter_grade = 'B'
                elif total >= 60: letter_grade = 'C'
                elif total >= 50: letter_grade = 'D'
                else: letter_grade = 'F'

                result, created = AssessmentResult.objects.get_or_create(
                    enrollment=enrollment,
                    node=course,
                    defaults={
                        'result_data': {
                            'components': {
                                'Assignments': assignments,
                                'Midterm': midterm,
                                'Final Exam': final_exam,
                                'Participation': participation,
                            },
                            'total': round(total, 2),
                            'status': status,
                            'letter_grade': letter_grade,
                        },
                        'graded_by': graded_by,
                        'is_published': True,
                        'published_at': timezone.now(),
                        'lecturer_comments': f'Good work on {course.title}!' if total >= 70 else 'Needs improvement.',
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Created grades for {enrollment.user.email} - {course.title}"))

    def _create_node_completions(self, program, enrollments):
        """Mark some sessions as completed for each student."""
        sessions = list(CurriculumNode.objects.filter(program=program, node_type='Session'))
        
        for enrollment in enrollments:
            # Complete 40-80% of sessions randomly
            num_to_complete = random.randint(int(len(sessions) * 0.4), int(len(sessions) * 0.8))
            completed_sessions = random.sample(sessions, num_to_complete)
            
            for session in completed_sessions:
                completion, created = NodeCompletion.objects.get_or_create(
                    enrollment=enrollment,
                    node=session,
                    defaults={
                        'completed_at': timezone.now() - timedelta(days=random.randint(1, 30)),
                        'completion_type': 'view',
                    }
                )
            
            progress = (len(completed_sessions) / len(sessions)) * 100
            self.stdout.write(f"  - {enrollment.user.first_name}: {progress:.0f}% progress ({num_to_complete}/{len(sessions)} sessions)")

    def _create_announcements(self, program, instructors):
        """Create sample announcements from instructors."""
        announcements_data = [
            {
                'title': 'Welcome to the New Semester!',
                'content': '''Dear Students,

Welcome to the Certificate in Biblical Studies program! We are excited to have you join us on this journey of exploring God's Word.

Please make sure to:
- Review the course syllabus
- Complete the introductory readings
- Join our WhatsApp group for updates

God bless you as you begin this journey!

Your Instructors''',
                'is_pinned': True,
            },
            {
                'title': 'Midterm Exam Schedule',
                'content': '''The midterm examinations will be held as follows:

- Old Testament Survey: Monday, Week 8
- New Testament Survey: Wednesday, Week 8

Please prepare accordingly. Revision materials have been uploaded to the learning portal.

Grace and peace,
Instructor John''',
                'is_pinned': False,
            },
            {
                'title': 'Chapel Service This Friday',
                'content': '''Don't forget our weekly chapel service this Friday at 10:00 AM.

Guest Speaker: Pastor David from Nairobi Chapel
Topic: "Called to Serve"

Attendance is mandatory for all students.''',
                'is_pinned': False,
            },
        ]

        for i, data in enumerate(announcements_data):
            announcement, created = Announcement.objects.get_or_create(
                program=program,
                title=data['title'],
                defaults={
                    'author': instructors[i % len(instructors)],
                    'content': data['content'],
                    'is_pinned': data['is_pinned'],
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✓ Created Announcement: {data['title']}"))

    def _print_summary(self, students_data, instructors_data, password):
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ Crossview Theology School data seeded successfully!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING(f'Password for all accounts: {password}'))
        self.stdout.write('')
        self.stdout.write('  Admin:')
        self.stdout.write('    admin@admin.com')
        self.stdout.write('')
        self.stdout.write('  Instructors:')
        for data in instructors_data:
            self.stdout.write(f"    {data['email']}")
        self.stdout.write('')
        self.stdout.write('  Students:')
        for data in students_data:
            self.stdout.write(f"    {data['email']}")
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Simulation includes:'))
        self.stdout.write('  • 2 Programs with full curriculum tree')
        self.stdout.write('  • Grades for all students (with letter grades)')
        self.stdout.write('  • Progress tracking (40-80% completion per student)')
        self.stdout.write('  • 3 Announcements (1 pinned)')
        self.stdout.write('  • Practicum rubric + student submissions + reviews')

    def _create_practicum_data(self, program, enrollments, reviewer):
        """Create practicum rubric, submissions, and reviews."""
        
        # 1. Create a Ministry Practicum Rubric
        rubric, created = Rubric.objects.get_or_create(
            name='Ministry Practicum Evaluation',
            defaults={
                'description': 'Rubric for evaluating student ministry field work',
                'dimensions': [
                    {'name': 'Scripture Use', 'weight': 0.25, 'max_score': 100},
                    {'name': 'Communication', 'weight': 0.25, 'max_score': 100},
                    {'name': 'Pastoral Care', 'weight': 0.25, 'max_score': 100},
                    {'name': 'Professionalism', 'weight': 0.25, 'max_score': 100},
                ],
                'max_score': 100,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created Rubric: {rubric.name}'))

        # 2. Get a session node for practicum submissions
        session_nodes = list(CurriculumNode.objects.filter(
            program=program, node_type='Session'
        )[:3])  # Get first 3 sessions
        
        if not session_nodes:
            self.stdout.write('  - No session nodes found for practicum')
            return

        # 3. Create practicum submissions for some students
        submission_data = [
            {
                'title': 'Youth Group Teaching Session',
                'file_type': 'video/mp4',
                'file_size': 52428800,  # 50MB
                'duration': 1800,  # 30 minutes
                'status': 'approved',
            },
            {
                'title': 'Hospital Visitation Report',
                'file_type': 'application/pdf',
                'file_size': 2097152,  # 2MB
                'duration': None,
                'status': 'approved',
            },
            {
                'title': 'Sunday School Lesson',
                'file_type': 'video/mp4',
                'file_size': 41943040,  # 40MB
                'duration': 1500,  # 25 minutes
                'status': 'pending',
            },
            {
                'title': 'Sermon: The Good Shepherd',
                'file_type': 'video/mp4',
                'file_size': 104857600,  # 100MB
                'duration': 2700,  # 45 minutes
                'status': 'revision_required',
            },
            {
                'title': 'Counseling Session Notes',
                'file_type': 'application/pdf',
                'file_size': 1048576,  # 1MB
                'duration': None,
                'status': 'pending',
            },
        ]

        for i, enrollment in enumerate(enrollments[:5]):
            data = submission_data[i % len(submission_data)]
            node = session_nodes[i % len(session_nodes)]
            
            submission, created = PracticumSubmission.objects.get_or_create(
                enrollment=enrollment,
                node=node,
                version=1,
                defaults={
                    'status': data['status'],
                    'file_path': f'/uploads/practicum/{enrollment.user.username}/{data["title"].lower().replace(" ", "_")}.{data["file_type"].split("/")[1]}',
                    'file_type': data['file_type'],
                    'file_size': data['file_size'],
                    'duration_seconds': data['duration'],
                    'metadata': {
                        'title': data['title'],
                        'description': f'{data["title"]} submitted by {enrollment.user.get_full_name()}',
                    },
                    'submitted_at': timezone.now() - timedelta(days=random.randint(1, 14)),
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✓ Created Practicum: {data['title']} by {enrollment.user.email}"))

                # 4. Create review for approved/revision_required submissions
                if data['status'] in ['approved', 'revision_required']:
                    scores = {
                        'Scripture Use': random.randint(70, 95),
                        'Communication': random.randint(65, 90),
                        'Pastoral Care': random.randint(60, 95),
                        'Professionalism': random.randint(75, 100),
                    }
                    total = sum(scores.values()) / 4
                    
                    review, _ = SubmissionReview.objects.get_or_create(
                        submission=submission,
                        reviewer=reviewer,
                        defaults={
                            'status': data['status'],
                            'dimension_scores': scores,
                            'total_score': round(total, 2),
                            'comments': 'Good work! Keep improving your delivery.' if data['status'] == 'approved' else 'Please revise the introduction section and resubmit.',
                            'reviewed_at': timezone.now() - timedelta(days=random.randint(0, 7)),
                        }
                    )
