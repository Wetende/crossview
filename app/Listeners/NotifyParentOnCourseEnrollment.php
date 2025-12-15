<?php

namespace App\Listeners;

use App\Events\CourseEnrollment;
use App\Notifications\StudentEnrolledInCourseNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyParentOnCourseEnrollment implements ShouldQueue
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
    public function handle(CourseEnrollment $event): void
    {
        $student = $event->user;
        $enrollment = $event->enrollment;


        $linkedParents = $student->linkedParents()->get();

        
        if ($linkedParents->isNotEmpty()) {
            foreach ($linkedParents as $parent) {
                $parent->notify(new StudentEnrolledInCourseNotification($enrollment, $student));
            }
        }
    }
}
