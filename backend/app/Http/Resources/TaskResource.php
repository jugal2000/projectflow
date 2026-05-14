<?php

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'project_id'  => $this->project_id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'priority'    => $this->priority,

            // The assignee object (only if loaded)
            'assignee'    => new UserResource($this->whenLoaded('assignee')),
            'assigned_to' => $this->assigned_to, // just the ID

            'due_date'    => $this->due_date?->toDateString(),

            // Calculate is_overdue right here in the resource
            // A task is overdue if: it has a due date, that date is past, and it's not done
            'is_overdue'  => $this->due_date
                && $this->due_date->isPast()
                && $this->status !== 'done',

            'estimated_hours' => $this->estimated_hours,
            'actual_hours'    => $this->actual_hours,
            'sort_order'      => $this->sort_order,

            // Tell the frontend which status changes are allowed from current status
            // The frontend uses this to gray out buttons the user can't click
            'allowed_transitions' => Task::STATUS_TRANSITIONS[$this->status] ?? [],

            'created_at'  => $this->created_at->toISOString(),
            'updated_at'  => $this->updated_at->toISOString(),
        ];
    }
}
