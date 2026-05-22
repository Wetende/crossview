from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

# Import models
from apps.core.models import InstructorProfile, Program
from apps.curriculum.models import CurriculumNode
from apps.progression.models import Enrollment, NodeCompletion
from apps.assessments.models import (
    Assignment, AssignmentSubmission, Quiz, Question, 
    QuestionOption, QuizAttempt
)
from apps.content.models import ContentBlock
from apps.blueprints.models import AcademicBlueprint

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds comprehensive data for Peter (Student) and Mary (Instructor) with lessons, content, quizzes, and assignments.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("=== Starting Comprehensive Seed Process ==="))

        try:
            with transaction.atomic():
                # 1. Fetch/Create Users
                mary = self._get_or_create_mary()
                peter = self._get_or_create_peter()

                # 2. Ensure Instructor Profile
                self._ensure_instructor_profile(mary)

                # 3. Create Main Program (where Peter is enrolled)
                program = self._create_program(mary)

                # 4. Create Curriculum with 5 Lessons
                module1, lessons = self._create_curriculum(program)

                # 5. Add Content to Lessons (with Unsplash images)
                self._add_lesson_content(lessons)

                # 6. Create 2 Quizzes with Different Question Types
                quiz1, quiz2 = self._create_quizzes(lessons)

                # 7. Create 3 Assignments
                assignments = self._create_assignments(program)

                # 8. Enroll Peter
                enrollment = self._enroll_peter(peter, program)

                # 9. Add Progress Data
                self._add_progress_data(enrollment, lessons)

                # 10. Add Quiz Attempts
                self._add_quiz_attempts(enrollment, [quiz1, quiz2])

                # 11. Add Assignment Submissions with Grading
                self._add_assignment_submissions(enrollment, assignments, mary)

                # 12. Create 4 Additional Courses for Mary
                self._create_additional_courses(mary)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding data: {e}"))
            raise e

        self.stdout.write(self.style.SUCCESS("\n=== Seed Process Completed Successfully! ==="))
        self.stdout.write("Data created:")
        self.stdout.write("  - 5 Courses (1 with Peter enrolled)")
        self.stdout.write("  - 5 Lessons with content blocks (Unsplash images)")
        self.stdout.write("  - 2 Quizzes with mixed question types")
        self.stdout.write("  - 3 Assignments (all graded)")
        self.stdout.write("  - Student progress and completions")

    def _get_or_create_mary(self):
        mary, created = User.objects.get_or_create(
            email="mary@instructor.com",
            defaults={
                "username": "mary_inst",
                "first_name": "Mary",
                "last_name": "Instructor",
                "is_staff": True
            }
        )
        if created:
            mary.set_password("password123")
            mary.save()
            self.stdout.write(self.style.SUCCESS(f"✓ Created Mary: {mary.email}"))
        else:
            self.stdout.write(f"✓ Found Mary: {mary.email}")
        return mary

    def _get_or_create_peter(self):
        peter, created = User.objects.get_or_create(
            email="peter@student.com",
            defaults={
                "username": "peter_stu",
                "first_name": "Peter",
                "last_name": "Student"
            }
        )
        if created:
            peter.set_password("password123")
            peter.save()
            self.stdout.write(self.style.SUCCESS(f"✓ Created Peter: {peter.email}"))
        else:
            self.stdout.write(f"✓ Found Peter: {peter.email}")
        return peter

    def _ensure_instructor_profile(self, mary):
        profile, created = InstructorProfile.objects.get_or_create(
            user=mary,
            defaults={
                "status": "approved",
                "bio": "Experienced Systems Architect with 15 years in the industry.",
                "job_title": "Senior Systems Architect",
                "teaching_experience": "Guest lecturer at Tech University."
            }
        )
        if not created and profile.status != "approved":
            profile.status = "approved"
            profile.save()
        self.stdout.write("✓ Instructor profile ready")

    def _create_program(self, mary):
        blueprint = AcademicBlueprint.objects.first()
        if not blueprint:
            blueprint = AcademicBlueprint.objects.create(
                name="Default Blueprint",
                hierarchy_structure=["Module", "Lesson"],
                grading_logic={"type": "weighted", "components": []}
            )

        program, created = Program.objects.get_or_create(
            code="ADV-SYS-101",
            defaults={
                "name": "Introduction to Advanced Systems",
                "description": "A comprehensive course on modern system architecture patterns.",
                "blueprint": blueprint,
                "is_published": True,
                "submission_status": "approved",
                "level": "Intermediate",
                "duration_hours": 40,
                "video_hours": 12,
                "submitted_by": mary,
                "submitted_at": timezone.now() - timedelta(days=30),
                "category": "Technology",
                "badge_type": "hot"
            }
        )
        
        # Set thumbnail URL (stored in custom_pricing for now as workaround)
        if not program.custom_pricing.get("thumbnail_url"):
            program.custom_pricing["thumbnail_url"] = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=450&fit=crop"
            program.save()
        
        if mary not in program.instructors.all():
            program.instructors.add(mary)
        
        self.stdout.write(self.style.SUCCESS(f"✓ Program: {program.name}"))
        return program

    def _create_curriculum(self, program):
        module1 = CurriculumNode.objects.filter(
            program=program, 
            title="Module 1: System Architecture Fundamentals"
        ).first()
        
        if not module1:
            module1 = CurriculumNode(
                program=program,
                title="Module 1: System Architecture Fundamentals",
                node_type="Module",
                description="Core concepts and patterns in system design.",
                position=0,
                is_published=True
            )
            module1.save(skip_validation=True)

        lesson_data = [
            {
                "title": "Lesson 1: Introduction to System Architecture",
                "description": "Overview of system architecture and design principles.",
                "thumbnail": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop"
            },
            {
                "title": "Lesson 2: Scalability Patterns",
                "description": "Understanding scalability, load balancing, and caching.",
                "thumbnail": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop"
            },
            {
                "title": "Lesson 3: Microservices vs Monoliths",
                "description": "Comparing architectural approaches and trade-offs.",
                "thumbnail": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=225&fit=crop"
            },
            {
                "title": "Lesson 4: Database Design Strategies",
                "description": "SQL vs NoSQL, sharding, and replication.",
                "thumbnail": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=225&fit=crop"
            },
            {
                "title": "Lesson 5: Security Best Practices",
                "description": "Authentication, authorization, and data protection.",
                "thumbnail": "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&h=225&fit=crop"
            }
        ]

        lessons = []
        for idx, data in enumerate(lesson_data):
            lesson = CurriculumNode.objects.filter(
                parent=module1,
                program=program,
                title=data["title"]
            ).first()
            
            if not lesson:
                lesson = CurriculumNode(
                    parent=module1,
                    program=program,
                    title=data["title"],
                    node_type="Lesson",
                    description=data["description"],
                    position=idx,
                    is_published=True,
                    properties={"thumbnail": data["thumbnail"]}
                )
                lesson.save(skip_validation=True)
            else:
                # Update existing lesson with thumbnail
                if not lesson.properties.get("thumbnail"):
                    lesson.properties["thumbnail"] = data["thumbnail"]
                    lesson.save(skip_validation=True)
            
            lessons.append(lesson)

        self.stdout.write(self.style.SUCCESS(f"✓ Created {len(lessons)} lessons with thumbnails"))
        return module1, lessons

    def _add_lesson_content(self, lessons):
        content_data = [
            # Lesson 1 content
            [
                {"type": "IMAGE", "data": {"url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200", "caption": "Modern technology and connectivity"}},
                {"type": "RICHTEXT", "data": {"html": "<h2>Welcome to System Architecture</h2><p>In this lesson, we'll explore the fundamentals of designing robust systems.</p>"}},
                {"type": "VIDEO", "data": {"provider": "youtube", "url": "https://youtube.com/watch?v=dQw4w9WgXcQ", "duration": 600}},
                {"type": "RICHTEXT", "data": {"html": "<h3>Key Concepts</h3><ul><li>Modularity</li><li>Separation of Concerns</li><li>Abstraction</li></ul>"}}
            ],
            # Lesson 2 content
            [
                {"type": "IMAGE", "data": {"url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200", "caption": "Scalable infrastructure"}},
                {"type": "RICHTEXT", "data": {"html": "<h2>Scalability Patterns</h2><p>Learn how to build systems that scale.</p>"}},
                {"type": "VIDEO", "data": {"provider": "youtube", "url": "https://youtube.com/watch?v=scalability", "duration": 720}},
                {"type": "DOCUMENT", "data": {"file_path": "media/scalability-guide.pdf", "allow_download": True}}
            ],
            # Lesson 3 content
            [
                {"type": "IMAGE", "data": {"url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200", "caption": "Distributed systems architecture"}},
                {"type": "RICHTEXT", "data": {"html": "<h2>Microservices vs Monoliths</h2><p>Understanding the trade-offs between different architectural styles.</p>"}},
                {"type": "VIDEO", "data": {"provider": "vimeo", "url": "https://vimeo.com/123456", "duration": 540}},
            ],
            # Lesson 4 content
            [
                {"type": "IMAGE", "data": {"url": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200", "caption": "Database architecture and data flow"}},
                {"type": "RICHTEXT", "data": {"html": "<h2>Database Design</h2><p>Choosing the right database for your use case.</p>"}},
                {"type": "IMAGE", "data": {"url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200", "caption": "Data analytics dashboard"}},
                {"type": "RICHTEXT", "data": {"html": "<p>Sharding, replication, and consistency models.</p>"}}
            ],
            # Lesson 5 content
            [
                {"type": "IMAGE", "data": {"url": "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1200", "caption": "Cybersecurity concept"}},
                {"type": "RICHTEXT", "data": {"html": "<h2>Security Best Practices</h2><p>Protecting your systems from threats.</p>"}},
                {"type": "VIDEO", "data": {"provider": "youtube", "url": "https://youtube.com/watch?v=security", "duration": 480}},
                {"type": "DOCUMENT", "data": {"file_path": "media/security-checklist.pdf", "allow_download": True}}
            ]
        ]

        for lesson, blocks in zip(lessons, content_data):
            for idx, block_info in enumerate(blocks):
                ContentBlock.objects.get_or_create(
                    node=lesson,
                    position=idx,
                    defaults={
                        "block_type": block_info["type"],
                        "data": block_info["data"]
                    }
                )

        self.stdout.write(self.style.SUCCESS("✓ Added content blocks with Unsplash images to all lessons"))

    def _create_quizzes(self, lessons):
        # Quiz 1 - After Lesson 2 (Mixed question types)
        quiz1, _ = Quiz.objects.get_or_create(
            node=lessons[1],
            title="Scalability Fundamentals Quiz",
            defaults={
                "description": "Test your understanding of scalability patterns.",
                "time_limit_minutes": 15,
                "max_attempts": 2,
                "pass_threshold": 70,
                "is_published": True,
                "show_answers_after_submit": True
            }
        )

        # Quiz 1 Questions
        if not quiz1.questions.exists():
            # MCQ Question
            q1 = Question.objects.create(
                quiz=quiz1,
                question_type="mcq",
                text="What is the primary benefit of horizontal scaling?",
                points=10,
                position=0,
                answer_data={"correct": 1}
            )
            for idx, option in enumerate(["Lower cost", "Better fault tolerance and scalability", "Simpler architecture", "Faster deployment"]):
                QuestionOption.objects.create(question=q1, text=option, is_correct=(idx == 1), position=idx)

            # True/False Question
            Question.objects.create(
                quiz=quiz1,
                question_type="true_false",
                text="Load balancers can only distribute HTTP traffic.",
                points=5,
                position=1,
                answer_data={"correct": False}
            )

            # Fill in the Blank Question  
            q3 = Question.objects.create(
                quiz=quiz1,
                question_type="fill_blank",
                text="_____ is a technique where data is stored temporarily to reduce database load.",
                points=5,
                position=2,
                answer_data={"gaps": 1}
            )
            from apps.assessments.models import QuestionGapAnswer
            QuestionGapAnswer.objects.create(question=q3, gap_index=0, accepted_answers=["Caching", "Cache"])

        # Quiz 2 - After Lesson 4 (Different question types)
        quiz2, _ = Quiz.objects.get_or_create(
            node=lessons[3],
            title="Database Design Quiz",
            defaults={
                "description": "Test your knowledge of database architectures.",
                "time_limit_minutes": 20,
                "max_attempts": 3,
                "pass_threshold": 75,
                "is_published": True
            }
        )

        # Quiz 2 Questions
        if not quiz2.questions.exists():
            # Multi-select MCQ
            q1 = Question.objects.create(
                quiz=quiz2,
                question_type="mcq_multi",
                text="Which of the following are NoSQL database types? (Select all that apply)",
                points=10,
                position=0,
                answer_data={"correct_indices": [0, 1, 3]}
            )
            for idx, option in enumerate(["Document Store", "Key-Value Store", "Relational", "Column Family"]):
                QuestionOption.objects.create(question=q1, text=option, is_correct=(idx in [0, 1, 3]), position=idx)

            # True/False
            Question.objects.create(
                quiz=quiz2,
                question_type="true_false",
                text="Sharding improves read performance by distributing data across multiple servers.",
                points=5,
                position=1,
                answer_data={"correct": True}
            )

            # MCQ
            q3 = Question.objects.create(
                quiz=quiz2,
                question_type="mcq",
                text="What does CAP theorem stand for?",
                points=10,
                position=2,
                answer_data={"correct": 2}
            )
            for idx, option in enumerate(["Cache, ACL, Performance", "Concurrent, Available, Partition", "Consistency, Availability, Partition Tolerance", "Cluster, API, Protocol"]):
                QuestionOption.objects.create(question=q3, text=option, is_correct=(idx == 2), position=idx)

        self.stdout.write(self.style.SUCCESS("✓ Created 2 quizzes with mixed question types"))
        return quiz1, quiz2

    def _create_assignments(self, program):
        assignments_data = [
            {
                "title": "System Architecture Essay",
                "description": "Write a 500-word essay comparing Monolithic and Microservices architectures.",
                "instructions": "Submit as PDF or Text. Cover pros, cons, and use cases.",
                "weight": 25
            },
            {
                "title": "Scalability Case Study",
                "description": "Analyze a real-world system and propose scalability improvements.",
                "instructions": "Choose a system (e.g., Twitter, Netflix) and document your analysis.",
                "weight": 30
            },
            {
                "title": "Database Design Project",
                "description": "Design a database schema for an e-commerce platform.",
                "instructions": "Include ER diagrams and justify your design choices.",
                "weight": 35
            }
        ]

        assignments = []
        for idx, data in enumerate(assignments_data):
            assignment, _ = Assignment.objects.get_or_create(
                program=program,
                title=data["title"],
                defaults={
                    "description": data["description"],
                    "instructions": data["instructions"],
                    "weight": data["weight"],
                    "submission_type": "text",
                    "is_published": True,
                    "due_date": timezone.now() + timedelta(days=7 * (idx + 1))
                }
            )
            assignments.append(assignment)

        self.stdout.write(self.style.SUCCESS(f"✓ Created {len(assignments)} assignments"))
        return assignments

    def _enroll_peter(self, peter, program):
        enrollment, created = Enrollment.objects.get_or_create(
            user=peter,
            program=program,
            defaults={
                "status": "active",
                "enrolled_at": timezone.now() - timedelta(days=14)
            }
        )
        self.stdout.write(self.style.SUCCESS(f"✓ Enrolled Peter"))
        return enrollment

    def _add_progress_data(self, enrollment, lessons):
        # Peter completed first 3 lessons
        for idx in range(3):
            NodeCompletion.objects.get_or_create(
                enrollment=enrollment,
                node=lessons[idx],
                defaults={
                    "completed_at": timezone.now() - timedelta(days=10 - idx * 2),
                    "completion_type": "view"
                }
            )
        self.stdout.write("✓ Added lesson completions (3/5)")

    def _add_quiz_attempts(self, enrollment, quizzes):
        # Quiz 1 attempt (passed)
        attempt1, _ = QuizAttempt.objects.get_or_create(
            enrollment=enrollment,
            quiz=quizzes[0],
            attempt_number=1,
            defaults={
                "started_at": timezone.now() - timedelta(days=8),
                "submitted_at": timezone.now() - timedelta(days=8),
                "answers": {
                    str(quizzes[0].questions.all()[0].id): 1,  # Correct
                    str(quizzes[0].questions.all()[1].id): False,  # Correct
                    str(quizzes[0].questions.all()[2].id): "Caching"  # Correct
                },
                "score": 100.0,
                "points_earned": 20,
                "points_possible": 20,
                "passed": True
            }
        )

        # Quiz 2 attempt (passed with lower score)
        attempt2, _ = QuizAttempt.objects.get_or_create(
            enrollment=enrollment,
            quiz=quizzes[1],
            attempt_number=1,
            defaults={
                "started_at": timezone.now() - timedelta(days=5),
                "submitted_at": timezone.now() - timedelta(days=5),
                "answers": {
                    str(quizzes[1].questions.all()[0].id): [0, 1, 3],  # Correct
                    str(quizzes[1].questions.all()[1].id): True,  # Correct
                    str(quizzes[1].questions.all()[2].id): 1  # Incorrect
                },
                "score": 80.0,
                "points_earned": 20,
                "points_possible": 25,
                "passed": True
            }
        )
        self.stdout.write("✓ Added quiz attempts (2/2 passed)")

    def _add_assignment_submissions(self, enrollment, assignments, mary):
        submissions_data = [
            {
                "text": "Monolithic architectures centralize all functionality in a single codebase, making deployment simple but scaling difficult. Microservices distribute functionality across independent services, enabling scalability but introducing complexity in deployment and inter-service communication. For small teams and simple applications, monoliths are more appropriate. For large-scale systems requiring independent scaling, microservices are better suited...",
                "score": 85.0,
                "feedback": "Excellent analysis, Peter! You clearly understand the trade-offs. Consider discussing data consistency patterns in distributed systems."
            },
            {
                "text": "Twitter handles over 500 million tweets per day. Key scalability challenges include: read-heavy workload, timeline generation, and global distribution. Proposed improvements: 1) Implement CDN for static content, 2) Use read replicas for timeline queries, 3) Employ event-driven architecture for real-time updates, 4) Partition data by geographic region...",
                "score": 92.0,
                "feedback": "Outstanding work! Your analysis is thorough and your proposals are well-justified. Great understanding of real-world scalability patterns."
            },
            {
                "text": "E-commerce Database Design:\n\nEntities: Users, Products, Orders, OrderItems, Payments, Inventory\n\nKey design decisions:\n- Users table with normalized address data\n- Products with category hierarchy\n- Orders with status tracking\n- Separate OrderItems for flexibility\n- Inventory tracking with optimistic locking\n\nI chose a relational model because e-commerce requires ACID transactions for payments and inventory. However, product catalog could use NoSQL for flexibility...",
                "score": 88.0,
                "feedback": "Very good design, Peter. Your justification for using RDBMS is sound. The inventory locking strategy shows good understanding of concurrency issues. Consider adding indexes for common query patterns."
            }
        ]

        for assignment, data in zip(assignments, submissions_data):
            AssignmentSubmission.objects.get_or_create(
                enrollment=enrollment,
                assignment=assignment,
                defaults={
                    "status": "graded",
                    "text_content": data["text"],
                    "submitted_at": timezone.now() - timedelta(days=12 - assignments.index(assignment) * 3),
                    "score": data["score"],
                    "feedback": data["feedback"],
                    "graded_by": mary,
                    "graded_at": timezone.now() - timedelta(days=10 - assignments.index(assignment) * 3)
                }
            )

        self.stdout.write(self.style.SUCCESS("✓ Added 3 graded assignment submissions"))

    def _create_additional_courses(self, mary):
        """Create 4 additional courses for Mary to showcase her teaching portfolio."""
        
        blueprint = AcademicBlueprint.objects.first()
        
        courses_data = [
            {
                "code": "WEB-DEV-201",
                "name": "Modern Web Development",
                "description": "Master frontend and backend web development with modern frameworks.",
                "level": "Intermediate",
                "duration_hours": 50,
                "video_hours": 15,
                "category": "Web Development",
                "badge_type": "hot",
                "thumbnail": "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=450&fit=crop",
                "lessons": [
                    {"title": "HTML5 & CSS3 Fundamentals", "desc": "Building responsive layouts", "image": "https://images.unsplash.com/photo-1547658719-da2b51169166?w=1200"},
                    {"title": "JavaScript ES6+", "desc": "Modern JavaScript features", "image": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=1200"},
                    {"title": "React Framework", "desc": "Component-based UI development", "image": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200"},
                ]
            },
            {
                "code": "CLOUD-301",
                "name": "Cloud Computing with AWS",
                "description": "Learn to design, deploy, and manage cloud infrastructure on AWS.",
                "level": "Advanced",
                "duration_hours": 60,
                "video_hours": 20,
                "category": "Cloud Computing",
                "badge_type": "special",
                "thumbnail": "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=450&fit=crop",
                "lessons": [
                    {"title": "AWS Core Services", "desc": "EC2, S3, and RDS fundamentals", "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200"},
                    {"title": "Serverless Architecture", "desc": "Lambda and API Gateway", "image": "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1200"},
                    {"title": "Infrastructure as Code", "desc": "CloudFormation and Terraform", "image": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200"},
                ]
            },
            {
                "code": "DATA-SCI-101",
                "name": "Introduction to Data Science",
                "description": "Explore data analysis, visualization, and machine learning basics.",
                "level": "Beginner",
                "duration_hours": 45,
                "video_hours": 18,
                "category": "Data Science",
                "badge_type": "new",
                "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                "lessons": [
                    {"title": "Python for Data Science", "desc": "NumPy and Pandas fundamentals", "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200"},
                    {"title": "Data Visualization", "desc": "Matplotlib and Seaborn", "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200"},
                    {"title": "Machine Learning Basics", "desc": "Supervised and unsupervised learning", "image": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200"},
                ]
            },
            {
                "code": "DEVOPS-401",
                "name": "DevOps Engineering Mastery",
                "description": "CI/CD pipelines, containerization, and Kubernetes orchestration.",
                "level": "Advanced",
                "duration_hours": 55,
                "video_hours": 22,
                "category": "DevOps",
                "thumbnail": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=450&fit=crop",
                "lessons": [
                    {"title": "Docker Containerization", "desc": "Building and managing containers", "image": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=1200"},
                    {"title": "Kubernetes Orchestration", "desc": "Deploy and scale containerized apps", "image": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200"},
                    {"title": "CI/CD with Jenkins", "desc": "Automated testing and deployment", "image": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200"},
                ]
            }
        ]

        for course_data in courses_data:
            # Create program
            program, created = Program.objects.get_or_create(
                code=course_data["code"],
                defaults={
                    "name": course_data["name"],
                    "description": course_data["description"],
                    "blueprint": blueprint,
                    "is_published": True,
                    "submission_status": "approved",
                    "level": course_data["level"],
                    "duration_hours": course_data["duration_hours"],
                    "video_hours": course_data["video_hours"],
                    "submitted_by": mary,
                    "submitted_at": timezone.now() - timedelta(days=60),
                    "category": course_data.get("category", "Technology"),
                    "badge_type": course_data.get("badge_type")
                }
            )
            
            # Set thumbnail URL
            if not program.custom_pricing.get("thumbnail_url"):
                program.custom_pricing["thumbnail_url"] = course_data["thumbnail"]
                program.save()
            
            if mary not in program.instructors.all():
                program.instructors.add(mary)

            # Create module
            module = CurriculumNode.objects.filter(
                program=program,
                title=f"Module 1: {course_data['name']} Essentials"
            ).first()
            
            if not module:
                module = CurriculumNode(
                    program=program,
                    title=f"Module 1: {course_data['name']} Essentials",
                    node_type="Module",
                    description=f"Core concepts of {course_data['name'].lower()}.",
                    position=0,
                    is_published=True
                )
                module.save(skip_validation=True)

            # Create lessons with content
            for idx, lesson_data in enumerate(course_data["lessons"]):
                lesson = CurriculumNode.objects.filter(
                    parent=module,
                    program=program,
                    title=lesson_data["title"]
                ).first()
                
                if not lesson:
                    lesson = CurriculumNode(
                        parent=module,
                        program=program,
                        title=lesson_data["title"],
                        node_type="Lesson",
                        description=lesson_data["desc"],
                        position=idx,
                        is_published=True,
                        properties={"thumbnail": lesson_data["image"]}
                    )
                    lesson.save(skip_validation=True)
                else:
                    # Update with thumbnail if not present
                    if not lesson.properties.get("thumbnail"):
                        lesson.properties["thumbnail"] = lesson_data["image"]
                        lesson.save(skip_validation=True)

                # Add content blocks with Unsplash images
                ContentBlock.objects.get_or_create(
                    node=lesson,
                    position=0,
                    defaults={
                        "block_type": "IMAGE",
                        "data": {"url": lesson_data["image"], "caption": lesson_data["title"]}
                    }
                )
                
                ContentBlock.objects.get_or_create(
                    node=lesson,
                    position=1,
                    defaults={
                        "block_type": "RICHTEXT",
                        "data": {"html": f"<h2>{lesson_data['title']}</h2><p>{lesson_data['desc']}</p>"}
                    }
                )

                ContentBlock.objects.get_or_create(
                    node=lesson,
                    position=2,
                    defaults={
                        "block_type": "VIDEO",
                        "data": {"provider": "youtube", "url": f"https://youtube.com/watch?v=demo_{idx}", "duration": 600}
                    }
                )

        self.stdout.write(self.style.SUCCESS(f"✓ Created 4 additional courses for Mary"))
