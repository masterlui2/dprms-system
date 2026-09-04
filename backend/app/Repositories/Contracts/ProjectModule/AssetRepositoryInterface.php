<?php

namespace App\Repositories\Contracts\ProjectModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AssetRepositoryInterface extends BaseRepositoryInterface{
    public function findByQuarterMetrics(int $quarterId): Collection;
}
