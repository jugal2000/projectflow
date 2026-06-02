<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends BaseController
{
  /**
   * GET /api/v1/activity-logs
   *
   * Returns a paginated, reverse-chronological audit trail.
   * Optional filters: ?action=created&user_id=3&subject_type=Task
   * Only admins and managers can view the full activity trail.
   */
  public function index(Request $request): JsonResponse
  {
    /** @var User $user */
    $user = Auth::user();

    // The audit trail is a management view — admins and managers only.
    if (!$user->isAdmin() && !$user->isManager()) {
      return $this->forbidden('You do not have permission to view the activity log.');
    }

    $query = ActivityLog::query()
      ->with('user')           // eager-load the actor to avoid N+1
      ->latest();              // newest first (orders by created_at desc)

    // Optional filter: by action type (e.g. "created", "commented")
    if ($request->filled('action')) {
      $query->where('action', $request->action);
    }

    // Optional filter: by who performed the action
    if ($request->filled('user_id')) {
      $query->where('user_id', $request->user_id);
    }

    // Optional filter: by subject type. Accept a short name ("Task")
    // and expand it to the full class name stored in the DB.
    if ($request->filled('subject_type')) {
      $short = ucfirst($request->subject_type);
      $query->where('subject_type', "App\\Models\\{$short}");
    }

    $logs = $query->paginate($request->per_page ?? 25);

    return $this->paginated(ActivityLogResource::collection($logs));
  }
}
