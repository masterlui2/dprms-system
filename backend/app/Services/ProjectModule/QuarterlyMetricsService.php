<?php

namespace App\Services\ProjectModule;

use App\Models\QuarterlyMetrics;
use App\Repositories\Contracts\ProjectModule\QuarterlyMetricsRepositoryInterface;
use App\Services\Contracts\ProjectModule\QuarterlyMetricsServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Override;

class QuarterlyMetricsService implements QuarterlyMetricsServiceInterface{
    public function __construct(protected QuarterlyMetricsRepositoryInterface $quarterlyMetricsRepository)
    {

    }

    #[Override]
    public function submit(int $projectId, array $data): QuarterlyMetrics
    {
        $exist = $this->quarterlyMetricsRepository->findByProject($projectId, $data['quarter'], $data['year']);
        if ($exist->isNotEmpty()) {
            abort(409, 'Quarterly metrics already exist for this project/quarter/year.');
        }

        return $this->quarterlyMetricsRepository->create([
            'project_id' => $projectId,
            'quarter' => $data['quarter'],
            'year' => $data['year'],
            'submitted_by' => Auth::id()
        ]);
    }

    #[Override]
    public function getByProject(int $projectId, ?int $quarter = null, ?int $year = null): Collection
    {
        return $this->quarterlyMetricsRepository->findByProject($projectId);
    }
}
