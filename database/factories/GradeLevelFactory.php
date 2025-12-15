<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\GradeLevel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GradeLevel>
 */
final class GradeLevelFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = GradeLevel::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $level = 0;
        $level++;

        return [
            'name' => 'Grade ' . $level,
            'level_order' => $level,
            'description' => fake()->sentence(),
            'age_range' => ($level + 5) . '-' . ($level + 6),
            'curriculum_code' => fake()->optional(0.5)->regexify('G[0-9]'),
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the grade level is inactive.
     */
    public function inactive(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
