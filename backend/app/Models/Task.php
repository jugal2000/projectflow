<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'assigned_to',
        'due_date',
        'estimated_hours',
        'actual_hours',
        'sort_order',
    ];

    protected $casts = [
        'due_date'        => 'date',
        'estimated_hours' => 'decimal:1',
        'actual_hours'    => 'decimal:1',
        'sort_order'      => 'integer',
    ];

    // ── STATUS MACHINE ─────────────────────────────────────────────────
    // This defines which status changes are ALLOWED
    // Think of it like a flowchart:
    //   todo → in_progress → in_review → done
    //
    // You can also go backwards (e.g. in_review → in_progress)
    // but you CANNOT skip forward (e.g. todo → done is NOT allowed)

    public const STATUS_TRANSITIONS = [
        'todo'        => ['in_progress'],           // from todo, can only go to in_progress
        'in_progress' => ['in_review', 'todo'],     // can go forward or back
        'in_review'   => ['done', 'in_progress'],   // can go forward or back
        'done'        => ['in_review'],             // can only go back to in_review
    ];

    // List of all valid statuses and priorities (used for validation)
    public const STATUSES   = ['todo', 'in_progress', 'in_review', 'done'];
    public const PRIORITIES = ['low', 'medium', 'high', 'critical'];

    // ── RELATIONSHIPS ──────────────────────────────────────────────────

    // A task BELONGS TO a project
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    // A task is ASSIGNED TO a user (via assigned_to column)
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // A task HAS MANY comments
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // ── STATUS TRANSITION CHECK ────────────────────────────────────────
    // Given the current status, can we change to $newStatus?
    // Returns true if allowed, false if not.

    public function canTransitionTo(string $newStatus): bool
    {
        // Can't "transition" to the same status
        if ($this->status === $newStatus) {
            return false;
        }

        // Look up what's allowed from current status
        // ?? [] means: if not found, use empty array (so in_array returns false)
        return in_array($newStatus, self::STATUS_TRANSITIONS[$this->status] ?? []);
    }

    // ── QUERY SCOPES ───────────────────────────────────────────────────

    public function scopeForStatus($query, ?string $status)
    {
        return $status ? $query->where('status', $status) : $query;
    }

    public function scopeForPriority($query, ?string $priority)
    {
        return $priority ? $query->where('priority', $priority) : $query;
    }

    public function scopeForAssignee($query, ?int $userId)
    {
        return $userId ? $query->where('assigned_to', $userId) : $query;
    }

    // Scope for overdue tasks:
    // - has a due_date
    // - that date is in the past
    // - status is NOT done (done tasks aren't "overdue")
    public function scopeOverdue($query)
    {
        return $query
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()) // now() returns current date/time
            ->where('status', '!=', 'done');
    }
}
