<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'        => $this->id,
            'body'      => $this->body,
            'parent_id' => $this->parent_id,

            // Who wrote this comment?
            'author'    => new UserResource($this->whenLoaded('author')),

            // Nested replies — each reply is also a CommentResource
            // This creates a tree structure automatically
            'replies'   => CommentResource::collection($this->whenLoaded('replies')),

            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),

            // Can the current user edit this comment?
            // Used by the frontend to show/hide the Edit button
            'can_edit'  => $request->user()?->id === $this->user_id
                && $this->created_at->diffInMinutes(now()) <= 15,
        ];
    }
}
