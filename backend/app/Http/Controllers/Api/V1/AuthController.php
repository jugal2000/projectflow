<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends BaseController
{
  /**
   * POST /api/v1/auth/register
   *
   * What happens:
   * 1. RegisterRequest validates the input (name, email, password, confirmation)
   * 2. We create the user in the database
   * 3. We create a token for them (so they're immediately logged in)
   * 4. We return the token + user data
   */
  public function register(RegisterRequest $request): JsonResponse
  {
    // Create the user — password is automatically hashed because of the 'hashed' cast
    $user = User::create([
      'name'     => $request->name,
      'email'    => $request->email,
      'password' => $request->password,
      'role'     => 'developer', // New registrations always start as developer
    ]);

    // createToken() creates an API token for this user
    // 'api-token' is just a name for the token (can be anything)
    // plainTextToken = the actual string to send in requests (only shown ONCE)
    $token = $user->createToken('api-token')->plainTextToken;

    return $this->success([
      'token' => $token,
      'user'  => new UserResource($user),
    ], 'Registration successful', 201); // 201 = Created
  }

  /**
   * POST /api/v1/auth/login
   *
   * What happens:
   * 1. Find user by email
   * 2. Check password matches
   * 3. Check account is active
   * 4. Create and return token
   */
  public function login(LoginRequest $request): JsonResponse
  {
    // Find the user by email (returns null if not found)
    $user = User::where('email', $request->email)->first();

    // Check 1: Does user exist AND does password match?
    // Hash::check() compares plain password against hashed version
    // We check both in one condition so we don't reveal whether the email exists
    // (security: don't say "email not found" vs "wrong password" — just say "invalid credentials")
    if (!$user || !Hash::check($request->password, $user->password)) {
      return $this->error('Invalid credentials', 401); // 401 = Unauthorized
    }

    // Check 2: Is the account active?
    // We check this AFTER password check so we don't reveal inactive accounts to strangers
    if (!$user->is_active) {
      return $this->error(
        'Your account has been deactivated. Please contact an administrator.',
        403 // 403 = Forbidden (you exist but you're not allowed in)
      );
    }

    // Create the token
    $token = $user->createToken('api-token')->plainTextToken;

    return $this->success([
      'token' => $token,
      'user'  => new UserResource($user),
    ], 'Login successful');
  }

  /**
   * POST /api/v1/auth/logout
   *
   * Deletes the CURRENT token only.
   * (If the user has multiple devices logged in, only THIS one gets logged out)
   */
  public function logout(Request $request): JsonResponse
  {
    // currentAccessToken() = the token that was used in THIS request
    // delete() = removes it from the database, making it invalid forever
    $request->user()->currentAccessToken()->delete();

    return $this->success(null, 'Logged out successfully');
  }

  /**
   * GET /api/v1/auth/me
   *
   * Returns the currently logged-in user's profile.
   * The middleware already verified the token, so $request->user() is safe to use.
   */
  public function me(Request $request): JsonResponse
  {
    return $this->success(new UserResource($request->user()));
  }
}
