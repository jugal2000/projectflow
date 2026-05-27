<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProjectTest extends TestCase
{
  use RefreshDatabase;

  private function createProject(User $owner, array $overrides = []): Project
  {
    $name = 'Test Project ' . uniqid();
    return Project::factory()->create(array_merge([
      'owner_id' => $owner->id,
      'slug'     => Str::slug($name),
      'name'     => $name,
    ], $overrides));
  }

  public function test_manager_can_create_project(): void
  {
    $manager = User::factory()->manager()->create();
    $token   = $this->loginAs($manager);

    $response = $this->withToken($token)->postJson('/api/v1/projects', [
      'name'        => 'New Platform',
      'description' => 'Full description here for the platform',
      'status'      => 'planning',
      'start_date'  => '2025-01-01',
    ]);

    $response->assertStatus(201);
    $response->assertJsonPath('data.name', 'New Platform');
    $this->assertDatabaseHas('projects', [
      'name'     => 'New Platform',
      'owner_id' => $manager->id,
    ]);
  }

  public function test_developer_cannot_create_project(): void
  {
    $developer = User::factory()->developer()->create();
    $token     = $this->loginAs($developer);

    $response = $this->withToken($token)->postJson('/api/v1/projects', [
      'name'        => 'Sneaky Project',
      'description' => 'Developer should not create this',
      'status'      => 'planning',
      'start_date'  => '2025-01-01',
    ]);

    $response->assertStatus(403);
    $this->assertDatabaseMissing('projects', ['name' => 'Sneaky Project']);
  }

  public function test_admin_can_create_project(): void
  {
    $admin = User::factory()->admin()->create();
    $token = $this->loginAs($admin);

    $response = $this->withToken($token)->postJson('/api/v1/projects', [
      'name'        => 'Admin Project',
      'description' => 'Created by admin user',
      'status'      => 'active',
      'start_date'  => '2025-01-01',
    ]);

    $response->assertStatus(201);
  }

  public function test_project_slug_is_auto_generated(): void
  {
    $manager = User::factory()->manager()->create();
    $token   = $this->loginAs($manager);

    $this->withToken($token)->postJson('/api/v1/projects', [
      'name'        => 'My Cool Project',
      'description' => 'Description here',
      'status'      => 'active',
      'start_date'  => '2025-01-01',
    ])->assertJsonPath('data.slug', 'my-cool-project');
  }

  public function test_owner_can_update_their_project(): void
  {
    $manager = User::factory()->manager()->create();
    $project = $this->createProject($manager);
    $token   = $this->loginAs($manager);

    $response = $this->withToken($token)->putJson(
      "/api/v1/projects/{$project->slug}",
      ['status' => 'active']
    );

    $response->assertOk();
    $this->assertDatabaseHas('projects', [
      'id'     => $project->id,
      'status' => 'active',
    ]);
  }

  public function test_developer_cannot_update_project(): void
  {
    $manager   = User::factory()->manager()->create();
    $developer = User::factory()->developer()->create();
    $project   = $this->createProject($manager);
    $token     = $this->loginAs($developer);

    $this->withToken($token)->putJson(
      "/api/v1/projects/{$project->slug}",
      ['status' => 'completed']
    )->assertStatus(403);
  }

  public function test_admin_can_delete_project(): void
  {
    $admin   = User::factory()->admin()->create();
    $project = $this->createProject($admin);
    $token   = $this->loginAs($admin);

    $this->withToken($token)
      ->deleteJson("/api/v1/projects/{$project->slug}")
      ->assertOk();

    $this->assertSoftDeleted('projects', ['id' => $project->id]);
  }

  public function test_manager_cannot_delete_project(): void
  {
    $manager = User::factory()->manager()->create();
    $project = $this->createProject($manager);
    $token   = $this->loginAs($manager);

    $this->withToken($token)
      ->deleteJson("/api/v1/projects/{$project->slug}")
      ->assertStatus(403);
  }
}
