<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SubscriptionTier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SubscriptionTier>
 */
final class SubscriptionTierFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = SubscriptionTier::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->randomElement(['Basic', 'Standard', 'Premium', 'Ultimate', 'Pro']) . ' Plan';

        return [
            'name' => $name,
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 4.99, 29.99),
            'level' => fake()->numberBetween(0, 3),
            'duration_days' => fake()->randomElement([0, 30, 90, 365]), 
            'max_courses' => fake()->optional()->numberBetween(10, 100),
            'features' => [
                'feature_1' => 'Access to ' . fake()->numberBetween(10, 500) . '+ courses',
                'feature_2' => fake()->randomElement(['HD video quality', '4K video quality']),
                'feature_3' => fake()->randomElement(['Offline downloads', 'Certificate of completion']),
                'feature_4' => fake()->optional()->randomElement(['1-on-1 mentoring', 'Priority support']),
            ],
            'is_active' => true,
        ];
    }

    /**
     * Create a basic tier.
     */
    public function basic(): self
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Basic Plan',
            'price' => 9.99,
            'level' => 1,
            'duration_days' => 30,
            'max_courses' => 20,
            'features' => [
                'feature_1' => 'Access to 100+ courses',
                'feature_2' => 'HD video quality',
                'feature_3' => 'Certificate of completion',
            ],
        ]);
    }

    /**
     * Create a premium tier.
     */
    public function premium(): self
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Premium Plan',
            'price' => 19.99,
            'level' => 2,
            'duration_days' => 30,
            'max_courses' => 50,
            'features' => [
                'feature_1' => 'Access to 300+ courses',
                'feature_2' => '4K video quality',
                'feature_3' => 'Certificate of completion',
                'feature_4' => 'Offline downloads',
                'feature_5' => 'Priority support',
            ],
        ]);
    }

    /**
     * Create an ultimate tier.
     */
    public function ultimate(): self
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Ultimate Plan',
            'price' => 29.99,
            'level' => 3,
            'duration_days' => 30,
            'max_courses' => null,
            'features' => [
                'feature_1' => 'Access to ALL courses',
                'feature_2' => '4K video quality',
                'feature_3' => 'Certificate of completion',
                'feature_4' => 'Offline downloads',
                'feature_5' => '1-on-1 mentoring sessions',
                'feature_6' => 'Priority support',
            ],
        ]);
    }

    /**
     * Indicate that the tier is inactive.
     */
    public function inactive(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
