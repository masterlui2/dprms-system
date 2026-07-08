<?php

namespace App\Repositories\AuthorizationModule;

use App\Models\UserRole;
use App\Repositories\Contracts\AuthorizationModule\UserRoleRepositoryInterface;
use Override;
use App\Repositories\BaseRepository;

class UserRoleRepository extends BaseRepository implements UserRoleRepositoryInterface
{
    /**
     * Create a new class instance.
     */
    public function __construct(UserRole $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function assignRole(int $userId, int $roleId, ?int $assignedBy = null): UserRole
    {
        return $this->model->firstorCreate(
            ['user_id' => $userId, 'role_id' => $roleId],
            ['assigned_by' => $assignedBy, 'assigned_at' => now()]
        );
    }

    #[Override]
    public function revoke(int $userId, int $roleId): bool
    {
        $userRole = $this->model
        ->where('user_id',$userId)
        ->where('role_id',$roleId)
        ->first();

        if(! $userRole){
            return false;
        }

        return $userRole->delete();
    }

    #[Override]
    public function userHasRole(int $userId, string $roleCode): bool
    {
        return $this->model
        ->newQuery()->where('user_id',$userId)
        ->whereHas('role', function ($query) use ($roleCode){
            $query->where('code',$roleCode);
        })
        ->exists();
    }
}
