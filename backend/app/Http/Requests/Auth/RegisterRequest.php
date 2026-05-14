<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // 'min:2'    = at least 2 characters
            // 'max:100'  = at most 100 characters
            'name'     => ['required', 'string', 'min:2', 'max:100'],

            // 'unique:users,email' = this email must not already exist in the users table
            'email'    => ['required', 'email', 'unique:users,email'],

            // 'min:8'     = password must be at least 8 characters
            // 'confirmed' = there must be a matching 'password_confirmation' field
            'password' => ['required', 'string', 'min:8', 'confirmed'],

            'password_confirmation' => ['required'],
        ];
    }
}
