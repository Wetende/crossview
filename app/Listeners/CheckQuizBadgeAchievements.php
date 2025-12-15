<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\QuizCompleted;
use App\Services\BadgeService;

final class CheckQuizBadgeAchievements
{
    public function __construct(
        private readonly BadgeService $badgeService
    ) {
    }

    public function handle(QuizCompleted $event): void
    {
        $user = $event->user;
        $quizAttempt = $event->quizAttempt;

        
        $scorePercentage = (int) round($quizAttempt->score);

        
        $this->badgeService->checkQuizScoreBadges($user, $scorePercentage);
    }
}
