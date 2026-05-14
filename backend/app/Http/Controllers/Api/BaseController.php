<?php

// The "namespace" tells PHP where this file lives in the folder structure
// App\Http\Controllers\Api means it's in app/Http/Controllers/Api/
namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller; // The base class all controllers extend

abstract class BaseController extends Controller
// "abstract" means you can't create a BaseController directly
// It's only used as a parent class for other controllers
{
  /**
   * Send a success response.
   *
   * Usage: return $this->success($userData, 'User created', 201);
   *
   * @param mixed  $data    The data to send back (array, object, null)
   * @param string $message A human-readable message
   * @param int    $status  HTTP status code (200 = OK, 201 = Created, etc.)
   */
  protected function success(mixed $data = null, string $message = 'Success', int $status = 200): JsonResponse
  {
    return response()->json([
      'success' => true,
      'message' => $message,
      'data'    => $data,
    ], $status);
  }

  /**
   * Send an error response.
   *
   * Usage: return $this->error('Not found', 404);
   */
  protected function error(string $message, int $status = 400, mixed $errors = null): JsonResponse
  {
    $payload = [
      'success' => false,
      'message' => $message,
    ];

    // Only add 'errors' key if there are validation errors to show
    if ($errors !== null) {
      $payload['errors'] = $errors;
    }

    return response()->json($payload, $status);
  }

  /**
   * Send a paginated response.
   * Pagination = splitting large lists into pages (like Google search results).
   *
   * Usage: return $this->paginated($projects);
   */
  protected function paginated($paginator, string $message = 'Success'): JsonResponse
  {
    return response()->json([
      'success' => true,
      'message' => $message,
      'data'    => $paginator->items(), // The actual records for this page
      'meta'    => [
        // Meta = information ABOUT the data (not the data itself)
        'current_page' => $paginator->currentPage(), // Which page are we on?
        'last_page'    => $paginator->lastPage(),    // How many pages total?
        'per_page'     => $paginator->perPage(),     // How many per page?
        'total'        => $paginator->total(),       // Total records across all pages
      ],
    ]);
  }

  /**
   * Shortcut for 404 Not Found responses.
   */
  protected function notFound(string $message = 'Resource not found'): JsonResponse
  {
    return $this->error($message, 404);
  }

  /**
   * Shortcut for 403 Forbidden responses.
   */
  protected function forbidden(string $message = 'Forbidden'): JsonResponse
  {
    return $this->error($message, 403);
  }
}
