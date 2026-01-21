import random
import requests
from django.core.files.base import ContentFile
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone

from apps.platform.models import PlatformSettings
from apps.blueprints.models import AcademicBlueprint
from apps.core.models import Program
from apps.curriculum.models import CurriculumNode
from apps.assessments.models import AssessmentResult, Rubric
from apps.progression.models import InstructorAssignment, Enrollment, NodeCompletion, Announcement
from apps.practicum.models import PracticumSubmission, SubmissionReview


User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds Crossview Theology School with full simulation data'

    def download_image(self, url):
        try:
            # User-Agent is required for some Unsplash URLs to avoid 403
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                return ContentFile(response.content)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    Failed to download image: {e}'))
        return None

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
        # Ensure Blue Branding (Crossview Brand)
        settings.primary_color = "#3B82F6"  # Blue 500
        settings.secondary_color = "#1E40AF"  # Blue 800
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
        """Create programs with individual instructor assignments."""
        programs = []
        john, mary = instructors[0], instructors[1]
        
        # Program 1: Certificate in Biblical Studies (Instructor: John)
        program1 = self._create_program(
            blueprint,
            name='Certificate in Biblical Studies',
            code='CBS-101',
            description='Foundation course covering Old and New Testament survey, biblical interpretation, and Christian doctrine.',
            image_url='https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800&q=80',
            image_name='cbs.jpg'
        )
        self._assign_instructor(program1, john, is_primary=True)
        self._create_cbs_curriculum(program1)
        programs.append(program1)
        
        # Program 2: Diploma in Pastoral Ministry (Instructor: John)
        program2 = self._create_program(
            blueprint,
            name='Diploma in Pastoral Ministry',
            code='DPM-201',
            description='Comprehensive training for pastoral leadership, counseling, and church administration.',
            image_url='https://images.unsplash.com/photo-1475721027760-74cf05b56ca1?w=800&q=80',
            image_name='dpm.jpg'
        )
        self._assign_instructor(program2, john, is_primary=True)
        self._create_dpm_curriculum(program2)
        programs.append(program2)
        
        # Program 3: Diploma in Christian Counseling (Instructor: Mary)
        program3 = self._create_program(
            blueprint,
            name='Diploma in Christian Counseling',
            code='DCC-201',
            description='Equipping counselors with biblical wisdom and psychological insights.',
            image_url='https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
            image_name='counseling.jpg'
        )
        self._assign_instructor(program3, mary, is_primary=True)
        self._create_generic_curriculum(program3, 'Counseling')
        programs.append(program3)

        # Program 4: Certificate in Youth Ministry (Instructor: Mary)
        program4 = self._create_program(
            blueprint,
            name='Certificate in Youth Ministry',
            code='CYM-101',
            description='Strategies for reaching and discipling the next generation.',
            image_url='https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80',
            image_name='youth.jpg'
        )
        self._assign_instructor(program4, mary, is_primary=True)
        self._create_generic_curriculum(program4, 'Youth Ministry')
        programs.append(program4)

        # Program 5: Bachelor of Theology (Instructor: John)
        program5 = self._create_program(
            blueprint,
            name='Bachelor of Theology',
            code='BTH-301',
            description='Advanced theological studies for future theologians and pastors.',
            image_url='https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80',
            image_name='bth.jpg'
        )
        self._assign_instructor(program5, john, is_primary=True)
        self._create_generic_curriculum(program5, 'Theology')
        programs.append(program5)

        # Program 6: Diploma in Worship Arts (Instructor: Mary)
        program6 = self._create_program(
            blueprint,
            name='Diploma in Worship Arts',
            code='DWA-201',
            description='Theology of worship, music theory, and team dynamics.',
            image_url='https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80',
            image_name='worship.jpg'
        )
        self._assign_instructor(program6, mary, is_primary=True)
        self._create_generic_curriculum(program6, 'Worship')
        programs.append(program6)

        # Program 7: Certificate in Missions & Evangelism (Instructor: John)
        program7 = self._create_program(
            blueprint,
            name='Certificate in Missions & Evangelism',
            code='CME-101',
            description='Preparing for cross-cultural ministry and local outreach.',
            image_url='https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800&q=80',
            image_name='missions.jpg'
        )
        self._assign_instructor(program7, john, is_primary=True)
        self._create_generic_curriculum(program7, 'Missions')
        programs.append(program7)

        # Program 8: Advanced Diploma in Church Leadership (Instructor: Mary)
        program8 = self._create_program(
            blueprint,
            name='Advanced Diploma in Church Leadership',
            code='ADCL-301',
            description='Strategic leadership for large congregations and organizations.',
            image_url='https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
            image_name='leadership_adv.jpg'
        )
        self._assign_instructor(program8, mary, is_primary=True)
        self._create_generic_curriculum(program8, 'Leadership')
        programs.append(program8)

        # Program 9: Certificate in Children's Ministry (Instructor: Mary)
        program9 = self._create_program(
            blueprint,
            name='Certificate in Children\'s Ministry',
            code='CCM-101',
            description='Effective teaching methods and care for children in the church.',
            image_url='https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
            image_name='children.jpg'
        )
        self._assign_instructor(program9, mary, is_primary=True)
        self._create_generic_curriculum(program9, 'Children')
        programs.append(program9)

        # Program 10: Diploma in Biblical Languages (Instructor: John)
        program10 = self._create_program(
            blueprint,
            name='Diploma in Biblical Languages',
            code='DBL-201',
            description='In-depth study of Biblical Hebrew and Koine Greek.',
            image_url='https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=800&q=80',
            image_name='languages.jpg'
        )
        self._assign_instructor(program10, john, is_primary=True)
        self._create_generic_curriculum(program10, 'Languages')
        programs.append(program10)
        
        return programs

    def _create_generic_curriculum(self, program, topic):
        """Create a standard generic curriculum."""
        courses = [
            {
                'title': f'Introduction to {topic}',
                'code': f'{topic[:3].upper()}-101',
                'description': f'Basic principles of {topic}.',
                'modules': [
                    {
                        'title': 'Foundations',
                        'lessons': [
                            {'title': 'Key Concepts', 'sessions': ['Definition', 'History', 'Importance']},
                            {'title': 'Best Practices', 'sessions': ['Methods', 'Application', 'Case Studies']},
                        ]
                    }
                ]
            },
            {
                'title': f'Advanced {topic}',
                'code': f'{topic[:3].upper()}-201',
                'description': f'Deeper look into {topic}.',
                'modules': [
                    {
                        'title': 'Applied Skills',
                        'lessons': [
                            {'title': 'Field Work', 'sessions': ['Planning', 'Execution', 'Review']},
                        ]
                    }
                ]
            }
        ]
        self._build_curriculum_tree(program, courses)

    def _create_program(self, blueprint, name, code, description, image_url, image_name):
        program, created = Program.objects.get_or_create(
            name=name,
            defaults={
                'blueprint': blueprint,
                'code': code,
                'description': description,
                'is_published': True,
            }
        )
        
        if created or not program.thumbnail:
            self.stdout.write(f'  Downloading image for {name}...')
            img = self.download_image(image_url)
            if img:
                program.thumbnail.save(image_name, img)
                program.save()
        
        self._log(created, 'Program', program.name)

        return program

    def _assign_instructor(self, program, instructor, is_primary=False):
        """Assign an instructor to a program."""
        InstructorAssignment.objects.get_or_create(
            instructor=instructor, program=program,
            defaults={'is_primary': is_primary}
        )
        self.stdout.write(f"    → Assigned {instructor.first_name} to {program.name}")

    def _create_cbs_curriculum(self, program):
        """
        Create curriculum for Certificate in Biblical Studies.
        Uses 2-level hierarchy matching course builder UI:
        - Section (node_type='Module', parent=None) = collapsible panel
        - Lesson (child of section) = items inside the panel
        """
        from apps.content.models import ContentBlock
        from apps.assessments.models import Quiz, Question, QuestionOption, Assignment

        # Section 1: Old Testament Survey
        ot_section = self._create_section(program, 'Old Testament Survey', 0)
        
        # Lessons for OT Section
        lesson1 = self._create_lesson(program, ot_section, 'Introduction to Genesis', 0, 'text')
        self._add_text_content(lesson1, 
            '<h2>Introduction to Genesis</h2>'
            '<p>Genesis, meaning "origins" or "beginnings," is the first book of the Bible and lays the foundation for all of Scripture. '
            'This lesson explores the creation narrative, the fall of humanity, and God\'s covenant with Abraham.</p>'
            '<h3>Key Themes</h3>'
            '<ul><li>Creation and the sovereignty of God</li><li>The origin of sin and its consequences</li>'
            '<li>God\'s promise of redemption through Abraham\'s seed</li></ul>'
            '<h3>Reading Assignment</h3><p>Read Genesis chapters 1-12 before proceeding to the next lesson.</p>'
        )
        
        lesson2 = self._create_lesson(program, ot_section, 'The Pentateuch: Law and Covenant', 1, 'video')
        self._add_video_content(lesson2, 'https://www.youtube.com/watch?v=GQI72THyO5I')
        self._add_text_content(lesson2,
            '<h3>The Five Books of Moses</h3>'
            '<p>The Pentateuch (Torah) includes Genesis, Exodus, Leviticus, Numbers, and Deuteronomy. '
            'These books establish the foundation of Israel\'s identity, law, and covenant relationship with God.</p>'
        )
        
        lesson3 = self._create_lesson(program, ot_section, 'Historical Books: Joshua to Esther', 2, 'text')
        self._add_text_content(lesson3,
            '<h2>Historical Books Overview</h2>'
            '<p>The Historical Books cover Israel\'s history from the conquest of Canaan through the post-exilic period. '
            'Key themes include God\'s faithfulness, the consequences of disobedience, and the hope of restoration.</p>'
            '<h3>Books Covered</h3>'
            '<ul><li>Joshua - Conquest of the Promised Land</li><li>Judges - Cycle of sin and deliverance</li>'
            '<li>Ruth - Story of redemption and loyalty</li><li>1-2 Samuel - Rise of the monarchy</li>'
            '<li>1-2 Kings - Division and exile</li><li>1-2 Chronicles - Retelling from priestly perspective</li>'
            '<li>Ezra-Nehemiah - Return and rebuilding</li><li>Esther - God\'s providence in exile</li></ul>'
        )
        
        lesson4 = self._create_lesson(program, ot_section, 'Wisdom Literature: Psalms and Proverbs', 3, 'text')
        self._add_text_content(lesson4,
            '<h2>Wisdom Literature</h2>'
            '<p>The Wisdom Books (Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon) address life\'s deepest questions '
            'from a perspective of faith in God.</p>'
            '<h3>Key Characteristics</h3>'
            '<ul><li>Poetry and literary artistry</li><li>Practical wisdom for daily living</li>'
            '<li>Wrestling with suffering and injustice</li><li>The fear of the Lord as the beginning of wisdom</li></ul>'
        )
        
        lesson5 = self._create_lesson(program, ot_section, 'Major Prophets: Isaiah to Daniel', 4, 'video')
        self._add_video_content(lesson5, 'https://www.youtube.com/watch?v=qV9OKieZ4qY')
        self._add_text_content(lesson5,
            '<h3>The Prophetic Message</h3>'
            '<p>The Major Prophets (Isaiah, Jeremiah, Lamentations, Ezekiel, Daniel) called Israel to repentance '
            'and pointed forward to the coming Messiah and the ultimate restoration of God\'s kingdom.</p>'
        )
        
        # Quiz for OT Section
        self._create_quiz_for_section(program, ot_section, 'Old Testament Foundations Quiz', [
            {'text': 'Who traditionally authored the Pentateuch?', 'options': ['Moses', 'David', 'Solomon', 'Abraham'], 'correct': 0},
            {'text': 'Which book begins with "In the beginning God created..."?', 'options': ['Genesis', 'Exodus', 'Psalms', 'Isaiah'], 'correct': 0},
            {'text': 'The Wisdom Books primarily focus on:', 'options': ['Practical living and life questions', 'Historical events', 'Prophecy', 'Law'], 'correct': 0},
            {'text': 'Which prophet saw a vision of dry bones coming to life?', 'options': ['Ezekiel', 'Isaiah', 'Jeremiah', 'Daniel'], 'correct': 0},
        ])

        # Section 2: New Testament Survey
        nt_section = self._create_section(program, 'New Testament Survey', 1)
        
        lesson6 = self._create_lesson(program, nt_section, 'The Synoptic Gospels: Matthew, Mark, Luke', 0, 'text')
        self._add_text_content(lesson6,
            '<h2>The Synoptic Gospels</h2>'
            '<p>Matthew, Mark, and Luke are called "Synoptic" (meaning "seeing together") because they share similar content and structure. '
            'Each Gospel presents Jesus from a unique perspective.</p>'
            '<h3>Distinctive Emphases</h3>'
            '<ul><li><strong>Matthew</strong> - Jesus as the Jewish Messiah, fulfillment of prophecy</li>'
            '<li><strong>Mark</strong> - Jesus as the Suffering Servant, action-focused narrative</li>'
            '<li><strong>Luke</strong> - Jesus as Savior of all people, emphasis on the marginalized</li></ul>'
        )
        
        lesson7 = self._create_lesson(program, nt_section, 'The Gospel of John: Signs and Discourses', 1, 'video')
        self._add_video_content(lesson7, 'https://www.youtube.com/watch?v=G-2e9mMf7E8')
        self._add_text_content(lesson7,
            '<h3>The Unique Fourth Gospel</h3>'
            '<p>John\'s Gospel is distinct from the Synoptics, focusing on seven miraculous signs and extended discourses. '
            'The famous "I Am" statements reveal Jesus\' divine identity.</p>'
            '<h3>The Seven "I Am" Statements</h3>'
            '<ol><li>I am the Bread of Life (6:35)</li><li>I am the Light of the World (8:12)</li>'
            '<li>I am the Gate (10:9)</li><li>I am the Good Shepherd (10:11)</li>'
            '<li>I am the Resurrection and the Life (11:25)</li><li>I am the Way, Truth, and Life (14:6)</li>'
            '<li>I am the True Vine (15:1)</li></ol>'
        )
        
        lesson8 = self._create_lesson(program, nt_section, 'Acts: The Early Church', 2, 'text')
        self._add_text_content(lesson8,
            '<h2>The Book of Acts</h2>'
            '<p>Acts records the birth and expansion of the early church from Jerusalem to Rome. '
            'Written by Luke as a sequel to his Gospel, it shows the Holy Spirit empowering the apostles '
            'to fulfill the Great Commission.</p>'
            '<h3>Key Events</h3>'
            '<ul><li>Pentecost and the coming of the Spirit</li><li>Stephen\'s martyrdom</li>'
            '<li>Conversion of Saul (Paul)</li><li>Council of Jerusalem</li><li>Paul\'s missionary journeys</li></ul>'
        )
        
        lesson9 = self._create_lesson(program, nt_section, 'Pauline Epistles: Romans to Philemon', 3, 'text')
        self._add_text_content(lesson9,
            '<h2>The Letters of Paul</h2>'
            '<p>Paul\'s 13 epistles form the doctrinal backbone of the New Testament, addressing theology, '
            'church practice, and Christian living.</p>'
            '<h3>Categories of Pauline Letters</h3>'
            '<ul><li><strong>Major Epistles</strong>: Romans, 1-2 Corinthians, Galatians</li>'
            '<li><strong>Prison Epistles</strong>: Ephesians, Philippians, Colossians, Philemon</li>'
            '<li><strong>Pastoral Epistles</strong>: 1-2 Timothy, Titus</li>'
            '<li><strong>Eschatological</strong>: 1-2 Thessalonians</li></ul>'
        )
        
        lesson10 = self._create_lesson(program, nt_section, 'General Epistles and Revelation', 4, 'video')
        self._add_video_content(lesson10, 'https://www.youtube.com/watch?v=5nvVVcYD-0w')
        self._add_text_content(lesson10,
            '<h3>The General Epistles</h3>'
            '<p>Hebrews, James, 1-2 Peter, 1-3 John, and Jude address various churches and individuals. '
            'Revelation concludes the New Testament with apocalyptic visions of Christ\'s ultimate victory.</p>'
        )
        
        # Quiz for NT Section
        self._create_quiz_for_section(program, nt_section, 'New Testament Knowledge Check', [
            {'text': 'Which Gospel is NOT a Synoptic Gospel?', 'options': ['John', 'Matthew', 'Mark', 'Luke'], 'correct': 0},
            {'text': 'The Book of Acts was written by:', 'options': ['Luke', 'Paul', 'Peter', 'John'], 'correct': 0},
            {'text': 'How many epistles did Paul write?', 'options': ['13', '7', '21', '5'], 'correct': 0},
            {'text': 'The last book of the Bible is:', 'options': ['Revelation', 'Jude', 'Malachi', '3 John'], 'correct': 0},
        ])

        # Section 3: Biblical Interpretation
        interp_section = self._create_section(program, 'Biblical Interpretation', 2)
        
        lesson11 = self._create_lesson(program, interp_section, 'Introduction to Hermeneutics', 0, 'video')
        self._add_video_content(lesson11, 'https://www.youtube.com/watch?v=vFwNZNyDu9k')
        self._add_text_content(lesson11,
            '<h3>What is Hermeneutics?</h3>'
            '<p>Hermeneutics is the science and art of biblical interpretation. This lesson covers the fundamental '
            'principles for understanding Scripture accurately and applying it faithfully.</p>'
        )
        
        lesson12 = self._create_lesson(program, interp_section, 'Understanding Context and Genre', 1, 'text')
        self._add_text_content(lesson12,
            '<h2>Context and Genre</h2>'
            '<p>Proper interpretation requires understanding both the historical context and literary genre of each passage.</p>'
            '<h3>Types of Context</h3>'
            '<ul><li><strong>Historical Context</strong>: When was it written? To whom? Why?</li>'
            '<li><strong>Literary Context</strong>: What comes before and after?</li>'
            '<li><strong>Canonical Context</strong>: How does it fit in the whole Bible?</li></ul>'
            '<h3>Biblical Genres</h3>'
            '<ul><li>Narrative, Law, Poetry, Prophecy, Wisdom, Gospel, Epistle, Apocalyptic</li></ul>'
        )
        
        lesson13 = self._create_lesson(program, interp_section, 'Application in Modern Life', 2, 'text')
        self._add_text_content(lesson13,
            '<h2>Bridging the Gap</h2>'
            '<p>The goal of Bible study is not just understanding but transformation. '
            'This lesson explores how to move from ancient text to contemporary application.</p>'
            '<h3>Application Process</h3>'
            '<ol><li>Determine the original meaning (exegesis)</li>'
            '<li>Identify the timeless principle</li>'
            '<li>Apply the principle to modern contexts</li></ol>'
        )
        
        # Assignment for Interpretation Section
        assignment, _ = Assignment.objects.get_or_create(
            program=program,
            title='Personal Bible Study Paper',
            defaults={
                'description': 'Demonstrate your ability to interpret and apply Scripture using the hermeneutical principles learned.',
                'instructions': '<h3>Assignment Instructions</h3>'
                    '<p>Choose a passage of 10-15 verses from the Old or New Testament. Write a 1000-word paper that:</p>'
                    '<ol><li>Examines the historical and literary context</li>'
                    '<li>Explains the passage\'s original meaning</li>'
                    '<li>Identifies timeless principles</li>'
                    '<li>Provides specific, practical applications for today</li></ol>'
                    '<p><strong>Due Date:</strong> End of Week 8</p>'
                    '<p><strong>Format:</strong> PDF or Word document</p>',
                'weight': 25,
                'submission_type': 'file',
                'is_published': True
            }
        )
        
        # Create assignment node as lesson
        assign_lesson = self._create_lesson(program, interp_section, 'Personal Bible Study Paper', 3, 'assignment')
        assign_lesson.properties['assignment_id'] = assignment.id
        assign_lesson.save()
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Created CBS curriculum (3 sections, 14 items including 2 quizzes and 1 assignment)'))

    def _create_section(self, program, title, position):
        """Create a section (top-level Module with no parent)."""
        section, created = CurriculumNode.objects.get_or_create(
            program=program,
            parent=None,
            node_type='Module',
            title=title,
            defaults={'position': position, 'is_published': True}
        )
        return section
    
    def _create_lesson(self, program, section, title, position, lesson_type='text'):
        """Create a lesson as child of a section."""
        lesson, created = CurriculumNode.objects.get_or_create(
            program=program,
            parent=section,
            node_type='Lesson',
            title=title,
            defaults={
                'position': position, 
                'is_published': True,
                'properties': {'lesson_type': lesson_type}
            }
        )
        return lesson
    
    def _add_text_content(self, node, html_content):
        """Add rich text content block to a node."""
        from apps.content.models import ContentBlock
        ContentBlock.objects.get_or_create(
            node=node,
            block_type='RICHTEXT',
            defaults={
                'position': ContentBlock.objects.filter(node=node).count(),
                'data': {'content': html_content}
            }
        )
    
    def _add_video_content(self, node, url):
        """Add video content block to a node."""
        from apps.content.models import ContentBlock
        ContentBlock.objects.get_or_create(
            node=node,
            block_type='VIDEO',
            defaults={
                'position': ContentBlock.objects.filter(node=node).count(),
                'data': {'url': url, 'provider': 'youtube'}
            }
        )
    
    def _create_quiz_for_section(self, program, section, title, questions_data):
        """Create a quiz as a lesson in the section."""
        from apps.assessments.models import Quiz, Question, QuestionOption
        
        # Create quiz lesson node (keep as Lesson type - Quiz is attached via quiz.node)
        quiz_lesson = self._create_lesson(program, section, title, 
            CurriculumNode.objects.filter(parent=section).count(), 'quiz')
        # Don't change node_type - 'Lesson' is the valid type, 'Quiz' is not in blueprint
        

        # Create Quiz object
        quiz, _ = Quiz.objects.get_or_create(
            node=quiz_lesson,
            title=title,
            defaults={
                'description': f'Test your knowledge from the {section.title} section.',
                'pass_threshold': 70,
                'is_published': True
            }
        )
        
        # Create questions
        for i, q_data in enumerate(questions_data):
            question, _ = Question.objects.get_or_create(
                quiz=quiz,
                text=q_data['text'],
                defaults={'question_type': 'mcq', 'points': 10, 'position': i, 'answer_data': {}}
            )
            for j, opt_text in enumerate(q_data['options']):
                QuestionOption.objects.get_or_create(
                    question=question,
                    text=opt_text,
                    defaults={'is_correct': (j == q_data['correct']), 'position': j}
                )
        
        return quiz


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
        """Create grade data for students on section-level (Module) nodes."""
        # Use Module nodes (sections) for grading since we use 2-level hierarchy
        sections = CurriculumNode.objects.filter(program=program, node_type='Module', parent__isnull=True)
        
        for enrollment in enrollments:
            for section in sections:
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
                    node=section,
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
                        'lecturer_comments': f'Good work on {section.title}!' if total >= 70 else 'Needs improvement',
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"  ✓ Created grades for {enrollment.user.email} - {section.title}"))

    def _create_node_completions(self, program, enrollments):
        """Mark some lessons as completed for each student."""
        # Use Lesson nodes since we use 2-level hierarchy (Session is no longer used for CBS)
        lessons = list(CurriculumNode.objects.filter(program=program, node_type='Lesson'))
        if not lessons:
            # Fallback to Session for other programs using old 4-level hierarchy
            lessons = list(CurriculumNode.objects.filter(program=program, node_type='Session'))
        
        for enrollment in enrollments:
            # Complete 40-80% of sessions randomly
            if not lessons:
                continue
            num_to_complete = random.randint(int(len(lessons) * 0.4), int(len(lessons) * 0.8))
            completed_lessons = random.sample(lessons, num_to_complete)
            
            for lesson in completed_lessons:
                completion, created = NodeCompletion.objects.get_or_create(
                    enrollment=enrollment,
                    node=lesson,
                    defaults={
                        'completed_at': timezone.now() - timedelta(days=random.randint(1, 30)),
                        'completion_type': 'view',
                    }
                )
            
            progress = (len(completed_lessons) / len(lessons)) * 100 if lessons else 0
            self.stdout.write(f"  - {enrollment.user.first_name}: {progress:.0f}% progress ({num_to_complete}/{len(lessons)} lessons)")

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
