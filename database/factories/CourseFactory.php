<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Category;
use App\Models\Course;
use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\SubscriptionTier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
final class CourseFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Course::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence();
        return [
            'user_id' => User::factory()->teacher(),
            'title' => $title,
            'slug' => Str::slug($title),
            'description' => fake()->paragraphs(3, true),
            'short_description' => fake()->paragraph(),
            'thumbnail_path' => null,
            'price' => fake()->randomFloat(2, 0, 100),
            'language' => fake()->randomElement(['en', 'sw', 'lg', 'fr']),
            'requirements' => [fake()->sentence(), fake()->sentence()],
            'what_you_will_learn' => [fake()->sentence(), fake()->sentence(), fake()->sentence()],
            'instructor_info' => fake()->optional()->paragraph(),
            'tags' => [fake()->word(), fake()->word(), fake()->word()],
            'duration_in_minutes' => fake()->numberBetween(60, 600),
            'is_featured' => fake()->boolean(20),
            'is_recommended' => fake()->boolean(20),
            'allow_certificate' => fake()->boolean(30),
            'certificate_template_id' => null,
            'is_published' => true,
            'published_at' => now(),
            'subscription_required' => false,
            'required_subscription_tier_id' => null,
            'enable_coupon' => fake()->boolean(30),
            'sale_price' => fake()->optional(0.3)->randomFloat(2, 0, 100),
            'sale_start_date' => fake()->optional(0.3)->dateTimeBetween('-1 week', 'now'),
            'sale_end_date' => fake()->optional(0.3)->dateTimeBetween('now', '+2 weeks'),
            'enable_bulk_purchase' => fake()->boolean(20),
            'enable_gift_option' => fake()->boolean(20),
            'position' => fake()->numberBetween(1, 100),
            'category_id' => null,
            'subject_id' => null,
            'grade_level_id' => null,
        ];
    }

    /**
     * Indicate that the course is unpublished.
     */
    public function unpublished(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_published' => false,
            'published_at' => null,
        ]);
    }

    /**
     * Indicate that the course requires a subscription.
     */
    public function requiresSubscription(SubscriptionTier $tier = null): self
    {
        return $this->state(function (array $attributes) use ($tier) {
            return [
                'subscription_required' => true,
                'required_subscription_tier_id' => $tier ? $tier->id : SubscriptionTier::factory(),
            ];
        });
    }

    /**
     * Set a specific category for the course.
     */
    public function inCategory(Category $category = null): self
    {
        return $this->state(function (array $attributes) use ($category) {
            return [
                'category_id' => $category ? $category->id : Category::factory(),
            ];
        });
    }

    /**
     * Set a specific subject for the course.
     */
    public function withSubject(Subject $subject = null): self
    {
        return $this->state(function (array $attributes) use ($subject) {
            return [
                'subject_id' => $subject ? $subject->id : Subject::factory(),
            ];
        });
    }

    /**
     * Set a specific grade level for the course.
     */
    public function forGradeLevel(GradeLevel $gradeLevel = null): self
    {
        return $this->state(function (array $attributes) use ($gradeLevel) {
            return [
                'grade_level_id' => $gradeLevel ? $gradeLevel->id : GradeLevel::factory(),
            ];
        });
    }

    /**
     * Make the course featured.
     */
    public function featured(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }

    /**
     * Make the course recommended.
     */
    public function recommended(): self
    {
        return $this->state(fn (array $attributes) => [
            'is_recommended' => true,
        ]);
    }

    /**
     * Allow certificate for the course.
     */
    public function withCertificate(): self
    {
        return $this->state(fn (array $attributes) => [
            'allow_certificate' => true,
        ]);
    }

    /**
     * Enable sale pricing for the course.
     */
    public function onSale(): self
    {
        return $this->state(fn (array $attributes) => [
            'sale_price' => fake()->randomFloat(2, 0, $attributes['price']),
            'sale_start_date' => now()->subDay(),
            'sale_end_date' => now()->addDays(7),
        ]);
    }
}
