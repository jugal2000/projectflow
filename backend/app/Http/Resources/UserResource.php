<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

// JsonResource wraps a model and controls what gets sent as JSON
class UserResource extends JsonResource
{
    /**
     * toArray() defines exactly what fields to include in the response.
     * $this refers to the User model instance.
     */
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'role'       => $this->role,
            'avatar_url' => $this->avatar_url,
            'is_active'  => $this->is_active,
            'created_at' => $this->created_at->toISOString(),
            // Notice: NO password, NO remember_token — we never send those!
        ];
    }
}
