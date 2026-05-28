<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TaskUpdated;
use App\Http\Controllers\Api\BaseController;
use App\Http\Requests\Task\CreateTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class TaskController extends BaseController
{
    /**
     * Helper: get the currently authenticated user as a User model.
     * This properly types the user so we can call isAdmin(), isManager() etc.
     */
    private function authUser(): User
    {
        /** @var User $user */
        $user = Auth::user();
        return $user;
    }

    /**
     * GET /api/v1/projects/{slug}/tasks
     * List all tasks in a project
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $query = $project->tasks()->with('assignee');

        if ($request->status)      $query->where('status', $request->status);
        if ($request->priority)    $query->where('priority', $request->priority);
        if ($request->assigned_to) $query->where('assigned_to', $request->assigned_to);

        $tasks = $query->orderBy('sort_order')
            ->paginate($request->per_page ?? 50);

        return $this->paginated(TaskResource::collection($tasks));
    }

    /**
     * POST /api/v1/projects/{slug}/tasks
     * Create a new task in a project
     */
    public function store(CreateTaskRequest $request, Project $project): JsonResponse
    {
        $user     = $this->authUser();
        $status   = $request->validated()['status'] ?? 'todo';
        $maxOrder = $project->tasks()
            ->where('status', $status)
            ->max('sort_order') ?? -1;

        $task = $project->tasks()->create(array_merge(
            $request->validated(),
            ['sort_order' => $maxOrder + 1]
        ));

        ActivityLog::record($task, $user, 'created');
        TaskUpdated::dispatch($task, 'created');
        Cache::forget("project_stats_{$project->id}");

        return $this->success(
            new TaskResource($task->load('assignee')),
            'Task created successfully',
            201
        );
    }

    /**
     * PUT /api/v1/tasks/{task}
     * Update a task
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $user = $this->authUser();

        $canUpdate = $user->isAdmin()
            || $user->isManager()
            || $task->assigned_to === $user->id;

        if (!$canUpdate) {
            return $this->error('You do not have permission to update this task', 403);
        }

        $task->update($request->validated());

        ActivityLog::record($task, $user, 'updated');
        TaskUpdated::dispatch($task, 'updated');
        Cache::forget("project_stats_{$task->project_id}");

        return $this->success(
            new TaskResource($task->load('assignee')),
            'Task updated successfully'
        );
    }

    /**
     * PATCH /api/v1/tasks/{task}/status
     * Change task status (used by drag-and-drop)
     */
    public function changeStatus(Request $request, Task $task): JsonResponse
    {
        $user = $this->authUser();

        $canUpdate = $user->isAdmin()
            || $user->isManager()
            || $task->assigned_to === $user->id;

        if (!$canUpdate) {
            return $this->error('You do not have permission to change this task status', 403);
        }

        $request->validate([
            'status'       => 'required|in:todo,in_progress,in_review,done',
            'actual_hours' => 'nullable|numeric|min:0|max:9999',
        ]);

        $newStatus = $request->status;

        if (!$task->canTransitionTo($newStatus)) {
            return $this->error(
                "Cannot transition from '{$task->status}' to '{$newStatus}'",
                422
            );
        }

        if ($newStatus === 'done' && !$request->has('actual_hours')) {
            return $this->error('Actual hours are required to mark task as done', 422);
        }

        $oldStatus = $task->status;

        $task->update([
            'status'       => $newStatus,
            'actual_hours' => $request->actual_hours ?? $task->actual_hours,
        ]);

        ActivityLog::record($task, $user, 'status_changed', [
            'from' => $oldStatus,
            'to'   => $newStatus,
        ]);
        TaskUpdated::dispatch($task, 'status_changed');

        Cache::forget("project_stats_{$task->project_id}");

        return $this->success(
            new TaskResource($task->load('assignee')),
            'Status updated successfully'
        );
    }

    /**
     * PATCH /api/v1/tasks/{task}/assign
     * Assign a task to a user
     */
    public function assign(Request $request, Task $task): JsonResponse
    {
        $user = $this->authUser();

        if (!$user->isAdmin() && !$user->isManager()) {
            return $this->error('Only admins and managers can assign tasks', 403);
        }

        $request->validate([
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $task->update(['assigned_to' => $request->assigned_to]);

        ActivityLog::record($task, $user, 'assigned', [
            'assigned_to' => $request->assigned_to,
        ]);

        Cache::forget("project_stats_{$task->project_id}");

        return $this->success(
            new TaskResource($task->load('assignee')),
            'Task assigned successfully'
        );
    }

    /**
     * POST /api/v1/tasks/reorder
     * Bulk update sort_order for multiple tasks
     */
    public function reorder(Request $request): JsonResponse
    {
        $user = $this->authUser();

        if (!$user->isAdmin() && !$user->isManager()) {
            return $this->error('Only admins and managers can reorder tasks', 403);
        }

        $request->validate([
            'tasks'              => 'required|array|min:1',
            'tasks.*.id'         => 'required|integer|exists:tasks,id',
            'tasks.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($request->tasks as $taskData) {
            Task::where('id', $taskData['id'])->update([
                'sort_order' => $taskData['sort_order'],
            ]);
        }

        return $this->success(null, 'Tasks reordered successfully');
    }

    /**
     * DELETE /api/v1/tasks/{task}
     * Delete a task (soft delete)
     */
    public function destroy(Task $task): JsonResponse
    {
        $user = $this->authUser();

        if (!$user->isAdmin() && !$user->isManager()) {
            return $this->error('Only admins and managers can delete tasks', 403);
        }

        $projectId = $task->project_id;

        ActivityLog::record($task, $user, 'deleted');
        TaskUpdated::dispatch($task, 'deleted');
        $task->delete();

        Cache::forget("project_stats_{$projectId}");

        return $this->success(null, 'Task deleted successfully');
    }
}
