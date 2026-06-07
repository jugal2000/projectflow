<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── ACTIVITY LOGS ──────────────────────────────────────────────
        // The activity log is filtered by action and by user, and always
        // ordered by created_at (newest first) with pagination. These
        // composite indexes cover "filter + newest-first" without a scan.
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index(['action', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['subject_type', 'subject_id']); // polymorphic subject lookups
        });

        // ── TASK_USER PIVOT ────────────────────────────────────────────
        // "My tasks" filters by user_id across the pivot (whereHas assignees).
        // The unique [task_id, user_id] index already covers task_id lookups,
        // but a user_id index speeds up the per-user direction.
        Schema::table('task_user', function (Blueprint $table) {
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['action', 'created_at']);
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex(['subject_type', 'subject_id']);
        });

        Schema::table('task_user', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });
    }
};
