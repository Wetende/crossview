<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Role>
 */
final class RoleFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Role::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'display_name' => fake()->words(2, true),
        ];
    }

    /**
     * Get an existing admin role.
     *
     * @return \App\Models\Role
     */
    public function admin()
    {
        return Role::where('name', 'admin')->firstOrFail();
    }

    /**
     * Get an existing student role.
     *
     * @return \App\Models\Role
     */
    public function student()
    {
        return Role::where('name', 'student')->firstOrFail();
    }

    /**
     * Get an existing teacher role.
     *
     * @return \App\Models\Role
     */
    public function teacher()
    {
        return Role::where('name', 'teacher')->firstOrFail();
    }

    /**
     * Get an existing parent role.
     *
     * @return \App\Models\Role
     */
    public function parent()
    {
        return Role::where('name', 'parent')->firstOrFail();
    }
}
