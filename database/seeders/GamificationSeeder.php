<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\UserBadge;
use App\Models\User;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

final class GamificationSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $this->command->info('Seeding gamification data (badges, user badges)...');

        
        $badgeCount = $faker->numberBetween(10, 15);
        Badge::factory()->count($badgeCount)->create();
        $this->command->info($badgeCount . ' badges seeded.');

        
        $students = User::whereHas('roles', fn ($q) => $q->where('name', 'student'))->get();
        $badges = Badge::where('is_active', true)->get();

        if ($students->isEmpty() || $badges->isEmpty()) {
            $this->command->warn('No students or active badges found. Skipping awarding badges.');
        } else {
            foreach ($students as $student) {
                if ($faker->boolean(60)) { 
                    $numberOfBadgesToAward = $faker->numberBetween(1, min(5, $badges->count()));
                    $awardedBadges = $badges->random($numberOfBadgesToAward);

                    
                    if (!$awardedBadges instanceof \Illuminate\Database\Eloquent\Collection) {
                        $awardedBadges = new \Illuminate\Database\Eloquent\Collection([$awardedBadges]);
                    }

                    foreach ($awardedBadges as $badge) {
                        
                        if (!UserBadge::where('user_id', $student->id)->where('badge_id', $badge->id)->exists()) {
                            UserBadge::factory()->create([
                                'user_id' => $student->id,
                                'badge_id' => $badge->id,
                                'earned_at' => $faker->dateTimeThisYear(),
                            ]);
                        }
                    }
                }
            }
            $this->command->info('Badges awarded to students.');
        }

        $this->command->info('Gamification data seeding completed.');
    }
}
