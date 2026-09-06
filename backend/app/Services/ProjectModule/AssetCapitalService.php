<?php

namespace App\Services\ProjectModule;

use App\Models\AssetCapital;
use App\Repositories\Contracts\ProjectModule\AssetCapitalRepositoryInterface;
use App\Services\Contracts\ProjectModule\AssetCapitalServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class AssetCapitalService implements AssetCapitalServiceInterface{
    public function __construct(protected AssetCapitalRepositoryInterface $assetCapitalRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): AssetCapital
    {
       return $this->assetCapitalRepository->create([
            'quarter_id' => $quarterId,
            'name' => $data['name'],
            'amount' => $data['amount'],
       ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->assetCapitalRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): AssetCapital
    {
        $updated = $this->assetCapitalRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->assetCapitalRepository->findById($id);
    }

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'name' => $item['name'],
                'amount' => $item['amount'],
            ])->all();

            $created = $this->assetCapitalRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->assetCapitalRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->assetCapitalRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
