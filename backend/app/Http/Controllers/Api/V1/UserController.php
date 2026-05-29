<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Http\Requests\User\CreateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends BaseController
{
  /**
   * Helper: properly-typed authenticated user.
   */
  private function authUser(): User
  {
    /** @var User $user */
    $user = Auth::user();
    return $user;
  }

  /**
   * GET /api/v1/users
   * Lists all active users. Used by the Team page and assignee pickers.
   * Any authenticated user can view the team list.
   */
  public function index(Request $request): JsonResponse
  {
    $query = User::query()->where('is_active', true);

    if ($request->role) {
      $query->where('role', $request->role);
    }

    $users = $query->orderBy('name')->get();

    return $this->success(UserResource::collection($users));
  }

  /**
   * POST /api/v1/users
   * Creates a new user. Admin and manager only.
   * Authorization and role-validation are enforced by CreateUserRequest.
   */
  public function store(CreateUserRequest $request): JsonResponse
  {
    $actor = $this->authUser();

    $user = User::create([
      'name'      => $request->name,
      'email'     => $request->email,
      'password'  => Hash::make($request->password),
      'role'      => $request->role,
      'is_active' => true,
    ]);

    // Optional but useful: log who added whom
    if (class_exists(\App\Models\ActivityLog::class)) {
      \App\Models\ActivityLog::record($user, $actor, 'user_created', [
        'created_role' => $user->role,
      ]);
    }

    return $this->success(
      new UserResource($user),
      'User added to team successfully',
      201
    );
  }
}
