<?php

namespace App\Repositories\Contracts\ProjectModule;

use App\Repositories\Contracts\BaseRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface ExecutiveSummaryRepositoryInterface extends BaseRepositoryInterface{
    public function findByProject(int $projectId, ?int $semester = null, ?int $year = null):Collection;
}
