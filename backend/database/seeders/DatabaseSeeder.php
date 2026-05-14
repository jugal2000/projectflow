<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── CREATE 3 USERS PER ROLE (9 users total) ──────────────────

        // Admin users — can do everything
        $admin = User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@projectflow.dev',
            'password' => Hash::make('password'), // Hash::make = bcrypt hashing
            'role'     => 'admin',
        ]);

        User::create([
            'name' => 'Super Admin',
            'email' => 'admin2@projectflow.dev',
            'password' => Hash::make('password'),
            'role' => 'admin'
        ]);
        User::create([
            'name' => 'System Admin',
            'email' => 'admin3@projectflow.dev',
            'password' => Hash::make('password'),
            'role' => 'admin'
        ]);

        // Manager users — can create projects, manage tasks
        $manager = User::create([
            'name'     => 'Sarah Manager',
            'email'    => 'manager@projectflow.dev',
            'password' => Hash::make('password'),
            'role'     => 'manager',
        ]);

        User::create([
            'name' => 'Tom Director',
            'email' => 'manager2@projectflow.dev',
            'password' => Hash::make('password'),
            'role' => 'manager'
        ]);
        User::create([
            'name' => 'Lisa Lead',
            'email' => 'manager3@projectflow.dev',
            'password' => Hash::make('password'),
            'role' => 'manager'
        ]);

        // Developer users — work on tasks, add comments
        $dev = User::create([
            'name'     => 'Dev User',
            'email'    => 'dev@projectflow.dev',
            'password' => Hash::make('password'),
            'role'     => 'developer',
        ]);

        $dev2 = User::create([
            'name' => 'Jane Coder',
            'email' => 'dev2@projectflow.dev',
            'password' => Hash::make('password'),
            'role' => 'developer'
        ]);
        $dev3 = User::create([
            'name' => 'Bob Builder',
            'email' => 'dev3@projectflow.dev',
            'password' => Hash::make('password'),
            'role' => 'developer'
        ]);

        // ── CREATE 5 PROJECTS ─────────────────────────────────────────

        $project1 = Project::create([
            'name'        => 'E-Commerce Platform',
            'slug'        => 'e-commerce-platform',
            'description' => 'Build a full e-commerce website with cart and payments.',
            'status'      => 'active',
            'owner_id'    => $admin->id,
            'start_date'  => '2025-01-01',
            'end_date'    => '2025-12-31',
            'budget'      => 50000.00,
        ]);

        $project2 = Project::create([
            'name'        => 'Mobile App Redesign',
            'slug'        => 'mobile-app-redesign',
            'description' => 'Redesign the mobile app with modern UI/UX.',
            'status'      => 'planning',
            'owner_id'    => $manager->id,
            'start_date'  => '2025-03-01',
            'end_date'    => '2025-08-31',
            'budget'      => 25000.00,
        ]);

        $project3 = Project::create([
            'name'        => 'API Gateway Migration',
            'slug'        => 'api-gateway-migration',
            'description' => 'Migrate all services to go through a central API gateway.',
            'status'      => 'active',
            'owner_id'    => $manager->id,
            'start_date'  => '2025-02-01',
            'end_date'    => null,
            'budget'      => null,
        ]);

        $project4 = Project::create([
            'name'        => 'Data Analytics Dashboard',
            'slug'        => 'data-analytics-dashboard',
            'description' => 'Build real-time analytics dashboard for business metrics.',
            'status'      => 'on_hold',
            'owner_id'    => $admin->id,
            'start_date'  => '2025-04-01',
            'end_date'    => '2025-10-01',
            'budget'      => 15000.00,
        ]);

        $project5 = Project::create([
            'name'        => 'Customer Portal',
            'slug'        => 'customer-portal',
            'description' => 'Self-service portal for customers to manage their accounts.',
            'status'      => 'completed',
            'owner_id'    => $manager->id,
            'start_date'  => '2024-06-01',
            'end_date'    => '2024-12-31',
            'budget'      => 35000.00,
        ]);

        // ── CREATE 20+ TASKS ACROSS ALL PROJECTS ─────────────────────

        // Helper: create a task quickly
        // We'll create tasks for project1 first (most tasks here for demo)
        $tasks = [
            // Project 1 — E-Commerce Platform
            [
                'project_id' => $project1->id,
                'title' => 'Set up CI/CD pipeline',
                'status' => 'done',
                'priority' => 'high',
                'assigned_to' => $dev->id,
                'estimated_hours' => 8,
                'actual_hours' => 10,
                'sort_order' => 0
            ],

            [
                'project_id' => $project1->id,
                'title' => 'Design database schema',
                'status' => 'done',
                'priority' => 'critical',
                'assigned_to' => $dev2->id,
                'estimated_hours' => 12,
                'actual_hours' => 14,
                'sort_order' => 1
            ],

            [
                'project_id' => $project1->id,
                'title' => 'Implement user authentication',
                'status' => 'in_review',
                'priority' => 'critical',
                'assigned_to' => $dev->id,
                'estimated_hours' => 16,
                'actual_hours' => null,
                'sort_order' => 0,
                'due_date' => '2025-02-01'
            ],

            [
                'project_id' => $project1->id,
                'title' => 'Build product listing page',
                'status' => 'in_progress',
                'priority' => 'high',
                'assigned_to' => $dev3->id,
                'estimated_hours' => 20,
                'actual_hours' => null,
                'sort_order' => 0,
                'due_date' => '2025-03-15'
            ],

            [
                'project_id' => $project1->id,
                'title' => 'Shopping cart functionality',
                'status' => 'todo',
                'priority' => 'high',
                'assigned_to' => $dev2->id,
                'estimated_hours' => 24,
                'actual_hours' => null,
                'sort_order' => 0,
                'due_date' => '2025-04-01'
            ],

            [
                'project_id' => $project1->id,
                'title' => 'Payment gateway integration',
                'status' => 'todo',
                'priority' => 'critical',
                'assigned_to' => null,
                'estimated_hours' => 32,
                'actual_hours' => null,
                'sort_order' => 1
            ],

            // Project 2 — Mobile App Redesign
            [
                'project_id' => $project2->id,
                'title' => 'Create UI wireframes',
                'status' => 'in_progress',
                'priority' => 'medium',
                'assigned_to' => $dev->id,
                'estimated_hours' => 16,
                'actual_hours' => null,
                'sort_order' => 0
            ],

            [
                'project_id' => $project2->id,
                'title' => 'User research interviews',
                'status' => 'done',
                'priority' => 'high',
                'assigned_to' => $manager->id,
                'estimated_hours' => 8,
                'actual_hours' => 9,
                'sort_order' => 0
            ],

            [
                'project_id' => $project2->id,
                'title' => 'Design system setup',
                'status' => 'todo',
                'priority' => 'medium',
                'assigned_to' => $dev3->id,
                'estimated_hours' => 12,
                'actual_hours' => null,
                'sort_order' => 0,
                'due_date' => '2025-01-15'
            ],

            // Project 3 — API Gateway
            [
                'project_id' => $project3->id,
                'title' => 'Evaluate API gateway options',
                'status' => 'done',
                'priority' => 'high',
                'assigned_to' => $dev2->id,
                'estimated_hours' => 8,
                'actual_hours' => 6,
                'sort_order' => 0
            ],

            [
                'project_id' => $project3->id,
                'title' => 'Set up Kong gateway',
                'status' => 'in_progress',
                'priority' => 'critical',
                'assigned_to' => $dev->id,
                'estimated_hours' => 20,
                'actual_hours' => null,
                'sort_order' => 0
            ],

            [
                'project_id' => $project3->id,
                'title' => 'Migrate auth service',
                'status' => 'todo',
                'priority' => 'high',
                'assigned_to' => $dev3->id,
                'estimated_hours' => 16,
                'actual_hours' => null,
                'sort_order' => 0,
                'due_date' => '2025-02-28'
            ],

            [
                'project_id' => $project3->id,
                'title' => 'Load testing',
                'status' => 'todo',
                'priority' => 'medium',
                'assigned_to' => null,
                'estimated_hours' => 8,
                'actual_hours' => null,
                'sort_order' => 1
            ],

            // Project 4 — Analytics Dashboard
            [
                'project_id' => $project4->id,
                'title' => 'Define KPI requirements',
                'status' => 'done',
                'priority' => 'high',
                'assigned_to' => $manager->id,
                'estimated_hours' => 6,
                'actual_hours' => 5,
                'sort_order' => 0
            ],

            [
                'project_id' => $project4->id,
                'title' => 'Set up data pipeline',
                'status' => 'todo',
                'priority' => 'critical',
                'assigned_to' => $dev2->id,
                'estimated_hours' => 24,
                'actual_hours' => null,
                'sort_order' => 0
            ],

            // Project 5 — Customer Portal (completed project)
            [
                'project_id' => $project5->id,
                'title' => 'Requirements gathering',
                'status' => 'done',
                'priority' => 'high',
                'assigned_to' => $manager->id,
                'estimated_hours' => 8,
                'actual_hours' => 8,
                'sort_order' => 0
            ],

            [
                'project_id' => $project5->id,
                'title' => 'Backend API development',
                'status' => 'done',
                'priority' => 'high',
                'assigned_to' => $dev->id,
                'estimated_hours' => 40,
                'actual_hours' => 45,
                'sort_order' => 0
            ],

            [
                'project_id' => $project5->id,
                'title' => 'Frontend development',
                'status' => 'done',
                'priority' => 'high',
                'assigned_to' => $dev3->id,
                'estimated_hours' => 40,
                'actual_hours' => 38,
                'sort_order' => 1
            ],

            [
                'project_id' => $project5->id,
                'title' => 'User acceptance testing',
                'status' => 'done',
                'priority' => 'medium',
                'assigned_to' => $dev2->id,
                'estimated_hours' => 16,
                'actual_hours' => 12,
                'sort_order' => 2
            ],

            [
                'project_id' => $project5->id,
                'title' => 'Production deployment',
                'status' => 'done',
                'priority' => 'critical',
                'assigned_to' => $dev->id,
                'estimated_hours' => 4,
                'actual_hours' => 3,
                'sort_order' => 3
            ],
        ];

        // Create all tasks from the array above
        $createdTasks = [];
        foreach ($tasks as $taskData) {
            $createdTasks[] = Task::create($taskData);
        }

        // ── CREATE SAMPLE COMMENTS ────────────────────────────────────

        // Add a root comment to the first task
        $rootComment = Comment::create([
            'task_id' => $createdTasks[0]->id,
            'user_id' => $dev->id,
            'body'    => 'I have set up the pipeline using GitHub Actions. It runs tests on every push.',
        ]);

        // Add a reply to that comment
        Comment::create([
            'task_id'   => $createdTasks[0]->id,
            'user_id'   => $manager->id,
            'body'      => 'Great work! Can you add a deployment step to staging as well?',
            'parent_id' => $rootComment->id, // This makes it a reply
        ]);

        // Add another reply
        Comment::create([
            'task_id'   => $createdTasks[0]->id,
            'user_id'   => $dev->id,
            'body'      => 'Sure, I will add that in the next commit.',
            'parent_id' => $rootComment->id,
        ]);

        // Add a comment on a different task
        Comment::create([
            'task_id' => $createdTasks[2]->id,
            'user_id' => $admin->id,
            'body'    => 'Authentication needs to support OAuth2 as well. Please check with the team.',
        ]);
    }
}
