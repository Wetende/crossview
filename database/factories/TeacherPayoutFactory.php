<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\TeacherPayout;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TeacherPayout>
 */
final class TeacherPayoutFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = TeacherPayout::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $periodStart = fake()->dateTimeBetween('-6 months', '-1 month');
        $periodEnd = fake()->dateTimeBetween($periodStart, 'now');

        return [
            'user_id' => User::factory()->teacher(),
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'amount' => fake()->randomFloat(2, 50, 5000),
            'status' => fake()->randomElement(['pending', 'processing', 'completed', 'failed']),
            'notes' => fake()->optional(0.7)->sentence(),
            'processed_by_user_id' => null,
            'processed_at' => null,
        ];
    }

    /**
     * Set the payout to pending status.
     */
    public function pending(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'processed_by_user_id' => null,
            'processed_at' => null,
        ]);
    }

    /**
     * Set the payout to processing status.
     */
    public function processing(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
            'processed_by_user_id' => User::factory()->admin(),
            'processed_at' => fake()->dateTimeBetween('-2 days', 'now'),
        ]);
    }

    /**
     * Set the payout to completed status.
     */
    public function completed(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'processed_by_user_id' => User::factory()->admin(),
            'processed_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    /**
     * Set the payout to failed status.
     */
    public function failed(): self
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'processed_by_user_id' => User::factory()->admin(),
            'processed_at' => fake()->dateTimeBetween('-7 days', 'now'),
            'notes' => 'Failed due to ' . fake()->randomElement(['payment processing error', 'insufficient information', 'verification issues']),
        ]);
    }
}
