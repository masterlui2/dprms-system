<?php

namespace App\Services\ProjectModule;

use App\Models\ProductCost;
use App\Repositories\Contracts\ProjectModule\ProductionCostRepositoryInterface;
use App\Services\Contracts\ProjectModule\ProductionCostServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class ProductionCostService implements ProductionCostServiceInterface{
    public function __construct(protected ProductionCostRepositoryInterface $productionCostRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId,array $data): ProductCost
    {
        return $this->productionCostRepository->create([
            'quarter_id' => $quarterId,
            'particulars' => $data['particulars'],
            'month_1' => $data['month_1'],
            'month_2' => $data['month_2'],
            'month_3' => $data['month_3'],
        ]);
    }

    #[Override]
    public function getByQuarterlyMetricsId(int $quarterId): Collection
    {
        return $this->productionCostRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): ProductCost
    {
        $updated = $this->productionCostRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->productionCostRepository->findById($id);
    }
}
