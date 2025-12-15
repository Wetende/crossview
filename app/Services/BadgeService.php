<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Badge;
use App\Models\User;
use App\Models\UserBadge;
use App\Notifications\BadgeEarnedNotification;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final readonly class BadgeService
{
    /**
     * Get all badges available in the system
     */
    public function getAllBadges(): Collection
    {
        return Badge::where('is_active', true)->orderBy('name')->get();
    }

    /**
     * Get all badges earned by a specific user
     */
    public function getUserBadges(User $user): Collection
    {
        return $user->badges()->orderBy('user_badges.earned_at', 'desc')->get();
    }

    /**
     * Award a badge to a user if they meet the criteria
     */
    public function awardBadgeIfEligible(User $user, string $criteriaType, int|string $achievedValue): bool
    {
        $eligibleBadges = $this->getEligibleBadges($criteriaType, $achievedValue);

        if ($eligibleBadges->isEmpty()) {
            return false;
        }

        $awarded = false;

        foreach ($eligibleBadges as $badge) {
            
            if ($user->badges()->where('badge_id', $badge->id)->exists()) {
                continue;
            }

            $this->awardBadge($user, $badge);
            $awarded = true;
        }

        return $awarded;
    }

    /**
     * Get badges that match the criteria type and value
     */
    public function getEligibleBadges(string $criteriaType, int|string $achievedValue): Collection
    {
        return Badge::where('is_active', true)
            ->where('criteria_type', $criteriaType)
            ->where(function ($query) use ($achievedValue) {
                
                if (is_numeric($achievedValue)) {
                    $query->whereRaw('CAST(criteria_value AS UNSIGNED) <= ?', [(int)$achievedValue]);
                } else {
                    
                    $query->where('criteria_value', $achievedValue);
                }
            })
            ->get();
    }

    /**
     * Award a specific badge to a user
     */
    public function awardBadge(User $user, Badge $badge, ?string $reason = null): UserBadge
    {
        try {
            DB::beginTransaction();

            $userBadge = UserBadge::create([
                'user_id' => $user->id,
                'badge_id' => $badge->id,
                'earned_at' => Carbon::now(),
                'award_reason' => $reason ?? "Earned for meeting {$badge->criteria_type} criteria",
            ]);

            
            $user->notify(new BadgeEarnedNotification($badge));

            DB::commit();

            return $userBadge;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error awarding badge: ' . $e->getMessage(), [
                'badge_id' => $badge->id,
                'user_id' => $user->id,
                'exception' => $e,
            ]);

            throw $e;
        }
    }

    /**
     * Check and award course completion badges
     */
    public function checkCourseCompletionBadges(User $user, int $completedCoursesCount): bool
    {
        return $this->awardBadgeIfEligible($user, 'course_completion_count', $completedCoursesCount);
    }

    /**
     * Check and award quiz score badges
     */
    public function checkQuizScoreBadges(User $user, int $quizScorePercentage): bool
    {
        return $this->awardBadgeIfEligible($user, 'quiz_score_above', $quizScorePercentage);
    }

    /**
     * Check and award login streak badges
     */
    public function checkLoginStreakBadges(User $user, int $streakDays): bool
    {
        return $this->awardBadgeIfEligible($user, 'login_streak_days', $streakDays);
    }
}
