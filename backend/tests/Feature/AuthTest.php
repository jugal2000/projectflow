<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
  use RefreshDatabase;

  public function test_user_can_register_with_valid_data(): void
  {
    $response = $this->postJson('/api/v1/auth/register', [
      'name'                  => 'Test User',
      'email'                 => 'test@example.com',
      'password'              => 'password123',
      'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201);
    $response->assertJsonStructure([
      'data' => ['token', 'user' => ['id', 'email', 'role']]
    ]);
    $this->assertDatabaseHas('users', [
      'email' => 'test@example.com',
      'role'  => 'developer',
    ]);
  }

  public function test_register_fails_with_duplicate_email(): void
  {
    User::factory()->create(['email' => 'taken@example.com']);

    $response = $this->postJson('/api/v1/auth/register', [
      'name'                  => 'Another User',
      'email'                 => 'taken@example.com',
      'password'              => 'password123',
      'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['email']);
  }

  public function test_register_fails_with_mismatched_passwords(): void
  {
    $response = $this->postJson('/api/v1/auth/register', [
      'name'                  => 'Test User',
      'email'                 => 'test@example.com',
      'password'              => 'password123',
      'password_confirmation' => 'different_password',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['password']);
  }

  public function test_user_can_login_with_valid_credentials(): void
  {
    $user = User::factory()->create([
      'password'  => bcrypt('secret123'),
      'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
      'email'    => $user->email,
      'password' => 'secret123',
    ]);

    $response->assertOk();
    $response->assertJsonStructure(['data' => ['token', 'user']]);
  }

  public function test_login_fails_with_wrong_password(): void
  {
    $user = User::factory()->create([
      'password' => bcrypt('correctpass'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
      'email'    => $user->email,
      'password' => 'wrongpass',
    ]);

    $response->assertStatus(401);
    $response->assertJsonFragment(['success' => false]);
  }

  public function test_login_fails_for_inactive_account(): void
  {
    $user = User::factory()->create([
      'password'  => bcrypt('password'),
      'is_active' => false,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
      'email'    => $user->email,
      'password' => 'password',
    ]);

    $response->assertStatus(403);
  }

  public function test_authenticated_user_can_access_me_endpoint(): void
  {
    $user  = User::factory()->create();
    $token = $this->loginAs($user);

    $response = $this->withToken($token)->getJson('/api/v1/auth/me');

    $response->assertOk();
    $response->assertJsonPath('data.id', $user->id);
  }

  public function test_unauthenticated_request_returns_401(): void
  {
    $response = $this->getJson('/api/v1/auth/me');
    $response->assertStatus(401);
  }

  public function test_user_can_logout_and_token_is_revoked(): void
  {
    $user  = User::factory()->create();
    $token = $this->loginAs($user);

    // Verify token works BEFORE logout
    $this->withToken($token)
      ->getJson('/api/v1/auth/me')
      ->assertOk();

    // Perform logout
    $this->withToken($token)
      ->postJson('/api/v1/auth/logout')
      ->assertOk();

    // Verify the token was DELETED from the database
    // (more reliable than HTTP check in test environment)
    $this->assertDatabaseCount('personal_access_tokens', 0);
  }
}
