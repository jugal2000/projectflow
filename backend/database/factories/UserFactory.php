<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            // fake() generates realistic random data
            'name'      => fake()->name(),
            'email'     => fake()->unique()->safeEmail(), // unique = no duplicates
            'password'  => Hash::make('password'),        // all test users use 'password'
            'role'      => 'developer',                   // default role
            'is_active' => true,
        ];
    }

    // State methods = shortcuts to create specific types of users
    // Usage: User::factory()->admin()->create()

    public function admin(): static
    {
        return $this->state(['role' => 'admin']);
    }

    public function manager(): static
    {
        return $this->state(['role' => 'manager']);
    }

    public function developer(): static
    {
        return $this->state(['role' => 'developer']);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
