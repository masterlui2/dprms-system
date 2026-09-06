<?php

namespace App\Services\ProjectModule;

use App\Models\ProductionMaterial;
use App\Repositories\Contracts\ProjectModule\ProductionMaterialRepositoryInterface;
use App\Services\Contracts\ProjectModule\ProductionMaterialsServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
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

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'materials' => $item['materials'],
                'unit' => $item['unit'],
                'quantity' => $item['quantity'],
                'cost' => $item['cost'],
            ])->all();

            $created = $this->productionMaterialRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->productionMaterialRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->productionMaterialRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
