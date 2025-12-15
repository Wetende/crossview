<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\CourseReview;
use App\Models\SubscriptionTier;
use App\Models\UserSubscription;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Faker\Factory as Faker;

final class UserActivitySeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $this->command->info('Seeding user activity (enrollments, completions, attempts, submissions, reviews)...');

        $students = User::whereHas('roles', fn ($q) => $q->where('name', 'student'))->get();
        $courses = Course::where('is_published', true)->get();
        $subscriptionTiers = SubscriptionTier::where('price', '>', 0)->get(); 

        if ($students->isEmpty() || $courses->isEmpty()) {
            $this->command->warn('No students or published courses found. Skipping UserActivitySeeder.');
            return;
        }

        
        if ($subscriptionTiers->isNotEmpty()) {
            foreach ($students as $student) {
                if ($faker->boolean(30)) { 
                    $tier = $subscriptionTiers->random();
                    
                    $startDate = Carbon::now()->subMonths(6);
                    UserSubscription::factory()->create([
                        'user_id' => $student->id,
                        'subscription_tier_id' => $tier->id,
                        'status' => 'active',
                        'started_at' => $faker->dateTimeBetween($startDate, 'now'),
                        'expires_at' => $faker->dateTimeBetween('now', '+1 year'),
                    ]);
                }
            }
            $this->command->info('User subscriptions seeded.');
        }

        foreach ($students as $student) {
            
            $numberOfEnrollments = $faker->numberBetween(3, min(8, $courses->count()));
            $enrolledCourses = $courses->random($numberOfEnrollments);

            foreach ($enrolledCourses as $course) {
                
                $canEnroll = $course->is_free ||
                             !$course->subscription_required ||
                             ($course->required_subscription_tier_id && $student->subscriptions()->where('subscription_tier_id', $course->required_subscription_tier_id)->where('status', 'active')->exists()) ||
                             ($course->subscription_required && !$course->required_subscription_tier_id && $student->subscriptions()->where('status', 'active')->exists());

                if (!$canEnroll || Enrollment::where('user_id', $student->id)->where('course_id', $course->id)->exists()) {
                    continue; 
                }

                
                $enrollmentDate = $faker->dateTimeBetween(Carbon::now()->subMonths(3), Carbon::now());
                $enrollment = Enrollment::factory()->create([
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                    'enrolled_at' => $enrollmentDate,
                    'status' => 'active', 
                    'progress' => 0, 
                    'access_type' => 'purchase', 
                ]);

                $completedLessonsCount = 0;
                $totalLessonsInCourse = $course->lessons()->count();
                if ($totalLessonsInCourse === 0) {
                    continue;
                }

                
                $lessonsInCourse = $course->lessons()->orderBy('order')->get();
                $lessonsToCompleteCount = $faker->numberBetween(0, $totalLessonsInCourse);

                foreach ($lessonsInCourse->take($lessonsToCompleteCount) as $lesson) {
                    LessonCompletion::factory()->create([
                        'user_id' => $student->id,
                        'lesson_id' => $lesson->id,
                        'completed_at' => $faker->dateTimeBetween($enrollmentDate, 'now'),
                    ]);
                    $completedLessonsCount++;

                    
                    if ($lesson->lesson_type === 'quiz' && $lesson->quiz) {
                        $quiz = $lesson->quiz;
                        $numberOfAttempts = $faker->numberBetween(1, $quiz->max_attempts ?? 2);
                        for ($i = 0; $i < $numberOfAttempts; $i++) {
                            $attemptStartedAt = $faker->dateTimeBetween($enrollmentDate, 'now');
                            $attemptCompletedAt = Carbon::instance($attemptStartedAt)->addMinutes($faker->numberBetween(5, $quiz->duration_minutes));
                            $score = 0;
                            $quizAttempt = QuizAttempt::factory()->create([
                                'quiz_id' => $quiz->id,
                                'user_id' => $student->id,
                                'course_id' => $course->id,
                                'started_at' => $attemptStartedAt,
                                'completed_at' => $attemptCompletedAt,
                                'score' => 0, 
                            ]);

                            foreach ($quiz->questions as $question) {
                                $selectedOption = null;
                                $isCorrect = false;
                                if ($question->options->isNotEmpty()) {
                                    $selectedOption = $question->options->random();
                                    $isCorrect = $selectedOption->is_correct;
                                    if ($isCorrect) {
                                        $score += $question->points;
                                    }
                                }
                                QuizAttemptAnswer::factory()->create([
                                    'quiz_attempt_id' => $quizAttempt->id,
                                    'question_id' => $question->id,
                                    'question_option_id' => $selectedOption ? $selectedOption->id : null,
                                    'answer_text' => ($question->question_type === 'short_answer') ? $faker->sentence : null,
                                    'is_correct' => $isCorrect,
                                    'points_awarded' => $isCorrect ? $question->points : 0,
                                ]);
                            }
                            $quizAttempt->update(['score' => $score]);
                        }
                    }

                    
                    if ($lesson->lesson_type === 'assignment' && $lesson->assignment) {
                        $assignment = $lesson->assignment;
                        if ($faker->boolean(70)) { 
                            
                            $maxDate = $assignment->due_date && Carbon::parse($assignment->due_date)->isFuture()
                                ? Carbon::parse($assignment->due_date)
                                : Carbon::now();

                            
                            $submissionDate = $enrollmentDate <= $maxDate
                                ? $faker->dateTimeBetween($enrollmentDate, $maxDate)
                                : $maxDate;

                            $isGraded = $faker->boolean(60);
                            AssignmentSubmission::factory()->create([
                                'assignment_id' => $assignment->id,
                                'user_id' => $student->id,
                                'course_id' => $course->id,
                                'submitted_at' => $submissionDate,
                                'content' => $faker->paragraphs(3, true),
                                'file_path' => $faker->boolean(30) ? 'placeholders/submissions/' . $faker->uuid . '.pdf' : null,
                                'grade' => $isGraded ? $faker->numberBetween(max(0, $assignment->max_points - 40), $assignment->max_points) : null,
                                'feedback' => $isGraded ? $faker->paragraph : null,
                                'graded_at' => $isGraded ? $faker->dateTimeBetween($submissionDate, 'now') : null,
                                'graded_by_user_id' => $isGraded ? $course->teacher->id : null,
                            ]);
                        }
                    }
                }
                
                $enrollment->progress = ($totalLessonsInCourse > 0) ? floor(($completedLessonsCount / $totalLessonsInCourse) * 100) : 0;
                if ($enrollment->progress == 100) {
                    $enrollment->status = 'completed';
                    $enrollment->completed_at = $faker->dateTimeBetween($enrollmentDate, 'now');

                    
                    if ($faker->boolean(50)) { 
                        CourseReview::factory()->create([
                            'course_id' => $course->id,
                            'user_id' => $student->id,
                            'rating' => $faker->numberBetween(3, 5),
                            'content' => $faker->paragraph,
                            'is_approved' => $faker->boolean(80),
                        ]);
                    }
                }
                $enrollment->save();
            }
        }
        $this->command->info('User activity seeded successfully.');
    }
}
