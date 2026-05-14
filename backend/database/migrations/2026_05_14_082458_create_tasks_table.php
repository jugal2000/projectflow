<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();

            // Every task belongs to a project
            // cascadeOnDelete = if the project is deleted, delete all its tasks too
            $table->foreignId('project_id')
                ->constrained('projects')
                ->cascadeOnDelete();

            $table->string('title');             // Short task name
            $table->text('description')->nullable(); // Longer details, optional

            // The 4 stages a task moves through
            $table->enum('status', [
                'todo',
                'in_progress',
                'in_review',
                'done'
            ])->default('todo');

            // How urgent the task is
            $table->enum('priority', [
                'low',
                'medium',
                'high',
                'critical'
            ])->default('medium');

            // Who is working on this task?
            // nullable = task might not be assigned to anyone yet
            // nullOnDelete = if the user is deleted, set this to null (don't delete the task)
            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->date('due_date')->nullable();  // When should this be done?

            // decimal(5, 1) = up to 5 digits, 1 decimal place. e.g. 12.5 hours
            $table->decimal('estimated_hours', 5, 1)->nullable();
            $table->decimal('actual_hours', 5, 1)->nullable();

            // Used for ordering tasks within a column (drag and drop order)
            $table->integer('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            // These indexes make filtering fast:
            $table->index(['project_id', 'status']);      // "show me all todo tasks in project X"
            $table->index(['project_id', 'priority']);    // "show me all critical tasks in project X"
            $table->index(['assigned_to', 'status']);     // "show me all in-progress tasks for user Y"
            $table->index(['project_id', 'sort_order']);  // "show me tasks in order"
            $table->index(['status', 'due_date']);        // "show me overdue tasks"
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
