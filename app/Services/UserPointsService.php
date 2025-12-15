<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Badge;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\UserPoint;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

final readonly class UserPointsService
{
    /**
     * Award points to a user for completing a course.
     */
    public function awardPointsForCourseCompletion(User $user, Course $course): UserPoint
    {
        return $this->awardPoints(
            user: $user,
            source: $course,
            sourceType: 'course_completion',
            points: 100,
            description: "Completed Course: {$course->title}"
        );
    }

    /**
     * Award points to a user based on their quiz score.
     */
    public function awardPointsForQuizScore(User $user, QuizAttempt $attempt): UserPoint
    {
        $quiz = $attempt->quiz;
        $scorePercent = $attempt->score_percent;

        
        $points = (int) max(10, min(50, round($scorePercent / 2)));

        return $this->awardPoints(
            user: $user,
            source: $quiz,
            sourceType: 'quiz_score',
            points: $points,
            description: "Quiz Score: {$quiz->title} ({$scorePercent}%)"
        );
    }

    /**
     * Award points to a user for earning a badge.
     */
    public function awardPointsForBadgeEarned(User $user, Badge $badge): UserPoint
    {
        return $this->awardPoints(
            user: $user,
            source: $badge,
            sourceType: 'badge_earned',
            points: 50,
            description: "Badge Earned: {$badge->name}"
        );
    }

    /**
     * Get the total points for a user.
     */
    public function getTotalPoints(User $user): int
    {
        return $user->points()->sum('points');
    }

    /**
     * Get the point history for a user, optionally filtered by time period.
     */
    public function getPointHistory(
        User $user,
        ?string $timePeriod = null,
        int $limit = 20
    ): Collection {
        $query = $user->points()->orderBy('created_at', 'desc');

        if ($timePeriod) {
            $query = match ($timePeriod) {
                'weekly' => $query->where('created_at', '>=', now()->subWeek()),
                'monthly' => $query->where('created_at', '>=', now()->subMonth()),
                'yearly' => $query->where('created_at', '>=', now()->subYear()),
                default => $query,
            };
        }

        return $query->limit($limit)->get();
    }

    /**
     * Award points to a user.
     */
    private function awardPoints(
        User $user,
        Model $source,
        string $sourceType,
        int $points,
        string $description
    ): UserPoint {
        return UserPoint::create([
            'user_id' => $user->id,
            'source_type' => $sourceType,
            'source_id' => $source->id,
            'points' => $points,
            'description' => $description,
        ]);
    }
}
