<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

final class ParentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the parent can view the child's details (grades, calendar, etc.).
     *
     * A child user must have a `parent_id` attribute that matches the authenticated parent's ID.
     *
     * @param \App\Models\User $parent The authenticated parent user.
     * @param \App\Models\User $child  The child user record being accessed.
     */
    public function viewChildDetails(User $parent, User $child): bool
    {
        
        
        return $parent->role === 'parent' && $child->parent_id === $parent->id;
    }

    /**
     * Determine whether the user can view any models.
     *
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'parent';
    }

    /**
     * Determine whether the user can view the model.
     *
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function view(User $user, User $model): bool
    {
        
        
        
        if ($model->parent_id) {
            return $this->viewChildDetails($user, $model);
        }
        
        return false;
    }

    
    
}
