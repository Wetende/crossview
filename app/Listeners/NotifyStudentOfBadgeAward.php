<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\BadgeAwarded;
use App\Notifications\BadgeEarnedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Listener to notify a student when they have earned a new badge.
 */
class NotifyStudentOfBadgeAward implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(BadgeAwarded $event): void
    {
        
        $event->user->notify(new BadgeEarnedNotification($event->badge, $event->userBadge));
    }
}
