<?php

namespace App\Repositories\ProjectModule;

use App\Models\ProductCost;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProjectModule\ProductionCostRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Override;

class ProductionCostRepository extends BaseRepository implements ProductionCostRepositoryInterface{
    #[Override]
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
}
