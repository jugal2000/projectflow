<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\CommentController;

Route::prefix('v1')->group(function () {

  // Authentication Routes
  Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
      Route::post('/logout', [AuthController::class, 'logout']);
      Route::get('/me', [AuthController::class, 'me']);
    });
  });

  // Protected Routes
  Route::middleware('auth:sanctum')->group(function () {

    // Projects
    Route::apiResource('projects', ProjectController::class);

    // Tasks
    Route::apiResource('tasks', TaskController::class);

    // Comments
    Route::get('tasks/{task}/comments', [CommentController::class, 'index']);
    Route::post('tasks/{task}/comments', [CommentController::class, 'store']);
    Route::delete('comments/{comment}', [CommentController::class, 'destroy']);
  });
});
