<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AssignmentSubmission>
 */
final class AssignmentSubmissionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = AssignmentSubmission::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'assignment_id' => Assignment::factory(),
            'user_id' => User::factory()->student(),
            'content' => fake()->paragraphs(3, true),
            'attachments' => [
                [
                    'path' => 'assignments/submission-' . fake()->uuid() . '.pdf',
                    'name' => 'submission.pdf',
                ]
            ],
            'grade' => null,
            'graded_at' => null,
            'teacher_feedback' => null,
            'submitted_at' => now(),
        ];
    }

    /**
     * Indicate that the submission has been graded.
     */
    public function graded(): self
    {
        return $this->state(function (array $attributes) {
            $assignment = Assignment::find($attributes['assignment_id']);
            $maxPoints = $assignment ? $assignment->points_possible : 100;

            return [
                'grade' => fake()->numberBetween(0, $maxPoints),
                'graded_at' => now(),
                'teacher_feedback' => fake()->paragraph(),
            ];
        });
    }

    /**
     * Indicate that the submission is late.
     */
    public function late(): self
    {
        return $this->state(function (array $attributes) {
            $assignment = Assignment::find($attributes['assignment_id']);
            $dueDate = $assignment ? $assignment->due_date : now()->subDays(1);

            return [
                'submitted_at' => fake()->dateTimeBetween($dueDate, '+5 days'),
            ];
        });
    }

    /**
     * Specify a student for the submission.
     */
    public function byStudent(User $student): self
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $student->id,
        ]);
    }
}
