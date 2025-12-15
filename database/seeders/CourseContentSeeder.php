<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Assignment;
use App\Models\CourseFaq;
use App\Models\CourseNotice;
use App\Models\LessonAttachment; 
use App\Models\Subject; 
use App\Enums\LessonType;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Illuminate\Support\Str;

final class CourseContentSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $this->command->info('Seeding course content (sections, lessons, quizzes, assignments, FAQs, notices)...');

        $courses = Course::where('is_published', true)->get(); 
        $subjects = Subject::all();

        if ($courses->isEmpty()) {
            $this->command->warn('No published courses found to seed content for. Skipping CourseContentSeeder.');
            return;
        }

        foreach ($courses as $course) {
            $this->command->info("Seeding content for course: {$course->title}");

            
            $numberOfSections = $faker->numberBetween(2, 5);
            for ($i = 0; $i < $numberOfSections; $i++) {
                $section = CourseSection::factory()->create([
                    'course_id' => $course->id,
                    'title' => 'Section ' . ($i + 1) . ': ' . $faker->bs, 
                    'order' => $i + 1,
                ]);

                
                $numberOfLessons = $faker->numberBetween(3, 7);
                for ($j = 0; $j < $numberOfLessons; $j++) {
                    
                    $lessonType = $faker->randomElement([
                        LessonType::TEXT->value,
                        LessonType::VIDEO->value,
                        LessonType::STREAM->value,
                        LessonType::QUIZ_LINK->value,
                        LessonType::ASSIGNMENT_LINK->value
                    ]);

                    $lessonTitle = ucfirst($faker->words($faker->numberBetween(3, 6), true));

                    $lessonData = [
                        'course_section_id' => $section->id,
                        'course_id' => $course->id, 
                        'title' => $lessonTitle,
                        'slug' => Str::slug($lessonTitle) . '-' . Str::random(4),
                        'lesson_type' => $lessonType,
                        'order' => $j + 1,
                        'lesson_duration' => $faker->numberBetween(5, 45),
                        'is_preview_allowed' => $faker->boolean(20), 
                        'is_published' => true,
                    ];

                    switch ($lessonType) {
                        case LessonType::VIDEO->value:
                            $lessonData['video_url'] = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; 
                            $lessonData['video_source'] = 'youtube';
                            $lessonData['content'] = $faker->paragraphs(2, true);
                            break;
                        case LessonType::TEXT->value:
                        case LessonType::STREAM->value:
                            $lessonData['content'] = $faker->paragraphs($faker->numberBetween(5, 15), true);
                            break;
                            
                    }
                    $lesson = Lesson::factory()->create($lessonData);

                    
                    if (in_array($lessonType, [LessonType::VIDEO->value, LessonType::TEXT->value], true) && $faker->boolean(40)) {
                        $fileSizeKb = $faker->numberBetween(100, 5000);
                        LessonAttachment::factory()->count($faker->numberBetween(1, 2))->create([
                            'lesson_id' => $lesson->id,
                            'file_name' => $faker->word . '.pdf', 
                            'file_path' => 'placeholders/attachments/' . $faker->uuid . '.pdf',
                            'file_type' => 'application/pdf',
                            'file_size' => $fileSizeKb * 1024, 
                        ]);
                    }

                    
                    if ($lessonType === LessonType::QUIZ_LINK->value) {
                        
                        $subjectId = $subjects->isNotEmpty() ? $subjects->random()->id : null;

                        $quiz = Quiz::factory()->create([
                            'course_section_id' => $section->id,
                            'title' => 'Quiz for: ' . $lesson->title,
                            'description' => $faker->sentence,
                            'time_limit' => $faker->numberBetween(10, 30),
                            'passing_grade' => $faker->numberBetween(50, 70),
                            'order' => $j + 1,
                            'subject_id' => $subjectId,
                        ]);
                        $lesson->update(['quiz_id' => $quiz->id]); 

                        
                        $numberOfQuestions = $faker->numberBetween(5, 10);
                        for ($k = 0; $k < $numberOfQuestions; $k++) {
                            $questionType = $faker->randomElement(['multiple_choice', 'true_false', 'short_answer']);
                            $question = Question::factory()->create([
                                'quiz_id' => $quiz->id,
                                'text' => $faker->sentence(10) . '?',
                                'question_type' => $questionType,
                                'points' => $faker->randomElement([1, 2, 5, 10]),
                                'order' => $k + 1,
                                'subject_topic_id' => null, 
                            ]);

                            
                            if ($questionType === 'multiple_choice') {
                                $numOptions = 4;
                                $correctIndex = $faker->numberBetween(0, $numOptions - 1);
                                for ($l = 0; $l < $numOptions; $l++) {
                                    QuestionOption::factory()->create([
                                        'question_id' => $question->id,
                                        'text' => $faker->words(3, true),
                                        'is_correct' => ($l === $correctIndex),
                                    ]);
                                }
                            } elseif ($questionType === 'true_false') {
                                QuestionOption::factory()->create([
                                    'question_id' => $question->id,
                                    'text' => 'True',
                                    'is_correct' => $faker->boolean
                                ]);
                                QuestionOption::factory()->create([
                                    'question_id' => $question->id,
                                    'text' => 'False',
                                    'is_correct' => !$question->options->first()->is_correct 
                                ]);
                            }
                        }
                    }

                    
                    if ($lessonType === LessonType::ASSIGNMENT_LINK->value) {
                        $assignment = Assignment::factory()->create([
                            'course_section_id' => $section->id,
                            'title' => 'Assignment: ' . $lesson->title,
                            'description' => $faker->paragraphs(3, true),
                            'instructions' => $faker->paragraph,
                            'due_date' => $faker->dateTimeBetween('now', '+2 months'),
                            'points_possible' => $faker->randomElement([50, 100, 150]),
                            'allowed_submission_types' => ['pdf', 'docx'],
                            'order' => $j + 1,
                        ]);
                        $lesson->update(['assignment_id' => $assignment->id]); 
                    }
                }
            }

            
            $numberOfFaqs = $faker->numberBetween(3, 5);
            for ($m = 0; $m < $numberOfFaqs; $m++) {
                CourseFaq::factory()->create([
                    'course_id' => $course->id,
                    'question' => $faker->sentence(8) . '?',
                    'answer' => $faker->paragraphs(2, true),
                    'order' => $m + 1,
                    'is_published' => true,
                ]);
            }

            
            $numberOfNotices = $faker->numberBetween(1, 3);
            for ($n = 0; $n < $numberOfNotices; $n++) {
                CourseNotice::factory()->create([
                    'course_id' => $course->id,
                    'title' => $faker->catchPhrase,
                    'content' => $faker->paragraph,
                    'type' => $faker->randomElement(['info', 'warning', 'update', 'important']),
                    'is_active' => $faker->boolean(75), 
                    'display_from' => $faker->dateTimeThisMonth(),
                    'display_until' => $faker->boolean(60) ? $faker->dateTimeBetween('now', '+1 month') : null,
                ]);
            }
        }
        $this->command->info('Course content seeded successfully.');
    }
}
