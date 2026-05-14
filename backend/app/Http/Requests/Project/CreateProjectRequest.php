<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization is handled in the Policy, not here
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'min:3', 'max:150'],
            'description' => ['required', 'string', 'max:5000'],

            // Rule::in() = value must be one of these specific options
            'status'      => ['required', Rule::in([
                'planning',
                'active',
                'on_hold',
                'completed',
                'archived'
            ])],

            'start_date'  => ['required', 'date'],

            // 'after_or_equal:start_date' = end_date must be same day or after start_date
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],

            // 'numeric' = must be a number
            // 'min:0'   = can't be negative
            'budget'      => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
