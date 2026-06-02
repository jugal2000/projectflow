<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray($request): array
    {
        // Two ways the counts can arrive:
        //  1. From withCount() in the controller (efficient, used by the list endpoint)
        //     -> gives us $this->tasks_count and $this->done_tasks as attributes
        //  2. From a loaded tasks relationship (used by the detail endpoint)
        //     -> lets us build a full per-status breakdown
        //
        // We prefer the loaded relationship for the per-status summary, but fall
        // back to withCount values for the totals so the list endpoint isn't zero.

        $tasksByStatus = [];
        $totalTasks    = 0;
        $doneTasks     = 0;

        if ($this->relationLoaded('tasks')) {
            // Detail endpoint path: full breakdown from loaded tasks
            foreach ($this->tasks as $task) {
                $tasksByStatus[$task->status] = ($tasksByStatus[$task->status] ?? 0) + 1;
            }
            $totalTasks = $this->tasks->count();
            $doneTasks  = $tasksByStatus['done'] ?? 0;
        } else {
            // List endpoint path: use the withCount() aggregates
            $totalTasks = $this->tasks_count ?? 0;
            $doneTasks  = $this->done_tasks ?? 0;
            // Minimal per-status summary so the dashboard's "In Progress" card has data
            $tasksByStatus = [
                'in_progress' => $this->in_progress_count ?? 0,
                'done'        => $doneTasks,
            ];
        }

        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'slug'         => $this->slug,
            'description'  => $this->description,
            'status'       => $this->status,
            'owner'        => new UserResource($this->whenLoaded('owner')),
            'start_date'   => $this->start_date?->toDateString(),
            'end_date'     => $this->end_date?->toDateString(),
            'budget'       => $this->budget,
            'task_summary' => $tasksByStatus,
            'total_tasks'  => $totalTasks,
            'done_tasks'   => $doneTasks,
            'created_at'   => $this->created_at->toISOString(),
            'updated_at'   => $this->updated_at->toISOString(),
        ];
    }
}
