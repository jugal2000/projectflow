<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// This class represents ONE migration — one change to the database
return new class extends Migration
{
    // The "up" method runs when we apply the migration (create the table)
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();                    // Auto-incrementing ID: 1, 2, 3...
            $table->string('name');          // A text column for the user's name
            $table->string('email')->unique(); // Email must be unique (no duplicates)
            $table->string('password');      // Hashed password (never stored as plain text)

            // Enum = a column that only allows specific values
            $table->enum('role', ['admin', 'manager', 'developer'])->default('developer');

            $table->string('avatar_url')->nullable(); // nullable = can be empty/null
            $table->boolean('is_active')->default(true); // true = account is active

            $table->rememberToken();   // For "remember me" functionality
            $table->timestamps();      // Adds created_at and updated_at columns automatically
            $table->softDeletes();     // Adds deleted_at — "deleted" rows are hidden, not removed

            // Indexes speed up database searches
            // We often search by email + is_active together, so index both
            $table->index(['email', 'is_active']);
            $table->index('role'); // We often filter users by role
        });
    }

    // The "down" method runs if we want to UNDO this migration
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
