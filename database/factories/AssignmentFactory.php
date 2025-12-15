<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\CourseSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Assignment>
 */
final class AssignmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Assignment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $section = CourseSection::factory()->create();

        return [
            'course_section_id' => $section->id,
            'title' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'instructions' => fake()->paragraphs(2, true),
            'due_date' => fake()->dateTimeBetween('+1 day', '+30 days'),
            'points_possible' => fake()->numberBetween(10, 100),
            'allowed_submission_types' => ['pdf', 'docx'],
            'unlock_date' => fake()->optional(0.3)->dateTimeBetween('-5 days', 'now'),
            'order' => fake()->numberBetween(1, 10),
        ];
    }

    /**
     * Set a specific unlock date.
     */
    public function unlockAt(\DateTime $date): self
    {
        return $this->state(fn (array $attributes) => [
            'unlock_date' => $date,
        ]);
    }

    /**
     * Set a specific due date.
     */
    public function dueIn(int $days): self
    {
        return $this->state(fn (array $attributes) => [
            'due_date' => now()->addDays($days),
        ]);
    }

    /**
     * Place the assignment in a specific section.
     */
    public function inSection(CourseSection $section): self
    {
        return $this->state(fn (array $attributes) => [
            'course_section_id' => $section->id,
        ]);
    }
}
