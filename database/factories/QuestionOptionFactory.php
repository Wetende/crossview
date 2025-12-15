<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuestionOption>
 */
final class QuestionOptionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = QuestionOption::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'question_id' => Question::factory(),
            'text' => fake()->sentence(),
            'image_url' => fake()->optional(0.2)->imageUrl(),
            'is_correct' => fake()->boolean(25), 
            'order' => fake()->numberBetween(1, 10),
        ];
    }

    /**
     * Set this option as correct.
     */
    public function correct(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_correct' => true,
        ]);
    }

    /**
     * Set this option as incorrect.
     */
    public function incorrect(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_correct' => false,
        ]);
    }
}
