<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Set up the test environment.
     * We override this to prevent the "table already exists" error
     * that happens when RefreshDatabase runs migrations multiple times.
     */
    protected function setUp(): void
    {
        parent::setUp();
    }

    /**
     * Helper: log in a user and return their token.
     * Usage: $token = $this->loginAs($user)
     */
    protected function loginAs($user): string
    {
        return $user->createToken('test-token')->plainTextToken;
    }
}
