<?php

namespace App\Repositories;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class BaseRepository implements BaseRepositoryInterface{

    public function __construct(protected Model $model){}

    #[Override]
    public function all(): Collection
    {
        return $this->model->newQuery()->get();
    }

    #[Override]
    public function findById(int $id): ?Model
    {
        return $this->model->newQuery()->find($id);
    }

    #[Override]
    public function create(array $data): Model
    {
        return $this->model->newQuery()->create($data);
    }

    #[Override]
    public function update(int $id, array $data): bool
    {
        $model = $this->findById($id);
        if(! $model){
            return false;
        }

        return $model->update($data);
    }

    #[Override]
    public function delete(int $id): bool
    {
        $model = $this->findById($id);
        if(! $model){
            return false;
        }

        return $model->delete();
    }

}
