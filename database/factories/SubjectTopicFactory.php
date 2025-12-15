<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Subject;
use App\Models\SubjectTopic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SubjectTopic>
 */
final class SubjectTopicFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = SubjectTopic::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject_id' => Subject::factory(),
            'name' => fake()->words(3, true),
            'parent_topic_id' => null,
            'curriculum_code' => fake()->optional(0.5)->regexify('[A-Z][0-9]\.[0-9]'),
        ];
    }

    /**
     * Make this topic a subtopic of another topic.
     */
    public function asSubtopic(SubjectTopic $parentTopic = null): self
    {
        return $this->state(function (array $attributes) use ($parentTopic) {
            $parent = $parentTopic ?? SubjectTopic::factory()->create([
                'subject_id' => $attributes['subject_id'],
                'parent_topic_id' => null,
            ]);

            return [
                'parent_topic_id' => $parent->id,
                'subject_id' => $parent->subject_id,
            ];
        });
    }
}
