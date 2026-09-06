<?php

namespace App\Services\ProjectModule;

use App\Models\Narrative;
use App\Repositories\Contracts\ProjectModule\NarrativeRepositoryInterface;
use App\Services\Contracts\ProjectModule\NarrativeServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class NarrativeService implements NarrativeServiceInterface{
    public function __construct(protected NarrativeRepositoryInterface $narrativeRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Narrative
    {
        return $this->narrativeRepository->create([
            'quarter_id' => $quarterId,
            'particular' => $data['particular'],
            'type' => $data['type'],
            'intervention' => $data['intervention'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->narrativeRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Narrative
    {
        $updated = $this->narrativeRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->narrativeRepository->findById($id);
    }

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'particular' => $item['particular'],
                'type' => $item['type'],
                'intervention' => $item['intervention'],
            ])->all();

            $created = $this->narrativeRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->narrativeRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->narrativeRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
