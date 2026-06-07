<?php

use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('project.{projectId}', function ($user, $projectId) {
    $project = Project::find($projectId);
    if (!$project) {
        return false;
    }

    // Admins and managers can listen to any project's stream.
    if ($user->isAdmin() || $user->isManager()) {
        return true;
    }

    // The project owner can listen.
    if ($project->owner_id === $user->id) {
        return true;
    }

    // A developer can listen if they're assigned to at least one task
    // in this project (i.e. they're actually working on it).
    return Task::where('project_id', $project->id)
        ->whereHas('assignees', fn($q) => $q->where('users.id', $user->id))
        ->exists();
});
