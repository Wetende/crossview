<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Question;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

final class QuestionPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the question.
     */
    public function view(User $user, Question $question): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $question->quiz->courseSection->course->user_id;
        }

        
        if ($user->hasRole('student')) {
            $course = $question->quiz->courseSection->course;

            
            if (!$course->is_published || !$question->quiz->courseSection->is_published) {
                return false;
            }

            
            return $user->enrollments()->where('course_id', $course->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can create questions.
     */
    public function create(User $user, int $quizId): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return \App\Models\Quiz::where('id', $quizId)
                ->whereHas('courseSection.course', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can update the question.
     */
    public function update(User $user, Question $question): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $question->quiz->courseSection->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the question.
     */
    public function delete(User $user, Question $question): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $question->quiz->courseSection->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can reorder question options.
     */
    public function reorderOptions(User $user, Question $question): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $question->quiz->courseSection->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can view their own questions library.
     */
    public function viewLibrary(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('teacher');
    }
}
