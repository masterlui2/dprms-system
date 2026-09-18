<?php

namespace App\Repositories\Contracts\ProjectModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AccomplishmentRepositoryInterface extends BaseRepositoryInterface{
    public function findBySummary(int $summaryId): Collection;
    public function createMany(array $rows): Collection;
    public function updateMany(int $summaryId,array $rows): Collection;
    public function deleteMany(int $summaryId,array $rows): int;
}
