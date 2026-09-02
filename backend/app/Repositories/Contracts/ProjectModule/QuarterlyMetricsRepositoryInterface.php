<?php

namespace App\Repositories\Contracts\ProjectModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface QuarterlyMetricsRepositoryInterface extends BaseRepositoryInterface{
    public function findByProject(int $projectId, ?int $quarter = null, ?int $year = null):Collection;
}
