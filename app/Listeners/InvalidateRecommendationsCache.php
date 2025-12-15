<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\CourseCompleted;
use App\Events\CourseEnrolled;
use App\Services\RecommendationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Listener to invalidate the recommendation cache when a user's course history or performance changes.
 */
class InvalidateRecommendationsCache implements ShouldQueue
{
    /**
     * Create the event listener.
     */
    public function __construct(
        private readonly RecommendationService $recommendationService
    ) {
    }

    /**
     * Handle CourseEnrolled events.
     */
    public function handleCourseEnrolled(CourseEnrolled $event): void
    {
        $this->recommendationService->clearUserRecommendationCache($event->user);
    }

    /**
     * Handle CourseCompleted events.
     */
    public function handleCourseCompleted(CourseCompleted $event): void
    {
        $this->recommendationService->clearUserRecommendationCache($event->user);
    }

    /**
     * Handle performance data updates.
     * This should be called when StudentPerformance records are created or updated.
     */
    public function handlePerformanceUpdated($event): void
    {
        
        if (isset($event->user)) {
            $this->recommendationService->clearUserRecommendationCache($event->user);
        } elseif (isset($event->user_id)) {
            $user = \App\Models\User::find($event->user_id);
            if ($user) {
                $this->recommendationService->clearUserRecommendationCache($user);
            }
        }
    }

    /**
     * Register the listeners for the subscriber.
     *
     * @param \Illuminate\Events\Dispatcher $events
     */
    public function subscribe($events): array
    {
        return [
            CourseEnrolled::class => 'handleCourseEnrolled',
            CourseCompleted::class => 'handleCourseCompleted',
            
            
        ];
    }
}
