<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskAssigneeTest extends TestCase
{
  use RefreshDatabase;

  private User $manager;
  private Project $project;

  protected function setUp(): void
  {
    parent::setUp();
    $this->manager = User::factory()->manager()->create();
    $this->project = Project::factory()->create(['owner_id' => $this->manager->id]);
  }

  public function test_task_can_be_created_with_multiple_assignees(): void
  {
    $dev1 = User::factory()->developer()->create();
    $dev2 = User::factory()->developer()->create();
    $token = $this->loginAs($this->manager);

    $res = $this->withToken($token)->postJson(
      "/api/v1/projects/{$this->project->slug}/tasks",
      ['title' => 'Shared task', 'priority' => 'high', 'assignee_ids' => [$dev1->id, $dev2->id]]
    )->assertStatus(201);

    $taskId = $res->json('data.id');
    $this->assertDatabaseHas('task_user', ['task_id' => $taskId, 'user_id' => $dev1->id]);
    $this->assertDatabaseHas('task_user', ['task_id' => $taskId, 'user_id' => $dev2->id]);
  }

  public function test_assign_endpoint_syncs_the_assignee_set(): void
  {
    $dev1 = User::factory()->developer()->create();
    $dev2 = User::factory()->developer()->create();
    $task = Task::factory()->create(['project_id' => $this->project->id]);
    $task->assignees()->attach($dev1->id);

    $token = $this->loginAs($this->manager);

    // Sync to a new set — dev1 removed, dev2 added
    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$task->id}/assign",
      ['assignee_ids' => [$dev2->id]]
    )->assertOk();

    $this->assertDatabaseMissing('task_user', ['task_id' => $task->id, 'user_id' => $dev1->id]);
    $this->assertDatabaseHas('task_user', ['task_id' => $task->id, 'user_id' => $dev2->id]);
  }

  public function test_assignee_developer_can_change_status(): void
  {
    $dev = User::factory()->developer()->create();
    $task = Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);
    $task->assignees()->attach($dev->id);

    $token = $this->loginAs($dev);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$task->id}/status",
      ['status' => 'in_progress']
    )->assertOk();
  }

  public function test_non_assignee_developer_cannot_change_status(): void
  {
    $dev = User::factory()->developer()->create();
    $task = Task::factory()->create(['project_id' => $this->project->id, 'status' => 'todo']);
    // dev is NOT attached as an assignee

    $token = $this->loginAs($dev);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$task->id}/status",
      ['status' => 'in_progress']
    )->assertStatus(403);
  }

  public function test_my_tasks_includes_tasks_where_user_is_one_of_several_assignees(): void
  {
    $dev = User::factory()->developer()->create();
    $other = User::factory()->developer()->create();
    $task = Task::factory()->create(['project_id' => $this->project->id]);
    $task->assignees()->attach([$dev->id, $other->id]);

    $token = $this->loginAs($dev);

    $this->withToken($token)
      ->getJson('/api/v1/tasks/my')
      ->assertOk()
      ->assertJsonFragment(['id' => $task->id]);
  }
}
