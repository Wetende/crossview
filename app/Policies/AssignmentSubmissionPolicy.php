<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\AssignmentSubmission;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

final class AssignmentSubmissionPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the submission.
     */
    public function view(User $user, AssignmentSubmission $submission): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $submission->assignment->courseSection->course->user_id;
        }

        
        if ($user->hasRole('student')) {
            return $user->id === $submission->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can create a submission.
     */
    public function create(User $user, int $assignmentId): bool
    {
        
        if (!$user->hasRole('student')) {
            return false;
        }


        $assignment = \App\Models\Assignment::find($assignmentId);
        if (!$assignment) {
            return false;
        }

        $course = $assignment->courseSection->course;

        
        if (!$course->is_published || !$assignment->courseSection->is_published) {
            return false;
        }

        
        return $user->enrollments()->where('course_id', $course->id)->exists();
    }

    /**
     * Determine whether the user can update the submission.
     */
    public function update(User $user, AssignmentSubmission $submission): bool
    {
        
        if ($user->hasRole('student')) {
            if ($submission->grade !== null) {
                return false; 
            }
            return $user->id === $submission->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the submission.
     */
    public function delete(User $user, AssignmentSubmission $submission): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('student')) {
            if ($submission->grade !== null) {
                return false; 
            }
            return $user->id === $submission->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can grade the submission.
     */
    public function grade(User $user, AssignmentSubmission $submission): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $submission->assignment->courseSection->course->user_id;
        }

        return false;
    }
}
