<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ActivityLog;

class CommentController extends BaseController
{
  /**
   * GET /api/v1/tasks/{id}/comments
   *
   * Returns threaded comments: only ROOT comments (no parent),
   * but each root comment has its replies nested inside it.
   */

  public function index(Task $task): JsonResponse
  {
    $comments = $task->comments()
      // Load nested replies up to 3 levels deep
      // 'replies.author' = for each reply, load the author
      // 'replies.replies.author' = for replies-of-replies, also load authors
      ->with(['author', 'replies.author', 'replies.replies.author'])
      ->whereNull('parent_id') // Only get ROOT comments (not replies)
      ->latest()               // Newest first
      ->get();

    return $this->success(CommentResource::collection($comments));
    // collection() = apply CommentResource to every comment in the array
  }

  /**
   * POST /api/v1/tasks/{id}/comments
   */
  public function store(Request $request, Task $task): JsonResponse
  {
    $request->validate([
      'body'      => ['required', 'string', 'max:5000'],
      'parent_id' => ['nullable', 'exists:comments,id'],
    ]);

    // Extra check: if a parent_id was given, make sure that parent
    // belongs to the SAME task (can't reply to a comment on a different task)
    if ($request->parent_id) {
      $parent = Comment::findOrFail($request->parent_id);
      if ($parent->task_id !== $task->id) {
        return $this->error('Parent comment does not belong to this task.', 422);
      }
    }

    $comment = $task->comments()->create([
      'user_id'   => Auth::id(),
      'body'      => $request->body,
      'parent_id' => $request->parent_id,
    ]);

    /** @var \App\Models\User $user */
    $user = Auth::user();
    ActivityLog::record($comment, $user, 'commented', [
      'task_id' => $task->id,
      'is_reply' => $request->parent_id !== null,
    ]);

    return $this->success(
      new CommentResource($comment->load('author')),
      'Comment added',
      201
    );
  }

  /**
   * PUT /api/v1/comments/{id}
   *
   * Edit a comment. Only within 15 minutes, only own comment.
   */
  public function update(Request $request, Comment $comment): JsonResponse
  {
    $request->validate([
      'body' => ['required', 'string', 'max:5000'],
    ]);

    // Use the isEditableBy() method we wrote in the Comment model
    if (!$comment->isEditableBy(Auth::user())) {
      return $this->forbidden(
        'You cannot edit this comment. Either it is not yours or the 15-minute window has passed.'
      );
    }

    $comment->update(['body' => $request->body]);

    /** @var \App\Models\User $user */
    $user = Auth::user();
    ActivityLog::record($comment, $user, 'comment_updated', [
      'task_id' => $comment->task_id,
    ]);


    return $this->success(
      new CommentResource($comment->load('author')),
      'Comment updated'
    );
  }

  public function destroy(Comment $comment): JsonResponse
  {
    /** @var \App\Models\User $user */
    $user = Auth::user();

    // Base permission: admin can delete any comment; others only their own.
    if (!$user->isAdmin() && $comment->user_id !== $user->id) {
      return $this->forbidden('You can only delete your own comments.');
    }

    // Indirect-deletion guard: deleting a parent cascades to its replies.
    // A non-admin must not delete a comment that has replies authored by
    // someone else, since that would remove comments they couldn't delete
    // directly. Admins bypass this (they can delete anything).
    if (!$user->isAdmin() && $this->hasReplyFromOtherUser($comment, $user)) {
      return $this->forbidden(
        'This comment has replies from other users and cannot be deleted directly. '
          . 'Please ask an administrator to remove it.'
      );
    }

    ActivityLog::record($comment, $user, 'comment_deleted', [
      'task_id' => $comment->task_id,
    ]);

    $comment->delete();

    return $this->success(null, 'Comment deleted');
  }

  /**
   * Recursively checks whether $comment has any descendant reply that was
   * authored by someone other than $user. Used to block indirect deletion:
   * a user shouldn't be able to cascade-delete replies they don't own.
   */
  private function hasReplyFromOtherUser(Comment $comment, \App\Models\User $user): bool
  {
    $comment->loadMissing('replies');

    foreach ($comment->replies as $reply) {
      // A reply not authored by this user is one they can't delete directly
      if ($reply->user_id !== $user->id) {
        return true;
      }
      // Recurse into nested replies
      if ($this->hasReplyFromOtherUser($reply, $user)) {
        return true;
      }
    }

    return false;
  }
}
