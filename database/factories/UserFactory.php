<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
final class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Role to attach after creating the user.
     */
    protected ?string $roleName = null;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstName = fake()->firstName();
        $lastName = fake()->lastName();

        return [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'name' => $firstName . ' ' . $lastName,
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'profile_picture_path' => null,
            'phone_number' => fake()->phoneNumber(),
            'phone_verified_at' => now(),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Set the role to admin.
     */
    public function admin(): static
    {
        return $this->state(function () {
            $this->roleName = 'admin';
            return [];
        });
    }

    /**
     * Set the role to teacher.
     */
    public function teacher(): static
    {
        return $this->state(function () {
            $this->roleName = 'teacher';
            return [];
        });
    }

    /**
     * Set the role to student.
     */
    public function student(): static
    {
        return $this->state(function () {
            $this->roleName = 'student';
            return [];
        });
    }

    /**
     * Set the role to parent.
     */
    public function parent(): static
    {
        return $this->state(function () {
            $this->roleName = 'parent';
            return [];
        });
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (User $user) {
            if ($this->roleName) {
                Log::info("Attaching role {$this->roleName} to user {$user->id}");

                
                $role = Role::where('name', $this->roleName)->first();

                if ($role) {
                    
                    DB::table('role_user')->insert([
                        'role_id' => $role->id,
                        'user_id' => $user->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    
                    $user->load('roles');

                    Log::info("Attached role {$role->id} ({$role->name}) to user {$user->id}");
                } else {
                    Log::warning("Role {$this->roleName} not found when creating user {$user->id}");
                }
            }
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
