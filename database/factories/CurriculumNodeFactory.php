<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Course;
use App\Models\CurriculumNode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CurriculumNode>
 */
final class CurriculumNodeFactory extends Factory
{
    protected $model = CurriculumNode::class;

    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'parent_id' => null,
            'node_type' => 'course',
            'title' => $this->faker->sentence(3),
            'code' => strtoupper($this->faker->lexify('???-###')),
            'description' => $this->faker->paragraph(),
            'properties' => [],
            'completion_rules' => [],
            'position' => $this->faker->numberBetween(0, 100),
            'is_published' => $this->faker->boolean(80),
        ];
    }

    public function forCourse(Course $course): static
    {
        return $this->state(fn (array $attributes) => [
            'course_id' => $course->id,
        ]);
    }

    public function withParent(CurriculumNode $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parent->id,
            'course_id' => $parent->course_id,
        ]);
    }

    public function ofType(string $type): static
    {
        return $this->state(fn (array $attributes) => [
            'node_type' => $type,
        ]);
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => true,
        ]);
    }

    public function withProperties(array $properties): static
    {
        return $this->state(fn (array $attributes) => [
            'properties' => $properties,
        ]);
    }
}
