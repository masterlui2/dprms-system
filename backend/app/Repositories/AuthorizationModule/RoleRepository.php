<?php

namespace App\Repositories\AuthorizationModule;

use App\Models\Role;
use App\Repositories\Contracts\AuthorizationModule\RoleRepositoryInterface;
use App\Repositories\BaseRepository;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
    /**
     * Create a new class instance.
     */
    public function __construct(Role $model)
    {
        parent::__construct($model);
    }
}
