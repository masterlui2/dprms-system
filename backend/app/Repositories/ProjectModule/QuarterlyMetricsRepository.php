<?php

namespace App\Repositories\ProjectModule;

use App\Models\QuarterlyMetrics;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\QuarterlyMetricsRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class QuarterlyMetricsRepository extends BaseRepository implements QuarterlyMetricsRepositoryInterface{
    public function __construct(QuarterlyMetrics $model)
    {
        parent::__construct($model);
    }

    public function findByProject(int $projectId, ?int $quarter = null, ?int $year = null): Collection
    {
        return $this->model->newQuery()
            ->where('project_id', $projectId)
            ->when($quarter, fn ($q) => $q->where('quarter', $quarter))
            ->when($year, fn ($q) => $q->where('year', $year))
            ->with(['products','employees','product_cost','asset','asset_capital','intervention','linkage','market','narrative','production_material'])
            ->get();
    }

    #[Override]
    public function create(array $data): QuarterlyMetrics
    {
        return $this->model->newQuery()->create($data);
    }
}
