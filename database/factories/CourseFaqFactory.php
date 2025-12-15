<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CourseFaq;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseFaq>
 */
final class CourseFaqFactory extends Factory
{
    protected $model = CourseFaq::class;

    public function definition(): array
    {
        return [
            'course_id' => Course::factory(), 
            'question' => rtrim(fake()->sentence(rand(6, 12)), '.') . '?',
            'answer' => fake()->paragraphs(rand(1, 3), true),
            'order' => fake()->unique()->numberBetween(1, 100), 
            'is_published' => fake()->boolean(90), 
        ];
    }
}
