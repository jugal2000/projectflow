<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    // We set UPDATED_AT to null because activity logs are immutable
    // (once recorded, they never change)
    public const UPDATED_AT = null;

    protected $fillable = [
        'subject_type',
        'subject_id',
        'user_id',
        'action',
        'properties',
    ];

    protected $casts = [
        // Automatically convert the JSON string in the DB to a PHP array
        'properties' => 'array',
    ];

    // ── RELATIONSHIPS ──────────────────────────────────────────────────

    // "MorphTo" is a polymorphic relationship
    // This can point to a Task, Project, Comment — any model
    // Laravel figures out which one using subject_type and subject_id
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    // Who performed the action?
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── CONVENIENCE METHOD ─────────────────────────────────────────────
    // Instead of writing ActivityLog::create([...]) everywhere with all params,
    // we use this cleaner helper:
    //
    // Usage: ActivityLog::record($task, $user, 'status_changed', ['from'=>'todo','to'=>'done'])

    public static function record(
        Model $subject,    // The thing being logged (a Task, Project, etc.)
        User $actor,       // Who did the action
        string $action,    // What they did ("created", "updated", "deleted", etc.)
        array $properties = [] // Any extra info to store (optional)
    ): self {
        return static::create([
            'subject_type' => get_class($subject), // e.g. "App\Models\Task"
            'subject_id'   => $subject->getKey(),  // the ID of that task
            'user_id'      => $actor->id,
            'action'       => $action,
            'properties'   => $properties ?: null, // store null if empty array
        ]);
    }
}
