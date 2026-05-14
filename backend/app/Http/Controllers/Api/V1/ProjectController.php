<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseController;
use App\Http\Requests\Project\CreateProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\ActivityLog;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class ProjectController extends BaseController
{
  /**
   * GET /api/v1/projects
   *
   * Returns a paginated, filtered list of projects.
   */
  public function index(Request $request): JsonResponse
  {
    $projects = Project::with(['owner', 'tasks']) // Eager load to prevent N+1
      ->forStatus($request->status)        // Apply status filter if given
      ->forOwner($request->owner_id)       // Apply owner filter if given
      ->when(                              // 'when' only adds this if condition is true
        $request->search,
        fn($q) => $q->where('name', 'like', "%{$request->search}%")
        // LIKE with % on both sides = contains search
      )
      ->orderBy(
        $request->sort_by ?? 'created_at',  // ?? = use 'created_at' if sort_by not given
        $request->sort_dir ?? 'desc'
      )
      ->paginate($request->per_page ?? 15); // Default 15 per page

    // Transform each project through ProjectResource before sending
    return $this->paginated(
      $projects->through(fn($p) => new ProjectResource($p))
    );
  }

  /**
   * POST /api/v1/projects
   *
   * Creates a new project. Only admin and manager can do this (enforced by Policy).
   */
  public function store(CreateProjectRequest $request): JsonResponse
  {
    // $this->authorize() calls the Policy and throws 403 if denied
    // 'create' = calls ProjectPolicy::create($user)
    $this->authorize('create', Project::class);

    // Generate a unique slug from the project name
    $slug = Project::generateUniqueSlug($request->name);

    // Create the project
    // array_merge combines two arrays: the validated form data + our additions
    $project = Project::create(array_merge(
      $request->validated(), // All the validated fields from CreateProjectRequest
      [
        'slug'     => $slug,
        'owner_id' => Auth::id(), // The logged-in user becomes the owner
      ]
    ));

    // Record this in the activity log
    ActivityLog::record($project, Auth::user(), 'created');

    // Load the owner relationship so ProjectResource can include it
    return $this->success(
      new ProjectResource($project->load('owner')),
      'Project created',
      201
    );
  }

  /**
   * GET /api/v1/projects/{slug}
   *
   * Returns a single project with all its tasks.
   * Laravel automatically finds the project by slug (because of getRouteKeyName())
   */
  public function show(Project $project): JsonResponse
  {
    // Load relationships: owner info + all tasks with their assignees
    $project->load(['owner', 'tasks.assignee']);
    // tasks.assignee = load tasks AND for each task load its assignee
    // This is called "nested eager loading"

    return $this->success(new ProjectResource($project));
  }

  /**
   * PUT /api/v1/projects/{slug}
   *
   * Updates a project. Only owner or admin (enforced by Policy).
   */
  public function update(UpdateProjectRequest $request, Project $project): JsonResponse
  {
    // 'update' = calls ProjectPolicy::update($user, $project)
    $this->authorize('update', $project);

    $data = $request->validated();

    // If the name changed, regenerate the slug
    if (isset($data['name']) && $data['name'] !== $project->name) {
      // Pass $project->id to exclude this project from collision check
      $data['slug'] = Project::generateUniqueSlug($data['name'], $project->id);
    }

    // Save "before" values for the activity log
    $before = $project->only(['name', 'status', 'description']);

    $project->update($data);

    // Log the change with before/after comparison
    ActivityLog::record($project, Auth::user(), 'updated', [
      'before' => $before,
      'after'  => $project->fresh()->only(['name', 'status', 'description']),
      // fresh() = re-fetch from database to get updated values
    ]);

    return $this->success(
      new ProjectResource($project->load('owner')),
      'Project updated'
    );
  }

  /**
   * DELETE /api/v1/projects/{slug}
   *
   * Soft deletes a project. Only admin (enforced by Policy).
   */
  public function destroy(Project $project): JsonResponse
  {
    $this->authorize('delete', $project);

    ActivityLog::record($project, Auth::user(), 'deleted');

    $project->delete(); // Soft delete — sets deleted_at, doesn't remove the row

    // Remove this project's stats from Redis cache
    Cache::forget("project_stats_{$project->id}");

    return $this->success(null, 'Project archived successfully');
  }

  /**
   * GET /api/v1/projects/{slug}/stats
   *
   * Returns aggregate statistics for a project.
   * Results are CACHED in Redis for 5 minutes to avoid repeated heavy queries.
   */
  public function stats(Project $project): JsonResponse
  {
    // Cache::remember() = try to get from cache first
    // If not in cache, run the function and STORE the result for 300 seconds (5 min)
    $stats = Cache::remember("project_stats_{$project->id}", 300, function () use ($project) {
      $taskQuery = $project->tasks(); // Base query for this project's tasks

      // Count tasks grouped by status — ONE query instead of four
      // selectRaw = write raw SQL inside a query builder query
      $byStatus = $taskQuery->clone()
        ->selectRaw('status, COUNT(*) as count')
        ->groupBy('status')
        ->pluck('count', 'status') // Returns ['todo' => 3, 'done' => 5]
        ->toArray();

      // Get total hours — ONE more query
      $hours = $taskQuery->clone()
        ->selectRaw('SUM(estimated_hours) as estimated, SUM(actual_hours) as actual')
        ->first();

      // Count overdue tasks using our scope
      $overdue = $taskQuery->clone()->overdue()->count();

      return [
        // array_merge fills in 0 for any status that has no tasks
        'tasks_by_status' => array_merge(
          ['todo' => 0, 'in_progress' => 0, 'in_review' => 0, 'done' => 0],
          $byStatus
        ),
        'total_tasks'     => array_sum($byStatus),
        'estimated_hours' => (float) ($hours->estimated ?? 0),
        'actual_hours'    => (float) ($hours->actual ?? 0),
        'overdue_count'   => $overdue,
        'completion_pct'  => $this->completionPercent($byStatus),
      ];
    });

    return $this->success($stats);
  }

  /**
   * Calculate what % of tasks are done.
   * Private helper method — only used inside this class.
   */
  private function completionPercent(array $byStatus): int
  {
    $total = array_sum($byStatus);
    if ($total === 0) return 0; // Avoid division by zero

    // round() rounds to nearest integer, (int) converts to integer type
    return (int) round(($byStatus['done'] ?? 0) / $total * 100);
  }
}
