<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\CourseCompleted;
use App\Services\BadgeService;
use Illuminate\Support\Facades\DB;

final class CheckCourseBadgeAchievements
{
    public function __construct(
        private readonly BadgeService $badgeService
    ) {
    }

    public function handle(CourseCompleted $event): void
    {
        $user = $event->user;

        
        $completedCoursesCount = DB::table('enrollments')
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->count();

        
        $this->badgeService->checkCourseCompletionBadges($user, $completedCoursesCount);
    }
}
