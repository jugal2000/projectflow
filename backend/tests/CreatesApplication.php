<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;

trait CreatesApplication
{
  /**
   * Creates the application.
   * This bootstraps Laravel for testing.
   */
  public function createApplication(): Application
  {
    $app = require __DIR__ . '/../bootstrap/app.php';

    $app->make(Kernel::class)->bootstrap();

    return $app;
  }
}
