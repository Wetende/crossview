<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

final class CourseSectionPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view all sections for a course.
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
     * Determine whether the user can view the section.
     */
    public function view(User $user, CourseSection $section): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $section->course->user_id;
        }

        
        if ($user->hasRole('student')) {
            
            if (!$section->course->is_published || !$section->is_published) {
                return false;
            }

            
            return $user->enrollments()->where('course_id', $section->course_id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can create sections.
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
     * Determine whether the user can update the section.
     */
    public function update(User $user, CourseSection $section): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $section->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the section.
     */
    public function delete(User $user, CourseSection $section): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $section->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can reorder sections.
     */
    public function reorder(User $user, Course $course): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $course->user_id;
        }

        return false;
    }
}
