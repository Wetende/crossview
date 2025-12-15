<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Category;
use App\Models\Leaderboard;
use App\Models\Role;
use App\Models\User;
use App\Models\UserPoint;
use App\Models\Badge;
use App\Models\Quiz;
use App\Services\LeaderboardService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

final class LeaderboardSeeder extends Seeder
{
    public function __construct(
        private readonly LeaderboardService $leaderboardService,
    ) {
    }

    public function run(): void
    {
        $this->command->info('Seeding leaderboards and user points...');

        
        if (Leaderboard::count() > 0) {
            $this->command->info('Leaderboards already exist. Skipping seeding.');
            return;
        }

        
        $this->createLeaderboards();

        
        $this->generateUserPoints();

        
        $this->updateLeaderboards();

        $this->command->info('Leaderboards and user points seeded successfully.');
    }

    private function createLeaderboards(): void
    {
        
        $siteLeaderboards = [
            [
                'name' => 'Monthly Top Performers',
                'description' => 'Students with the highest points earned this month',
                'scope_type' => 'site',
                'time_period' => 'monthly',
            ],
            [
                'name' => 'All-Time Hall of Fame',
                'description' => 'Students with the highest lifetime achievement points',
                'scope_type' => 'site',
                'time_period' => 'all_time',
            ],
            [
                'name' => 'Weekly Challenge Champions',
                'description' => 'Top performers in this week\'s challenges',
                'scope_type' => 'site',
                'time_period' => 'weekly',
            ],
        ];

        foreach ($siteLeaderboards as $leaderboardData) {
            $this->leaderboardService->createLeaderboard(
                $leaderboardData['name'],
                $leaderboardData['description'],
                $leaderboardData['scope_type'],
                null,
                $leaderboardData['time_period']
            );
        }

        
        $topCourses = Course::where('is_published', true)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        foreach ($topCourses as $course) {
            $this->leaderboardService->createLeaderboard(
                "{$course->title} Leaderboard",
                "Top students in the {$course->title} course",
                'course',
                $course,
                'all_time'
            );
        }

        
        $categories = Category::all();
        foreach ($categories as $category) {
            $this->leaderboardService->createLeaderboard(
                "{$category->name} Champions",
                "Top students in {$category->name} courses",
                'category',
                $category,
                'all_time'
            );
        }
    }

    private function generateUserPoints(): void
    {
        
        if (UserPoint::count() > 0) {
            $this->command->info('User points already exist. Skipping generation.');
            return;
        }


        $studentRole = Role::where('name', 'student')->first();
        $students = User::whereHas('roles', function ($query) use ($studentRole) {
            $query->where('role_id', $studentRole->id);
        })->get();

        if ($students->isEmpty()) {
            $this->command->error('No students found. Please run UserSeeder first.');
            return;
        }


        $courses = Course::where('is_published', true)->get();
        if ($courses->isEmpty()) {
            $this->command->error('No published courses found. Please run CourseSeeder first.');
            return;
        }

        
        $activities = [
            
            'courses' => [
                'points' => [50, 100],
                'description' => 'Completed course',
                'class' => Course::class
            ],
            'quizzes' => [
                'points' => [5, 25],
                'description' => 'Scored well on a quiz',
                'class' => Quiz::class
            ],
            'badges' => [
                'points' => [15, 30],
                'description' => 'Earned a badge',
                'class' => Badge::class
            ],
            
            'login' => [
                'points' => [1, 3],
                'description' => 'Daily login bonus',
                'class' => null
            ],
            'forum' => [
                'points' => [2, 5],
                'description' => 'Posted in the forum',
                'class' => null
            ],
        ];

        
        $startDate = Carbon::now()->subMonths(6);
        $endDate = Carbon::now();
        $daysBetween = $endDate->diffInDays($startDate);

        $userPoints = [];
        $batchSize = 100;

        foreach ($students as $student) {
            
            $studentActivityLevel = rand(1, 5); 
            $numEntries = $studentActivityLevel * 20; 

            for ($i = 0; $i < $numEntries; $i++) {
                
                $date = $startDate->copy()->addDays(rand(0, (int)$daysBetween));

                
                $activityKey = array_rand($activities);
                $activity = $activities[$activityKey];


                $pointRange = $activity['points'];
                $points = rand($pointRange[0], $pointRange[1]);

                
                $sourceId = null;
                $sourceType = null;

                if ($activity['class'] !== null) {
                    $sourceType = $activity['class'];

                    
                    if ($activityKey === 'courses' && $courses->isNotEmpty()) {
                        $sourceId = $courses->random()->id;
                    } elseif ($activityKey === 'quizzes') {
                        $sourceId = rand(1, 100); 
                    } elseif ($activityKey === 'badges') {
                        $sourceId = rand(1, 14); 
                    }
                }

                $userPoints[] = [
                    'user_id' => $student->id,
                    'source_type' => $sourceType,
                    'source_id' => $sourceId,
                    'points' => $points,
                    'description' => $activity['description'],
                    'created_at' => $date,
                    'updated_at' => $date,
                ];

                
                if (count($userPoints) >= $batchSize) {
                    UserPoint::insert($userPoints);
                    $userPoints = [];
                }
            }
        }

        
        if (!empty($userPoints)) {
            UserPoint::insert($userPoints);
        }
    }

    private function updateLeaderboards(): void
    {
        
        $this->leaderboardService->updateAllActiveLeaderboards();
    }
}
