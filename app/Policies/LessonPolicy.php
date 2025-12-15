<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

final class LessonPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the lesson.
     */
    public function view(User $user, Lesson $lesson): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $lesson->courseSection->course->user_id;
        }

        
        if ($user->hasRole('student')) {
            $course = $lesson->courseSection->course;

            
            if ($lesson->is_preview_allowed) {
                return true;
            }

            
            if (!$course->is_published || !$lesson->courseSection->is_published) {
                return false;
            }

            
            if (!$user->enrollments()->where('course_id', $course->id)->exists()) {
                return false;
            }

            
            
            if ($lesson->unlock_date && now() < $lesson->unlock_date) {
                return false;
            }

            
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create lessons.
     */
    public function create(User $user, int $courseSectionId): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return \App\Models\CourseSection::where('id', $courseSectionId)
                ->whereHas('course', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can update the lesson.
     */
    public function update(User $user, Lesson $lesson): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $lesson->courseSection->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the lesson.
     */
    public function delete(User $user, Lesson $lesson): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $lesson->courseSection->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can reorder lessons.
     */
    public function reorder(User $user, int $courseSectionId): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return \App\Models\CourseSection::where('id', $courseSectionId)
                ->whereHas('course', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->exists();
        }

        return false;
    }

    /**
     * Determine if the user can manage lesson attachments
     */
    public function manageAttachments(User $user, Lesson $lesson): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $lesson->courseSection->course->user_id;
        }

        return false;
    }
}
