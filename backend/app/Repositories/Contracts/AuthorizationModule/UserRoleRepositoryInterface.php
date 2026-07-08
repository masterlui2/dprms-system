<?php

namespace App\Repositories\Contracts\AuthorizationModule;

use App\Models\UserRole;
use App\Repositories\Contracts\BaseRepositoryInterface;

interface UserRoleRepositoryInterface extends BaseRepositoryInterface{
    public function assignRole(int $userId, int $roleId, ?int $assignedBy = null): UserRole;
    public function revoke(int $userId, int $roleId): bool;
    public function userHasRole(int $userId, string $roleCode): bool;
}
