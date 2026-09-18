<?php

namespace App\Repositories\ProjectModule;

use App\Models\ExecutiveSummary;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\ExecutiveSummaryRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ExecutiveSummaryRepository extends BaseRepository implements ExecutiveSummaryRepositoryInterface{
    public function __construct(ExecutiveSummary $model)
    {
        parent::__construct($model);
    }

    public function findByProject(int $projectId, ?int $semester = null, ?int $year = null): Collection
    {
        return $this->model->newQuery()
            ->where('project_id', $projectId)
            ->when($semester, fn ($q) => $q->where('semester', $semester))
            ->when($year, fn ($q) => $q->where('year', $year))
            ->with(['accomplishments','outputs','actions'])
            ->get();
    }
}
