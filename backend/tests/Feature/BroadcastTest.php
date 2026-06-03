<?php

namespace Tests\Feature;

use App\Events\TaskUpdated;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BroadcastTest extends TestCase
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
    ]);
    $this->task->assignees()->attach($this->manager->id);
  }

  public function test_changing_status_dispatches_task_updated_event(): void
  {
    // Event::fake intercepts events so they don't actually broadcast,
    // and lets us assert that they were dispatched.
    Event::fake([TaskUpdated::class]);

    $token = $this->loginAs($this->manager);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$this->task->id}/status",
      ['status' => 'in_progress']
    )->assertOk();

    Event::assertDispatched(TaskUpdated::class);
  }

  public function test_task_updated_event_carries_the_correct_task(): void
  {
    Event::fake([TaskUpdated::class]);

    $token = $this->loginAs($this->manager);

    $this->withToken($token)->patchJson(
      "/api/v1/tasks/{$this->task->id}/status",
      ['status' => 'in_progress']
    )->assertOk();

    Event::assertDispatched(TaskUpdated::class, function (TaskUpdated $event) {
      return $event->task->id === $this->task->id;
    });
  }

  public function test_creating_a_task_dispatches_task_updated_event(): void
  {
    Event::fake([TaskUpdated::class]);

    $token = $this->loginAs($this->manager);

    $this->withToken($token)->postJson(
      "/api/v1/projects/{$this->project->slug}/tasks",
      ['title' => 'New task triggers broadcast', 'priority' => 'low']
    )->assertStatus(201);

    Event::assertDispatched(TaskUpdated::class);
  }
}
