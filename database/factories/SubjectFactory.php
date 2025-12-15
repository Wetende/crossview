<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subject>
 */
final class SubjectFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Subject::class;

    /**
     * Define the model's default state.
     * This will be used when we explicitly need to create a new subject.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        
        $name = $this->faker->words(2, true);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $this->faker->paragraph(),
            'icon_path' => null,
            'color_code' => $this->faker->hexColor(),
            'is_active' => true,
            'position' => $this->faker->numberBetween(1, 50),
            'curriculum_code' => $this->faker->optional(0.5)->regexify('[A-Z][0-9]'),
        ];
    }

    /**
     * Get an existing subject if available, or create a new one if needed.
     * This is safer than trying to create a new subject which might conflict.
     *
     */
    public function existing(): Subject
    {
        $existingSubjects = Subject::all();
        if ($existingSubjects->isNotEmpty()) {
            return $existingSubjects->random();
        }

        
        return Subject::factory()->create();
    }

    /**
     * Indicate that the subject is inactive.
     */
    public function inactive(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
