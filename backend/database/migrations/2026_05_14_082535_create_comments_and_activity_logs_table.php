<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── COMMENTS TABLE ─────────────────────────────────────────────
        Schema::create('comments', function (Blueprint $table) {
            $table->id();

            // Which task does this comment belong to?
            $table->foreignId('task_id')
                ->constrained('tasks')
                ->cascadeOnDelete(); // Delete comments when task is deleted

            // Who wrote this comment?
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->text('body'); // The actual comment text

            // THIS is the clever part for threaded comments:
            // A comment can have a parent_id pointing to ANOTHER comment
            // That makes it a "reply". If parent_id is null, it's a root comment.
            // Example:
            //   Comment 1 (parent_id = null)  ← root comment
            //   Comment 2 (parent_id = 1)     ← reply to comment 1
            //   Comment 3 (parent_id = 1)     ← another reply to comment 1
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('comments')  // points to the SAME table (self-referencing)
                ->cascadeOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['task_id', 'parent_id']); // Fast lookup: "root comments for task X"
        });

        // ── ACTIVITY LOGS TABLE ────────────────────────────────────────
        // This records EVERYTHING that happens: task created, status changed, etc.
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // "Polymorphic" means this can log activity for ANY model
            // subject_type = which type of thing changed (e.g. "App\Models\Task")
            // subject_id   = which specific one (e.g. task with id=5)
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id');

            // Who did the action?
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('action'); // e.g. "created", "updated", "status_changed"

            // JSON column = store any extra data as key-value pairs
            // e.g. {"from": "todo", "to": "in_progress"}
            $table->json('properties')->nullable();

            $table->timestamps(); // We only need created_at, not updated_at (logs don't change)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('comments');
    }
};
