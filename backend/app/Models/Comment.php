<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'task_id',
        'user_id',
        'body',
        'parent_id',
    ];

    // ── RELATIONSHIPS ──────────────────────────────────────────────────

    // A comment belongs to a task
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    // A comment was written by a user (we call them "author" for clarity)
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // A comment can have a parent comment (if it's a reply)
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    // A comment can have many replies (other comments where parent_id = this comment's id)
    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    // ── 15-MINUTE EDIT WINDOW ──────────────────────────────────────────
    // Can this user edit this comment?
    // Rules:
    //   - Admin can always edit any comment
    //   - Regular users can only edit their OWN comment, within 15 minutes

    public function isEditableBy(User $user): bool
    {
        // Admins can edit anything, anytime
        if ($user->isAdmin()) {
            return true;
        }

        // Must be the author
        // AND must be within 15 minutes of when the comment was created
        return $this->user_id === $user->id
            && $this->created_at->diffInMinutes(now()) <= 15;
        //         ^ created_at is a Carbon date object (because of $casts in the parent)
        //                        ^ diffInMinutes() = how many minutes ago was this created?
    }
}
