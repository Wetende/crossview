<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\TeacherProfile;
use App\Models\StudentProfile;
use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Assignment;
use App\Models\Enrollment;
use App\Models\LessonCompletion;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\CourseReview;
use App\Models\UserPoint;
use App\Models\StudentPerformance;
use App\Models\PerformanceMetric;
use App\Models\UserBadge;
use App\Models\Badge;
use App\Services\LeaderboardService;
use App\Services\RankingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Faker\Factory as Faker;
use Illuminate\Support\Str;

final class TestingDataSeeder extends Seeder
{
    private array $students = [];
    private array $teachers = [];
    private array $courses = [];

    public function run(): void
    {
        $this->command->info('Creating focused testing dataset for ranking, leaderboards, and recommendations...');

        $faker = Faker::create();


        $roles = $this->getRoles();
        $gradeLevels = $this->getGradeLevels();
        $subjects = $this->getSubjects();
        $categories = $this->getCategories();
        $performanceMetrics = $this->getPerformanceMetrics();

        
        $this->createAdminUser();

        
        $this->createTeachers($faker, $roles, $subjects);

        
        $this->createStudents($faker, $roles, $gradeLevels);

        
        $this->createCourses($faker, $categories, $subjects, $gradeLevels);

        
        $this->createCourseContent($faker);

        
        $this->generateStudentActivity($faker);

        
        $this->generatePerformanceData($faker, $performanceMetrics, $gradeLevels, $subjects);

        
        $this->generateUserPoints($faker);

        
        $this->generateBadges($faker);

        
        $this->generateRankings();

        
        $this->updateLeaderboards();

        $this->command->info('Testing dataset created successfully!');
        $this->displayCredentials();
    }

    private function createAdminUser(): void
    {
        $this->command->info('Creating admin user...');

        $adminRole = Role::where('name', 'admin')->first();
        if (!$adminRole) {
            $this->command->error('Admin role not found. Please run RoleSeeder first.');
            return;
        }

        $admin = User::firstOrCreate(
            ['email' => 'admin@studysafari.app'],
            [
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'name' => 'System Administrator',
                'email_verified_at' => now(),
                'password' => bcrypt('admin123'),
            ]
        );

        if (!$admin->roles()->where('role_id', $adminRole->id)->exists()) {
            $admin->roles()->attach($adminRole->id);
        }

        $this->command->info('Admin user created: admin@studysafari.app / admin123');
    }

    private function displayCredentials(): void
    {
        $this->command->info('');
        $this->command->info('=== LOGIN CREDENTIALS ===');
        $this->command->info('');
        $this->command->info('ADMIN USER:');
        $this->command->info('Email: admin@studysafari.app');
        $this->command->info('Password: admin123');
        $this->command->info('');
        $this->command->info('TEACHER EXAMPLE:');
        $this->command->info('Email: sarah.math@studysafari.app');
        $this->command->info('Password: password');
        $this->command->info('');
        $this->command->info('STUDENT EXAMPLE:');
        $this->command->info('Email: (check database for student emails ending with @studysafari.app)');
        $this->command->info('Password: password');
        $this->command->info('');
        $this->command->info('All users have password: "password" except admin');
        $this->command->info('========================');
    }

    private function getRoles(): array
    {
        return [
            'student' => Role::where('name', 'student')->first(),
            'teacher' => Role::where('name', 'teacher')->first(),
        ];
    }

    private function getGradeLevels()
    {
        return GradeLevel::all();
    }

    private function getSubjects()
    {
        return Subject::all();
    }

    private function getCategories()
    {
        return Category::all();
    }

    private function getPerformanceMetrics()
    {
        return PerformanceMetric::all();
    }

    private function createTeachers($faker, array $roles, $subjects): void
    {
        $this->command->info('Creating 3 specialized teachers...');

        $teacherData = [
            [
                'name' => 'Dr. Sarah Mathematics',
                'email' => 'sarah.math@studysafari.app',
                'specializations' => ['Mathematics', 'Physics'],
                'bio' => 'PhD in Mathematics with 15 years of teaching experience. Specializes in making complex mathematical concepts accessible to students.',
                'qualifications' => 'PhD Mathematics, MSc Physics, Certified Math Instructor'
            ],
            [
                'name' => 'Prof. James Sciences',
                'email' => 'james.science@studysafari.app',
                'specializations' => ['Chemistry', 'Biology', 'Physics'],
                'bio' => 'Professor of Chemistry with extensive research background. Expert in laboratory techniques and scientific methodology.',
                'qualifications' => 'PhD Chemistry, MSc Biology, Research Fellow'
            ],
            [
                'name' => 'Ms. Emily Languages',
                'email' => 'emily.lang@studysafari.app',
                'specializations' => ['English', 'Literature', 'History'],
                'bio' => 'Literature professor and published author. Passionate about creative writing and critical thinking.',
                'qualifications' => 'MA English Literature, BA History, Published Author'
            ]
        ];

        foreach ($teacherData as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'first_name' => explode(' ', $data['name'])[0],
                    'last_name' => implode(' ', array_slice(explode(' ', $data['name']), 1)),
                    'name' => $data['name'],
                    'email_verified_at' => now(),
                    'password' => bcrypt('password'),
                ]
            );

            if (!$user->roles()->where('role_id', $roles['teacher']->id)->exists()) {
                $user->roles()->attach($roles['teacher']->id);
            }

            TeacherProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'bio' => $data['bio'],
                    'qualifications' => $data['qualifications'],
                    'school_affiliation' => $faker->company . ' School',
                    'position' => $faker->randomElement(['Senior Teacher', 'Department Head', 'Professor']),
                    'hourly_rate' => $faker->numberBetween(25, 50),
                    'available_for_tutoring' => $faker->boolean(70),
                ]
            );

            
            foreach ($data['specializations'] as $subjectName) {
                $subject = $subjects->firstWhere('name', $subjectName);
                if ($subject && !$user->specializedSubjects()->where('subject_id', $subject->id)->exists()) {
                    $user->specializedSubjects()->attach($subject->id);
                }
            }

            $this->teachers[] = $user;
        }
    }

    private function createStudents($faker, array $roles, $gradeLevels): void
    {
        $this->command->info('Creating 15 diverse students...');

        
        $performanceTiers = [
            'high' => 4,     
            'medium' => 7,   
            'low' => 4       
        ];

        $studentCount = 0;
        foreach ($performanceTiers as $tier => $count) {
            for ($i = 0; $i < $count; $i++) {
                $firstName = $faker->firstName;
                $lastName = $faker->lastName;

                $email = strtolower($firstName . '.' . $lastName . '.s' . ++$studentCount . '@studysafari.app');
                $user = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'name' => "$firstName $lastName",
                        'email_verified_at' => now(),
                        'password' => bcrypt('password'),
                    ]
                );

                if (!$user->roles()->where('role_id', $roles['student']->id)->exists()) {
                    $user->roles()->attach($roles['student']->id);
                }

                StudentProfile::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'date_of_birth' => $faker->dateTimeBetween('-18 years', '-14 years')->format('Y-m-d'),
                        'grade_level_id' => $gradeLevels->random()->id,
                        'school_name' => $faker->company . ' Secondary School',
                        'learning_interests' => json_encode($faker->randomElements([
                            'Mathematics', 'Science', 'Literature', 'History', 'Art', 'Music', 'Sports', 'Technology'
                        ], $faker->numberBetween(2, 4))),
                    ]
                );

                
                $user->performance_tier = $tier;
                $this->students[] = $user;
            }
        }
    }

    private function createCourses($faker, $categories, $subjects, $gradeLevels): void
    {
        $this->command->info('Creating diverse courses...');

        $coursesByTeacher = [
            
            0 => [
                ['title' => 'Algebra Fundamentals', 'subject' => 'Mathematics', 'level' => 'S1', 'price' => 0],
                ['title' => 'Advanced Calculus', 'subject' => 'Mathematics', 'level' => 'S6', 'price' => 29.99],
                ['title' => 'Physics Mechanics', 'subject' => 'Physics', 'level' => 'S4', 'price' => 19.99],
                ['title' => 'Mathematical Problem Solving', 'subject' => 'Mathematics', 'level' => 'S3', 'price' => 15.99],
                ['title' => 'Introduction to Statistics', 'subject' => 'Mathematics', 'level' => 'S2', 'price' => 0],
            ],
            
            1 => [
                ['title' => 'Organic Chemistry Basics', 'subject' => 'Chemistry', 'level' => 'S2', 'price' => 24.99],
                ['title' => 'Cell Biology Fundamentals', 'subject' => 'Biology', 'level' => 'S1', 'price' => 0],
                ['title' => 'Laboratory Techniques', 'subject' => 'Chemistry', 'level' => 'S4', 'price' => 39.99],
                ['title' => 'Genetics and Evolution', 'subject' => 'Biology', 'level' => 'S5', 'price' => 34.99],
            ],
            
            2 => [
                                  ['title' => 'Creative Writing Workshop', 'subject' => 'English Language', 'level' => 'S2', 'price' => 19.99],
                ['title' => 'Shakespeare Studies', 'subject' => 'Literature', 'level' => 'S5', 'price' => 29.99],
                ['title' => 'World History Overview', 'subject' => 'History', 'level' => 'S1', 'price' => 0],
                ['title' => 'Critical Thinking Skills', 'subject' => 'English Language', 'level' => 'S3', 'price' => 15.99],
            ]
        ];

        foreach ($coursesByTeacher as $teacherIndex => $courses) {
            $teacher = $this->teachers[$teacherIndex];

            foreach ($courses as $courseData) {
                $subject = $subjects->firstWhere('name', $courseData['subject']);
                $category = $categories->random();
                $gradeLevel = $gradeLevels->random();

                $course = Course::create([
                    'user_id' => $teacher->id,
                    'title' => $courseData['title'],
                    'slug' => Str::slug($courseData['title']) . '-' . Str::random(4),
                    'description' => $faker->paragraphs(3, true),
                    'short_description' => $faker->sentence(15),
                    'price' => $courseData['price'],
                    'level' => $courseData['level'],
                    'language' => 'en',
                    'category_id' => $category->id,
                    'subject_id' => $subject->id,
                    'grade_level_id' => $gradeLevel->id,
                    'is_published' => true,
                    'published_at' => $faker->dateTimeThisYear(),
                    'duration_in_minutes' => $faker->numberBetween(180, 600),
                    'what_you_will_learn' => json_encode($faker->sentences(4)),
                    'requirements' => json_encode($faker->sentences(2)),
                    'thumbnail_path' => 'placeholders/course_thumbnail_' . ($faker->numberBetween(1, 5)) . '.jpg',
                ]);

                $this->courses[] = $course;
            }
        }
    }

    private function createCourseContent($faker): void
    {
        $this->command->info('Creating comprehensive course content...');

        foreach ($this->courses as $course) {
            
            $sectionCount = $faker->numberBetween(3, 4);

            for ($s = 0; $s < $sectionCount; $s++) {
                $section = CourseSection::create([
                    'course_id' => $course->id,
                    'title' => 'Section ' . ($s + 1) . ': ' . $faker->words(3, true),
                    'description' => $faker->paragraph,
                    'order' => $s + 1,
                    'is_published' => true,
                ]);

                
                $lessonCount = $faker->numberBetween(4, 6);

                for ($l = 0; $l < $lessonCount; $l++) {
                    $lessonType = $faker->randomElement(['text', 'video', 'quiz_link']);

                    $lesson = Lesson::create([
                        'course_id' => $course->id,
                        'course_section_id' => $section->id,
                        'title' => 'Lesson ' . ($l + 1) . ': ' . $faker->words(4, true),
                        'slug' => Str::slug($course->title . ' lesson ' . ($l + 1)) . '-' . Str::random(4),
                        'lesson_type' => $lessonType,
                        'order' => $l + 1,
                        'is_published' => true,
                        'lesson_duration' => $faker->numberBetween(15, 45),
                        'content' => $faker->paragraphs(5, true),
                    ]);

                    
                    if ($lessonType === 'quiz_link') {
                        $quiz = Quiz::create([
                            'user_id' => $course->user_id,
                            'course_section_id' => $section->id,
                            'title' => 'Quiz: ' . $lesson->title,
                            'description' => $faker->sentence,
                            'time_limit' => $faker->numberBetween(15, 30),
                            'passing_grade' => $faker->numberBetween(60, 80),
                            'subject_id' => $course->subject_id,
                            'order' => $l + 1,
                        ]);

                        $lesson->update(['quiz_id' => $quiz->id]);

                        
                        $questionCount = $faker->numberBetween(5, 8);

                        for ($q = 0; $q < $questionCount; $q++) {
                            $question = Question::create([
                                'quiz_id' => $quiz->id,
                                'text' => $faker->sentence(10) . '?',
                                'question_type' => 'multiple_choice',
                                'points' => $faker->randomElement([5, 10, 15]),
                                'order' => $q + 1,
                                'explanation' => $faker->sentence,
                            ]);

                            
                            $correctIndex = $faker->numberBetween(0, 3);
                            for ($o = 0; $o < 4; $o++) {
                                QuestionOption::create([
                                    'question_id' => $question->id,
                                    'text' => $faker->words(4, true),
                                    'is_correct' => ($o === $correctIndex),
                                    'order' => $o + 1,
                                ]);
                            }
                        }
                    }
                }

                
                Assignment::create([
                    'course_section_id' => $section->id,
                    'title' => 'Assignment: ' . $faker->words(4, true),
                    'description' => $faker->paragraphs(2, true),
                    'instructions' => $faker->paragraph,
                    'due_date' => $faker->dateTimeBetween('now', '+2 months'),
                    'points_possible' => $faker->randomElement([50, 75, 100]),
                    'allowed_submission_types' => json_encode(['pdf', 'docx']),
                    'order' => $sectionCount + 1,
                ]);
            }
        }
    }

    private function generateStudentActivity($faker): void
    {
        $this->command->info('Generating realistic student activity...');

        foreach ($this->students as $student) {
            $tier = $student->performance_tier;

            
            $enrollmentRange = match($tier) {
                'high' => [6, 9],    
                'medium' => [3, 6],  
                'low' => [2, 4]      
            };

            $enrollmentCount = $faker->numberBetween($enrollmentRange[0], $enrollmentRange[1]);
            $coursesToEnroll = collect($this->courses)->random($enrollmentCount);

            foreach ($coursesToEnroll as $course) {
                $enrollmentDate = $faker->dateTimeBetween('-6 months', '-1 month');

                $enrollment = Enrollment::create([
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                    'enrolled_at' => $enrollmentDate,
                    'status' => 'active',
                    'access_type' => $course->price > 0 ? 'purchase' : 'subscription',
                    'progress' => 0,
                ]);

                
                $lessons = $course->lessons;
                $completionRate = match($tier) {
                    'high' => $faker->numberBetween(80, 100),
                    'medium' => $faker->numberBetween(40, 80),
                    'low' => $faker->numberBetween(10, 50)
                };

                $lessonsToComplete = (int) ($lessons->count() * $completionRate / 100);
                $completedLessons = $lessons->take($lessonsToComplete);
                $completedCount = 0;

                foreach ($completedLessons as $lesson) {
                    $completionDate = Carbon::instance($enrollmentDate)->addDays($faker->numberBetween(1, 30));

                    LessonCompletion::create([
                        'user_id' => $student->id,
                        'lesson_id' => $lesson->id,
                        'completed_at' => $completionDate,
                    ]);
                    $completedCount++;

                    
                    if ($lesson->lesson_type === 'quiz_link' && $lesson->quiz) {
                        $attempts = $faker->numberBetween(1, 3);

                        for ($a = 0; $a < $attempts; $a++) {
                            $attemptDate = $completionDate->copy()->addMinutes($faker->numberBetween(5, 60));

                            
                            $baseScore = match($tier) {
                                'high' => $faker->numberBetween(85, 100),
                                'medium' => $faker->numberBetween(60, 85),
                                'low' => $faker->numberBetween(30, 70)
                            };

                            $attemptBonus = $a * 5; 
                            $score = min(100, $baseScore + $attemptBonus);

                            $attempt = QuizAttempt::create([
                                'user_id' => $student->id,
                                'quiz_id' => $lesson->quiz->id,
                                'started_at' => $attemptDate,
                                'completed_at' => $attemptDate->copy()->addMinutes($faker->numberBetween(10, 30)),
                                'score' => $score,
                                'passed' => $score >= $lesson->quiz->passing_grade,
                                'attempt_number' => $a + 1,
                            ]);

                            
                            foreach ($lesson->quiz->questions as $question) {
                                $correctOption = $question->options->where('is_correct', true)->first();
                                $selectedOption = ($faker->numberBetween(1, 100) <= $score)
                                    ? $correctOption
                                    : $question->options->random();

                                QuizAttemptAnswer::create([
                                    'quiz_attempt_id' => $attempt->id,
                                    'question_id' => $question->id,
                                    'answer_text' => json_encode(['selected_option_id' => $selectedOption->id]),
                                    'is_correct' => $selectedOption->is_correct,
                                    'score' => $selectedOption->is_correct ? $question->points : 0,
                                ]);
                            }
                        }
                    }
                }

                
                $totalLessons = $lessons->count();
                $progressPercent = $totalLessons > 0 ? ($completedCount / $totalLessons) * 100 : 0;
                $enrollment->update(['progress' => $progressPercent]);

                
                if ($progressPercent >= 100) {
                    $enrollment->update([
                        'status' => 'completed',
                        'completed_at' => $completedLessons->last()->pivot->completed_at ?? now()
                    ]);

                    
                    if ($faker->boolean(70)) {
                        $rating = match($tier) {
                            'high' => $faker->numberBetween(4, 5),
                            'medium' => $faker->numberBetween(3, 5),
                            'low' => $faker->numberBetween(2, 4)
                        };

                        CourseReview::create([
                            'user_id' => $student->id,
                            'course_id' => $course->id,
                            'content' => $faker->paragraph,
                            'rating' => $rating,
                            'is_approved' => true,
                            'enrollment_id' => $enrollment->id,
                        ]);
                    }
                }
            }
        }
    }

    private function generatePerformanceData($faker, $performanceMetrics, $gradeLevels, $subjects): void
    {
        $this->command->info('Generating student performance data...');

        foreach ($this->students as $student) {
            $student->load('studentProfile.gradeLevel');
            $gradeLevel = $student->studentProfile->gradeLevel;
            $tier = $student->performance_tier;

            
            $subjectCount = min($faker->numberBetween(3, 5), $subjects->count());
            $studentSubjects = $subjects->random($subjectCount);

            foreach ($studentSubjects as $subject) {
                foreach ($performanceMetrics as $metric) {
                    
                    $baseScore = match($tier) {
                        'high' => $faker->numberBetween(80, 95),
                        'medium' => $faker->numberBetween(60, 80),
                        'low' => $faker->numberBetween(40, 65)
                    };

                    
                    $randomness = $faker->numberBetween(-10, 10);
                    $percentageScore = max(0, min(100, $baseScore + $randomness));

                    
                    $level = match(true) {
                        $percentageScore >= 80 => 'Distinction',
                        $percentageScore >= 65 => 'Credit',
                        $percentageScore >= 50 => 'Pass',
                        default => 'Needs Improvement'
                    };

                    $performanceDate = $faker->dateTimeBetween('-4 months', 'now');

                    StudentPerformance::create([
                        'user_id' => $student->id,
                        'subject_id' => $subject->id,
                        'grade_level_id' => $gradeLevel->id,
                        'performance_metric_id' => $metric->id,
                        'raw_score' => ($percentageScore / 100) * 100,
                        'percentage_score' => $percentageScore,
                        'level' => $level,
                        'last_calculated_at' => $performanceDate,
                        'created_at' => $performanceDate,
                        'updated_at' => $performanceDate,
                    ]);
                }
            }
        }
    }

    private function generateUserPoints($faker): void
    {
        $this->command->info('Generating user points for leaderboards...');

        foreach ($this->students as $student) {
            $tier = $student->performance_tier;

            
            $totalPoints = match($tier) {
                'high' => $faker->numberBetween(800, 1200),
                'medium' => $faker->numberBetween(400, 800),
                'low' => $faker->numberBetween(100, 400)
            };

            
            $pointsRemaining = $totalPoints;
            $startDate = Carbon::now()->subMonths(6);
            $endDate = Carbon::now();

            while ($pointsRemaining > 0) {
                $pointsToAward = min($pointsRemaining, $faker->numberBetween(5, 50));
                $activity = $faker->randomElement([
                    'course_completion', 'quiz_score', 'daily_login', 'assignment_submission', 'badge_earned'
                ]);

                $date = $faker->dateTimeBetween($startDate, $endDate);

                UserPoint::create([
                    'user_id' => $student->id,
                    'source_type' => match($activity) {
                        'course_completion' => Course::class,
                        'quiz_score' => Quiz::class,
                        'badge_earned' => Badge::class,
                        default => null
                    },
                    'source_id' => match($activity) {
                        'course_completion' => $this->courses[array_rand($this->courses)]->id,
                        'quiz_score' => $faker->numberBetween(1, 50),
                        'badge_earned' => $faker->numberBetween(1, 10),
                        default => null
                    },
                    'points' => $pointsToAward,
                    'description' => match($activity) {
                        'course_completion' => 'Completed course',
                        'quiz_score' => 'Great quiz performance',
                        'daily_login' => 'Daily login bonus',
                        'assignment_submission' => 'Assignment submitted',
                        'badge_earned' => 'Badge earned'
                    },
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                $pointsRemaining -= $pointsToAward;
            }
        }
    }

    private function generateBadges($faker): void
    {
        $this->command->info('Creating and awarding badges...');

        
        $badges = [
            ['name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'Completed your first course', 'points' => 50],
            ['name' => 'Quiz Master', 'slug' => 'quiz-master', 'description' => 'Achieved 90% or higher on 5 quizzes', 'points' => 100],
            ['name' => 'Dedicated Learner', 'slug' => 'dedicated-learner', 'description' => 'Logged in for 7 consecutive days', 'points' => 75],
            ['name' => 'Course Completionist', 'slug' => 'course-completionist', 'description' => 'Completed 5 courses', 'points' => 150],
            ['name' => 'Top Performer', 'slug' => 'top-performer', 'description' => 'Ranked in top 10% of your grade', 'points' => 200],
        ];

        $createdBadges = [];
        foreach ($badges as $badgeData) {
            $badge = Badge::firstOrCreate(
                ['slug' => $badgeData['slug']],
                [
                    'name' => $badgeData['name'],
                    'description' => $badgeData['description'],
                    'points' => $badgeData['points'],
                    'criteria_type' => 'manual',
                    'criteria_value' => '1',
                    'is_active' => true,
                ]
            );
            $createdBadges[] = $badge;
        }

        
        foreach ($this->students as $student) {
            $tier = $student->performance_tier;

            $badgeCount = match($tier) {
                'high' => $faker->numberBetween(3, 5),
                'medium' => $faker->numberBetween(1, 3),
                'low' => $faker->numberBetween(0, 2)
            };

            if ($badgeCount > 0) {
                $badgesToAward = collect($createdBadges)->random(min($badgeCount, count($createdBadges)));

                foreach ($badgesToAward as $badge) {
                    UserBadge::create([
                        'user_id' => $student->id,
                        'badge_id' => $badge->id,
                        'earned_at' => $faker->dateTimeBetween('-3 months', 'now'),
                        'award_reason' => "Earned for {$badge->description}",
                    ]);
                }
            }
        }
    }

    private function generateRankings(): void
    {
        $this->command->info('Generating student rankings...');

        $rankingService = app(RankingService::class);
        $gradeLevels = GradeLevel::all();
        $subjects = Subject::all();

        foreach ($gradeLevels as $gradeLevel) {
            
            $rankingService->generateOverallRankings($gradeLevel);

            
            foreach ($subjects as $subject) {
                $rankingService->generateSubjectRankings($subject, $gradeLevel);
            }
        }
    }

    private function updateLeaderboards(): void
    {
        $this->command->info('Creating and updating leaderboards...');

        $leaderboardService = app(LeaderboardService::class);

        
        $leaderboardService->createLeaderboard(
            'Testing Monthly Champions',
            'Top performers this month for testing',
            'site',
            null,
            'monthly'
        );

        $leaderboardService->createLeaderboard(
            'Testing All-Time Leaders',
            'All-time top performers for testing',
            'site',
            null,
            'all_time'
        );

        
        foreach (array_slice($this->courses, 0, 3) as $course) {
            $leaderboardService->createLeaderboard(
                "{$course->title} Champions",
                "Top students in {$course->title}",
                'course',
                $course,
                'all_time'
            );
        }

        
        $leaderboardService->updateAllActiveLeaderboards();
    }
}
