<?php

namespace App\Repositories\AuthorizationModule;

use App\Models\User;
use App\Repositories\Contracts\AuthorizationModule\UserRepositoryInterface;
use App\Repositories\BaseRepository;
use Override;

class UserRepository extends BaseRepository implements UserRepositoryInterface{

    public function __construct(User $model){
        parent::__construct($model);
    }

    #[Override]
    public function findByEmail(string $email): ?User
    {
        return $this->model->newQuery()->where("email",$email)->first();
    }

}
