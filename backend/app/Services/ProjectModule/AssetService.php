<?php

namespace App\Services\ProjectModule;

use App\Models\Asset;
use App\Repositories\Contracts\ProjectModule\AssetRepositoryInterface;
use App\Services\Contracts\ProjectModule\AssetServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class AssetService implements AssetServiceInterface{
    public function __construct(protected AssetRepositoryInterface $assetRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Asset
    {
        return $this->assetRepository->create([
            'quarter_id' => $quarterId,
            'asset_name' => $data['asset_name'],
            'type' => $data['type'],
            'lifespan' => $data['lifespan'],
            'year_acquired' => $data['year_acquired'],
            'cost' => $data['cost'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->assetRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Asset
    {
        $updated = $this->assetRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->assetRepository->findById($id);
    }

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'asset_name' => $item['asset_name'],
                'type' => $item['type'],
                'lifespan' => $item['lifespan'],
                'year_acquired' => $item['year_acquired'],
                'cost' => $item['cost'],
            ])->all();

            $created = $this->assetRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->assetRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->assetRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
