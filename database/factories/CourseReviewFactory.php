<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Course;
use App\Models\CourseReview;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseReview>
 */
final class CourseReviewFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = CourseReview::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->student(),
            'course_id' => Course::factory(),
            'content' => fake()->paragraph(),
            'rating' => fake()->numberBetween(1, 5),
            'is_approved' => true,
            'is_featured' => fake()->boolean(10),
            'is_anonymous' => fake()->boolean(20),
            'enrollment_id' => null,
        ];
    }

    /**
     * Associate the review with a specific enrollment.
     */
    public function withEnrollment(Enrollment $enrollment = null): self
    {
        return $this->state(function (array $attributes) use ($enrollment) {
            if ($enrollment) {
                return [
                    'user_id' => $enrollment->user_id,
                    'course_id' => $enrollment->course_id,
                    'enrollment_id' => $enrollment->id,
                ];
            }

            
            $enrollment = Enrollment::factory()->create([
                'user_id' => $attributes['user_id'],
                'course_id' => $attributes['course_id'],
            ]);

            return [
                'enrollment_id' => $enrollment->id,
            ];
        });
    }

    /**
     * Mark the review as featured.
     */
    public function featured(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }

    /**
     * Mark the review as anonymous.
     */
    public function anonymous(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_anonymous' => true,
        ]);
    }

    /**
     * Set the review to a specific rating.
     */
    public function withRating(int $rating): self
    {
        return $this->state(fn (array $attributes) => [
            'rating' => min(max($rating, 1), 5), 
        ]);
    }

    /**
     * Mark the review as pending approval.
     */
    public function pendingApproval(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_approved' => false,
        ]);
    }
}
