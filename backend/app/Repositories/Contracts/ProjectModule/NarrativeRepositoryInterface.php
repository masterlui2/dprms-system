<?php

namespace App\Repositories\Contracts\ProjectModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface NarrativeRepositoryInterface extends BaseRepositoryInterface{
    public function findByQuarterMetrics(int $quarterId): Collection;
    public function createMany(array $rows): Collection;
    public function updateMany(int $quarterId,array $rows): Collection;
    public function deleteMany(int $quarterId,array $rows): int;
}
