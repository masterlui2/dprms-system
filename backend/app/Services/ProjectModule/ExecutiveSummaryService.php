<?php

namespace App\Services\ProjectModule;

use App\Models\ExecutiveSummary;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\ExecutiveSummaryRepositoryInterface;
use App\Services\Contracts\ProjectModule\ExecutiveSummaryServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Override;

class ExecutiveSummaryService implements ExecutiveSummaryServiceInterface{
    public function __construct(protected ExecutiveSummaryRepositoryInterface $executiveSummaryRepository)
    {

    }

    #[Override]
    public function submit(int $projectId, array $data): ExecutiveSummary
    {
        $exist = $this->executiveSummaryRepository->findByProject($projectId, $data['semester'], $data['year']);
        if ($exist->isNotEmpty()) {
            abort(409, 'Executive Summary already exist for this project/semester/year.');
        }

        return $this->executiveSummaryRepository->create([
            'project_id' => $projectId,
            'semester' => $data['semester'],
            'year' => $data['year'],
            'submitted_by' => Auth::id(),
            'total_project_budget' => $data['total_project_budget'],
        ]);
    }

    #[Override]
    public function getByProject(int $projectId, ?int $semester = null, ?int $year = null): Collection
    {
        return $this->executiveSummaryRepository->findByProject($projectId,$semester,$year);
    }
}
