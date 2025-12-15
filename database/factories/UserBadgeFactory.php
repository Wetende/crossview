<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\UserBadge;
use App\Models\User;
use App\Models\Badge;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserBadge>
 */
final class UserBadgeFactory extends Factory
{
    protected $model = UserBadge::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(), 
            'badge_id' => Badge::factory(), 
            'earned_at' => fake()->dateTimeThisYear(),
            
            
            
        ];
    }
}
