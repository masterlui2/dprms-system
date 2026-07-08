<?php

namespace App\Providers;

use App\Repositories\AuthorizationModule\RoleRepository;
use App\Repositories\AuthorizationModule\UserRepository;
use App\Repositories\AuthorizationModule\UserRoleRepository;
use App\Repositories\AuthorizationModule\AuditLogRepository;
use App\Repositories\Contracts\AuthorizationModule\UserRepositoryInterface;
use App\Repositories\Contracts\AuthorizationModule\RoleRepositoryInterface;
use App\Repositories\Contracts\AuthorizationModule\UserRoleRepositoryInterface;
use App\Repositories\Contracts\AuthorizationModule\AuditLogRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(RoleRepositoryInterface::class, RoleRepository::class);
        $this->app->bind(UserRoleRepositoryInterface::class, UserRoleRepository::class);
        $this->app->bind(AuditLogRepositoryInterface::class, AuditLogRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
