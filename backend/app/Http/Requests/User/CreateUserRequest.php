<?php

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CreateUserRequest extends FormRequest
{
  /**
   * Only admins and managers may even attempt to create a user.
   * Authorization here returns 403 automatically if false.
   */
  public function authorize(): bool
  {
    /** @var User|null $user */
    $user = Auth::user();
    return $user !== null && ($user->isAdmin() || $user->isManager());
  }

  public function rules(): array
  {
    /** @var User $user */
    $user = Auth::user();

    // Admins can assign any role; managers cannot create admins.
    $allowedRoles = $user->isAdmin()
      ? ['admin', 'manager', 'developer']
      : ['manager', 'developer'];

    return [
      'name'     => ['required', 'string', 'min:2', 'max:100'],
      'email'    => ['required', 'email', 'max:150', 'unique:users,email'],
      'password' => ['required', 'string', 'min:8'],
      'role'     => ['required', Rule::in($allowedRoles)],
    ];
  }

  public function messages(): array
  {
    return [
      'role.in' => 'You are not allowed to assign the role: :input',
    ];
  }
}
