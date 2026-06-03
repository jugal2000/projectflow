<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Http\Requests\Project\CreateProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class ProjectController extends BaseController
{
  /**
   * Helper: get the currently authenticated user as a User model.
   */
  private function authUser(): User
  {
    /** @var User $user */
    $user = Auth::user();
    return $user;
  }

  /**
   * GET /api/v1/projects
   * List all projects with optional filters
   */
  public function index(Request $request): JsonResponse
  {
    $query = Project::with('owner')
      ->withCount([
        'tasks',
        'tasks as done_tasks' => function ($q) {
          $q->where('status', 'done');
        },
        'tasks as in_progress_count' => function ($q) {
          $q->where('status', 'in_progress');
        },
      ]);

    // Filters
    if ($request->status) {
      $query->where('status', $request->status);
    }

    if ($request->search) {
      $query->where('name', 'like', '%' . $request->search . '%');
    }

    $projects = $query->orderBy('created_at', 'desc')
      ->paginate($request->per_page ?? 18);

    return $this->paginated(ProjectResource::collection($projects));
  }

  /**
   * POST /api/v1/projects
   * Create a new project
   * Only admins and managers can create projects.
   */
  public function store(CreateProjectRequest $request): JsonResponse
  {
    $user = $this->authUser();

    // Manual authorization — only admin and manager can create projects
    if (!$user->isAdmin() && !$user->isManager()) {
      return $this->error('Only admins and managers can create projects', 403);
    }

    $data = $request->validated();

    // Auto-generate unique slug from name
    $data['slug']     = Project::generateUniqueSlug($data['name']);
    $data['owner_id'] = $user->id;

    $project = Project::create($data);

    ActivityLog::record($project, $user, 'created');

    return $this->success(
      new ProjectResource($project->load('owner')),
      'Project created successfully',
      201
    );
  }

  /**
   * GET /api/v1/projects/{slug}
   * Show one project's full details
   */
  public function show(Project $project): JsonResponse
  {
    $project->load('owner');
    $project->loadCount([
      'tasks',
      'tasks as done_tasks' => function ($q) {
        $q->where('status', 'done');
      },
    ]);

    return $this->success(new ProjectResource($project));
  }

  /**
   * PUT /api/v1/projects/{slug}
   * Update a project
   */
  public function update(UpdateProjectRequest $request, Project $project): JsonResponse
  {
    $user = $this->authUser();

    // Admin can update any project; manager only their own projects
    $canUpdate = $user->isAdmin()
      || ($user->isManager() && $project->owner_id === $user->id);

    if (!$canUpdate) {
      return $this->error('You do not have permission to update this project', 403);
    }

    $data = $request->validated();

    // If name changed, regenerate slug (excluding current project)
    if (isset($data['name']) && $data['name'] !== $project->name) {
      $data['slug'] = Project::generateUniqueSlug($data['name'], $project->id);
    }

    $project->update($data);

    ActivityLog::record($project, $user, 'updated');
    Cache::forget("project_stats_{$project->id}");

    return $this->success(
      new ProjectResource($project->load('owner')),
      'Project updated successfully'
    );
  }

  /**
   * DELETE /api/v1/projects/{slug}
   * Soft delete a project
   * Only admins can delete projects.
   */
  public function destroy(Project $project): JsonResponse
  {
    $user = $this->authUser();

    // Only admins can delete projects
    if (!$user->isAdmin()) {
      return $this->error('Only admins can delete projects', 403);
    }

    ActivityLog::record($project, $user, 'deleted');
    $project->delete();

    Cache::forget("project_stats_{$project->id}");

    return $this->success(null, 'Project deleted successfully');
  }

  /**
   * GET /api/v1/projects/{slug}/stats
   *
   * Aggregate project statistics, cached for 5 minutes.
   * Response shape matches the ProjectStats interface on the frontend.
   */
  public function stats(Project $project): JsonResponse
  {
    $stats = Cache::remember("project_stats_{$project->id}", 300, function () use ($project) {
      $byStatus = $project->tasks()
        ->selectRaw('status, COUNT(*) as count')
        ->groupBy('status')
        ->pluck('count', 'status')
        ->toArray();

      // Ensure every status key is present even when zero
      $tasksByStatus = array_merge(
        ['todo' => 0, 'in_progress' => 0, 'in_review' => 0, 'done' => 0],
        $byStatus
      );

      $hours = $project->tasks()
        ->selectRaw('SUM(estimated_hours) as estimated, SUM(actual_hours) as actual')
        ->first();

      $overdueCount = $project->tasks()
        ->whereNotNull('due_date')
        ->where('due_date', '<', now())
        ->where('status', '!=', 'done')
        ->count();

      $totalTasks = array_sum($tasksByStatus);
      $completionPct = $totalTasks === 0
        ? 0
        : (int) round(($tasksByStatus['done'] / $totalTasks) * 100);

      return [
        'tasks_by_status' => $tasksByStatus,
        'total_tasks'     => $totalTasks,
        'estimated_hours' => (float) ($hours->estimated ?? 0),
        'actual_hours'    => (float) ($hours->actual ?? 0),
        'overdue_count'   => $overdueCount,
        'completion_pct'  => $completionPct,
      ];
    });

    return $this->success($stats);
  }
}
