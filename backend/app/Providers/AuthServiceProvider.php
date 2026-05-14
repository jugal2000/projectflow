<?php

namespace App\Providers;

use App\Models\Project;
use App\Models\Task;
use App\Policies\ProjectPolicy;
use App\Policies\TaskPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    // This array maps Models to their Policy classes
    // "For the Project model, use ProjectPolicy"
    protected $policies = [
        Project::class => ProjectPolicy::class,
        Task::class    => TaskPolicy::class,
    ];

    public function boot(): void
    {
        // This registers all the policies listed above
        $this->registerPolicies();
    }
}
