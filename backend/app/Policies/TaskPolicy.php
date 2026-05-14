<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Can this user CREATE a task?
     * Any authenticated user can create tasks.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Can this user UPDATE a task?
     * - Admin: yes always
     * - Manager: yes always
     * - Developer: only if they are the assignee
     */
    public function update(User $user, Task $task): bool
    {
        return $user->isAdminOrManager() || $task->assigned_to === $user->id;
    }

    /**
     * Can this user DELETE a task?
     * Only admins and managers.
     */
    public function delete(User $user, Task $task): bool
    {
        return $user->isAdminOrManager();
    }
}
