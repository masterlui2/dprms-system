<?php

namespace App\Services\ProjectModule;

use App\Models\ProductCost;
use App\Repositories\Contracts\ProjectModule\ProductionCostRepositoryInterface;
use App\Services\Contracts\ProjectModule\ProductionCostServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
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
            'type' => $data['type'],
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

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'particulars' => $item['particulars'],
                'type' => $item['type'],
                'month_1' => $item['month_1'],
                'month_2' => $item['month_2'],
                'month_3' => $item['month_3'],
            ])->all();

            $created = $this->productionCostRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->productionCostRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->productionCostRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
