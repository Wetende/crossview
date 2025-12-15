<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

final class AssignmentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view assignments for a course.
     */
    public function viewAny(User $user, Course $course): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $course->user_id;
        }

        
        if ($user->hasRole('student')) {
            
            if (!$course->is_published) {
                return false;
            }

            
            return $user->enrollments()->where('course_id', $course->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can view the assignment.
     */
    public function view(User $user, Assignment $assignment): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $assignment->courseSection->course->user_id;
        }

        
        if ($user->hasRole('student')) {
            $course = $assignment->courseSection->course;

            
            if (!$course->is_published || !$assignment->courseSection->is_published) {
                return false;
            }

            
            return $user->enrollments()->where('course_id', $course->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can create assignments.
     */
    public function create(User $user, Course $course): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can update the assignment.
     */
    public function update(User $user, Assignment $assignment): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $assignment->courseSection->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the assignment.
     */
    public function delete(User $user, Assignment $assignment): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $assignment->courseSection->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can submit to the assignment.
     */
    public function submit(User $user, Assignment $assignment): bool
    {
        
        if (!$user->hasRole('student')) {
            return false;
        }

        $course = $assignment->courseSection->course;

        
        if (!$course->is_published || !$assignment->courseSection->is_published) {
            return false;
        }

        
        return $user->enrollments()->where('course_id', $course->id)->exists();
    }
}
