<?php

namespace App\Http\Requests\Task;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'           => ['sometimes', 'string', 'min:3', 'max:200'],
            'description'     => ['nullable', 'string', 'max:10000'],
            'priority'        => ['sometimes', Rule::in(Task::PRIORITIES)],
            'assigned_to'     => ['nullable', 'exists:users,id'],
            'due_date'        => ['nullable', 'date'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'actual_hours'    => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
