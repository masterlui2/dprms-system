<?php

namespace App\Services\ProjectModule;

use App\Models\Linkage;
use App\Repositories\Contracts\ProjectModule\LinkageRepositoryInterface;
use App\Services\Contracts\ProjectModule\LinkageServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class LinkageService implements LinkageServiceInterface{
    public function __construct(protected LinkageRepositoryInterface $linkageRepository)
    {
    }

    #[Override]
    public function submit(int $quarterId, array $data): Linkage
    {
        return $this->linkageRepository->create([
            'quarter_id' => $quarterId,
            'name' => $data['name'],
            'type' => $data['type'],
            'male_quantity' => $data['male_quantity'],
            'female_quantity' => $data['female_quantity'],
        ]);
    }

    #[Override]
    public function getQuarterlyMetrics(int $quarterId): Collection
    {
        return $this->linkageRepository->findByQuarterMetrics($quarterId);
    }

    #[Override]
    public function update(int $id, array $data): Linkage
    {
        $updated = $this->linkageRepository->update($id,$data);
        if (! $updated) {
            abort(404,"Not Found");
        }
        return $this->linkageRepository->findById($id);
    }

    #[Override]
    public function batch(int $quarterId, array $creates, array $updates, array $deletes): Collection
    {
        return DB::transaction(function () use ($quarterId,$creates,$updates,$deletes):Collection{
            $createdRows = Collection::make($creates)->map(fn(array $item) => [
                'quarter_id' => $quarterId,
                'name' => $item['name'],
                'type' => $item['type'],
                'male_quantity' => $item['male_quantity'],
                'female_quantity' => $item['female_quantity'],
            ])->all();

            $created = $this->linkageRepository->createMany($createdRows);

            foreach($created as $i => $model){
                if(isset($creates[$i]['temp_id'])){
                    $model->setAttribute('temp_id',$creates[$i]['temp_id']);
                }
            }

            $updated = empty($updates) ? Collection::make() : $this->linkageRepository->updateMany($quarterId,$updates);

            if(! empty($deletes)){
                $this->linkageRepository->deleteMany($quarterId,$deletes);
            }

            return Collection::make($created->concat($updated)->values());
        });
    }
}
