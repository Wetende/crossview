<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizAttemptAnswer>
 */
final class QuizAttemptAnswerFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = QuizAttemptAnswer::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $isCorrect = fake()->boolean(70);

        return [
            'quiz_attempt_id' => QuizAttempt::factory(),
            'question_id' => Question::factory(),
            'answer_text' => $this->generateAnswerText(),
            'is_correct' => $isCorrect,
            'score' => $isCorrect ? fake()->randomFloat(2, 0.5, 10) : 0,
        ];
    }

    /**
     * Generate answer text based on random question type.
     */
    private function generateAnswerText(): array
    {
        $questionType = fake()->randomElement([
            'single_choice',
            'multiple_choice',
            'true_false',
            'matching',
            'fill_in_the_gap',
            'keywords'
        ]);

        return match ($questionType) {
            'single_choice' => ['selected_option_id' => fake()->numberBetween(1, 5)],
            'multiple_choice' => ['selected_option_ids' => [fake()->numberBetween(1, 5), fake()->numberBetween(6, 10)]],
            'true_false' => ['selected_value' => fake()->boolean()],
            'matching' => [
                'pairs' => [
                    ['left_id' => 1, 'right_id' => 3],
                    ['left_id' => 2, 'right_id' => 1],
                    ['left_id' => 3, 'right_id' => 2],
                ]
            ],
            'fill_in_the_gap' => ['answers' => ['Paris', 'Rome']],
            'keywords' => ['text' => fake()->words(5, true)],
        };
    }

    /**
     * Indicate that the answer is correct.
     */
    public function correct(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_correct' => true,
            'score' => fake()->randomFloat(2, 0.5, 10),
        ]);
    }

    /**
     * Indicate that the answer is incorrect.
     */
    public function incorrect(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_correct' => false,
            'score' => 0,
        ]);
    }

    /**
     * Set a specific answer type and format.
     */
    public function withAnswerType(string $type, array $answerData): self
    {
        return $this->state(fn (array $attributes) => [
            'answer_text' => $answerData,
        ]);
    }
}
