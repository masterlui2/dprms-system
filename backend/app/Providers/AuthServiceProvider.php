<?php

namespace App\Providers;

use App\Services\AuthorizationModule\AuthService;
use App\Services\Contracts\AuthorizationModule\AuthServiceInterface;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(AuthServiceInterface::class,AuthService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
