<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    // 1. Create the pivot table linking tasks to their (multiple) assignees.
    Schema::create('task_user', function (Blueprint $table) {
      $table->id();
      $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
      $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
      $table->timestamps();

      // A user can't be assigned to the same task twice.
      $table->unique(['task_id', 'user_id']);
    });

    // 2. Migrate existing single-assignee data into the pivot,
    //    so no current assignments are lost.
    $assignedTasks = DB::table('tasks')
      ->whereNotNull('assigned_to')
      ->get(['id', 'assigned_to']);

    foreach ($assignedTasks as $task) {
      DB::table('task_user')->insert([
        'task_id'    => $task->id,
        'user_id'    => $task->assigned_to,
        'created_at' => now(),
        'updated_at' => now(),
      ]);
    }

    // 3. Drop the old single-assignee column. Order matters in MySQL:
    //    foreign key first (it depends on the index), then the index,
    //    then the column itself.
    Schema::table('tasks', function (Blueprint $table) {
      $table->dropForeign(['assigned_to']);
      $table->dropIndex(['assigned_to', 'status']);
      $table->dropColumn('assigned_to');
    });
  }

  public function down(): void
  {
    Schema::table('tasks', function (Blueprint $table) {
      $table->foreignId('assigned_to')
        ->nullable()
        ->after('priority')
        ->constrained('users')
        ->nullOnDelete();
      $table->index(['assigned_to', 'status']);
    });

    $pivots = DB::table('task_user')->get(['task_id', 'user_id']);
    $seen = [];
    foreach ($pivots as $pivot) {
      if (isset($seen[$pivot->task_id])) {
        continue;
      }
      $seen[$pivot->task_id] = true;
      DB::table('tasks')
        ->where('id', $pivot->task_id)
        ->update(['assigned_to' => $pivot->user_id]);
    }

    Schema::dropIfExists('task_user');
  }
};
