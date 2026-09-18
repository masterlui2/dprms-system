<?php

namespace App\Services\ProjectModule;

use App\Models\Action;
use App\Repositories\Contracts\ProjectModule\ActionRepositoryInterface;
use App\Services\Contracts\ProjectModule\ActionServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class ActionService implements ActionServiceInterface{
    public function __construct(protected ActionRepositoryInterface $actionRepository)
    {
    }

    #[Override]
    public function submit(int $summaryId, array $data): Action
    {
        return $this->actionRepository->create([
            'executive_summary_id' => $summaryId,
            'cooperating_agency' => $data['cooperating_agency'] ,
            'plan' => $data['plan'] ,
            'solutions' => $data['solutions'] ,
            'concern' => $data['concern'] ,
        ]);
    }

    #[Override]
    public function getSummary(int $summaryId): Collection
    {
        return $this->actionRepository->findBySummary($summaryId);
    }

    #[Override]
    public function update(int $id, array $data): action
    {
        $updated = $this->actionRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->actionRepository->findById($id);
    }

    #[Override]
    public function batch(int $summaryId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($summaryId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'executive_summary_id' => $summaryId,
                'cooperating_agency' => $item['cooperating_agency'] ,
                'plan' => $item['plan'] ,
                'solutions' => $item['solutions'] ,
                'concern' => $item['concern'] ,
            ])->all();

            $created = $this->actionRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->actionRepository->updateMany($summaryId,$updates);

            if(! empty($deletes)){
                $this->actionRepository->deleteMany($summaryId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
