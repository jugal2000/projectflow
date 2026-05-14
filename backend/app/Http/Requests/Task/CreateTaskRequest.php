<?php

namespace App\Http\Requests\Task;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'           => ['required', 'string', 'min:3', 'max:200'],
            'description'     => ['nullable', 'string', 'max:10000'],

            // Task::STATUSES = ['todo', 'in_progress', 'in_review', 'done']
            'status'          => ['nullable', Rule::in(Task::STATUSES)],
            'priority'        => ['nullable', Rule::in(Task::PRIORITIES)],

            // 'exists:users,id' = this user ID must exist in the users table
            'assigned_to'     => ['nullable', 'exists:users,id'],

            'due_date'        => ['nullable', 'date'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0', 'max:9999'],
        ];
    }
}
