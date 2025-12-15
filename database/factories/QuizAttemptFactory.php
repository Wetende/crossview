<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizAttempt>
 */
final class QuizAttemptFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = QuizAttempt::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startedAt = fake()->dateTimeBetween('-30 days', '-1 hour');
        $completedAt = fake()->optional(0.9)->dateTimeBetween($startedAt, 'now');

        return [
            'user_id' => User::factory()->student(),
            'quiz_id' => Quiz::factory(),
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
            'score' => $completedAt ? fake()->randomFloat(2, 0, 100) : null,
            'passed' => $completedAt ? fake()->boolean(70) : null,
            'attempt_number' => fake()->numberBetween(1, 3),
        ];
    }

    /**
     * Indicate that the attempt is in progress (not completed).
     */
    public function inProgress(): self
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => null,
            'score' => null,
            'passed' => null,
        ]);
    }

    /**
     * Indicate that the attempt was passed.
     */
    public function passed(): self
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => fake()->dateTimeBetween($attributes['started_at'], 'now'),
            'score' => fake()->randomFloat(2, 70, 100),
            'passed' => true,
        ]);
    }

    /**
     * Indicate that the attempt was failed.
     */
    public function failed(): self
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => fake()->dateTimeBetween($attributes['started_at'], 'now'),
            'score' => fake()->randomFloat(2, 0, 69),
            'passed' => false,
        ]);
    }

    /**
     * Set a specific attempt number.
     */
    public function attemptNumber(int $number): self
    {
        return $this->state(fn (array $attributes) => [
            'attempt_number' => $number,
        ]);
    }
}
