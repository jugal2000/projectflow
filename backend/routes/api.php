<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

  // ── AUTH ROUTES (no login required) ───────────────────────────────
  Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
      Route::post('/logout', [AuthController::class, 'logout']);
      Route::get('/me',      [AuthController::class, 'me']);
    });
  });

  Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {

    // PROJECT ROUTES — specific routes FIRST
    Route::get('/projects',                  [ProjectController::class, 'index']);
    Route::post('/projects',                 [ProjectController::class, 'store']);

    // Users / Team
    Route::get('/users',  [\App\Http\Controllers\Api\V1\UserController::class, 'index']);
    Route::post('/users', [\App\Http\Controllers\Api\V1\UserController::class, 'store']);

    // These two MUST come before /projects/{project}
    Route::get('/projects/{project}/stats',  [ProjectController::class, 'stats']);
    Route::get('/projects/{project}/tasks',  [TaskController::class, 'index']);
    Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);

    // Generic project routes LAST
    Route::get('/projects/{project}',        [ProjectController::class, 'show']);
    Route::put('/projects/{project}',        [ProjectController::class, 'update']);
    Route::delete('/projects/{project}',     [ProjectController::class, 'destroy']);

    // TASK ROUTES — reorder before {task}
    Route::post('/tasks/reorder',         [TaskController::class, 'reorder']);
    Route::put('/tasks/{task}',           [TaskController::class, 'update']);
    Route::patch('/tasks/{task}/status',  [TaskController::class, 'changeStatus']);
    Route::patch('/tasks/{task}/assign',  [TaskController::class, 'assign']);
    Route::delete('/tasks/{task}',        [TaskController::class, 'destroy']);

    // COMMENT ROUTES
    Route::get('/tasks/{task}/comments',  [CommentController::class, 'index']);
    Route::post('/tasks/{task}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}',     [CommentController::class, 'update']);
    Route::delete('/comments/{comment}',  [CommentController::class, 'destroy']);
  });
});
