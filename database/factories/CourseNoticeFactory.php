<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CourseNotice;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CourseNotice>
 */
final class CourseNoticeFactory extends Factory
{
    protected $model = CourseNotice::class;

    public function definition(): array
    {
        $isActive = fake()->boolean(80); 
        $displayFrom = fake()->dateTimeBetween('-1 month', '+1 month');
        $displayUntil = $isActive && fake()->boolean(70) ? fake()->dateTimeBetween($displayFrom, '+2 months') : null;

        return [
            'course_id' => Course::factory(),
            'title' => fake()->catchPhrase(),
            'content' => fake()->paragraph(rand(2, 5)),
            'type' => fake()->randomElement(['info', 'warning', 'update', 'important', 'event']),
            'is_active' => $isActive,
            'display_from' => $displayFrom,
            'display_until' => $displayUntil,
            
        ];
    }
}
