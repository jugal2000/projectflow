<?php

namespace Tests\Unit;

use App\Models\Task;
use Tests\TestCase;

class TaskStatusMachineTest extends TestCase
{
  public function test_todo_can_only_go_to_in_progress(): void
  {
    $task = new Task(['status' => 'todo']);

    $this->assertTrue($task->canTransitionTo('in_progress'));
    $this->assertFalse($task->canTransitionTo('in_review'));
    $this->assertFalse($task->canTransitionTo('done'));
  }

  public function test_in_progress_can_go_forward_or_back(): void
  {
    $task = new Task(['status' => 'in_progress']);

    $this->assertTrue($task->canTransitionTo('in_review'));
    $this->assertTrue($task->canTransitionTo('todo'));
    $this->assertFalse($task->canTransitionTo('done'));
  }

  public function test_in_review_can_go_to_done_or_back(): void
  {
    $task = new Task(['status' => 'in_review']);

    $this->assertTrue($task->canTransitionTo('done'));
    $this->assertTrue($task->canTransitionTo('in_progress'));
    $this->assertFalse($task->canTransitionTo('todo'));
  }

  public function test_task_cannot_transition_to_same_status(): void
  {
    $task = new Task(['status' => 'todo']);
    $this->assertFalse($task->canTransitionTo('todo'));
  }
}
