<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Badge;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Badge>
 */
final class BadgeFactory extends Factory
{
    protected $model = Badge::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(fake()->numberBetween(2, 4), true);
        return [
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence,
            'icon_path' => 'placeholders/badges/' . fake()->randomElement(['star', 'trophy', 'medal', 'diamond', 'book']) . '.svg',
            'points' => fake()->randomElement([10, 25, 50, 100]),
            'criteria_type' => fake()->randomElement(['course_completion_count', 'quiz_score_above', 'login_streak_days']),
            'criteria_value' => (string)fake()->numberBetween(1, 10),
            'criteria' => json_encode(['description' => 'Awarded for ' . fake()->bs]),
            'is_active' => fake()->boolean(90),
        ];
    }
}
