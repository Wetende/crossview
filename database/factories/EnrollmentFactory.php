<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Enrollment>
 */
final class EnrollmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Enrollment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'course_id' => Course::factory(),
            'enrolled_at' => fake()->dateTimeBetween('-6 months', 'now'),
            'completed_at' => fake()->optional(0.3)->dateTimeBetween('-3 months', 'now'),
            'progress' => fake()->randomFloat(2, 0, 100),
            'access_type' => fake()->randomElement(['purchase', 'subscription']),
            'course_purchase_id' => null,
            'status' => 'active',
        ];
    }

    /**
     * Indicate that the enrollment is completed.
     */
    public function completed(): self
    {
        return $this->state(function (array $attributes) {
            $enrolledAt = $attributes['enrolled_at'] ?? fake()->dateTimeBetween('-6 months', '-1 month');

            return [
                'enrolled_at' => $enrolledAt,
                'completed_at' => fake()->dateTimeBetween($enrolledAt, 'now'),
                'progress' => 100,
            ];
        });
    }

    /**
     * Indicate that the enrollment was via subscription.
     */
    public function viaSubscription(): self
    {
        return $this->state(fn (array $attributes) => [
            'access_type' => 'subscription',
            'course_purchase_id' => null,
        ]);
    }

    /**
     * Indicate that the enrollment is restricted (by tier level).
     */
    public function restrictedByTier(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'restricted_tier',
        ]);
    }

    /**
     * Indicate that the enrollment is restricted (by course limit).
     */
    public function restrictedByLimit(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'restricted_limit',
        ]);
    }
}
