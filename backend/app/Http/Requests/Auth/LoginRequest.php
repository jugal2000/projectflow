<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    // authorize() = should this user be allowed to make this request?
    // For login, anyone can try, so we return true
    public function authorize(): bool
    {
        return true;
    }

    // rules() = what must the data look like to be valid?
    public function rules(): array
    {
        return [
            // 'required' = must be present and not empty
            // 'email'    = must be a valid email format (has @ and a domain)
            'email'    => ['required', 'email'],

            // 'string'   = must be text
            'password' => ['required', 'string'],
        ];
    }
}
