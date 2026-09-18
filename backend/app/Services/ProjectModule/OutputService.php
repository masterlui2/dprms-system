<?php

namespace App\Services\ProjectModule;

use App\Models\Output;
use App\Repositories\Contracts\ProjectModule\OutputRepositoryInterface;
use App\Services\Contracts\ProjectModule\OutputServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class OutputService implements OutputServiceInterface{
    public function __construct(protected OutputRepositoryInterface $outputRepository)
    {
    }

    #[Override]
    public function submit(int $summaryId, array $data): Output
    {
        return $this->outputRepository->create([
            'executive_summary_id' => $summaryId,
            'expected_output' => $data['expected_output'] ,
            'target' => $data['target'] ,
            'actual' => $data['actual'] ,
            'weight' => $data['weight'] ,
            'description' => $data['description'] ,
        ]);
    }

    #[Override]
    public function getSummary(int $summaryId): Collection
    {
        return $this->outputRepository->findBySummary($summaryId);
    }

    #[Override]
    public function update(int $id, array $data): output
    {
        $updated = $this->outputRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->outputRepository->findById($id);
    }

    #[Override]
    public function batch(int $summaryId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($summaryId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'executive_summary_id' => $summaryId,
                'expected_output' => $item['expected_output'] ,
                'target' => $item['target'] ,
                'actual' => $item['actual'] ,
                'description' => $item['description'] ,
            ])->all();

            $created = $this->outputRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->outputRepository->updateMany($summaryId,$updates);

            if(! empty($deletes)){
                $this->outputRepository->deleteMany($summaryId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
