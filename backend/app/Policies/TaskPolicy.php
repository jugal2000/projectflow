<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * ──────────────────────────────────────────────────────────────────
     * NOTE: Admin gets automatic access to everything via Gate::before
     * in AuthServiceProvider, so we don't need to check for admin in
     * each method. However, we include the check for clarity and safety
     * in case the Gate::before is removed.
     * ──────────────────────────────────────────────────────────────────
     */

    /**
     * Can the user view the list of tasks?
     * All authenticated users can view tasks.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Can the user view this specific task?
     * All authenticated users can view any task.
     */
    public function view(User $user, Task $task): bool
    {
        return true;
    }

    /**
     * Can the user create a new task?
     * Per assessment: any authenticated user can create tasks.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Can the user update this task?
     * - Admin: can update any task
     * - Manager: can update any task
     * - Developer: only tasks assigned to them
     */
    public function update(User $user, Task $task): bool
    {
        // Admin and manager can update any task
        if ($user->isAdmin() || $user->isManager()) {
            return true;
        }

        // Developer can only update their own assigned tasks
        return $task->assigned_to === $user->id;
    }

    /**
     * Can the user change this task's status?
     * (used when dragging tasks between columns)
     * Same rules as update.
     */
    public function changeStatus(User $user, Task $task): bool
    {
        if ($user->isAdmin() || $user->isManager()) {
            return true;
        }

        return $task->assigned_to === $user->id;
    }

    /**
     * Can the user reorder tasks within columns?
     * Only admin and manager can reorder.
     */
    public function reorder(User $user): bool
    {
        return $user->isAdmin() || $user->isManager();
    }

    /**
     * Can the user assign this task to someone?
     * Only admin and manager can assign tasks.
     */
    public function assign(User $user, Task $task): bool
    {
        return $user->isAdmin() || $user->isManager();
    }

    /**
     * Can the user delete this task?
     * Only admin and manager can delete tasks.
     */
    public function delete(User $user, Task $task): bool
    {
        return $user->isAdmin() || $user->isManager();
    }

    /**
     * Can the user restore a soft-deleted task?
     * Only admin can restore.
     */
    public function restore(User $user, Task $task): bool
    {
        return $user->isAdmin();
    }

    /**
     * Can the user permanently delete a task?
     * Only admin can force-delete.
     */
    public function forceDelete(User $user, Task $task): bool
    {
        return $user->isAdmin();
    }
}
