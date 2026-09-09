<?php

namespace App\Repositories\ProjectModule;

use App\Models\ProductCost;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\ProductionCostRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class ProductionCostRepository extends BaseRepository implements ProductionCostRepositoryInterface{
    public function __construct(ProductCost $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByQuarterMetrics(int $quarterId): Collection
    {
        return $this->model->newQuery()->where('quarter_id',$quarterId)->get();
    }

    #[Override]
    public function update(int $id, array $data): bool
    {
        $cost = $this->model->newQuery()->find($id);
        if(! $cost){
            return false;
        }

        $cost->fill($data);
        return $cost->save();
    }

    #[Override]
    public function createMany(array $rows): Collection
    {
        return Collection::make($rows)->map(function (array $rows){
            return $this->model->newQuery()->create($rows);
        });
    }

    #[Override]
    public function updateMany(int $quarterId, array $rows): Collection
    {
        return Collection::make($rows)->map(function (array $rows) use ($quarterId) {
            $id = $rows['id'];
            $cost =  $this->model->newQuery()->where('quarter_id',$quarterId)->find($id);
            if (! $cost){
                abort(404,"Not Found");
            }

            $cost->fill(collect($rows)->except('id')->toArray());
            $cost->save();
            return $cost;
        });
    }

    #[Override]
    public function deleteMany(int $quarterId, array $rows): int
    {
        return $this->model->newQuery()->where('quarter_id',$quarterId)->whereIn('id',$rows)->delete();
    }
}
