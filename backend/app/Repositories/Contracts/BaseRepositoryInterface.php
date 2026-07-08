<?php

namespace App\Repositories\Contracts;

interface BaseRepositoryInterface{
    public function all(): \Illuminate\Database\Eloquent\Collection;
    public function findById(int $id): ?\Illuminate\Database\Eloquent\Model;
    public function create(array $data): \Illuminate\Database\Eloquent\Model;
    public function update(int $id, array $data): bool;
    public function delete(int $id): bool;
}
