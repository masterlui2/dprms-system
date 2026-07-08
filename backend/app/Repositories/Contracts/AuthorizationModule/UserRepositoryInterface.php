<?php

namespace App\Repositories\Contracts\AuthorizationModule;

use App\Models\User;
use App\Repositories\Contracts\BaseRepositoryInterface;

interface UserRepositoryInterface extends BaseRepositoryInterface{
    public function findByEmail(string $email): ?User;
}
