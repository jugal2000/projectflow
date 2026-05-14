<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();

            $table->string('name');         // Project name, e.g. "E-Commerce Platform"

            // Slug is a URL-friendly version of the name
            // e.g. "E-Commerce Platform" becomes "e-commerce-platform"
            // unique() means no two projects can have the same slug
            $table->string('slug')->unique();

            $table->text('description');    // text = longer text than string (up to 65,000 chars)

            // Only these 5 values are allowed in the status column
            $table->enum('status', [
                'planning',
                'active',
                'on_hold',
                'completed',
                'archived'
            ])->default('planning');

            // owner_id links to the users table
            // constrained() tells Laravel: this is a foreign key to the users table
            // cascadeOnDelete() means: if the user is deleted, delete their projects too
            $table->foreignId('owner_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->date('start_date');         // Just the date, no time
            $table->date('end_date')->nullable(); // Project might not have an end date yet

            // decimal(10, 2) means: up to 10 digits total, 2 after the decimal
            // e.g. 99999999.99 — good for money
            $table->decimal('budget', 10, 2)->nullable();

            $table->timestamps();   // created_at, updated_at
            $table->softDeletes();  // deleted_at (safe deletion)

            // Composite indexes — we often filter projects by status AND owner together
            $table->index(['status', 'owner_id']);
            $table->index(['status', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
