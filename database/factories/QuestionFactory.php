<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Question;
use App\Models\Quiz;
use App\Models\SubjectTopic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Question>
 */
final class QuestionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Question::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'text' => fake()->sentence() . '?',
            'question_type' => fake()->randomElement([
                'single_choice', 'multiple_choice', 'true_false',
                'matching', 'image_matching', 'fill_in_the_gap', 'keywords'
            ]),
            'points' => fake()->numberBetween(1, 10),
            'order' => fake()->numberBetween(0, 20),
            'hint' => fake()->optional(0.5)->sentence(),
            'explanation' => fake()->optional(0.7)->paragraph(),
            'image_path' => fake()->optional(0.3)->imageUrl(),
            'add_to_my_library' => fake()->boolean(30),
            'subject_topic_id' => fake()->optional(0.7)->randomElement([null, SubjectTopic::factory()]),
        ];
    }

    /**
     * Create a single choice question.
     */
    public function singleChoice(): self
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => 'single_choice',
        ]);
    }

    /**
     * Create a multiple choice question.
     */
    public function multipleChoice(): self
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => 'multiple_choice',
        ]);
    }

    /**
     * Create a true/false question.
     */
    public function trueFalse(): self
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => 'true_false',
            'text' => fake()->sentence(), 
        ]);
    }

    /**
     * Create a matching question.
     */
    public function matching(): self
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => 'matching',
        ]);
    }

    /**
     * Create an image matching question.
     */
    public function imageMatching(): self
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => 'image_matching',
        ]);
    }

    /**
     * Create a fill in the gap question.
     */
    public function fillInTheGap(): self
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => 'fill_in_the_gap',
            'text' => 'The capital of France is [blank] and the capital of Italy is [blank].',
        ]);
    }

    /**
     * Create a keywords question.
     */
    public function keywords(): self
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => 'keywords',
        ]);
    }

    /**
     * Associate with a specific subject topic.
     */
    public function forSubjectTopic(SubjectTopic $subjectTopic = null): self
    {
        return $this->state(function (array $attributes) use ($subjectTopic) {
            return [
                'subject_topic_id' => $subjectTopic ? $subjectTopic->id : SubjectTopic::factory(),
            ];
        });
    }
}
