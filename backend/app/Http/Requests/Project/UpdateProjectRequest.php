<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // 'sometimes' = only validate this field IF it was included in the request
            // This allows partial updates (PATCH-style) — you don't have to send ALL fields
            'name'        => ['sometimes', 'string', 'min:3', 'max:150'],
            'description' => ['sometimes', 'string', 'max:5000'],
            'status'      => ['sometimes', Rule::in([
                'planning',
                'active',
                'on_hold',
                'completed',
                'archived'
            ])],
            'start_date'  => ['sometimes', 'date'],
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
            'budget'      => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
