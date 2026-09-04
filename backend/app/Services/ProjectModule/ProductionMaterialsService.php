<?php

namespace App\Services\ProjectModule;

use App\Models\ProductionMaterial;
use App\Repositories\Contracts\ProjectModule\ProductionMaterialRepositoryInterface;
use App\Services\Contracts\ProjectModule\ProductionMaterialsServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class ProductionMaterialsService implements ProductionMaterialsServiceInterface{
    public function __construct(protected ProductionMaterialRepositoryInterface $productionMaterialRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): ProductionMaterial
    {
        return $this->productionMaterialRepository->create([
            'quarter_id' => $quarterId,
            'materials' => $data['materials'],
            'unit' => $data['unit'],
            'quantity' => $data['quantity'],
            'cost' => $data['cost'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->productionMaterialRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): ProductionMaterial
    {
        $updated = $this->productionMaterialRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->productionMaterialRepository->findById($id);
    }
}
