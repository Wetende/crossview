<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\TeacherPaymentDetail;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TeacherPaymentDetail>
 */
final class TeacherPaymentDetailFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = TeacherPaymentDetail::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $paymentMethod = fake()->randomElement(['bank_transfer', 'mobile_money', 'paypal', 'stripe']);

        return [
            'user_id' => User::factory()->teacher(),
            'payment_method' => $paymentMethod,
            'account_details' => $this->generateAccountDetails($paymentMethod),
            'is_verified' => fake()->boolean(70),
        ];
    }

    /**
     * Generate mock account details based on payment method.
     */
    private function generateAccountDetails(string $paymentMethod): string
    {
        $details = match ($paymentMethod) {
            'bank_transfer' => [
                'bank_name' => fake()->company(),
                'account_number' => fake()->numerify('##########'),
                'account_name' => fake()->name(),
                'swift_code' => fake()->regexify('[A-Z]{4}[A-Z]{2}[0-9A-Z]{2}'),
            ],
            'mobile_money' => [
                'phone_number' => fake()->phoneNumber(),
                'provider' => fake()->randomElement(['MTN', 'Vodafone', 'Airtel']),
                'account_name' => fake()->name(),
            ],
            'paypal' => [
                'email' => fake()->email(),
                'account_id' => fake()->regexify('[A-Z0-9]{12}'),
            ],
            'stripe' => [
                'account_id' => 'acct_' . fake()->regexify('[a-zA-Z0-9]{16}'),
                'account_holder_name' => fake()->name(),
            ],
            default => [
                'notes' => 'Custom payment method',
                'details' => fake()->text(),
            ],
        };

        return json_encode($details);
    }

    /**
     * Mark the payment details as verified.
     */
    public function verified(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_verified' => true,
        ]);
    }

    /**
     * Mark the payment details as unverified.
     */
    public function unverified(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_verified' => false,
        ]);
    }

    /**
     * Set the payment method to bank transfer.
     */
    public function bankTransfer(): self
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => 'bank_transfer',
            'account_details' => $this->generateAccountDetails('bank_transfer'),
        ]);
    }

    /**
     * Set the payment method to mobile money.
     */
    public function mobileMoney(): self
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => 'mobile_money',
            'account_details' => $this->generateAccountDetails('mobile_money'),
        ]);
    }

    /**
     * Set the payment method to PayPal.
     */
    public function paypal(): self
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => 'paypal',
            'account_details' => $this->generateAccountDetails('paypal'),
        ]);
    }
}
