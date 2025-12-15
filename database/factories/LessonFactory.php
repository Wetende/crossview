<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CourseSection;
use App\Models\Lesson;
use App\Enums\LessonType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Lesson>
 */
final class LessonFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Lesson::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $section = CourseSection::factory()->create();
        $title = fake()->sentence();

        return [
            'course_id' => $section->course_id,
            'course_section_id' => $section->id,
            'title' => $title,
            'slug' => Str::slug($title) . '-' . Str::random(4),
            'lesson_type' => LessonType::TEXT->value,
            'content' => fake()->paragraphs(3, true),
            'order' => fake()->numberBetween(1, 20),
            'is_published' => true,
            'is_preview_allowed' => fake()->boolean(20),
            'lesson_duration' => fake()->numberBetween(5, 45),
        ];
    }

    /**
     * Create a text-based lesson.
     */
    public function text(): self
    {
        return $this->state(fn (array $attributes) => [
            'lesson_type' => LessonType::TEXT->value,
            'content' => fake()->paragraphs(3, true),
        ]);
    }

    /**
     * Create a video embed lesson.
     */
    public function videoEmbed(): self
    {
        return $this->state(fn (array $attributes) => [
            'lesson_type' => LessonType::VIDEO->value,
            'video_url' => 'https://www.youtube.com/watch?v=' . fake()->regexify('[A-Za-z0-9_-]{11}'),
            'video_source' => 'youtube',
            'content' => fake()->paragraphs(1, true),
        ]);
    }

    /**
     * Create a live session lesson.
     */
    public function liveSession(): self
    {
        return $this->state(fn (array $attributes) => [
            'lesson_type' => LessonType::STREAM->value,
            'stream_url' => 'https://zoom.us/j/' . fake()->numberBetween(10000000000, 99999999999),
            'stream_password' => fake()->password(8, 12),
            'content' => fake()->paragraphs(1, true),
        ]);
    }

    /**
     * Create a quiz link lesson.
     */
    public function quizLink(): self
    {
        return $this->state(fn (array $attributes) => [
            'lesson_type' => LessonType::QUIZ_LINK->value,
            'content' => fake()->paragraphs(1, true),
        ]);
    }

    /**
     * Create an assignment link lesson.
     */
    public function assignmentLink(): self
    {
        return $this->state(fn (array $attributes) => [
            'lesson_type' => LessonType::ASSIGNMENT_LINK->value,
            'content' => fake()->paragraphs(1, true),
        ]);
    }

    /**
     * Create a free preview lesson.
     */
    public function preview(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_preview_allowed' => true,
        ]);
    }

    /**
     * Set a specific order for the lesson.
     */
    public function withOrder(int $order): self
    {
        return $this->state(fn (array $attributes) => [
            'order' => $order,
        ]);
    }

    /**
     * Place the lesson in a specific section.
     */
    public function inSection(CourseSection $section): self
    {
        return $this->state(fn (array $attributes) => [
            'course_section_id' => $section->id,
            'course_id' => $section->course_id,
        ]);
    }
}
