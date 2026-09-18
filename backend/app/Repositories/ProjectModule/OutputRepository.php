<?php

namespace App\Repositories\ProjectModule;

use App\Models\Output;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\OutputRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class OutputRepository extends BaseRepository implements OutputRepositoryInterface{
    public function __construct(Output $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findBySummary(int $summaryId): Collection
    {
        return $this->model->newQuery()->where('executive_summary_id',$summaryId)->get();
    }

    #[Override]
    public function update(int $id, array $data): bool
    {
        $product = $this->model->newQuery()->find($id);
        if(! $product){
            return false;
        }

        $product->fill($data);
        return $product->save();
    }

    #[Override]
    public function createMany(array $rows): Collection
    {
        return Collection::make($rows)->map(function (array $rows){
            return $this->model->newQuery()->create($rows);
        });
    }

    #[Override]
    public function updateMany(int $summaryId, array $rows): Collection
    {
        return Collection::make($rows)->map(function (array $rows) use ($summaryId) {
            $id = $rows['id'];
            $output =  $this->model->newQuery()->where('executive_summary_id',$summaryId)->find($id);
            if (! $output){
                abort(404,"Not Found");
            }

            $output->fill(collect($rows)->except('id')->toArray());
            $output->save();
            return $output;
        });
    }

    #[Override]
    public function deleteMany(int $summaryId, array $rows): int
    {
        return $this->model->newQuery()->where('executive_summary_id',$summaryId)->whereIn('id',$rows)->delete();
    }
}
