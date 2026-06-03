<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
  use RefreshDatabase;

  private User $manager;
  private Project $project;

  protected function setUp(): void
  {
    parent::setUp();

    $this->manager = User::factory()->manager()->create();
    $this->project = Project::factory()->create([
      'owner_id' => $this->manager->id,
    ]);
  }

  public function test_creating_a_task_records_an_activity_log(): void
  {
    $token = $this->loginAs($this->manager);

    $this->withToken($token)->postJson(
      "/api/v1/projects/{$this->project->slug}/tasks",
      ['title' => 'A brand new task', 'priority' => 'medium']
    )->assertStatus(201);

    $this->assertDatabaseHas('activity_logs', [
      'action'       => 'created',
      'subject_type' => Task::class,
      'user_id'      => $this->manager->id,
    ]);
  }

  public function test_posting_a_comment_records_a_commented_log(): void
  {
    $task = Task::factory()->create([
      'project_id'  => $this->project->id,
    ]);

    $token = $this->loginAs($this->manager);

    $this->withToken($token)->postJson(
      "/api/v1/tasks/{$task->id}/comments",
      ['body' => 'Logging this comment']
    )->assertStatus(201);

    $this->assertDatabaseHas('activity_logs', [
      'action'  => 'commented',
      'user_id' => $this->manager->id,
    ]);
  }

  public function test_admin_can_view_activity_log(): void
  {
    // Generate at least one log entry first
    Task::factory()->create(['project_id' => $this->project->id]);

    $admin = User::factory()->admin()->create();
    $token = $this->loginAs($admin);

    $this->withToken($token)
      ->getJson('/api/v1/activity-logs')
      ->assertOk()
      ->assertJsonStructure([
        'success',
        'data',
        'meta' => ['current_page', 'last_page', 'per_page', 'total'],
      ]);
  }

  public function test_developer_cannot_view_activity_log(): void
  {
    $developer = User::factory()->developer()->create();
    $token     = $this->loginAs($developer);

    $this->withToken($token)
      ->getJson('/api/v1/activity-logs')
      ->assertStatus(403);
  }
}
