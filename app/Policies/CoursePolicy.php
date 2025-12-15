<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Course;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

final class CoursePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any courses.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('teacher');
    }

    /**
     * Determine whether the user can view the course.
     */
    public function view(User $user, Course $course): bool
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
     * Determine whether the user can create courses.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('teacher');
    }

    /**
     * Determine whether the user can update the course.
     */
    public function update(User $user, Course $course): bool
    {
        
        if ($course->isEditingLocked() && !$user->hasRole('admin')) {
            return false;
        }

        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the course.
     */
    public function delete(User $user, Course $course): bool
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
     * Determine whether the user can restore the course.
     */
    public function restore(User $user, Course $course): bool
    {
        
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can permanently delete the course.
     */
    public function forceDelete(User $user, Course $course): bool
    {
        
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can publish/unpublish the course.
     */
    public function updateStatus(User $user, Course $course): bool
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
     * Determine whether the user can feature/unfeature the course.
     */
    public function toggleFeatured(User $user, Course $course): bool
    {
        
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can recommend/unrecommend the course.
     */
    public function toggleRecommended(User $user, Course $course): bool
    {
        
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the admin can view course builder.
     */
    public function viewAsAdmin(User $user, Course $course): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the admin can create courses.
     */
    public function createAsAdmin(User $user): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the admin can edit courses.
     */
    public function editAsAdmin(User $user, Course $course): bool
    {
        return $user->hasRole('admin');
    }
    
    /**
     * Determine whether the admin can assign a course to a teacher.
     */
    public function assignToTeacher(User $user): bool
    {
        return $user->hasRole('admin');
    }
    
    /**
     * Determine whether the admin can view the course builder for any course.
     */
    public function viewBuilderAsAdmin(User $user, Course $course): bool
    {
        return $user->hasRole('admin');
    }
    
    /**
     * Determine whether the admin can manage course curriculum for any course.
     */
    public function manageCurriculumAsAdmin(User $user, Course $course): bool
    {
        return $user->hasRole('admin');
    }
}
