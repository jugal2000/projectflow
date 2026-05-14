<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable; // Throwable = any error or exception in PHP

class Handler extends ExceptionHandler
{
  // These fields are never shown in error messages (security)
  protected $dontFlash = [
    'current_password',
    'password',
    'password_confirmation',
  ];

  public function register(): void
  {
    $this->reportable(function (Throwable $e) {
      // You could log to a service like Sentry here
    });
  }

  /**
   * This is called whenever an exception is thrown.
   * We override it to always return JSON for API requests.
   */
  public function render($request, Throwable $e): JsonResponse|\Illuminate\Http\Response
  {
    // Check if the request expects JSON (API requests do)
    // OR if the URL starts with /api/
    if ($request->expectsJson() || $request->is('api/*')) {
      return $this->renderJson($e);
    }

    // For non-API requests (like the welcome page), use default Laravel behavior
    return parent::render($request, $e);
  }

  /**
   * Convert any exception into a clean JSON response.
   */
  private function renderJson(Throwable $e): JsonResponse
  {
    // ── VALIDATION ERRORS ──────────────────────────────────────────
    // These happen when form data doesn't pass validation rules
    // e.g. email field is missing, password too short, etc.
    if ($e instanceof ValidationException) {
      return response()->json([
        'success' => false,
        'message' => 'Validation failed',
        'errors'  => $e->errors(), // Returns field-by-field errors
        // e.g. {"email": ["The email field is required."]}
      ], 422); // 422 = Unprocessable Entity (bad input)
    }

    // ── AUTHENTICATION ERRORS ──────────────────────────────────────
    // These happen when user is not logged in
    if ($e instanceof AuthenticationException) {
      return response()->json([
        'success' => false,
        'message' => 'Unauthenticated. Please log in.',
      ], 401); // 401 = Unauthorized
    }

    // ── AUTHORIZATION ERRORS ───────────────────────────────────────
    // These happen when user IS logged in but doesn't have permission
    if ($e instanceof AccessDeniedHttpException) {
      return response()->json([
        'success' => false,
        'message' => 'You do not have permission to perform this action.',
      ], 403); // 403 = Forbidden
    }

    // ── NOT FOUND ERRORS ───────────────────────────────────────────
    // ModelNotFoundException = tried to find a record that doesn't exist
    // e.g. Project::findOrFail(999) when project 999 doesn't exist
    if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
      return response()->json([
        'success' => false,
        'message' => 'The requested resource was not found.',
      ], 404); // 404 = Not Found
    }

    // ── ALL OTHER ERRORS ───────────────────────────────────────────
    // In production: hide the real error (security!)
    // In development: show the real error (helpful for debugging)
    $message = app()->isProduction()
      ? 'An unexpected error occurred. Please try again.'
      : $e->getMessage(); // Shows the actual PHP error in development

    return response()->json([
      'success' => false,
      'message' => $message,
    ], 500); // 500 = Internal Server Error
  }
}
