<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TeacherProfile>
 */
final class TeacherProfileFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = TeacherProfile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'bio' => fake()->paragraph(),
            'qualifications' => fake()->sentence(),
            'school_affiliation' => fake()->company(),
            'position' => fake()->jobTitle(),
            'hourly_rate' => fake()->randomFloat(2, 20, 100),
            'available_for_tutoring' => fake()->boolean(),
        ];
    }
}
