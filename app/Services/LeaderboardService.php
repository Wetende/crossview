<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Leaderboard;
use App\Models\LeaderboardEntry;
use App\Models\User;
use App\Models\UserPoint;
use App\Models\Course;
use App\Models\Quiz;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

final readonly class LeaderboardService
{
    public function __construct(
        private UserPointsService $userPointsService,
    ) {
    }

    /**
     * Create a new leaderboard.
     */
    public function createLeaderboard(
        string $name,
        ?string $description = null,
        string $scopeType = 'site',
        ?Model $scopeableModel = null,
        string $timePeriod = 'monthly',
        ?Carbon $startDate = null,
        ?Carbon $endDate = null,
        bool $isActive = true
    ): Leaderboard {
        return Leaderboard::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $description,
            'scope_type' => $scopeType,
            'scope_id' => $scopeableModel?->id,
            'time_period' => $timePeriod,
            'is_active' => $isActive,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);
    }

    /**
     * Update a leaderboard with the latest user rankings.
     */
    public function updateLeaderboard(Leaderboard $leaderboard): void
    {

        $startDate = $this->getStartDateForTimePeriod($leaderboard->time_period, $leaderboard->start_date);

        
        $userPoints = $this->getUserPointsForLeaderboard($leaderboard, $startDate);

        
        $userTotals = $userPoints->groupBy('user_id')
            ->map(fn ($points) => $points->sum('points'))
            ->sort(SORT_NUMERIC)
            ->reverse();

        
        $leaderboard->entries()->delete();

        
        $rank = 1;
        foreach ($userTotals as $userId => $points) {
            LeaderboardEntry::create([
                'leaderboard_id' => $leaderboard->id,
                'user_id' => $userId,
                'rank' => $rank++,
                'points' => $points,
                'is_public' => true, 
            ]);
        }

        
        $leaderboard->update(['last_updated_at' => now()]);
    }

    /**
     * Get user position in a specific leaderboard.
     */
    public function getUserPosition(Leaderboard $leaderboard, User $user): ?LeaderboardEntry
    {
        return $leaderboard->entries()->where('user_id', $user->id)->first();
    }

    /**
     * Get leaderboards that a user appears in.
     */
    public function getLeaderboardsForUser(User $user): Collection
    {
        return Leaderboard::whereHas('entries', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->get();
    }

    /**
     * Get leaderboards for a specific scope (e.g., a course or category).
     */
    public function getLeaderboardsForScope(string $scopeType, ?int $scopeId = null): Collection
    {
        $query = Leaderboard::where('scope_type', $scopeType)
            ->where('is_active', true);

        if ($scopeId !== null) {
            $query->where('scope_id', $scopeId);
        }

        return $query->get();
    }

    /**
     * Update all active leaderboards.
     */
    public function updateAllActiveLeaderboards(): void
    {
        $leaderboards = Leaderboard::where('is_active', true)->get();

        foreach ($leaderboards as $leaderboard) {
            $this->updateLeaderboard($leaderboard);
        }
    }

    /**
     * Get the start date for a time period.
     */
    private function getStartDateForTimePeriod(string $timePeriod, ?Carbon $startDate = null): ?Carbon
    {
        if ($startDate) {
            return $startDate;
        }

        return match ($timePeriod) {
            'weekly' => now()->startOfWeek(),
            'monthly' => now()->startOfMonth(),
            'yearly' => now()->startOfYear(),
            'all_time' => null,
            default => now()->subMonth(),
        };
    }

    /**
     * Get user points for a leaderboard within a time range.
     */
    private function getUserPointsForLeaderboard(Leaderboard $leaderboard, ?Carbon $startDate): Collection
    {
        $query = UserPoint::query();

        
        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($leaderboard->end_date) {
            $query->where('created_at', '<=', $leaderboard->end_date);
        }

        
        if ($leaderboard->scope_type !== 'site' && $leaderboard->scope_id) {
            if ($leaderboard->scope_type === 'course') {
                $courseClass = Course::class;
                $quizClass = Quiz::class;

                
                
                
                $query->where(function ($q) use ($leaderboard, $courseClass, $quizClass) {
                    
                    $q->where(function ($subQ) use ($leaderboard, $courseClass) {
                        $subQ->where('source_type', $courseClass)
                            ->where('source_id', $leaderboard->scope_id);
                    });

                    
                    
                    
                    $q->orWhere(function ($subQ) use ($quizClass) {
                        $subQ->where('source_type', $quizClass);
                    });
                });
            } elseif ($leaderboard->scope_type === 'category') {
                
                
                

                
                
            }
        }

        return $query->get();
    }
}
