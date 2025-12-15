<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Payment;
use App\Models\SubscriptionTier;
use App\Models\User;
use App\Models\UserSubscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserSubscription>
 */
final class UserSubscriptionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = UserSubscription::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startedAt = fake()->dateTimeBetween('-6 months', 'now');
        $expiresAt = fake()->dateTimeBetween($startedAt, '+6 months');

        return [
            'user_id' => User::factory(),
            'subscription_tier_id' => SubscriptionTier::factory(),
            'started_at' => $startedAt,
            'expires_at' => $expiresAt,
            'auto_renew' => fake()->boolean(),
            'status' => 'active',
            'latest_payment_id' => null,
        ];
    }

    /**
     * Indicate that the subscription is expired.
     */
    public function expired(): self
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'expired',
                'started_at' => fake()->dateTimeBetween('-1 year', '-3 months'),
                'expires_at' => fake()->dateTimeBetween('-3 months', '-1 day'),
            ];
        });
    }

    /**
     * Indicate that the subscription is cancelled.
     */
    public function cancelled(): self
    {
        return $this->state(function (array $attributes) {
            $cancelledAt = fake()->dateTimeBetween('-2 months', 'now');

            return [
                'status' => 'cancelled',
                'canceled_at' => $cancelledAt,
                'cancellation_reason' => fake()->sentence(),
            ];
        });
    }

    /**
     * Configure the model to have a related payment.
     */
    public function withPayment(): self
    {
        return $this->state(function (array $attributes) {
            $payment = Payment::factory()->create([
                'user_id' => $attributes['user_id'] ?? User::factory(),
            ]);

            return [
                'latest_payment_id' => $payment->id,
            ];
        });
    }
}
