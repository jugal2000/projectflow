<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
  public function toArray($request): array
  {
    return [
      'id'           => $this->id,
      'action'       => $this->action,
      // Turn "App\Models\Task" into just "Task" for the frontend
      'subject_type' => class_basename($this->subject_type),
      'subject_id'   => $this->subject_id,
      'properties'   => $this->properties,
      // The actor who performed the action (only if loaded)
      'user'         => $this->whenLoaded('user', fn() => [
        'id'   => $this->user->id,
        'name' => $this->user->name,
        'role' => $this->user->role,
      ]),
      'created_at'   => $this->created_at->toISOString(),
    ];
  }
}
