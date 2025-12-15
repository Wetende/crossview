<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\SubscriptionTier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

final class SubscriptionTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if subscription tiers already exist
        if (SubscriptionTier::count() > 0) {
            $this->command->info('Subscription tiers already exist. Skipping seeding.');
            return;
        }
        
        $this->command->info('Seeding subscription tiers...');
        
        // Basic tier
        SubscriptionTier::create([
            'name' => 'Basic',
            'description' => 'Perfect for beginners looking to explore our learning platform with limited access.',
            'price' => 0,
            'level' => 0,
            'duration_days' => 0,
            'max_courses' => 2,
            'features' => [
                'Access to 2 courses',
                'Basic quizzes',
                'Forum access',
                'Email support'
            ],
            'is_active' => true,
        ]);

        // Standard tier
        SubscriptionTier::create([
            'name' => 'Standard',
            'description' => 'Our most popular package with a perfect balance of features for committed learners.',
            'price' => 19900, 
            'level' => 1,
            'duration_days' => 30,
            'max_courses' => 5,
            'features' => [
                'Access to 5 courses',
                'Advanced quizzes',
                'Downloadable materials',
                'Forum access',
                'Priority email support',
                'Progress tracking'
            ],
            'is_active' => true,
        ]);

        // Premium tier
        SubscriptionTier::create([
            'name' => 'Premium',
            'description' => 'The ultimate learning experience with full platform access and premium support.',
            'price' => 39900, 
            'level' => 2,
            'duration_days' => 30,
            'max_courses' => null, 
            'features' => [
                'Unlimited course access',
                'All advanced quizzes',
                'Downloadable materials',
                'Forum moderation privileges',
                'Priority 24/7 support',
                'Offline access',
                'Dedicated tutor sessions',
                'Course completion certificates',
                'Early access to new courses'
            ],
            'is_active' => true,
        ]);
        
        $this->command->info('Subscription tiers seeded successfully.');
    }
}
