<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProjectFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true); // e.g. "blue ocean platform"

        return [
            'name'        => ucwords($name),
            'slug'        => Str::slug($name),
            'description' => fake()->paragraph(),
            'status'      => 'active',
            'owner_id'    => User::factory(), // automatically creates a user if none given
            'start_date'  => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'end_date'    => fake()->dateTimeBetween('now', '+6 months')->format('Y-m-d'),
            'budget'      => fake()->randomFloat(2, 1000, 100000),
        ];
    }
}
