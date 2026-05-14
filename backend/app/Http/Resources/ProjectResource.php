<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray($request): array
    {
        // Build task summary counts if tasks are loaded
        // (we don't always load tasks — only when needed)
        $tasksByStatus = [];
        $totalTasks    = 0;

        // whenLoaded() = only include this data if we specifically loaded the relationship
        // This prevents accidental N+1 queries (explained below)
        if ($this->relationLoaded('tasks')) {
            foreach ($this->tasks as $task) {
                // Count tasks by status
                // e.g. ['todo' => 3, 'in_progress' => 2, 'done' => 5]
                $tasksByStatus[$task->status] = ($tasksByStatus[$task->status] ?? 0) + 1;
            }
            $totalTasks = $this->tasks->count();
        }

        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'slug'         => $this->slug,
            'description'  => $this->description,
            'status'       => $this->status,

            // whenLoaded = only include owner data if we loaded the owner relationship
            // This prevents extra database queries
            'owner'        => new UserResource($this->whenLoaded('owner')),

            'start_date'   => $this->start_date?->toDateString(),
            // The ?-> is "null-safe operator" — if start_date is null, don't crash

            'end_date'     => $this->end_date?->toDateString(),
            'budget'       => $this->budget,
            'task_summary' => $tasksByStatus,  // counts by status
            'total_tasks'  => $totalTasks,
            'done_tasks'   => $tasksByStatus['done'] ?? 0,
            'created_at'   => $this->created_at->toISOString(),
            'updated_at'   => $this->updated_at->toISOString(),
        ];
    }
}
