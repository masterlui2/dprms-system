<?php

namespace App\Services\ProjectModule;

use App\Models\Accomplishment;
use App\Repositories\Contracts\ProjectModule\AccomplishmentRepositoryInterface;
use App\Services\Contracts\ProjectModule\AccomplishmentServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class AccomplishmentService implements AccomplishmentServiceInterface{
    public function __construct(protected AccomplishmentRepositoryInterface $accomplishmentRepository)
    {
    }

    #[Override]
    public function submit(int $summaryId, array $data): Accomplishment
    {
        return $this->accomplishmentRepository->create([
            'executive_summary_id' => $summaryId,
            'objectives' => $data['objectives'] ,
            'activities' => $data['activities'] ,
            'target_milestones' => $data['target_milestones'] ,
            'weight' => $data['weight'] ,
            'actual_accomplishment' => $data['actual_accomplishment'] ,
            'actual' => $data['actual']
        ]);
    }

    #[Override]
    public function getSummary(int $summaryId): Collection
    {
        return $this->accomplishmentRepository->findBySummary($summaryId);
    }

    #[Override]
    public function update(int $id, array $data): Accomplishment
    {
        $updated = $this->accomplishmentRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->accomplishmentRepository->findById($id);
    }

    #[Override]
    public function batch(int $summaryId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($summaryId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'executive_summary_id' => $summaryId,
                'objectives' => $item['objectives'] ,
                'activities' => $item['activities'] ,
                'target_milestones' => $item['target_milestones'] ,
                'weight' => $item['weight'] ,
                'actual_accomplishment' => $item['actual_accomplishment'] ,
                'actual' => $item['actual']
            ])->all();

            $created = $this->accomplishmentRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->accomplishmentRepository->updateMany($summaryId,$updates);

            if(! empty($deletes)){
                $this->accomplishmentRepository->deleteMany($summaryId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
