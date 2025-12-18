<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\AcademicBlueprint;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AcademicBlueprint>
 */
final class AcademicBlueprintFactory extends Factory
{
    protected $model = AcademicBlueprint::class;

    public function definition(): array
    {
        $hierarchies = [
            ['Course', 'Section', 'Lesson'],
            ['Year', 'Unit', 'Session'],
            ['Level', 'Module', 'Competency', 'Element'],
            ['Track', 'Course', 'Lesson'],
            ['Program', 'Module', 'Topic'],
        ];

        return [
            'name' => $this->faker->unique()->words(3, true) . ' Blueprint',
            'description' => $this->faker->paragraph(),
            'hierarchy_structure' => $this->faker->randomElement($hierarchies),
            'grading_logic' => [
                'type' => 'weighted',
                'pass_mark' => $this->faker->numberBetween(40, 70),
                'components' => [
                    ['name' => 'CAT', 'weight' => 0.3],
                    ['name' => 'Exam', 'weight' => 0.7],
                ],
            ],
            'progression_rules' => [
                'sequential' => $this->faker->boolean(),
                'prerequisites' => [],
            ],
            'gamification_enabled' => $this->faker->boolean(),
            'certificate_enabled' => $this->faker->boolean(),
        ];
    }

    public function competencyBased(): static
    {
        return $this->state(fn (array $attributes) => [
            'hierarchy_structure' => ['Level', 'Module', 'Competency', 'Element'],
            'grading_logic' => [
                'type' => 'competency',
                'competency_labels' => [
                    'pass' => 'Competent',
                    'fail' => 'Not Yet Competent',
                ],
            ],
        ]);
    }

    public function passFail(): static
    {
        return $this->state(fn (array $attributes) => [
            'grading_logic' => [
                'type' => 'pass_fail',
            ],
        ]);
    }

    public function theologyStandard(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'CCT Theology Standard',
            'hierarchy_structure' => ['Year', 'Unit', 'Session'],
            'grading_logic' => [
                'type' => 'weighted',
                'pass_mark' => 40,
                'components' => [
                    ['name' => 'CAT', 'weight' => 0.3],
                    ['name' => 'Exam', 'weight' => 0.7],
                ],
            ],
        ]);
    }
}
