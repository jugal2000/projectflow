<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\TaskController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

Route::prefix('v1')->group(function () {

  // ── AUTH ROUTES (no login required) ───────────────────────────────
  Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
      Route::post('/logout', [AuthController::class, 'logout']);
      Route::get('/me',      [AuthController::class, 'me']);
      Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
        return \Illuminate\Support\Facades\Broadcast::auth($request);
      });
    });
  });

  Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {

    // Broadcasting auth endpoint — authorizes private channel subscriptions
    // using the Sanctum token (not session). Echo POSTs here before joining
    // a private channel; the callback in routes/channels.php decides access.
    Broadcast::routes(['middleware' => ['auth:sanctum']]);

    // PROJECT ROUTES — specific routes FIRST
    Route::get('/projects',                  [ProjectController::class, 'index']);
    Route::post('/projects',                 [ProjectController::class, 'store']);

    // Users / Team
    Route::get('/users',  [\App\Http\Controllers\Api\V1\UserController::class, 'index']);
    Route::post('/users', [\App\Http\Controllers\Api\V1\UserController::class, 'store']);

    // Activity log / audit trail (admin & manager only)
    Route::get('/activity-logs', [\App\Http\Controllers\Api\V1\ActivityLogController::class, 'index']);

    // These two MUST come before /projects/{project}
    Route::get('/projects/{project}/stats',  [ProjectController::class, 'stats']);
    Route::get('/projects/{project}/tasks',  [TaskController::class, 'index']);
    Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);

    // Generic project routes LAST
    Route::get('/projects/{project}',        [ProjectController::class, 'show']);
    Route::put('/projects/{project}',        [ProjectController::class, 'update']);
    Route::delete('/projects/{project}',     [ProjectController::class, 'destroy']);

    // TASK ROUTES — specific routes BEFORE /tasks/{task}
    Route::get('/tasks/my',              [TaskController::class, 'myTasks']);
    Route::post('/tasks/reorder',        [TaskController::class, 'reorder']);
    Route::put('/tasks/{task}',          [TaskController::class, 'update']);
    Route::patch('/tasks/{task}/status', [TaskController::class, 'changeStatus']);
    Route::patch('/tasks/{task}/assign', [TaskController::class, 'assign']);
    Route::delete('/tasks/{task}',       [TaskController::class, 'destroy']);

    // Current user's tasks across all projects (must come before /tasks/{task})
    Route::get('/tasks/my', [TaskController::class, 'myTasks']);

    // COMMENT ROUTES
    Route::get('/tasks/{task}/comments',  [CommentController::class, 'index']);
    Route::post('/tasks/{task}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}',     [CommentController::class, 'update']);
    Route::delete('/comments/{comment}',  [CommentController::class, 'destroy']);
  });
});
