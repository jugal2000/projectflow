<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * Can this user CREATE a project?
     * Only admins and managers.
     */
    public function create(User $user): bool
    {
        return $user->isAdminOrManager();
    }

    /**
     * Can this user VIEW a project?
     * Anyone who is logged in.
     */
    public function view(User $user, Project $project): bool
    {
        return true; // All authenticated users can view projects
    }

    /**
     * Can this user UPDATE a project?
     * Admin can update any project.
     * Managers can only update projects THEY OWN.
     */
    public function update(User $user, Project $project): bool
    {
        // isAdmin() returns true for admin, so they can always update
        // For everyone else, check if they are the owner
        return $user->isAdmin() || $project->owner_id === $user->id;
    }

    /**
     * Can this user DELETE a project?
     * Only admins. Managers cannot delete projects.
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->isAdmin();
    }
}
