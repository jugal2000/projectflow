<?php

namespace Tests\Unit;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskReorderTest extends TestCase
{
  use RefreshDatabase;

  public function test_tasks_sort_order_updates_in_bulk(): void
  {
    $manager = User::factory()->manager()->create();
    $project = Project::factory()->create(['owner_id' => $manager->id]);
    $token   = $this->loginAs($manager);

    $t1 = Task::factory()->create(['project_id' => $project->id, 'sort_order' => 0]);
    $t2 = Task::factory()->create(['project_id' => $project->id, 'sort_order' => 1]);
    $t3 = Task::factory()->create(['project_id' => $project->id, 'sort_order' => 2]);

    $this->withToken($token)->postJson('/api/v1/tasks/reorder', [
      'tasks' => [
        ['id' => $t1->id, 'sort_order' => 2],
        ['id' => $t2->id, 'sort_order' => 1],
        ['id' => $t3->id, 'sort_order' => 0],
      ],
    ])->assertOk();

    $this->assertDatabaseHas('tasks', ['id' => $t1->id, 'sort_order' => 2]);
    $this->assertDatabaseHas('tasks', ['id' => $t2->id, 'sort_order' => 1]);
    $this->assertDatabaseHas('tasks', ['id' => $t3->id, 'sort_order' => 0]);
  }
}
