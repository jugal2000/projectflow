<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Http\Requests\Task\CreateTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TaskController extends BaseController
{
    /**
     * GET /api/v1/projects/{slug}/tasks
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $tasks = $project->tasks()
            ->with(['assignee'])
            ->forStatus($request->status)
            ->forPriority($request->priority)
            ->forAssignee($request->assigned_to)
            ->orderBy($request->sort_by ?? 'sort_order', $request->sort_dir ?? 'asc')
            ->paginate($request->per_page ?? 20);

        return $this->paginated(
            $tasks->through(fn($t) => new TaskResource($t))
        );
    }

    /**
     * POST /api/v1/projects/{slug}/tasks
     */
    public function store(CreateTaskRequest $request, Project $project): JsonResponse
    {
        $this->authorize('create', Task::class);

        // Find the highest sort_order in this status column, then add 1
        // So the new task appears at the BOTTOM of its column
        $maxOrder = $project->tasks()
            ->where('status', $request->status ?? 'todo')
            ->max('sort_order') ?? -1; // If no tasks, start at -1 so first task gets 0

        $task = $project->tasks()->create(array_merge(
            $request->validated(),
            ['sort_order' => $maxOrder + 1]
        ));

        ActivityLog::record($task, Auth::user(), 'created');

        // Bust the stats cache — task count changed
        Cache::forget("project_stats_{$project->id}");

        return $this->success(
            new TaskResource($task->load('assignee')),
            'Task created',
            201
        );
    }

    /**
     * PUT /api/v1/tasks/{id}
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $before = $task->only(['title', 'status', 'priority', 'assigned_to']);
        $task->update($request->validated());

        ActivityLog::record($task, Auth::user(), 'updated', ['before' => $before]);
        Cache::forget("project_stats_{$task->project_id}");

        return $this->success(new TaskResource($task->load('assignee')), 'Task updated');
    }

    /**
     * PATCH /api/v1/tasks/{id}/status
     *
     * Changes status with full transition validation.
     * This is separate from update() because it has special business rules.
     */
    public function changeStatus(Request $request, Task $task): JsonResponse
    {
        // Quick inline validation (not worth a whole Form Request class for 1-2 fields)
        $request->validate([
            'status'       => ['required', 'in:' . implode(',', Task::STATUSES)],
            'actual_hours' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = Auth::user();

        // Authorization check: only assignee or manager/admin can change status
        if (!$user->is_admin && !$user->is_manager && $task->assigned_to !== $user->id) {
            return $this->forbidden('Only the assignee or a manager can change task status.');
        }

        $newStatus = $request->status;

        // Check the state machine — is this transition allowed?
        if (!$task->canTransitionTo($newStatus)) {
            return $this->error(
                "Cannot transition from '{$task->status}' to '{$newStatus}'. " .
                    "Allowed: " . implode(', ', Task::STATUS_TRANSITIONS[$task->status] ?? []),
                422 // 422 = Unprocessable Entity (the request is valid but breaks business rules)
            );
        }

        // Special rule: moving to 'done' requires actual_hours
        if ($newStatus === 'done' && !$request->actual_hours && !$task->actual_hours) {
            return $this->error('actual_hours is required when marking a task as done.', 422);
        }

        $oldStatus = $task->status;

        // array_filter removes null values — so we don't overwrite actual_hours with null
        $task->update(array_filter([
            'status'       => $newStatus,
            'actual_hours' => $request->actual_hours,
        ]));

        // Record what changed
        ActivityLog::record($task, $user, 'status_changed', [
            'from' => $oldStatus,
            'to'   => $newStatus,
        ]);

        Cache::forget("project_stats_{$task->project_id}");

        return $this->success(new TaskResource($task->load('assignee')), 'Status updated');
    }

    /**
     * PATCH /api/v1/tasks/{id}/assign
     */
    public function assign(Request $request, Task $task): JsonResponse
    {
        $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $this->authorize('update', $task);

        $oldAssignee = $task->assigned_to;
        $task->update(['assigned_to' => $request->user_id]);

        ActivityLog::record($task, Auth::user(), 'assigned', [
            'from' => $oldAssignee,
            'to'   => $request->user_id,
        ]);

        return $this->success(new TaskResource($task->load('assignee')), 'Task assigned');
    }

    /**
     * POST /api/v1/tasks/reorder
     *
     * Bulk updates sort_order for all tasks — used after drag and drop.
     * Uses a database TRANSACTION to ensure all updates succeed or none do.
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'tasks'              => ['required', 'array'],
            'tasks.*.id'         => ['required', 'integer', 'exists:tasks,id'],
            'tasks.*.sort_order' => ['required', 'integer', 'min:0'],
            // tasks.*.id = validate 'id' for EVERY item in the tasks array
        ]);

        // DB::transaction() = wrap multiple queries in a transaction
        // If ANY query fails, ALL changes are rolled back (like "undo all")
        // This prevents partial updates (e.g. 5 of 10 tasks updated then error)
        DB::transaction(function () use ($request) {
            foreach ($request->tasks as $item) {
                Task::where('id', $item['id'])
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return $this->success(null, 'Tasks reordered');
    }

    /**
     * DELETE /api/v1/tasks/{id}
     */
    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        ActivityLog::record($task, Auth::user(), 'deleted');
        Cache::forget("project_stats_{$task->project_id}");

        $task->delete(); // Soft delete

        return $this->success(null, 'Task deleted');
    }
}
