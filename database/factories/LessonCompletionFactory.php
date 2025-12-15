<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\LessonCompletion;
use App\Models\User;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LessonCompletion>
 */
final class LessonCompletionFactory extends Factory
{
    protected $model = LessonCompletion::class;

    public function definition(): array
    {
        
        $lesson = Lesson::inRandomOrder()->first() ?? Lesson::factory()->create();

        return [
            'user_id' => User::factory(), 
            'lesson_id' => $lesson->id,
            'completed_at' => fake()->dateTimeThisYear(),
        ];
    }
}
