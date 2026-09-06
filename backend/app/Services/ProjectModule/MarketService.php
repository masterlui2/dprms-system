<?php

namespace App\Services\ProjectModule;

use App\Models\Market;
use App\Repositories\Contracts\ProjectModule\MarketRepositoryInterface;
use App\Services\Contracts\ProjectModule\MarketServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class MarketService implements MarketServiceInterface{
    public function __construct(protected MarketRepositoryInterface $marketRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Market
    {
        return $this->marketRepository->create([
            'quarter_id' => $quarterId,
            'market_name' => $data['market_name'],
            'address' => $data['address'],
            'condition' => $data['condition'],
            'effective_date' => $data['effective_date'],
            'contact_person' => $data['contact_person'],
            'service' => $data['service'],
            'volume' => $data['volume'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->marketRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Market
    {
        $updated = $this->marketRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->marketRepository->findById($id);
    }

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'market_name' => $item['market_name'],
                'address' => $item['address'],
                'condition' => $item['condition'],
                'effective_date' => $item['effective_date'],
                'contact_person' => $item['contact_person'],
                'service' => $item['service'],
                'volume' => $item['volume'],
            ])->all();

            $created = $this->marketRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->marketRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->marketRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
