<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str; // Str is a helper for string operations

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'status',
        'owner_id',
        'start_date',
        'end_date',
        'budget',
    ];

    // Automatically convert these columns to the right PHP types
    protected $casts = [
        'start_date' => 'date',       // becomes a Carbon date object
        'end_date'   => 'date',
        'budget'     => 'decimal:2',  // keeps 2 decimal places
    ];

    // ── RELATIONSHIPS ──────────────────────────────────────────────────

    // A project BELONGS TO one user (the owner)
    // BelongsTo = the foreign key is in THIS table (owner_id)
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
        //                      ^ which model  ^ the column in projects table
    }

    // A project HAS MANY tasks
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
        // Laravel automatically knows to use project_id in the tasks table
    }

    // ── SLUG GENERATION ────────────────────────────────────────────────
    // A slug is a URL-safe version of the project name
    // "My Cool Project" → "my-cool-project"
    // If that already exists → "my-cool-project-1"
    // If that exists too    → "my-cool-project-2"  etc.

    public static function generateUniqueSlug(string $name, ?int $excludeId = null): string
    {
        // Str::slug converts "My Cool Project" to "my-cool-project"
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        // Keep trying until we find a slug that doesn't exist
        while (
            static::where('slug', $slug)
            // If we're UPDATING a project, exclude its own ID from the check
            // (so renaming "My Project" to "My Project" doesn't cause a collision with itself)
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->withTrashed() // also check soft-deleted projects (don't reuse their slugs)
            ->exists()
        ) {
            $slug = "{$base}-{$counter}"; // try "my-cool-project-1", then "my-cool-project-2", etc.
            $counter++;
        }

        return $slug;
    }

    // ── QUERY SCOPES ───────────────────────────────────────────────────
    // Scopes are reusable query filters you can chain
    // Usage: Project::forStatus('active')->get()

    // Filter by status (if a status is given)
    public function scopeForStatus($query, ?string $status)
    {
        // Only add the WHERE clause if $status is not null/empty
        return $status ? $query->where('status', $status) : $query;
    }

    // Filter by owner
    public function scopeForOwner($query, ?int $ownerId)
    {
        return $ownerId ? $query->where('owner_id', $ownerId) : $query;
    }

    // ── ROUTE MODEL BINDING ────────────────────────────────────────────
    // Normally Laravel finds models by ID in the URL: /projects/1
    // We want to use slug instead: /projects/my-cool-project
    // This one method makes that happen automatically
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
