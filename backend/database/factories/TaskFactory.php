<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id'      => Project::factory(),
            'title'           => fake()->sentence(4),
            'description'     => fake()->paragraph(),
            'status'          => 'todo',
            'priority'        => fake()->randomElement(['low', 'medium', 'high', 'critical']),
            'assigned_to'     => null,
            'due_date'        => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'estimated_hours' => fake()->randomFloat(1, 1, 40),
            'actual_hours'    => null,
            'sort_order'      => 0,
        ];
    }
}
