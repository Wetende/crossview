<?php

namespace App\Listeners;

use App\Events\CourseCompleted;
use App\Notifications\StudentCompletedCourseNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyParentOnCourseCompletion implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {

    }

    /**
     * Handle the event.
     */
    public function handle(CourseCompleted $event): void
    {
        $student = $event->user;
        $enrollment = $event->enrollment;


        $linkedParents = $student->linkedParents()->get();

        
        if ($linkedParents->isNotEmpty()) {
            foreach ($linkedParents as $parent) {
                $parent->notify(new StudentCompletedCourseNotification($enrollment, $student));
            }
        }
    }
}
