<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
  use RefreshDatabase;

  private User $author;
  private Project $project;
  private Task $task;

  protected function setUp(): void
  {
    parent::setUp();

    $this->author  = User::factory()->developer()->create();
    $this->project = Project::factory()->create();
    $this->task    = Task::factory()->create([
      'project_id'  => $this->project->id,
    ]);
  }

  public function test_user_can_post_a_comment(): void
  {
    $token = $this->loginAs($this->author);

    $this->withToken($token)->postJson(
      "/api/v1/tasks/{$this->task->id}/comments",
      ['body' => 'This is my comment']
    )->assertStatus(201);

    $this->assertDatabaseHas('comments', [
      'task_id' => $this->task->id,
      'user_id' => $this->author->id,
      'body'    => 'This is my comment',
    ]);
  }

  public function test_user_can_post_a_reply(): void
  {
    $parent = Comment::create([
      'task_id' => $this->task->id,
      'user_id' => $this->author->id,
      'body'    => 'Parent comment',
    ]);

    $token = $this->loginAs($this->author);

    $this->withToken($token)->postJson(
      "/api/v1/tasks/{$this->task->id}/comments",
      ['body' => 'A reply', 'parent_id' => $parent->id]
    )->assertStatus(201);

    $this->assertDatabaseHas('comments', [
      'parent_id' => $parent->id,
      'body'      => 'A reply',
    ]);
  }

  public function test_reply_to_comment_from_different_task_is_rejected(): void
  {
    // A comment that belongs to a DIFFERENT task
    $otherTask = Task::factory()->create(['project_id' => $this->project->id]);
    $otherComment = Comment::create([
      'task_id' => $otherTask->id,
      'user_id' => $this->author->id,
      'body'    => 'Comment on another task',
    ]);

    $token = $this->loginAs($this->author);

    $this->withToken($token)->postJson(
      "/api/v1/tasks/{$this->task->id}/comments",
      ['body' => 'Trying to reply across tasks', 'parent_id' => $otherComment->id]
    )->assertStatus(422);
  }

  public function test_author_can_edit_own_comment_within_window(): void
  {
    $comment = Comment::create([
      'task_id' => $this->task->id,
      'user_id' => $this->author->id,
      'body'    => 'Original text',
    ]);

    $token = $this->loginAs($this->author);

    $this->withToken($token)->putJson(
      "/api/v1/comments/{$comment->id}",
      ['body' => 'Edited text']
    )->assertOk();

    $this->assertDatabaseHas('comments', [
      'id'   => $comment->id,
      'body' => 'Edited text',
    ]);
  }

  public function test_comment_cannot_be_edited_after_window(): void
  {
    $comment = Comment::create([
      'task_id' => $this->task->id,
      'user_id' => $this->author->id,
      'body'    => 'Old comment',
    ]);

    // Force created_at back in time, bypassing Eloquent's automatic
    // timestamp handling, so the comment is outside the 15-minute edit window.
    Comment::withoutTimestamps(function () use ($comment) {
      $comment->forceFill(['created_at' => now()->subMinutes(20)])->save();
    });

    $token = $this->loginAs($this->author);

    $this->withToken($token)->putJson(
      "/api/v1/comments/{$comment->id}",
      ['body' => 'Trying to edit too late']
    )->assertStatus(403);
  }

  public function test_admin_can_delete_any_comment(): void
  {
    $comment = Comment::create([
      'task_id' => $this->task->id,
      'user_id' => $this->author->id,  // created by the developer
      'body'    => 'Developer comment',
    ]);

    $admin = User::factory()->admin()->create();
    $token = $this->loginAs($admin);

    $this->withToken($token)->deleteJson(
      "/api/v1/comments/{$comment->id}"
    )->assertOk();
  }

  public function test_user_cannot_delete_another_users_comment(): void
  {
    $comment = Comment::create([
      'task_id' => $this->task->id,
      'user_id' => $this->author->id,
      'body'    => 'Author comment',
    ]);

    $otherDev = User::factory()->developer()->create();
    $token    = $this->loginAs($otherDev);

    $this->withToken($token)->deleteJson(
      "/api/v1/comments/{$comment->id}"
    )->assertStatus(403);
  }
}
