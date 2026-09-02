<?php

namespace App\Repositories\Contracts\ProjectModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Support\Collection;

interface ProductRepositoryInterface extends BaseRepositoryInterface{
    public function findByQuarterMetrics(int $quarterId): Collection;
}
