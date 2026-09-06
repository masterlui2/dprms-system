<?php

namespace App\Services\ProjectModule;

use App\Models\Intervention;
use App\Repositories\Contracts\ProjectModule\InterventionRepositoryInterface;
use App\Services\Contracts\ProjectModule\InterventionServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class InterventionService implements InterventionServiceInterface{
    public function __construct(protected InterventionRepositoryInterface $interventionRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Intervention
    {
        return $this->interventionRepository->create([
            'quarter_id' => $quarterId,
            'name' => $data['name'],
            'type' => $data['type'],
            'availed' => $data['availed'],
            'intervention' => $data['intervention'],
            'date' => $data['date'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->interventionRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Intervention
    {
        $updated = $this->interventionRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->interventionRepository->findById($id);
    }

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'name' => $item['name'],
                'type' => $item['type'],
                'availed' => $item['availed'],
                'intervention' => $item['intervention'],
                'date' => $item['date'],
            ])->all();

            $created = $this->interventionRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->interventionRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->interventionRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });


    }
}
