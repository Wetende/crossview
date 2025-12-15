<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseSection>
 */
final class CourseSectionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = CourseSection::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'title' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'order' => fake()->randomNumber(2),
            'is_published' => true,
            'unlock_date' => fake()->optional(0.3)->dateTimeBetween('now', '+30 days'),
            'unlock_after_days' => fake()->optional(0.3)->numberBetween(1, 30),
        ];
    }

    /**
     * Indicate that the section is unpublished.
     */
    public function unpublished(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => false,
        ]);
    }

    /**
     * Set a specific order for the section.
     */
    public function withOrder(int $order): self
    {
        return $this->state(fn (array $attributes) => [
            'order' => $order,
        ]);
    }
}
