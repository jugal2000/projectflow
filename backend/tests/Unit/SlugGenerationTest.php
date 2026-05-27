<?php

namespace Tests\Unit;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class SlugGenerationTest extends TestCase
{
  use RefreshDatabase;

  protected bool $dropViews = true;

  public function test_slug_is_generated_from_name(): void
  {
    $slug = Project::generateUniqueSlug('My Awesome Project');
    $this->assertEquals('my-awesome-project', $slug);
  }

  public function test_slug_converts_spaces_and_uppercase(): void
  {
    $slug = Project::generateUniqueSlug('Hello World TEST');
    $this->assertEquals('hello-world-test', $slug);
  }

  public function test_slug_appends_counter_on_first_collision(): void
  {
    $owner = User::factory()->create();
    Project::factory()->create([
      'slug'     => 'my-project',
      'owner_id' => $owner->id,
    ]);

    $slug = Project::generateUniqueSlug('My Project');
    $this->assertEquals('my-project-1', $slug);
  }

  public function test_slug_increments_counter_on_multiple_collisions(): void
  {
    $owner = User::factory()->create();
    Project::factory()->create(['slug' => 'api-project',   'owner_id' => $owner->id]);
    Project::factory()->create(['slug' => 'api-project-1', 'owner_id' => $owner->id]);
    Project::factory()->create(['slug' => 'api-project-2', 'owner_id' => $owner->id]);

    $slug = Project::generateUniqueSlug('API Project');
    $this->assertEquals('api-project-3', $slug);
  }

  public function test_slug_excludes_own_project_on_update(): void
  {
    $owner   = User::factory()->create();
    $project = Project::factory()->create([
      'slug'     => 'my-existing-slug',
      'owner_id' => $owner->id,
    ]);

    $slug = Project::generateUniqueSlug('My Existing Slug', $project->id);
    $this->assertEquals('my-existing-slug', $slug);
  }
}
