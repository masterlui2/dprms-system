<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\QuarterlyMetrics;
use Illuminate\Database\Eloquent\Collection;

interface QuarterlyMetricsServiceInterface{
    public function submit(int $projectId, array $data): QuarterlyMetrics;
    public function getByProject(int $projectId, ?int $quarter = null, ?int $year = null): Collection;
}
