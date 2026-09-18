<?php

namespace App\Services\Contracts\ProjectModule;

use App\Models\ExecutiveSummary;
use Illuminate\Database\Eloquent\Collection;

interface ExecutiveSummaryServiceInterface{
    public function submit(int $projectId, array $data): ExecutiveSummary;
    public function getByProject(int $projectId, ?int $semester = null, ?int $year = null): Collection;
}
