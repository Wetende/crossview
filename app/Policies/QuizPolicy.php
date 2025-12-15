<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\Quiz;
use Illuminate\Auth\Access\HandlesAuthorization;

final class QuizPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'teacher';
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Quiz $quiz): bool
    {
        
        
        if ($quiz->creator_id === $user->id) {
            return true;
        }
        
        if ($quiz->course_id && $quiz->loadMissing('course')->course && $quiz->course->teacher_id === $user->id) {
            return true;
        }
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->role === 'teacher';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Quiz $quiz): bool
    {
        
        if ($quiz->creator_id === $user->id) {
            return true;
        }
        
        
        
        
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Quiz $quiz): bool
    {
        
        return $quiz->creator_id === $user->id;
    }

    /**
     * Determine whether the user can view quiz results.
     */
    public function viewResults(User $user, Quiz $quiz): bool
    {
        
        
        if ($quiz->creator_id === $user->id) {
            return true;
        }
        if ($quiz->course_id && $quiz->loadMissing('course')->course && $quiz->course->teacher_id === $user->id) {
            return true;
        }
        return false;
    }

    /**
     * Determine whether the user can reorder quiz questions.
     */
    public function reorderQuestions(User $user, Quiz $quiz): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $quiz->courseSection->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can manage quiz questions.
     */
    public function manageQuestions(User $user, Quiz $quiz): bool
    {
        
        if ($user->hasRole('admin')) {
            return true;
        }

        
        if ($user->hasRole('teacher')) {
            return $user->id === $quiz->courseSection->course->user_id;
        }

        return false;
    }

    /**
     * Determine whether the user can attempt the quiz.
     */
    public function attempt(User $user, Quiz $quiz): bool
    {
        
        if (!$user->hasRole('student')) {
            return false;
        }

        $course = $quiz->courseSection->course;

        
        if (!$course->is_published || !$quiz->courseSection->is_published) {
            return false;
        }

        
        return $user->enrollments()->where('course_id', $course->id)->exists();
    }

    
}
