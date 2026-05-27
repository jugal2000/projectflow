<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskStatusTransitionTest extends TestCase
{
  use RefreshDatabase;

  private User $manager;
  private Project $project;
  private Task $task;

  protected function setUp(): void
  {
    parent::setUp();

    $this->manager = User::factory()->manager()->create();
    $this->project = Project::factory()->create([
      'owner_id' => $this->manager->id,
    ]);
    $this->task = Task::factory()->create([
      'project_id'  => $this->project->id,
      'status'      => 'todo',
      'assigned_to' => $this->manager->id,
    ]);
  }

  public function test_todo_can_transition_to_in_progress(): void
  {
    $token = $this->loginAs($this->manager);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$this->task->id}/status",
      ['status' => 'in_progress']
    )->assertOk();

    $this->assertDatabaseHas('tasks', [
      'id'     => $this->task->id,
      'status' => 'in_progress',
    ]);
  }

  public function test_in_progress_can_transition_to_in_review(): void
  {
    $this->task->update(['status' => 'in_progress']);
    $token = $this->loginAs($this->manager);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$this->task->id}/status",
      ['status' => 'in_review']
    )->assertOk();
  }

  public function test_in_review_can_transition_to_done_with_hours(): void
  {
    $this->task->update(['status' => 'in_review']);
    $token = $this->loginAs($this->manager);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$this->task->id}/status",
      ['status' => 'done', 'actual_hours' => 8]
    )->assertOk();

    $this->assertDatabaseHas('tasks', [
      'id'     => $this->task->id,
      'status' => 'done',
    ]);
  }

  public function test_todo_cannot_skip_to_done(): void
  {
    $token = $this->loginAs($this->manager);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$this->task->id}/status",
      ['status' => 'done']
    )->assertStatus(422);
  }

  public function test_todo_cannot_skip_to_in_review(): void
  {
    $token = $this->loginAs($this->manager);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$this->task->id}/status",
      ['status' => 'in_review']
    )->assertStatus(422);
  }

  public function test_done_requires_actual_hours(): void
  {
    $this->task->update(['status' => 'in_review']);
    $token = $this->loginAs($this->manager);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$this->task->id}/status",
      ['status' => 'done']
    )->assertStatus(422);
  }

  public function test_non_assignee_developer_cannot_change_status(): void
  {
    $otherDev = User::factory()->developer()->create();
    $token    = $this->loginAs($otherDev);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$this->task->id}/status",
      ['status' => 'in_progress']
    )->assertStatus(403);
  }
}
