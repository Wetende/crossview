<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ParentProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ParentProfile>
 */
final class ParentProfileFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ParentProfile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'occupation' => fake()->jobTitle(),
            'relationship_to_student' => fake()->randomElement(['Mother', 'Father', 'Guardian', 'Grandparent']),
            'notification_preferences' => [
                'email' => fake()->boolean(80),
                'sms' => fake()->boolean(50),
                'push' => fake()->boolean(30),
            ],
        ];
    }
}
