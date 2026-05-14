<?php

namespace App\Models;

// These are "traits" — reusable chunks of functionality we add to the class
use Illuminate\Database\Eloquent\Factories\HasFactory; // lets us create fake users for testing
use Illuminate\Database\Eloquent\Relations\HasMany;    // for defining "has many" relationships
use Illuminate\Database\Eloquent\SoftDeletes;           // gives us soft-delete functionality
use Illuminate\Foundation\Auth\User as Authenticatable; // base class for users (handles login)
use Illuminate\Notifications\Notifiable;                // lets us send notifications to users
use Laravel\Sanctum\HasApiTokens;                       // lets us create API tokens for login

class User extends Authenticatable
{
    // We "use" all the traits we imported above
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    // $fillable = list of columns we're ALLOWED to set via code
    // This protects against "mass assignment" attacks
    // (where a hacker sends extra fields to change things they shouldn't)
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar_url',
        'is_active',
    ];

    // $hidden = columns that are NEVER included in API responses
    // We never want to send the password back to the browser!
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // $casts = automatically convert column values to the right PHP type
    protected $casts = [
        'is_active'         => 'boolean',  // "1"/"0" in DB becomes true/false in PHP
        'email_verified_at' => 'datetime', // string in DB becomes a DateTime object
        'password'          => 'hashed',   // automatically hashes password when you set it
    ];

    // ── RELATIONSHIPS ──────────────────────────────────────────────────
    // These methods tell Laravel how models connect to each other

    // A user can OWN many projects (as the project owner)
    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'owner_id');
        //                    ^ which model   ^ which column links to this user
    }

    // A user can be ASSIGNED to many tasks
    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    // A user can write many comments
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
        // Laravel automatically looks for user_id in the comments table
    }

    // A user can have many activity log entries
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    // ── ROLE HELPER METHODS ────────────────────────────────────────────
    // Instead of writing $user->role === 'admin' everywhere,
    // we write $user->isAdmin() — much more readable

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    public function isDeveloper(): bool
    {
        return $this->role === 'developer';
    }

    // Shortcut: is the user either admin OR manager?
    public function isAdminOrManager(): bool
    {
        return in_array($this->role, ['admin', 'manager']);
    }
}
